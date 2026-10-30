import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Send, Truck } from "lucide-react";
import { toast } from "sonner";
import { courierStatus, sendToCourier, type CourierId } from "@/lib/courier.functions";
import { btnPrimary, inputCls } from "@/components/admin/confirm";

const LABEL: Record<CourierId, string> = { steadfast: "Steadfast", pathao: "Pathao", redx: "RedX" };

export function useCourierStatus() {
  const fn = useServerFn(courierStatus);
  return useQuery({ queryKey: ["admin", "courier-status"], queryFn: () => fn(), staleTime: 60_000 });
}

/** One-tap booking with a connected courier; COD amount is the order total unless cash was already collected. */
export function CourierDispatch({ orderId, dispatched }: { orderId: string; dispatched: string | null }) {
  const status = useCourierStatus();
  const send = useServerFn(sendToCourier);
  const qc = useQueryClient();
  const ready = (status.data ?? []).filter((c) => c.configured);
  const [pick, setPick] = useState<CourierId | "">("");
  const m = useMutation({
    mutationFn: (courier: CourierId) => send({ data: { orderId, courier } }),
    onSuccess: (r) => {
      if (!r.ok) return toast.error(r.error);
      toast.success(`Parcel booked. Tracking code ${r.tracking_code}`);
      qc.invalidateQueries({ queryKey: ["admin", "order", orderId] });
    },
    onError: () => toast.error("Couldn't reach the courier. Try again."),
  });
  if (dispatched)
    return (
      <p className="flex items-center gap-2 rounded-md bg-secondary p-3 text-sm">
        <Truck className="h-4 w-4 text-primary" aria-hidden /> Booked with courier · ID {dispatched}
      </p>
    );
  if (status.isPending) return <div className="h-11 animate-pulse rounded-md bg-muted" />;
  if (!ready.length)
    return (
      <p className="rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">
        No courier connected yet. Add Steadfast, Pathao or RedX keys (Settings → Courier connections) to book
        parcels in one tap. Until then, type the courier and tracking code below.
      </p>
    );
  const chosen = (pick || ready[0]!.id) as CourierId;
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <select
        aria-label="Courier to book"
        className={inputCls}
        value={chosen}
        onChange={(e) => setPick(e.target.value as CourierId)}
      >
        {ready.map((c) => (
          <option key={c.id} value={c.id}>
            {LABEL[c.id]}
          </option>
        ))}
      </select>
      <button
        type="button"
        className={`${btnPrimary} min-h-11 shrink-0`}
        disabled={m.isPending}
        onClick={() => {
          if (confirm(`Book this parcel with ${LABEL[chosen]}?`)) m.mutate(chosen);
        }}
      >
        <Send className="mr-1 h-4 w-4" aria-hidden />
        {m.isPending ? "Booking…" : "Send to courier"}
      </button>
    </div>
  );
}

export function CourierConnections() {
  const s = useCourierStatus();
  if (s.isPending) return <div className="h-24 animate-pulse rounded-md bg-muted" />;
  if (s.isError) return <p className="text-sm text-destructive">Couldn't check courier connections.</p>;
  return (
    <ul className="grid gap-3 sm:grid-cols-3">
      {s.data.map((c) => (
        <li key={c.id} className="rounded-md border border-border p-3 text-sm">
          <div className="flex items-center justify-between">
            <b>{LABEL[c.id]}</b>
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${c.configured ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}
            >
              {c.configured ? "Connected" : "Not connected"}
            </span>
          </div>
          {!c.configured && (
            <p className="mt-2 break-words text-xs text-muted-foreground">Needs: {c.missing.join(", ")}</p>
          )}
        </li>
      ))}
    </ul>
  );
}
