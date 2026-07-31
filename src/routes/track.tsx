import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2, MapPin, PackageSearch, Truck } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { trackingApi } from "@/api/trackingApi";
import type { PublicTrackingResult } from "@/api/types";
import { StatusBadge } from "@/components/common/badges";
import { EmptyState } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/track")({
  head: () => ({
    meta: [
      { title: "Track a package — TrackFlow" },
      {
        name: "description",
        content: "Enter your TrackFlow tracking number to see the current status and delivery progress of your package.",
      },
      { property: "og:title", content: "Track a package — TrackFlow" },
      {
        property: "og:description",
        content: "Check the live status, expected delivery date, and journey of your TrackFlow shipment.",
      },
    ],
  }),
  component: PublicTrackingPage,
});

const schema = z.object({
  trackingNumber: z
    .string()
    .trim()
    .min(6, "Tracking numbers are at least 6 characters")
    .max(40, "That tracking number is too long"),
});

type TrackValues = z.infer<typeof schema>;

function PublicTrackingPage() {
  const form = useForm<TrackValues>({ resolver: zodResolver(schema), defaultValues: { trackingNumber: "" } });

  const mutation = useMutation<PublicTrackingResult, Error, string>({
    mutationFn: (trackingNumber) => trackingApi.track(trackingNumber),
  });

  const result = mutation.data;

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
          <Link to="/track" className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground">
              <Truck className="size-4" aria-hidden="true" />
            </span>
            <span className="text-sm font-semibold">TrackFlow</span>
          </Link>
          <Link
            to="/login"
            className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Operator sign in
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-4 py-10 sm:px-6 sm:py-14">
        <div className="max-w-xl space-y-2">
          <h1 className="text-2xl font-semibold sm:text-3xl">Track your package</h1>
          <p className="text-sm text-muted-foreground">
            Enter the tracking number from your shipping confirmation to see where your package is right now.
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit((values) => mutation.mutate(values.trackingNumber))}
                className="flex flex-col gap-3 sm:flex-row sm:items-start"
                noValidate
              >
                <FormField
                  control={form.control}
                  name="trackingNumber"
                  render={({ field }) => (
                    <FormItem className="min-w-0 flex-1">
                      <FormLabel className="sr-only">Tracking number</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. TF482100000" className="font-mono" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="sm:w-32" disabled={mutation.isPending}>
                  {mutation.isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                      Tracking
                    </>
                  ) : (
                    "Track"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {mutation.isPending ? (
          <Card>
            <CardContent className="space-y-3 pt-6">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-full max-w-md" />
              <Skeleton className="h-40 w-full" />
            </CardContent>
          </Card>
        ) : null}

        {mutation.isError ? (
          <Card>
            <CardContent className="p-0">
              <EmptyState
                icon={<PackageSearch className="size-5" aria-hidden="true" />}
                title="Package not found"
                description={mutation.error.message}
              />
            </CardContent>
          </Card>
        ) : null}

        {result ? (
          <div className="space-y-6">
            <Card>
              <CardHeader className="gap-3">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 sm:flex sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Tracking number</p>
                    <CardTitle className="truncate font-mono text-lg">{result.trackingNumber}</CardTitle>
                  </div>
                  <StatusBadge status={result.status} className="shrink-0" />
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 border-t border-border pt-5 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-muted-foreground">Expected delivery</p>
                  <p className="text-sm font-medium">{formatDate(result.expectedDeliveryDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">From</p>
                  <p className="text-sm font-medium">{result.originCity}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">To</p>
                  <p className="text-sm font-medium">{result.destinationCity}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tracking history</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-5">
                  {result.events.map((event, index) => (
                    <li key={`${event.occurredAt}-${index}`} className="relative flex gap-3 pl-1">
                      <span
                        className="mt-1.5 grid size-6 shrink-0 place-items-center rounded-full border border-border bg-card"
                        aria-hidden="true"
                      >
                        <MapPin className={index === 0 ? "size-3 text-primary" : "size-3 text-muted-foreground"} />
                      </span>
                      <div className="min-w-0 space-y-0.5">
                        <p className="text-sm font-medium">{event.status}</p>
                        <p className="truncate text-sm text-muted-foreground">{event.location}</p>
                        <p className="text-xs text-muted-foreground">{formatDateTime(event.occurredAt)}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {!result && !mutation.isPending && !mutation.isError ? (
          <p className="text-sm text-muted-foreground">
            Tracking numbers start with <span className="font-mono">TF</span> and are shown on your shipping
            confirmation email.
          </p>
        ) : null}
      </main>
    </div>
  );
}
