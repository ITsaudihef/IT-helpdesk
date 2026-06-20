import { cn, statusBadge, statusLabel, priorityBadge, priorityLabel } from "@/lib/utils";

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", statusBadge[status])}>
      {statusLabel[status] || status}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", priorityBadge[priority])}>
      {priorityLabel[priority] || priority}
    </span>
  );
}
