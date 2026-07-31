import { ShipmentStatus, RiskLevel } from "../types";
import type {
  ActivityLogEntry,
  Address,
  Merchant,
  Shipment,
  ShipmentIntelligence,
  TrackingEvent,
} from "../types";

/** Deterministic PRNG so the seeded mock dataset is stable across reloads. */
function mulberry32(seed: number) {
  return function random() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260731);
const pick = <T,>(items: readonly T[]) => items[Math.floor(rand() * items.length)]!;
const int = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1));

const NOW = Date.now();
const HOUR = 3600_000;
const DAY = 24 * HOUR;
const iso = (ms: number) => new Date(ms).toISOString();

const CITIES: Array<{ city: string; state: string; postal: string; country: string }> = [
  { city: "Chicago", state: "IL", postal: "60601", country: "United States" },
  { city: "Dallas", state: "TX", postal: "75201", country: "United States" },
  { city: "Denver", state: "CO", postal: "80202", country: "United States" },
  { city: "Atlanta", state: "GA", postal: "30303", country: "United States" },
  { city: "Seattle", state: "WA", postal: "98101", country: "United States" },
  { city: "Newark", state: "NJ", postal: "07102", country: "United States" },
  { city: "Phoenix", state: "AZ", postal: "85004", country: "United States" },
  { city: "Columbus", state: "OH", postal: "43215", country: "United States" },
  { city: "Miami", state: "FL", postal: "33130", country: "United States" },
  { city: "Portland", state: "OR", postal: "97204", country: "United States" },
];

const STREETS = [
  "1420 Industrial Pkwy",
  "88 Harbor Point Rd",
  "3301 Foundry Lane",
  "715 Meridian Ave",
  "2140 Corbin Street",
  "560 Westgate Blvd",
  "97 Cannery Row",
  "1188 Alder Court",
];

const FIRST = ["Dana", "Marcus", "Priya", "Elena", "Jonas", "Aisha", "Tobias", "Lena", "Omar", "Grace", "Ivan", "Noor"];
const LAST = ["Whitfield", "Okonkwo", "Rasmussen", "Delgado", "Farrow", "Nakamura", "Bright", "Castellanos", "Halvorsen", "Mbeki"];

const PACKAGES = [
  "Consumer electronics accessories",
  "Apparel — 4 units",
  "Refrigerated food kit",
  "Home fragrance set",
  "Replacement machine parts",
  "Medical supplies (non-hazardous)",
  "Printed marketing materials",
  "Ceramic tableware, fragile",
];

const OPERATORS = ["m.okonkwo@trackflow.io", "d.whitfield@trackflow.io", "l.bright@trackflow.io"];

function address(seedIdx: number): Address {
  const c = CITIES[seedIdx % CITIES.length]!;
  return {
    line1: pick(STREETS),
    city: c.city,
    state: c.state,
    postalCode: c.postal,
    country: c.country,
  };
}

export const merchants: Merchant[] = [
  "Northwind Supply Co.",
  "Cobalt Home Goods",
  "Verity Pharma Distribution",
  "Atlas Outdoor Gear",
  "Brightline Apparel",
  "Harborside Grocers",
  "Meridian Electronics",
  "Lumen Beauty Labs",
].map((companyName, i) => ({
  id: `mer_${(i + 1).toString().padStart(3, "0")}`,
  companyName,
  contactName: `${pick(FIRST)} ${pick(LAST)}`,
  email: `ops@${companyName.toLowerCase().replace(/[^a-z]+/g, "")}.com`,
  phone: `+1 (${int(200, 989)}) ${int(200, 989)}-${int(1000, 9999)}`,
  isActive: i !== 5 && i !== 7,
  shipmentCount: 0,
  createdAt: iso(NOW - int(120, 900) * DAY),
}));

/** Ordered happy-path progression used to synthesise realistic event history. */
const PROGRESSION: ShipmentStatus[] = [
  ShipmentStatus.Created,
  ShipmentStatus.PickedUp,
  ShipmentStatus.AtOriginFacility,
  ShipmentStatus.InTransit,
  ShipmentStatus.AtDestinationFacility,
  ShipmentStatus.OutForDelivery,
  ShipmentStatus.Delivered,
];

