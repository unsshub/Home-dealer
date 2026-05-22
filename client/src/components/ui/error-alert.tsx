import { cn } from '../../lib/utils';

interface ErrorAlertProps {
  message: string;
  className?: string;
  onRetry?: () => void;
}

export function ErrorAlert({ message, className, onRetry }: ErrorAlertProps) {
  const lines = message.split('\n');
  return (
    <div
      className={cn(
        'rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger',
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          {lines.map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="shrink-0 text-xs font-medium underline hover:no-underline"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
