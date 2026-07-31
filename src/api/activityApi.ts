import { mockResponse } from "./client";
import { activityLog, ACTIVITY_ACTIONS, ACTIVITY_ENTITIES, ACTIVITY_USERS } from "./mock/store";
import type { ActivityLogEntry, ActivityQuery, Paged } from "./types";

export const activityApi = {
  /** GET /api/activity */
  async list(query: ActivityQuery = {}): Promise<Paged<ActivityLogEntry>> {
    return mockResponse(() => {
      const items = activityLog.filter((entry) => {
        if (query.user && entry.user !== query.user) return false;
        if (query.action && entry.action !== query.action) return false;
        if (query.entityType && entry.entityType !== query.entityType) return false;
        if (query.fromDate && entry.timestamp < query.fromDate) return false;
        if (query.toDate && entry.timestamp > `${query.toDate}T23:59:59.999Z`) return false;
        return true;
      });
      const page = query.page ?? 1;
      const pageSize = query.pageSize ?? 15;
      return {
        items: items.slice((page - 1) * pageSize, page * pageSize),
        page,
        pageSize,
        totalCount: items.length,
        totalPages: Math.max(1, Math.ceil(items.length / pageSize)),
      };
    });
  },

  /** GET /api/activity/filters */
  async filters(): Promise<{ users: string[]; actions: string[]; entityTypes: string[] }> {
    return mockResponse(
      () => ({ users: ACTIVITY_USERS, actions: ACTIVITY_ACTIONS, entityTypes: ACTIVITY_ENTITIES }),
      200,
    );
  },
};