const TERMINAL_MIX: ShipmentStatus[] = [
  ShipmentStatus.Delivered,
  ShipmentStatus.Delivered,
  ShipmentStatus.Delivered,
  ShipmentStatus.InTransit,
  ShipmentStatus.InTransit,
  ShipmentStatus.OutForDelivery,
  ShipmentStatus.AtDestinationFacility,
  ShipmentStatus.AtOriginFacility,
  ShipmentStatus.PickedUp,
  ShipmentStatus.Created,
  ShipmentStatus.OnHold,
  ShipmentStatus.DeliveryFailed,
  ShipmentStatus.ReturnedToSender,
  ShipmentStatus.Cancelled,
  ShipmentStatus.Lost,
];

function facilityName(city: string) {
  return `${city} Sortation Center`;
}

export function computeIntelligence(shipment: Omit<Shipment, "intelligence">): ShipmentIntelligence {
  const last = shipment.events[shipment.events.length - 1]!;
  const hoursSinceLastMovement = Math.max(0, Math.round((NOW - new Date(last.occurredAt).getTime()) / HOUR));
  const expectedDeliveryVarianceHours = Math.round(
    (NOW - new Date(shipment.expectedDeliveryDate).getTime()) / HOUR,
  );
  const failedDeliveryAttempts = shipment.events.filter((e) => e.status === ShipmentStatus.DeliveryFailed).length;
  const currentFacility = last.location;

  let riskLevel: RiskLevel = RiskLevel.Normal;
  let summary = "This shipment is progressing normally.";

  const closed: ShipmentStatus[] = [
    ShipmentStatus.Delivered,
    ShipmentStatus.Cancelled,
    ShipmentStatus.ReturnedToSender,
  ];

  if (shipment.status === ShipmentStatus.Lost) {
    riskLevel = RiskLevel.Critical;
    summary = "This shipment is marked lost and requires immediate investigation.";
  } else if (closed.includes(shipment.status)) {
    riskLevel = RiskLevel.Normal;
    summary =
      shipment.status === ShipmentStatus.Delivered
        ? "This shipment was delivered and needs no further action."
        : `This shipment is closed with status “${shipment.status}”.`;
  } else if (failedDeliveryAttempts >= 2) {
    riskLevel = RiskLevel.Critical;
    summary = `${failedDeliveryAttempts} delivery attempts have failed.`;
  } else if (expectedDeliveryVarianceHours > 24) {
    riskLevel = RiskLevel.Critical;
    summary = "This shipment is more than a day past its expected delivery date and requires immediate review.";
  } else if (expectedDeliveryVarianceHours > 0) {
    riskLevel = RiskLevel.Delayed;
    summary = "This shipment is delayed and requires immediate review.";
  } else if (hoursSinceLastMovement >= 12 || failedDeliveryAttempts === 1 || shipment.status === ShipmentStatus.OnHold) {
    riskLevel = RiskLevel.AtRisk;
    summary = `This shipment has not moved for ${hoursSinceLastMovement} hours and may miss its expected delivery date.`;
  }

  return {
    riskLevel,
    summary,
    hoursSinceLastMovement,
    expectedDeliveryVarianceHours,
    failedDeliveryAttempts,
    currentFacility,
    factors: [
      { label: "Hours since last movement", value: `${hoursSinceLastMovement} h` },
      {
        label: "Expected delivery variance",
        value:
          expectedDeliveryVarianceHours > 0
            ? `${expectedDeliveryVarianceHours} h behind schedule`
            : `${Math.abs(expectedDeliveryVarianceHours)} h of buffer remaining`,
      },
      { label: "Failed delivery attempts", value: String(failedDeliveryAttempts) },
      { label: "Current facility", value: currentFacility },
    ],
  };
}

