import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SlidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const SlidePanel = ({
  isOpen,
  onClose,
  title,
  children,
  className,
  size = 'md',
}: SlidePanelProps) => {
  const sizeClasses = {
    sm: 'w-80',
    md: 'w-96',
    lg: 'w-[500px]',
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-30 transition-opacity"
          onClick={onClose}
        />
      )}
      <div
        className={cn(
          'fixed right-0 top-0 bottom-0 z-50 bg-white shadow-2xl transform transition-transform duration-300 flex flex-col',
          sizeClasses[size],
          isOpen ? 'translate-x-0' : 'translate-x-full',
          className
        )}
      >
        <div className="flex items-center justify-between border-b border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">{children}</div>
      </div>
    </>
  );
};
