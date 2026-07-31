import type { RiskLevel, ShipmentStatus } from "@/api/types";
import { riskStyles, statusStyles } from "@/lib/shipment-status";
import { cn } from "@/lib/utils";

const base =
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap";

export function StatusBadge({ status, className }: { status: ShipmentStatus; className?: string }) {
  return <span className={cn(base, statusStyles[status], className)}>{status}</span>;
}

export function RiskBadge({ risk, className }: { risk: RiskLevel; className?: string }) {
  return <span className={cn(base, riskStyles[risk], className)}>{risk}</span>;
}
