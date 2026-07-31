import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { shipmentsApi } from "@/api/shipmentsApi";
import type { Shipment, ShipmentStatus } from "@/api/types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { isTerminal, nextStatuses } from "@/lib/shipment-status";

const schema = z.object({
  status: z.string().min(1, "Select the new status"),
  location: z.string().trim().min(2, "Location is required").max(120),
  occurredAt: z.string().min(1, "Event date and time is required"),
  notes: z.string().trim().max(500).optional(),
});

type Values = z.infer<typeof schema>;

function localDateTimeValue() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 16);
}

export function UpdateStatusDialog({
  shipment,
  open,
  onOpenChange,
}: {
  shipment: Shipment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [apiError, setApiError] = useState<string | null>(null);
  const [pendingValues, setPendingValues] = useState<Values | null>(null);
  const options = nextStatuses(shipment.status);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { status: "", location: shipment.intelligence.currentFacility, occurredAt: localDateTimeValue(), notes: "" },
  });

  const mutation = useMutation({
    mutationFn: (values: Values) =>
      shipmentsApi.addEvent(shipment.id, {
        status: values.status as ShipmentStatus,
        location: values.location,
        notes: values.notes || undefined,
        occurredAt: new Date(values.occurredAt).toISOString(),
      }),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: ["shipment", shipment.id] });
      void queryClient.invalidateQueries({ queryKey: ["shipments"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Status updated", { description: `${updated.trackingNumber} is now “${updated.status}”.` });
      form.reset({ status: "", location: updated.intelligence.currentFacility, occurredAt: localDateTimeValue(), notes: "" });
      onOpenChange(false);
    },
    onError: (error: Error) => setApiError(error.message),
  });

  const submit = (values: Values) => {
    setApiError(null);
    if (isTerminal(values.status as ShipmentStatus)) {
      setPendingValues(values);
      return;
    }
    mutation.mutate(values);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Update shipment status</DialogTitle>
            <DialogDescription>
              Only statuses that logically follow “{shipment.status}” can be selected.
            </DialogDescription>
          </DialogHeader>

          {apiError ? (
            <Alert variant="destructive">
              <AlertDescription>{apiError}</AlertDescription>
            </Alert>
          ) : null}

          {options.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              This shipment has reached a final status and can no longer be updated.
            </p>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(submit)} className="space-y-4" noValidate>
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New status</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {options.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="occurredAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event date and time</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (optional)</FormLabel>
                      <FormControl>
                        <Textarea rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={mutation.isPending}>
                    {mutation.isPending ? (
                      <>
                        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                        Saving…
                      </>
                    ) : (
                      "Update status"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={pendingValues !== null} onOpenChange={(value) => !value && setPendingValues(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm final status</AlertDialogTitle>
            <AlertDialogDescription>
              “{pendingValues?.status}” is a final status for {shipment.trackingNumber}. No further tracking updates
              will be possible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Go back</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingValues) mutation.mutate(pendingValues);
                setPendingValues(null);
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
