import { cn } from '../../lib/utils';

interface ErrorAlertProps {
  message: string;
  className?: string;
  onRetry?: () => void;
}

export function ErrorAlert({ message, className, onRetry }: ErrorAlertProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span>{message}</span>
        {onRetry && (
          <button
            onClick={onRetry}
            className="ml-4 text-xs font-medium underline hover:no-underline"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
