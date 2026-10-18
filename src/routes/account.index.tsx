import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { normalizeBdPhone } from "@/lib/checkout";
import { BD_DISTRICTS } from "@/lib/bd-districts";
import { Field, FormAlert, authInput } from "@/components/site/auth-card";
import { Confirm } from "@/components/admin/confirm";

export const Route = createFileRoute("/account/")({ component: ProfilePage });

const btn =
  "rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-60";
const ghost = "rounded-md border border-border px-3 py-1.5 text-sm hover:bg-secondary";

function ProfilePage() {
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr]">
      <ProfileForm />
      <Addresses />
    </div>
  );
}

function ProfileForm() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["my-profile"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, phone, email")
        .eq("id", u.user!.id)
        .maybeSingle();
      if (error) throw error;
      return data ?? { id: u.user!.id, full_name: "", phone: "", email: u.user!.email ?? "" };
    },
  });
  const [draft, setDraft] = useState<{ full_name: string; phone: string } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const f = draft ?? { full_name: q.data?.full_name ?? "", phone: q.data?.phone ?? "" };
  const save = useMutation({
    mutationFn: async () => {
      const name = f.full_name.trim();
      if (name.length < 2 || name.length > 100)
        throw new Error("Please enter your name (2–100 characters).");
      const phone = f.phone.trim() ? normalizeBdPhone(f.phone) : null;
      if (f.phone.trim() && !phone)
        throw new Error("Enter a valid Bangladeshi mobile number like 01XXXXXXXXX.");
      const { error } = await supabase
        .from("profiles")
        .upsert({ id: q.data!.id, full_name: name, phone, email: q.data!.email });
      if (error) throw new Error("Could not save your profile. Please try again.");
    },
    onSuccess: () => {
      setErr(null);
      setDraft(null);
      qc.invalidateQueries({ queryKey: ["my-profile"] });
      toast.success("Profile saved");
    },
    onError: (e: Error) => setErr(e.message),
  });

  if (q.isLoading)
    return (
      <p role="status" className="text-sm text-muted-foreground">
        Loading profile…
      </p>
    );
  if (q.isError) return <FormAlert>Could not load your profile. Please refresh.</FormAlert>;
  return (
    <form
      className="space-y-4 rounded-lg border border-border bg-card p-6"
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
      noValidate
    >
      <h2 className="font-display text-2xl">Your details</h2>
      {err && <FormAlert>{err}</FormAlert>}
      <Field id="pname" label="Full name">
        <input
          id="pname"
          autoComplete="name"
          maxLength={100}
          value={f.full_name}
          onChange={(e) => setDraft({ ...f, full_name: e.target.value })}
          className={authInput}
        />
      </Field>
      <Field id="pphone" label="Mobile number">
        <input
          id="pphone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          maxLength={16}
          placeholder="01XXXXXXXXX"
          value={f.phone}
          onChange={(e) => setDraft({ ...f, phone: e.target.value })}
          className={authInput}
        />
      </Field>
      <p className="text-sm text-muted-foreground">Email: {q.data?.email}</p>
      <button disabled={save.isPending} className={btn}>
        {save.isPending ? "Saving…" : "Save details"}
      </button>
    </form>
  );
}

type Addr = {
  id?: string;
  label: string;
  recipient_name: string;
  phone: string;
  address_line: string;
  city: string;
  zone: string;
  is_default: boolean;
};
const EMPTY: Addr = {
  label: "Home",
  recipient_name: "",
  phone: "",
  address_line: "",
  city: "",
  zone: "outside",
  is_default: false,
};

