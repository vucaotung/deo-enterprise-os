import { cn } from '@/lib/utils';

interface Column {
  id: string;
  title: string;
}

interface KanbanCardProps {
  id: string;
  title: string;
  description?: string;
  badges?: React.ReactNode[];
  onClick?: () => void;
}

interface KanbanBoardProps {
  columns: Column[];
  cards: Record<string, KanbanCardProps[]>;
  onCardClick?: (cardId: string) => void;
  className?: string;
}

const KanbanCardComponent = ({
  card,
  onClick,
}: {
  card: KanbanCardProps;
  onClick?: () => void;
}) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-3 cursor-pointer hover:shadow-md transition-shadow',
        onClick && 'cursor-pointer'
      )}
    >
      <h4 className="font-medium text-slate-900 mb-2 line-clamp-2">
        {card.title}
      </h4>
      {card.description && (
        <p className="text-sm text-slate-600 mb-3 line-clamp-2">
          {card.description}
        </p>
      )}
      {card.badges && card.badges.length > 0 && (
        <div className="flex flex-wrap gap-2">{card.badges}</div>
      )}
    </div>
  );
};

export const KanbanBoard = ({
  columns,
  cards,
  onCardClick,
  className,
}: KanbanBoardProps) => {
  return (
    <div className={cn('flex gap-6 overflow-x-auto pb-4', className)}>
      {columns.map((column) => (
        <div key={column.id} className="flex-shrink-0 w-80">
          <div className="bg-slate-50 rounded-lg p-4 min-h-96">
            <h3 className="font-semibold text-slate-900 mb-4">
              {column.title}
            </h3>
            <div className="space-y-0">
              {cards[column.id]?.map((card) => (
                <KanbanCardComponent
                  key={card.id}
                  card={card}
                  onClick={() => {
                    onCardClick?.(card.id);
                    card.onClick?.();
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
