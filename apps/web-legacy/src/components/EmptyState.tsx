import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 text-center',
        className
      )}
    >
      {Icon && <Icon size={48} className="mb-4 text-slate-300" />}
      <h3 className="mb-2 text-lg font-semibold text-slate-900">{title}</h3>
      {description && <p className="mb-6 text-slate-600">{description}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-deo-accent text-white rounded-lg font-medium hover:bg-cyan-600 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};