export function riskReason(shipment: Shipment): string {
  const i = shipment.intelligence;
  if (i.failedDeliveryAttempts >= 2) return "Repeated failed delivery attempts";
  if (i.expectedDeliveryVarianceHours > 24) return "Significantly past expected delivery date";
  if (i.expectedDeliveryVarianceHours > 0) return "Past expected delivery date";
  if (shipment.status === ShipmentStatus.OnHold) return "Held at facility";
  if (i.hoursSinceLastMovement >= 12) return `No movement for ${i.hoursSinceLastMovement} hours`;
  return "Monitoring";
}

function buildShipment(index: number): Shipment {
  const merchant = merchants[index % merchants.length]!;
  const originIdx = index % CITIES.length;
  const destIdx = (index * 3 + 4) % CITIES.length;
  const origin = address(originIdx);
  const destination = address(destIdx === originIdx ? destIdx + 1 : destIdx);
  const finalStatus = TERMINAL_MIX[index % TERMINAL_MIX.length]!;
  const createdAt = NOW - int(2, 14) * DAY - int(0, 20) * HOUR;
  const expectedDeliveryDate = createdAt + int(3, 8) * DAY;
  const id = `shp_${(index + 1).toString().padStart(4, "0")}`;
  const trackingNumber = `TF${(482100000 + index * 7717).toString()}`;
  const recipientName = `${pick(FIRST)} ${pick(LAST)}`;

  const path: ShipmentStatus[] = [];
  const progressIdx = PROGRESSION.indexOf(finalStatus);
  if (progressIdx >= 0) {
    path.push(...PROGRESSION.slice(0, progressIdx + 1));
  } else if (finalStatus === ShipmentStatus.Cancelled) {
    path.push(ShipmentStatus.Created, ShipmentStatus.Cancelled);
  } else if (finalStatus === ShipmentStatus.OnHold) {
    path.push(ShipmentStatus.Created, ShipmentStatus.PickedUp, ShipmentStatus.InTransit, ShipmentStatus.OnHold);
  } else if (finalStatus === ShipmentStatus.DeliveryFailed) {
    path.push(
      ...PROGRESSION.slice(0, 6),
      ShipmentStatus.DeliveryFailed,
      ...(index % 3 === 0 ? [ShipmentStatus.OutForDelivery, ShipmentStatus.DeliveryFailed] : []),
    );
  } else if (finalStatus === ShipmentStatus.ReturnedToSender) {
    path.push(...PROGRESSION.slice(0, 6), ShipmentStatus.DeliveryFailed, ShipmentStatus.ReturnedToSender);
  } else if (finalStatus === ShipmentStatus.Lost) {
    path.push(ShipmentStatus.Created, ShipmentStatus.PickedUp, ShipmentStatus.InTransit, ShipmentStatus.Lost);
  }

  const stallHours = index % 5 === 0 ? int(14, 60) : int(1, 9);
  const span = Math.max(1, NOW - stallHours * HOUR - createdAt);
  const events: TrackingEvent[] = path.map((status, i) => {
    const occurredAt = createdAt + Math.round((span * (i + 1)) / path.length);
    const location =
      status === ShipmentStatus.Created || status === ShipmentStatus.PickedUp
        ? `${origin.city}, ${origin.state}`
        : status === ShipmentStatus.AtOriginFacility
          ? facilityName(origin.city)
          : status === ShipmentStatus.InTransit
            ? `In transit to ${destination.city}, ${destination.state}`
            : status === ShipmentStatus.AtDestinationFacility
              ? facilityName(destination.city)
              : `${destination.city}, ${destination.state}`;
    return {
      id: `${id}_evt_${i + 1}`,
      shipmentId: id,
      status,
      location,
      occurredAt: iso(occurredAt),
      notes:
        status === ShipmentStatus.DeliveryFailed
          ? "Recipient unavailable at delivery address."
          : status === ShipmentStatus.OnHold
            ? "Held pending address verification."
            : undefined,
      createdBy: i === 0 ? "system@trackflow.io" : pick(OPERATORS),
      source: i === 0 ? "System" : pick(["Operator", "Scanner", "Carrier"] as const),
    };
  });

  const base: Omit<Shipment, "intelligence"> = {
    id,
    trackingNumber,
    merchantId: merchant.id,
    merchantName: merchant.companyName,
    recipientName,
    originCity: `${origin.city}, ${origin.state}`,
    destinationCity: `${destination.city}, ${destination.state}`,
    status: finalStatus,
    expectedDeliveryDate: iso(expectedDeliveryDate),
    riskLevel: RiskLevel.Normal,
    lastUpdatedAt: events[events.length - 1]!.occurredAt,
    recipient: {
      name: recipientName,
      phone: `+1 (${int(200, 989)}) ${int(200, 989)}-${int(1000, 9999)}`,
      email: `${recipientName.split(" ")[0]!.toLowerCase()}.${recipientName.split(" ")[1]!.toLowerCase()}@example.com`,
    },
    origin,
    destination,
    package: {
      description: pick(PACKAGES),
      weightKg: Number((rand() * 18 + 0.4).toFixed(2)),
      referenceNumber: index % 3 === 0 ? `PO-${int(10000, 99999)}` : undefined,
    },
    notes: index % 4 === 0 ? "Leave with front desk if recipient is unavailable." : undefined,
    createdAt: iso(createdAt),
    createdBy: pick(OPERATORS),
    updatedBy: pick(OPERATORS),
    events,
  };

  const intelligence = computeIntelligence(base);
  return { ...base, intelligence, riskLevel: intelligence.riskLevel };
}

