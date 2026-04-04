import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card = ({ children, className }: CardProps) => {
  return (
    <div
      className={cn(
        'bg-white rounded-lg shadow-sm border border-slate-200 p-6',
        className
      )}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className }: CardProps) => {
  return <div className={cn('mb-4', className)}>{children}</div>;
};

export const CardTitle = ({ children, className }: CardProps) => {
  return (
    <h3 className={cn('text-lg font-semibold text-slate-900', className)}>
      {children}
    </h3>
  );
};

export const CardContent = ({ children, className }: CardProps) => {
  return <div className={cn('', className)}>{children}</div>;
};

export const CardFooter = ({ children, className }: CardProps) => {
  return <div className={cn('mt-4 pt-4 border-t border-slate-200', className)}>{children}</div>;
};
