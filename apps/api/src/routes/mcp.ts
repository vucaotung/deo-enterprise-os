import { Router, Request, Response } from 'express';
import { ZodError } from 'zod';
import { callMcpTool, mcpTools } from '../mcp/tools';
import { extractServiceToken, serviceTokenMiddleware } from '../middleware/service-auth';

const router = Router();

const mcpAuth = serviceTokenMiddleware;

function rpcResult(id: any, result: any) {
  return { jsonrpc: '2.0', id: id ?? null, result };
}

function rpcError(id: any, code: number, message: string, data?: any) {
  return {
    jsonrpc: '2.0',
    id: id ?? null,
    error: {
      code,
      message,
      data,
    },
  };
}

function toolContent(result: any) {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result, null, 2),
      },
    ],
    structuredContent: result,
    isError: false,
  };
}

function serializeError(error: unknown) {
  if (error instanceof ZodError) {
    return {
      message: 'Invalid tool arguments',
      data: error.flatten(),
    };
  }

  if (error instanceof Error) {
    return { message: error.message };
  }

  return { message: 'Unknown MCP error' };
}

router.use(mcpAuth);

router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    transport: 'streamable-http',
    tools: mcpTools.length,
    timestamp: new Date().toISOString(),
  });
});

router.get('/tools', (_req: Request, res: Response) => {
  res.json({ tools: mcpTools });
});

router.post('/', async (req: Request, res: Response) => {
  const id = req.body?.id ?? null;

  try {
    const method = req.body?.method;

    if (method === 'initialize') {
      return res.json(rpcResult(id, {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {},
        },
        serverInfo: {
          name: 'enterprise-os',
          version: '0.1.0',
        },
      }));
    }

    if (method === 'tools/list') {
      return res.json(rpcResult(id, { tools: mcpTools }));
    }

    if (method === 'tools/call') {
      const toolName = req.body?.params?.name;
      const args = req.body?.params?.arguments || {};
      const result = await callMcpTool(toolName, args);
      return res.json(rpcResult(id, toolContent(result)));
    }

    if (typeof method === 'string' && method.startsWith('notifications/')) {
      return res.status(202).json(rpcResult(id, {}));
    }

    const directToolName = req.body?.tool || req.body?.name || method;
    if (typeof directToolName === 'string' && directToolName.startsWith('eos_')) {
      const args = req.body?.arguments || req.body?.args || req.body?.params || {};
      const result = await callMcpTool(directToolName, args);
      return res.json(rpcResult(id, toolContent(result)));
    }

    return res.status(400).json(rpcError(id, -32601, `Unsupported MCP method: ${method || 'missing'}`));
  } catch (error) {
    const serialized = serializeError(error);
    const code = serialized.message === 'Invalid tool arguments' ? -32602 : -32000;
    return res.status(400).json(rpcError(id, code, serialized.message, serialized.data));
  }
});

export default router;
