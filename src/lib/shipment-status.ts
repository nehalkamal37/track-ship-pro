import { RiskLevel, ShipmentStatus } from "@/api/types";

/** Tailwind token classes for status badges — one consistent semantic scale. */
export const statusStyles: Record<ShipmentStatus, string> = {
  [ShipmentStatus.Created]: "bg-muted text-muted-foreground border-border",
  [ShipmentStatus.PickedUp]: "bg-info-soft text-info border-info/25",
  [ShipmentStatus.AtOriginFacility]: "bg-info-soft text-info border-info/25",
  [ShipmentStatus.InTransit]: "bg-accent-soft text-accent-strong border-accent-strong/25",
  [ShipmentStatus.AtDestinationFacility]: "bg-accent-soft text-accent-strong border-accent-strong/25",
  [ShipmentStatus.OutForDelivery]: "bg-warning-soft text-warning border-warning/25",
  [ShipmentStatus.Delivered]: "bg-success-soft text-success border-success/25",
  [ShipmentStatus.DeliveryFailed]: "bg-destructive-soft text-destructive border-destructive/25",
  [ShipmentStatus.OnHold]: "bg-warning-soft text-warning border-warning/25",
  [ShipmentStatus.ReturnedToSender]: "bg-muted text-muted-foreground border-border",
  [ShipmentStatus.Cancelled]: "bg-muted text-muted-foreground border-border",
  [ShipmentStatus.Lost]: "bg-destructive-soft text-destructive border-destructive/25",
};

export const riskStyles: Record<RiskLevel, string> = {
  [RiskLevel.Normal]: "bg-success-soft text-success border-success/25",
  [RiskLevel.AtRisk]: "bg-warning-soft text-warning border-warning/25",
  [RiskLevel.Delayed]: "bg-destructive-soft text-destructive border-destructive/25",
  [RiskLevel.Critical]: "bg-destructive text-destructive-foreground border-destructive",
};

export const TERMINAL_STATUSES: ShipmentStatus[] = [
  ShipmentStatus.Delivered,
  ShipmentStatus.Cancelled,
  ShipmentStatus.Lost,
  ShipmentStatus.ReturnedToSender,
];

/** Rule-based state machine used by the update-status modal. */
const TRANSITIONS: Record<ShipmentStatus, ShipmentStatus[]> = {
  [ShipmentStatus.Created]: [ShipmentStatus.PickedUp, ShipmentStatus.OnHold, ShipmentStatus.Cancelled],
  [ShipmentStatus.PickedUp]: [ShipmentStatus.AtOriginFacility, ShipmentStatus.InTransit, ShipmentStatus.OnHold, ShipmentStatus.Lost],
  [ShipmentStatus.AtOriginFacility]: [ShipmentStatus.InTransit, ShipmentStatus.OnHold, ShipmentStatus.Lost],
  [ShipmentStatus.InTransit]: [
    ShipmentStatus.AtDestinationFacility,
    ShipmentStatus.OutForDelivery,
    ShipmentStatus.OnHold,
    ShipmentStatus.Lost,
  ],
  [ShipmentStatus.AtDestinationFacility]: [ShipmentStatus.OutForDelivery, ShipmentStatus.OnHold, ShipmentStatus.Lost],
  [ShipmentStatus.OutForDelivery]: [ShipmentStatus.Delivered, ShipmentStatus.DeliveryFailed, ShipmentStatus.OnHold],
  [ShipmentStatus.DeliveryFailed]: [
    ShipmentStatus.OutForDelivery,
    ShipmentStatus.OnHold,
    ShipmentStatus.ReturnedToSender,
  ],
  [ShipmentStatus.OnHold]: [ShipmentStatus.InTransit, ShipmentStatus.OutForDelivery, ShipmentStatus.ReturnedToSender, ShipmentStatus.Cancelled],
  [ShipmentStatus.Delivered]: [],
  [ShipmentStatus.ReturnedToSender]: [],
  [ShipmentStatus.Cancelled]: [],
  [ShipmentStatus.Lost]: [],
};

export function nextStatuses(current: ShipmentStatus): ShipmentStatus[] {
  return TRANSITIONS[current] ?? [];
}

export function isTerminal(status: ShipmentStatus) {
  return TERMINAL_STATUSES.includes(status);
}