export const shipments: Shipment[] = Array.from({ length: 74 }, (_, i) => buildShipment(i));

for (const merchant of merchants) {
  merchant.shipmentCount = shipments.filter((s) => s.merchantId === merchant.id).length;
}

const ACTIONS = ["Created", "Updated", "Status Changed", "Cancelled", "Logged In", "Exported"];
const ENTITIES = ["Shipment", "Merchant", "User"];

export const activityLog: ActivityLogEntry[] = shipments
  .flatMap((shipment, idx) =>
    shipment.events.slice(-2).map((event, j) => ({
      id: `act_${idx}_${j}`,
      timestamp: event.occurredAt,
      user: event.createdBy,
      action: j === 0 ? "Status Changed" : pick(ACTIONS),
      entityType: "Shipment",
      entityId: shipment.trackingNumber,
      description: `Shipment ${shipment.trackingNumber} set to “${event.status}” at ${event.location}.`,
    })),
  )
  .concat(
    merchants.map((merchant, i) => ({
      id: `act_mer_${i}`,
      timestamp: merchant.createdAt,
      user: OPERATORS[i % OPERATORS.length]!,
      action: "Created",
      entityType: "Merchant",
      entityId: merchant.id,
      description: `Merchant ${merchant.companyName} onboarded.`,
    })),
  )
  .concat(
    Array.from({ length: 12 }, (_, i) => ({
      id: `act_login_${i}`,
      timestamp: iso(NOW - i * 7 * HOUR),
      user: OPERATORS[i % OPERATORS.length]!,
      action: "Logged In",
      entityType: "User",
      entityId: `usr_00${(i % 3) + 1}`,
      description: "Signed in from the operations console.",
    })),
  )
  .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

export const ACTIVITY_ACTIONS = Array.from(new Set(activityLog.map((a) => a.action))).sort();
export const ACTIVITY_USERS = Array.from(new Set(activityLog.map((a) => a.user))).sort();
export const ACTIVITY_ENTITIES = ENTITIES;

export function nextEventId(shipmentId: string) {
  const shipment = shipments.find((s) => s.id === shipmentId);
  return `${shipmentId}_evt_${(shipment?.events.length ?? 0) + 1}`;
}

export function recalculate(shipment: Shipment) {
  shipment.events.sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
  const last = shipment.events[shipment.events.length - 1]!;
  shipment.status = last.status;
  shipment.lastUpdatedAt = last.occurredAt;
  const intelligence = computeIntelligence(shipment);
  shipment.intelligence = intelligence;
  shipment.riskLevel = intelligence.riskLevel;
  return shipment;
}
