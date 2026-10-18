import { createFileRoute } from "@tanstack/react-router";
import { CrudTable } from "@/components/admin/crud-table";
import { AdminTitle } from "@/components/admin/confirm";

export const Route = createFileRoute("/admin/categories")({ component: Categories });

function Categories() {
  return (
    <div>
      <AdminTitle title="Categories" />
      <CrudTable
        table="categories"
        noun="Category"
        orderBy="sort_order"
        searchKeys={["name", "slug"]}
        label={(r) => String(r.name)}
        invalidate={["categories", "catalogue"]}
        defaults={{
          name: "",
          slug: "",
          group_name: "Bridal",
          blurb: "",
          image_url: null,
          sort_order: 0,
          is_published: true,
        }}
        validate={(r) =>
          !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(String(r.slug ?? ""))
            ? "Slug may only use lowercase letters, numbers and dashes."
            : null
        }
        fields={[
          { key: "name", label: "Name", type: "text", required: true, maxLength: 80 },
          {
            key: "slug",
            label: "URL slug",
            type: "text",
            required: true,
            maxLength: 80,
            help: "Used in /category/… — changing it breaks old links.",
          },
          {
            key: "group_name",
            label: "Group",
            type: "select",
            options: ["Bridal", "Beauty", "Fashion"].map((g) => ({ value: g, label: g })),
          },
          { key: "blurb", label: "Short description", type: "textarea", maxLength: 300 },
          { key: "image_url", label: "Image", type: "image" },
          { key: "sort_order", label: "Display order", type: "number", min: 0, max: 999 },
          { key: "is_published", label: "Visible in shop", type: "bool" },
        ]}
        columns={[
          { key: "name", label: "Name" },
          { key: "slug", label: "Slug" },
          { key: "group_name", label: "Group" },
          { key: "sort_order", label: "Order" },
          {
            key: "is_published",
            label: "Visible",
            render: (r) => (r.is_published ? "Yes" : "Hidden"),
          },
        ]}
      />
    </div>
  );
}
