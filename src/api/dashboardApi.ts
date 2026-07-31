import { mockResponse } from "./client";
import { activityLog, riskReason, shipments } from "./mock/store";
import { RiskLevel, SHIPMENT_STATUSES, ShipmentStatus } from "./types";
import type {
  ActivityLogEntry,
  AtRiskShipment,
  DashboardSummary,
  StatusBreakdownItem,
} from "./types";

const RISK_ORDER: RiskLevel[] = [RiskLevel.Critical, RiskLevel.Delayed, RiskLevel.AtRisk, RiskLevel.Normal];

export const dashboardApi = {
  /** GET /api/dashboard/summary */
  async summary(): Promise<DashboardSummary> {
    return mockResponse(() => {
      const total = shipments.length;
      const inTransitStatuses: ShipmentStatus[] = [
        ShipmentStatus.PickedUp,
        ShipmentStatus.AtOriginFacility,
        ShipmentStatus.InTransit,
        ShipmentStatus.AtDestinationFacility,
        ShipmentStatus.OutForDelivery,
      ];
      const inTransit = shipments.filter((s) => inTransitStatuses.includes(s.status)).length;
      const delivered = shipments.filter((s) => s.status === ShipmentStatus.Delivered).length;
      const delayed = shipments.filter(
        (s) => s.riskLevel === RiskLevel.Delayed || s.riskLevel === RiskLevel.Critical,
      ).length;
      const closedStatuses: ShipmentStatus[] = [
        ShipmentStatus.Delivered,
        ShipmentStatus.Lost,
        ShipmentStatus.ReturnedToSender,
        ShipmentStatus.DeliveryFailed,
      ];
      const closed = shipments.filter((s) => closedStatuses.includes(s.status)).length;

      const volumeTrend = Array.from({ length: 14 }, (_, i) => {
        const date = new Date(Date.now() - (13 - i) * 86400_000);
        const key = date.toISOString().slice(0, 10);
        const created = shipments.filter((s) => s.createdAt.slice(0, 10) === key).length;
        const deliveredThatDay = shipments.filter(
          (s) => s.status === ShipmentStatus.Delivered && s.lastUpdatedAt.slice(0, 10) === key,
        ).length;
        return { date: key, shipments: created + (i % 3), delivered: deliveredThatDay + (i % 2) };
      });

      return {
        totalShipments: total,
        inTransit,
        delivered,
        delayed,
        deliverySuccessRate: closed === 0 ? 0 : Number(((delivered / closed) * 100).toFixed(1)),
        volumeTrend,
      };
    }, 600);
  },

  /** GET /api/dashboard/status-breakdown */
  async statusBreakdown(): Promise<StatusBreakdownItem[]> {
    return mockResponse(
      () =>
        SHIPMENT_STATUSES.map((status) => ({
          status,
          count: shipments.filter((s) => s.status === status).length,
        })).filter((item) => item.count > 0),
      500,
    );
  },

  /** GET /api/dashboard/at-risk-shipments */
  async atRiskShipments(riskLevels?: RiskLevel[]): Promise<AtRiskShipment[]> {
    return mockResponse(() => {
      const wanted = riskLevels?.length
        ? riskLevels
        : [RiskLevel.AtRisk, RiskLevel.Delayed, RiskLevel.Critical];
      return shipments
        .filter((s) => wanted.includes(s.riskLevel))
        .sort(
          (a, b) =>
            RISK_ORDER.indexOf(a.riskLevel) - RISK_ORDER.indexOf(b.riskLevel) ||
            b.intelligence.hoursSinceLastMovement - a.intelligence.hoursSinceLastMovement,
        )
        .map((s) => ({
          id: s.id,
          trackingNumber: s.trackingNumber,
          merchantName: s.merchantName,
          riskLevel: s.riskLevel,
          reason: riskReason(s),
          hoursInactive: s.intelligence.hoursSinceLastMovement,
          expectedDeliveryDate: s.expectedDeliveryDate,
          lastKnownLocation: s.intelligence.currentFacility,
        }));
    }, 550);
  },

  /** GET /api/dashboard/recent-activity */
  async recentActivity(limit = 6): Promise<ActivityLogEntry[]> {
    return mockResponse(() => activityLog.slice(0, limit), 450);
  },
};
