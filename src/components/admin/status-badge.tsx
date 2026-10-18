const tone: Record<string, string> = {
  pending: "bg-secondary text-secondary-foreground",
  confirmed: "bg-accent text-accent-foreground",
  processing: "bg-accent text-accent-foreground",
  shipped: "bg-primary/15 text-foreground",
  delivered: "bg-primary text-primary-foreground",
  collected: "bg-primary text-primary-foreground",
  cancelled: "bg-destructive/15 text-destructive",
  returned: "bg-destructive/15 text-destructive",
  refunded: "bg-destructive/15 text-destructive",
  unpaid: "bg-muted text-muted-foreground",
};
export function StatusBadge({ status }: { status: string }) {
  return <span className={`inline-block rounded-full px-2 py-0.5 text-xs capitalize ${tone[status] ?? "bg-muted"}`}>{status}</span>;
}
