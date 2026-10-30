import {
  LayoutDashboard,
  Package,
  Boxes,
  Tags,
  ShoppingBag,
  Users,
  TicketPercent,
  Images,
  Settings,
  Undo2,
  ShoppingCart,
  BarChart3,
  type LucideIcon,
} from "lucide-react";

export type NavItem = { to: string; label: string; icon: LucideIcon; exact?: boolean };

/** Single source of truth for admin navigation (sidebar, mobile drawer, bottom bar). */
export const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: "Store",
    items: [
      { to: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
      { to: "/admin/orders", label: "Orders", icon: ShoppingBag },
      { to: "/admin/incomplete", label: "Incomplete checkouts", icon: ShoppingCart },
      { to: "/admin/returns", label: "Returns", icon: Undo2 },
      { to: "/admin/products", label: "Products", icon: Package },
      { to: "/admin/inventory", label: "Inventory", icon: Boxes },
      { to: "/admin/categories", label: "Categories", icon: Tags },
      { to: "/admin/customers", label: "Customers", icon: Users },
    ],
  },
  {
    title: "Growth",
    items: [
      { to: "/admin/coupons", label: "Coupons", icon: TicketPercent },
      { to: "/admin/content", label: "Homepage & FAQs", icon: Images },
      { to: "/admin/reports", label: "Reports", icon: BarChart3 },
    ],
  },
];

export const SETTINGS_ITEM: NavItem = { to: "/admin/settings", label: "Settings", icon: Settings };

export const BOTTOM_TABS: NavItem[] = [
  { to: "/admin", label: "Home", icon: LayoutDashboard, exact: true },
  { to: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/customers", label: "Customers", icon: Users },
];
