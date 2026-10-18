import { useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Plus, Trash2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ADMIN_PAGE, errMsg, safeSearch, uploadImage } from "@/lib/admin";
import { Confirm, Pager, StatePanel, btnGhost, btnPrimary, inputCls } from "./confirm";

export type Field = {
  key: string;
  label: string;
  type: "text" | "textarea" | "number" | "bool" | "select" | "datetime" | "image";
  options?: { value: string; label: string }[];
  required?: boolean;
  min?: number;
  max?: number;
  maxLength?: number;
  placeholder?: string;
  help?: string;
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as unknown as { from: (t: string) => any };

export function CrudTable({
  table,
  noun,
  fields,
  columns,
  searchKeys,
  orderBy,
  ascending = true,
  defaults,
  validate,
  label,
  invalidate = [],
}: {
  table: string;
  noun: string;
  fields: Field[];
  columns: { key: string; label: string; render?: (r: Row) => ReactNode }[];
  searchKeys: string[];
  orderBy: string;
  ascending?: boolean;
  defaults: Record<string, unknown>;
  validate?: (r: Row) => string | null;
  label: (r: Row) => string;
  invalidate?: string[];
}) {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<Row | null>(null);
  const key = ["admin", table, q, page];

  const list = useQuery({
    queryKey: key,
    queryFn: async () => {
      let req = db
        .from(table)
        .select("*", { count: "exact" })
        .order(orderBy, { ascending })
        .range(page * ADMIN_PAGE, page * ADMIN_PAGE + ADMIN_PAGE - 1);
      const s = safeSearch(q);
      if (s) req = req.or(searchKeys.map((k) => `${k}.ilike.%${s}%`).join(","));
      const { data, error, count } = await req;
      if (error) throw new Error(errMsg(error));
      return { rows: (data ?? []) as Row[], count: count ?? 0 };
    },
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin", table] });
    invalidate.forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
  };

  const save = useMutation({
    mutationFn: async (r: Row) => {
      const payload: Row = {};
      for (const f of fields) {
        let v = r[f.key];
        if (f.type === "number") v = v === "" || v == null ? null : Number(v);
        if (f.type === "datetime") v = v ? new Date(String(v)).toISOString() : null;
        if (
          (f.type === "text" || f.type === "textarea" || f.type === "image") &&
          typeof v === "string"
        )
          v = v.trim() === "" ? null : v.trim();
        if (f.required && (v == null || v === "")) throw new Error(`${f.label} is required.`);
        if (
          f.type === "number" &&
          v != null &&
          (!Number.isFinite(v as number) ||
            (f.min != null && (v as number) < f.min) ||
            (f.max != null && (v as number) > f.max))
        )
          throw new Error(`${f.label} must be between ${f.min ?? "…"} and ${f.max ?? "…"}.`);
        payload[f.key] = v;
      }
      const bad = validate?.(payload);
      if (bad) throw new Error(bad);
      const { error } = r.id
        ? await db.from(table).update(payload).eq("id", r.id)
        : await db.from(table).insert(payload);
      if (error) throw new Error(errMsg(error));
    },
    onSuccess: (_d, r) => {
      toast.success(r.id ? `${noun} updated` : `${noun} created`);
      setEditing(null);
      refresh();
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from(table).delete().eq("id", id);
      if (error) throw new Error(errMsg(error));
    },
    onSuccess: () => {
      toast.success(`${noun} deleted`);
      refresh();
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(0);
          }}
          placeholder={`Search ${noun.toLowerCase()}s…`}
          aria-label={`Search ${noun}s`}
          className={`${inputCls} max-w-xs`}
        />
        <button className={btnPrimary} onClick={() => setEditing({ ...defaults })}>
          <Plus className="h-4 w-4" /> New {noun.toLowerCase()}
        </button>
      </div>
      {list.isPending ? (
        <StatePanel>Loading…</StatePanel>
      ) : list.isError ? (
        <StatePanel tone="error">{list.error.message}</StatePanel>
      ) : list.data.rows.length === 0 ? (
        <StatePanel>
          {q ? "No matches. Try a different search." : `No ${noun.toLowerCase()}s yet.`}
        </StatePanel>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                {columns.map((c) => (
                  <th key={c.key} className="px-3 py-2">
                    {c.label}
                  </th>
                ))}
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.data.rows.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  {columns.map((c) => (
                    <td key={c.key} className="px-3 py-2 align-top">
                      {c.render ? c.render(r) : String(r[c.key] ?? "—")}
                    </td>
                  ))}
                  <td className="whitespace-nowrap px-3 py-2 text-right">
                    <button
                      className={btnGhost}
                      aria-label={`Edit ${label(r)}`}
                      onClick={() => setEditing(r)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>{" "}
                    <Confirm
                      title={`Delete ${noun.toLowerCase()}?`}
                      description={`"${label(r)}" will be permanently removed.`}
                      onConfirm={() => del.mutate(r.id)}
                      trigger={
                        <button
                          className={`${btnGhost} text-destructive`}
                          aria-label={`Delete ${label(r)}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {list.data && (
        <Pager page={page} total={list.data.count} size={ADMIN_PAGE} onPage={setPage} />
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing?.id ? `Edit ${noun.toLowerCase()}` : `New ${noun.toLowerCase()}`}
            </DialogTitle>
          </DialogHeader>
          {editing && (
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                save.mutate(editing);
              }}
            >
              {fields.map((f) => (
                <FieldInput
                  key={f.key}
                  f={f}
                  value={editing[f.key]}
                  onChange={(v) => setEditing({ ...editing, [f.key]: v })}
                />
              ))}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className={btnGhost} onClick={() => setEditing(null)}>
                  Cancel
                </button>
                <button type="submit" className={btnPrimary} disabled={save.isPending}>
                  {save.isPending ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FieldInput({
  f,
  value,
  onChange,
}: {
  f: Field;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const [busy, setBusy] = useState(false);
  const id = `f-${f.key}`;
  const lbl = (
    <label htmlFor={id} className="mb-1 block text-xs font-medium text-muted-foreground">
      {f.label}
      {f.required && " *"}
    </label>
  );
  if (f.type === "bool")
    return (
      <label className="flex items-center gap-2 text-sm">
        <input
          id={id}
          type="checkbox"
          checked={!!value}
          onChange={(e) => onChange(e.target.checked)}
        />{" "}
        {f.label}
      </label>
    );
  return (
    <div>
      {lbl}
      {f.type === "textarea" ? (
        <textarea
          id={id}
          rows={4}
          maxLength={f.maxLength ?? 2000}
          className={inputCls}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : f.type === "select" ? (
        <select
          id={id}
          className={inputCls}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
        >
          {f.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : f.type === "datetime" ? (
        <input
          id={id}
          type="datetime-local"
          className={inputCls}
          value={value ? new Date(String(value)).toISOString().slice(0, 16) : ""}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : f.type === "image" ? (
        <div className="flex items-center gap-3">
          {typeof value === "string" && value && (
            <img src={value} alt="" className="h-14 w-14 rounded object-cover" />
          )}
          <label className={`${btnGhost} cursor-pointer`}>
            <Upload className="h-3.5 w-3.5" /> {busy ? "Uploading…" : "Upload image"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              disabled={busy}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setBusy(true);
                try {
                  onChange(await uploadImage(file, "content"));
                  toast.success("Image uploaded");
                } catch (err) {
                  toast.error((err as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            />
          </label>
          {typeof value === "string" && value && (
            <button
              type="button"
              className="text-xs text-destructive"
              onClick={() => onChange(null)}
            >
              Remove
            </button>
          )}
        </div>
      ) : (
        <input
          id={id}
          type={f.type === "number" ? "number" : "text"}
          min={f.min}
          max={f.max}
          maxLength={f.maxLength ?? 300}
          placeholder={f.placeholder}
          className={inputCls}
          value={value == null ? "" : String(value)}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {f.help && <p className="mt-1 text-xs text-muted-foreground">{f.help}</p>}
    </div>
  );
}
