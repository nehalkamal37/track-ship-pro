import { ApiError, mockResponse } from "./client";
import { merchants, recalculate, shipments } from "./mock/store";
import { ShipmentStatus } from "./types";
import type {
  CreateShipmentEventRequest,
  CreateShipmentRequest,
  Paged,
  Shipment,
  ShipmentListItem,
  ShipmentQuery,
  TrackingEvent,
} from "./types";

function toListItem(shipment: Shipment): ShipmentListItem {
  const {
    id,
    trackingNumber,
    merchantId,
    merchantName,
    recipientName,
    originCity,
    destinationCity,
    status,
    expectedDeliveryDate,
    riskLevel,
    lastUpdatedAt,
  } = shipment;
  return {
    id,
    trackingNumber,
    merchantId,
    merchantName,
    recipientName,
    originCity,
    destinationCity,
    status,
    expectedDeliveryDate,
    riskLevel,
    lastUpdatedAt,
  };
}

export function filterShipments(query: ShipmentQuery): Shipment[] {
  const search = (query.search ?? "").trim().toLowerCase();
  const filtered = shipments.filter((s) => {
    if (search && !`${s.trackingNumber} ${s.recipientName}`.toLowerCase().includes(search)) return false;
    if (query.status && s.status !== query.status) return false;
    if (query.merchantId && s.merchantId !== query.merchantId) return false;
    if (query.riskLevel && s.riskLevel !== query.riskLevel) return false;
    if (query.fromDate && s.expectedDeliveryDate < query.fromDate) return false;
    if (query.toDate && s.expectedDeliveryDate > `${query.toDate}T23:59:59.999Z`) return false;
    return true;
  });

  const sortBy = query.sortBy ?? "lastUpdatedAt";
  const dir = query.sortDir === "asc" ? 1 : -1;
  return filtered.sort((a, b) => String(a[sortBy]).localeCompare(String(b[sortBy])) * dir);
}

export const shipmentsApi = {
  /** GET /api/shipments */
  async list(query: ShipmentQuery = {}): Promise<Paged<ShipmentListItem>> {
    return mockResponse(() => {
      const items = filterShipments(query);
      const page = query.page ?? 1;
      const pageSize = query.pageSize ?? 10;
      return {
        items: items.slice((page - 1) * pageSize, page * pageSize).map(toListItem),
        page,
        pageSize,
        totalCount: items.length,
        totalPages: Math.max(1, Math.ceil(items.length / pageSize)),
      };
    });
  },

  /** GET /api/shipments/{id} */
  async getById(id: string): Promise<Shipment> {
    return mockResponse(() => {
      const shipment = shipments.find((s) => s.id === id || s.trackingNumber === id);
      if (!shipment) throw new ApiError("Shipment not found", 404);
      return structuredClone(shipment);
    }, 400);
  },

  /** POST /api/shipments */
  async create(payload: CreateShipmentRequest): Promise<Shipment> {
    return mockResponse(() => {
      const merchant = merchants.find((m) => m.id === payload.merchantId);
      if (!merchant) throw new ApiError("The selected merchant could not be found.", 400);

      const id = `shp_${(shipments.length + 1).toString().padStart(4, "0")}`;
      const now = new Date().toISOString();
      const event: TrackingEvent = {
        id: `${id}_evt_1`,
        shipmentId: id,
        status: ShipmentStatus.Created,
        location: `${payload.origin.city}, ${payload.origin.state}`,
        occurredAt: now,
        notes: "Shipment record created.",
        createdBy: "operator@trackflow.io",
        source: "Operator",
      };

      const shipment = {
        id,
        trackingNumber: `TF${Math.floor(700000000 + Math.random() * 99999999)}`,
        merchantId: merchant.id,
        merchantName: merchant.companyName,
        recipientName: payload.recipient.name,
        originCity: `${payload.origin.city}, ${payload.origin.state}`,
        destinationCity: `${payload.destination.city}, ${payload.destination.state}`,
        status: ShipmentStatus.Created,
        expectedDeliveryDate: payload.expectedDeliveryDate,
        riskLevel: "Normal",
        lastUpdatedAt: now,
        recipient: payload.recipient,
        origin: payload.origin,
        destination: payload.destination,
        package: payload.package,
        notes: payload.notes,
        createdAt: now,
        createdBy: "operator@trackflow.io",
        updatedBy: "operator@trackflow.io",
        events: [event],
      } as Shipment;

      shipments.unshift(shipment);
      merchant.shipmentCount += 1;
      recalculate(shipment);
      return structuredClone(shipment);
    }, 800);
  },

  /** POST /api/shipments/{id}/events */
  async addEvent(id: string, payload: CreateShipmentEventRequest): Promise<Shipment> {
    return mockResponse(() => {
      const shipment = shipments.find((s) => s.id === id);
      if (!shipment) throw new ApiError("Shipment not found", 404);
      shipment.events.push({
        id: `${id}_evt_${shipment.events.length + 1}`,
        shipmentId: id,
        status: payload.status,
        location: payload.location,
        occurredAt: payload.occurredAt,
        notes: payload.notes,
        createdBy: "operator@trackflow.io",
        source: "Operator",
      });
      shipment.updatedBy = "operator@trackflow.io";
      recalculate(shipment);
      return structuredClone(shipment);
    }, 700);
  },

  /** POST /api/shipments/{id}/cancel */
  async cancel(id: string, reason?: string): Promise<Shipment> {
    return mockResponse(() => {
      const shipment = shipments.find((s) => s.id === id);
      if (!shipment) throw new ApiError("Shipment not found", 404);
      if (shipment.status === ShipmentStatus.Delivered) {
        throw new ApiError("A delivered shipment cannot be cancelled.", 409);
      }
      shipment.events.push({
        id: `${id}_evt_${shipment.events.length + 1}`,
        shipmentId: id,
        status: ShipmentStatus.Cancelled,
        location: shipment.events[shipment.events.length - 1]?.location ?? shipment.originCity,
        occurredAt: new Date().toISOString(),
        notes: reason ?? "Cancelled by operator.",
        createdBy: "operator@trackflow.io",
        source: "Operator",
      });
      recalculate(shipment);
      return structuredClone(shipment);
    }, 700);
  },
};
