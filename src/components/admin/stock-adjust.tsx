import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { errMsg } from "@/lib/admin";
import { btnGhost, btnPrimary, inputCls } from "./confirm";

const REASONS = [
  { v: "restock", l: "New stock arrived" }, { v: "count_correction", l: "Stock count correction" },
  { v: "damaged", l: "Damaged / lost" }, { v: "returned", l: "Customer return" }, { v: "other", l: "Other" },
];

export function StockAdjust({ productId, variantId, label, current }: { productId: string; variantId?: string | null; label: string; current: number }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [change, setChange] = useState("");
  const [reason, setReason] = useState("restock");
  const [note, setNote] = useState("");
  const n = Number(change);
  const m = useMutation({
    mutationFn: async () => {
      if (!Number.isInteger(n) || n === 0) throw new Error("Enter a whole number like 5 or -2.");
      if (current + n < 0) throw new Error("Stock can't go below zero.");
      const { data, error } = await supabase.rpc("admin_adjust_stock", { p_product_id: productId, p_variant_id: (variantId ?? null) as string, p_change: n, p_reason: reason, p_note: note });
      if (error) throw new Error(errMsg(error));
      return data;
    },
    onSuccess: (v) => { toast.success(`Stock for ${label} is now ${v}`); setOpen(false); setChange(""); setNote(""); qc.invalidateQueries({ queryKey: ["admin"] }); qc.invalidateQueries({ queryKey: ["catalogue"] }); },
    onError: (e) => toast.error((e as Error).message),
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><button type="button" className={btnGhost}>Adjust</button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Adjust stock — {label}</DialogTitle></DialogHeader>
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); m.mutate(); }}>
          <p className="text-sm">Current stock: <b>{current}</b>{Number.isInteger(n) && n !== 0 && <> → <b>{current + n}</b></>}</p>
          <label className="block text-sm">Change (use minus to remove)<input autoFocus type="number" step={1} className={`${inputCls} mt-1`} value={change} onChange={(e) => setChange(e.target.value)} placeholder="e.g. 10 or -2" /></label>
          <label className="block text-sm">Reason<select className={`${inputCls} mt-1`} value={reason} onChange={(e) => setReason(e.target.value)}>{REASONS.map((r) => <option key={r.v} value={r.v}>{r.l}</option>)}</select></label>
          <label className="block text-sm">Note (optional)<input maxLength={300} className={`${inputCls} mt-1`} value={note} onChange={(e) => setNote(e.target.value)} /></label>
          <button className={`${btnPrimary} w-full`} disabled={m.isPending}>{m.isPending ? "Saving…" : "Save adjustment"}</button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
