import { AlertTriangle, Inbox, RefreshCw } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TableCell, TableRow } from "@/components/ui/table";

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <div className="grid size-11 place-items-center rounded-full bg-muted text-muted-foreground">
        {icon ?? <Inbox className="size-5" aria-hidden="true" />}
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {description ? <p className="max-w-sm text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description,
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div role="alert" className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <div className="grid size-11 place-items-center rounded-full bg-destructive-soft text-destructive">
        <AlertTriangle className="size-5" aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          {description ?? "We couldn't load this data. Please try again."}
        </p>
      </div>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="size-4" aria-hidden="true" />
          Retry
        </Button>
      ) : null}
    </div>
  );
}

export function TableSkeletonRows({ rows = 6, columns = 6 }: { rows?: number; columns?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <TableRow key={rowIndex}>
          {Array.from({ length: columns }).map((__, colIndex) => (
            <TableCell key={colIndex}>
              <Skeleton className="h-4 w-full max-w-[140px]" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

export function BlockSkeleton({ className = "h-64" }: { className?: string }) {
  return <Skeleton className={className} />;
}
