import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Store } from "lucide-react";
import { useState } from "react";

import { merchantsApi } from "@/api/merchantsApi";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState, ErrorState, TableSkeletonRows } from "@/components/common/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/_console/merchants")({
  head: () => ({
    meta: [
      { title: "Merchants — TrackFlow" },
      { name: "description", content: "Manage merchant accounts, contacts, and shipment volumes." },
      { property: "og:title", content: "Merchants — TrackFlow" },
      { property: "og:description", content: "Merchant directory with contact details and shipment volume." },
    ],
  }),
  component: MerchantsPage,
});

function MerchantsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"" | "active" | "inactive">("");
  const [page, setPage] = useState(1);

  const merchants = useQuery({
    queryKey: ["merchants", { search, status, page }],
    queryFn: () => merchantsApi.list({ search, status, page, pageSize: 10 }),
  });

  return (
    <>
      <PageHeader title="Merchants" description="Every merchant sending shipments through TrackFlow." />

      <div className="grid gap-2 sm:grid-cols-[minmax(0,320px)_auto]">
        <Input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Search company, contact, or email"
          aria-label="Search merchants"
        />
        <div className="flex flex-wrap gap-2">
          {(["", "active", "inactive"] as const).map((value) => (
            <Button
              key={value || "all"}
              size="sm"
              variant={status === value ? "default" : "outline"}
              onClick={() => {
                setStatus(value);
                setPage(1);
              }}
            >
              {value === "" ? "All" : value === "active" ? "Active" : "Inactive"}
            </Button>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {merchants.isError ? (
            <ErrorState description="Merchants could not be loaded." onRetry={() => merchants.refetch()} />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Shipments</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {merchants.isPending ? (
                    <TableSkeletonRows rows={6} columns={7} />
                  ) : merchants.data.items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="p-0">
                        <EmptyState
                          icon={<Store className="size-5" aria-hidden="true" />}
                          title="No merchants found"
                          description="Try a different search term or clear the status filter."
                        />
                      </TableCell>
                    </TableRow>
                  ) : (
                    merchants.data.items.map((merchant) => (
                      <TableRow key={merchant.id}>
                        <TableCell className="font-medium">{merchant.companyName}</TableCell>
                        <TableCell>{merchant.contactName}</TableCell>
                        <TableCell className="text-muted-foreground">{merchant.email}</TableCell>
                        <TableCell className="whitespace-nowrap">{merchant.phone}</TableCell>
                        <TableCell className="tabular-nums">{merchant.shipmentCount}</TableCell>
                        <TableCell>
                          <Badge variant={merchant.isActive ? "default" : "secondary"}>
                            {merchant.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{formatDate(merchant.createdAt)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {merchants.data && merchants.data.totalPages > 1 ? (
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">
            Page {merchants.data.page} of {merchants.data.totalPages} · {merchants.data.totalCount} merchants
          </p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= merchants.data.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}