function Addresses() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Addr | null>(null);
  const q = useQuery({
    queryKey: ["my-addresses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_addresses")
        .select("id, label, recipient_name, phone, address_line, city, zone, is_default")
        .order("is_default", { ascending: false })
        .order("created_at");
      if (error) throw error;
      return data ?? [];
    },
  });
  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("customer_addresses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-addresses"] });
      toast.success("Address removed");
    },
    onError: () => toast.error("Could not remove the address."),
  });

  return (
    <section
      className="space-y-4 rounded-lg border border-border bg-card p-6"
      aria-labelledby="addr-h"
    >
      <div className="flex items-center justify-between">
        <h2 id="addr-h" className="font-display text-2xl">
          Saved addresses
        </h2>
        {!editing && (
          <button
            className={ghost}
            onClick={() => setEditing({ ...EMPTY, is_default: (q.data?.length ?? 0) === 0 })}
          >
            Add address
          </button>
        )}
      </div>
      {editing && <AddressForm initial={editing} onDone={() => setEditing(null)} />}
      {q.isLoading && (
        <p role="status" className="text-sm text-muted-foreground">
          Loading addresses…
        </p>
      )}
      {q.isError && <FormAlert>Could not load addresses. Please refresh.</FormAlert>}
      {q.data?.length === 0 && !editing && (
        <p className="text-sm text-muted-foreground">
          No saved addresses yet. Add one to speed up delivery details.
        </p>
      )}
      <ul className="space-y-3">
        {q.data?.map((a) => (
          <li key={a.id} className="rounded-md border border-border p-4 text-sm">
            <p className="font-medium">
              {a.label}{" "}
              {a.is_default && (
                <span className="ml-1 rounded-full bg-secondary px-2 py-0.5 text-xs">Default</span>
              )}
            </p>
            <p className="mt-1">
              {a.recipient_name} · {a.phone}
            </p>
            <p className="text-muted-foreground">
              {a.address_line}, {a.city} ·{" "}
              {a.zone === "inside" ? "Inside Saidpur" : "Outside Saidpur"}
            </p>
            <div className="mt-3 flex gap-2">
              <button className={ghost} onClick={() => setEditing(a)}>
                Edit
              </button>
              <Confirm
                trigger={<button className={ghost}>Remove</button>}
                title="Remove this address?"
                description="This can't be undone."
                action="Remove"
                onConfirm={() => del.mutate(a.id)}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function AddressForm({ initial, onDone }: { initial: Addr; onDone: () => void }) {
  const qc = useQueryClient();
  const [a, setA] = useState<Addr>(initial);
  const [errs, setErrs] = useState<Record<string, string>>({});
  const set =
    (k: keyof Addr) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setA({ ...a, [k]: e.target.value });
  const save = useMutation({
    mutationFn: async () => {
      const v: Record<string, string> = {};
      if (a.label.trim().length < 1) v["label"] = "Add a label like Home or Office.";
      if (a.recipient_name.trim().length < 2) v["recipient_name"] = "Enter the recipient's name.";
      const phone = normalizeBdPhone(a.phone);
      if (!phone) v["phone"] = "Enter a valid Bangladeshi mobile number.";
      if (!a.city) v["city"] = "Choose a district.";
      if (a.address_line.trim().length < 8)
        v["address_line"] = "Please write the full address (house, road, area).";
      setErrs(v);
      if (Object.keys(v).length) throw new Error("validation");
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user!.id;
      if (a.is_default)
        await supabase
          .from("customer_addresses")
          .update({ is_default: false })
          .eq("user_id", uid)
          .neq("id", a.id ?? "00000000-0000-0000-0000-000000000000");
      const row = {
        user_id: uid,
        label: a.label.trim().slice(0, 40),
        recipient_name: a.recipient_name.trim().slice(0, 100),
        phone: phone!,
        address_line: a.address_line.trim().slice(0, 300),
        city: a.city,
        zone: a.zone === "inside" ? "inside" : "outside",
        is_default: a.is_default,
      };
      const { error } = a.id
        ? await supabase.from("customer_addresses").update(row).eq("id", a.id)
        : await supabase.from("customer_addresses").insert(row);
      if (error) throw new Error("save");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-addresses"] });
      toast.success("Address saved");
      onDone();
    },
    onError: (e: Error) => {
      if (e.message !== "validation") toast.error("Could not save the address. Please try again.");
    },
  });
  const inp = (
    k: keyof Addr,
    label: string,
    extra: React.InputHTMLAttributes<HTMLInputElement> = {},
  ) => (
    <Field id={`a-${k}`} label={label} error={errs[k]}>
      <input
        id={`a-${k}`}
        value={String(a[k])}
        onChange={set(k)}
        className={authInput}
        aria-invalid={!!errs[k]}
        {...extra}
      />
    </Field>
  );
  return (
    <form
      className="space-y-3 rounded-md border border-primary/40 bg-background p-4"
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
      noValidate
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {inp("label", "Label", { maxLength: 40 })}
        {inp("recipient_name", "Recipient name", { maxLength: 100, autoComplete: "name" })}
        {inp("phone", "Mobile number", {
          type: "tel",
          inputMode: "tel",
          maxLength: 16,
          placeholder: "01XXXXXXXXX",
        })}
        <Field id="a-city" label="District" error={errs["city"]}>
          <select
            id="a-city"
            value={a.city}
            onChange={set("city")}
            className={authInput}
            aria-invalid={!!errs["city"]}
          >
            <option value="">Choose district</option>
            {BD_DISTRICTS.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </Field>
      </div>
      <Field
        id="a-address_line"
        label="Full address (house, road, upazila/area)"
        error={errs["address_line"]}
      >
        <textarea
          id="a-address_line"
          rows={2}
          maxLength={300}
          value={a.address_line}
          onChange={set("address_line")}
          className={authInput}
          aria-invalid={!!errs["address_line"]}
        />
      </Field>
      <Field id="a-zone" label="Delivery area">
        <select id="a-zone" value={a.zone} onChange={set("zone")} className={authInput}>
          <option value="inside">Inside Saidpur</option>
          <option value="outside">Outside Saidpur</option>
        </select>
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={a.is_default}
          onChange={(e) => setA({ ...a, is_default: e.target.checked })}
        />{" "}
        Use as default address
      </label>
      <div className="flex gap-2">
        <button disabled={save.isPending} className={btn}>
          {save.isPending ? "Saving…" : "Save address"}
        </button>
        <button type="button" className={ghost} onClick={onDone}>
          Cancel
        </button>
      </div>
    </form>
  );
}
