import { ApiError, mockResponse } from "./client";
import { shipments } from "./mock/store";
import type { PublicTrackingResult } from "./types";

export const trackingApi = {
  /** GET /api/tracking/{trackingNumber} — public, privacy-filtered projection. */
  async track(trackingNumber: string): Promise<PublicTrackingResult> {
    return mockResponse(() => {
      const normalized = trackingNumber.trim().toUpperCase();
      const shipment = shipments.find((s) => s.trackingNumber.toUpperCase() === normalized);
      if (!shipment) {
        throw new ApiError("We couldn't find a package with that tracking number.", 404);
      }
      return {
        trackingNumber: shipment.trackingNumber,
        status: shipment.status,
        expectedDeliveryDate: shipment.expectedDeliveryDate,
        originCity: shipment.originCity,
        destinationCity: shipment.destinationCity,
        events: shipment.events
          .map((e) => ({ status: e.status, location: e.location, occurredAt: e.occurredAt }))
          .reverse(),
      };
    }, 800);
  },
};
