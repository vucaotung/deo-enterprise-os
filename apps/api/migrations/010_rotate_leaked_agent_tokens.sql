-- 010: rotate the agent tokens that leaked into the deploy chat log.
-- Idempotent: each run regenerates tokens for the 3 priority agents
-- IF AND ONLY IF their current token matches the leaked values.
-- Operators that have already rotated manually are unaffected.

UPDATE deo.agents
   SET api_token = gen_random_uuid(),
       updated_at = NOW()
 WHERE slug = 'office-agent'
   AND api_token = '3be57d8c-f1a2-4d67-b248-bc6ab309265e';

UPDATE deo.agents
   SET api_token = gen_random_uuid(),
       updated_at = NOW()
 WHERE slug = 'hr-agent'
   AND api_token = '06fe55b9-c881-48cd-93cd-39af3d11cdc1';

UPDATE deo.agents
   SET api_token = gen_random_uuid(),
       updated_at = NOW()
 WHERE slug = 'finance-agent'
   AND api_token = 'd4273ed1-775c-400d-afb8-aac8d38e45bd';
