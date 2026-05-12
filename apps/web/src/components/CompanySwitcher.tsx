import { ChevronsUpDown } from 'lucide-react';
import { useActiveCompany } from '@/lib/active-company';

export function CompanySwitcher() {
  const { id, setId, companies } = useActiveCompany();
  const list = companies.data ?? [];

  if (companies.isLoading) {
    return <div className="text-xs text-slate-400">Đang tải company…</div>;
  }
  if (companies.isError) {
    return <div className="text-xs text-red-500">Không tải được company</div>;
  }
  if (list.length === 0) {
    return (
      <a
        href="http://localhost:3100"
        className="text-xs text-deo-accent underline"
        target="_blank"
        rel="noreferrer"
      >
        Tạo company trong Paperclip →
      </a>
    );
  }

  return (
    <label className="relative block">
      <span className="sr-only">Active company</span>
      <select
        value={id ?? ''}
        onChange={(e) => setId(e.target.value)}
        className="w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 py-2 pr-8 text-sm text-slate-800 shadow-sm focus:border-deo-accent focus:outline-none focus:ring-1 focus:ring-deo-accent"
      >
        {list.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <ChevronsUpDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    </label>
  );
}
