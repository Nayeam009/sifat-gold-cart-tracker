import { createFileRoute } from "@tanstack/react-router";
import { CrudTable } from "@/components/admin/crud-table";
import { AdminTitle } from "@/components/admin/confirm";
import { formatTaka } from "@/lib/catalog";

export const Route = createFileRoute("/admin/coupons")({ component: Coupons });

function Coupons() {
  return (
    <div>
      <AdminTitle title="Coupons" />
      <CrudTable
        table="coupons"
        noun="Coupon"
        orderBy="created_at"
        ascending={false}
        searchKeys={["code"]}
        label={(r) => String(r.code)}
        defaults={{
          code: "",
          discount_type: "fixed",
          discount_value: "",
          min_subtotal: 0,
          max_discount: "",
          starts_at: null,
          expires_at: null,
          usage_limit: "",
          is_active: true,
        }}
        validate={(r) => {
          r.code = String(r.code ?? "").toUpperCase();
          if (!/^[A-Z0-9]{3,30}$/.test(r.code as string))
            return "Code must be 3–30 letters or numbers.";
          if (
            r.discount_type === "percent" &&
            ((r.discount_value as number) < 1 || (r.discount_value as number) > 90)
          )
            return "Percentage must be between 1 and 90.";
          if (r.starts_at && r.expires_at && String(r.expires_at) <= String(r.starts_at))
            return "Expiry must be after the start date.";
          return null;
        }}
        fields={[
          {
            key: "code",
            label: "Code",
            type: "text",
            required: true,
            maxLength: 30,
            placeholder: "EID10",
          },
          {
            key: "discount_type",
            label: "Type",
            type: "select",
            options: [
              { value: "fixed", label: "Fixed Taka amount" },
              { value: "percent", label: "Percentage" },
            ],
          },
          {
            key: "discount_value",
            label: "Value (৳ or %)",
            type: "number",
            required: true,
            min: 1,
            max: 1_000_000,
          },
          {
            key: "min_subtotal",
            label: "Minimum order subtotal (৳)",
            type: "number",
            required: true,
            min: 0,
            max: 10_000_000,
          },
          {
            key: "max_discount",
            label: "Maximum discount (৳, optional)",
            type: "number",
            min: 1,
            max: 1_000_000,
          },
          {
            key: "usage_limit",
            label: "Usage limit (optional)",
            type: "number",
            min: 1,
            max: 1_000_000,
          },
          { key: "starts_at", label: "Starts", type: "datetime" },
          { key: "expires_at", label: "Expires", type: "datetime" },
          { key: "is_active", label: "Active", type: "bool" },
        ]}
        columns={[
          { key: "code", label: "Code" },
          {
            key: "discount_value",
            label: "Discount",
            render: (r) =>
              r.discount_type === "percent"
                ? `${r.discount_value}%`
                : formatTaka(Number(r.discount_value)),
          },
          {
            key: "min_subtotal",
            label: "Min order",
            render: (r) => formatTaka(Number(r.min_subtotal)),
          },
          {
            key: "times_used",
            label: "Used",
            render: (r) => `${r.times_used}${r.usage_limit ? ` / ${r.usage_limit}` : ""}`,
          },
          {
            key: "expires_at",
            label: "Expires",
            render: (r) =>
              r.expires_at ? new Date(String(r.expires_at)).toLocaleDateString("en-GB") : "Never",
          },
          { key: "is_active", label: "Active", render: (r) => (r.is_active ? "Yes" : "Off") },
        ]}
      />
    </div>
  );
}
