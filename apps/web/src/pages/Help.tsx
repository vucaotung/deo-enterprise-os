import { useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import guideMd from '@/docs/USER_GUIDE_VN.md?raw';

interface OutletContext {
  setPageTitle: (title: string) => void;
}

export const Help = () => {
  const { setPageTitle } = useOutletContext<OutletContext>();

  useEffect(() => {
    setPageTitle('Hướng dẫn');
  }, [setPageTitle]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 max-w-4xl mx-auto">
      <article className="prose prose-slate max-w-none prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-table:text-sm prose-th:bg-slate-50 prose-th:text-left prose-th:px-3 prose-th:py-2 prose-td:px-3 prose-td:py-2 prose-td:border prose-td:border-slate-200 prose-th:border prose-th:border-slate-200 prose-code:text-deo-accent prose-code:bg-slate-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{guideMd}</ReactMarkdown>
      </article>
    </div>
  );
};
