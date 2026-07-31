import { ApiError, mockResponse } from "./client";
import { merchants } from "./mock/store";
import type { Merchant, MerchantRequest, Paged } from "./types";

export interface MerchantQuery {
  search?: string | undefined;
  status?: "active" | "inactive" | "" | undefined;
  page?: number | undefined;
  pageSize?: number | undefined;
}

export const merchantsApi = {
  /** GET /api/merchants */
  async list(query: MerchantQuery = {}): Promise<Paged<Merchant>> {
    return mockResponse(() => {
      const search = (query.search ?? "").trim().toLowerCase();
      let items = merchants.filter((m) => {
        if (search && !`${m.companyName} ${m.contactName} ${m.email}`.toLowerCase().includes(search)) return false;
        if (query.status === "active" && !m.isActive) return false;
        if (query.status === "inactive" && m.isActive) return false;
        return true;
      });
      items = [...items].sort((a, b) => a.companyName.localeCompare(b.companyName));
      const page = query.page ?? 1;
      const pageSize = query.pageSize ?? 10;
      return {
        items: items.slice((page - 1) * pageSize, page * pageSize),
        page,
        pageSize,
        totalCount: items.length,
        totalPages: Math.max(1, Math.ceil(items.length / pageSize)),
      };
    });
  },

  /** GET /api/merchants (unpaged options for selects) */
  async options(): Promise<Merchant[]> {
    return mockResponse(() => [...merchants].sort((a, b) => a.companyName.localeCompare(b.companyName)), 200);
  },

  /** GET /api/merchants/{id} */
  async getById(id: string): Promise<Merchant> {
    return mockResponse(() => {
      const merchant = merchants.find((m) => m.id === id);
      if (!merchant) throw new ApiError("Merchant not found", 404);
      return merchant;
    }, 300);
  },

  /** POST /api/merchants */
  async create(payload: MerchantRequest): Promise<Merchant> {
    return mockResponse(() => {
      if (merchants.some((m) => m.email.toLowerCase() === payload.email.toLowerCase())) {
        throw new ApiError("A merchant with this email already exists.", 409);
      }
      const merchant: Merchant = {
        id: `mer_${(merchants.length + 1).toString().padStart(3, "0")}`,
        ...payload,
        shipmentCount: 0,
        createdAt: new Date().toISOString(),
      };
      merchants.push(merchant);
      return merchant;
    }, 600);
  },

  /** PUT /api/merchants/{id} */
  async update(id: string, payload: MerchantRequest): Promise<Merchant> {
    return mockResponse(() => {
      const merchant = merchants.find((m) => m.id === id);
      if (!merchant) throw new ApiError("Merchant not found", 404);
      Object.assign(merchant, payload);
      return merchant;
    }, 600);
  },
};
