/** Pure admin business rules, kept free of I/O so they can be unit-tested. */

export type Segment = "vip" | "high_spender" | "at_risk" | "new";

export const SEGMENT_LABELS: Record<Segment, string> = {
  vip: "VIP",
  high_spender: "High spender",
  at_risk: "At risk",
  new: "New",
};

/** Amounts are integer BDT (same unit as orders.total). */
export function customerSegments(
  c: { orders: number; spent: number; last: string },
  now: Date = new Date(),
): Segment[] {
  const out: Segment[] = [];
  if (c.orders >= 4) out.push("vip");
  if (c.spent >= 10000) out.push("high_spender");
  const days = (now.getTime() - new Date(c.last).getTime()) / 86_400_000;
  if (days > 60) out.push("at_risk");
  if (c.orders === 1) out.push("new");
  return out;
}

export type ReturnStatus = "requested" | "approved" | "rejected" | "received" | "completed";

export function nextReturnStatuses(s: ReturnStatus): ReturnStatus[] {
  if (s === "requested") return ["approved", "rejected"];
  if (s === "approved") return ["received", "rejected"];
  if (s === "received") return ["completed"];
  return [];
}

export function refundAllowed(orderTotal: number, priorRefunds: number, refund: number): boolean {
  return Number.isInteger(refund) && refund >= 0 && refund + priorRefunds <= orderTotal;
}

export function creditChangeAllowed(balance: number, change: number): boolean {
  return Number.isInteger(change) && change !== 0 && balance + change >= 0;
}

export type StockRow = { id: string; kind: "product" | "variant"; label: string; stock: number };
export type StockChange = StockRow & { next: number };

/** Parse an inventory CSV (id,kind,label,stock). Empty stock cell = unchanged. */
export function parseStockCsv(
  text: string,
  current: StockRow[],
): { changes: StockChange[]; errors: string[] } {
  const byId = new Map(current.map((r) => [`${r.kind}:${r.id}`, r]));
  const changes: StockChange[] = [];
  const errors: string[] = [];
  const lines = text.replace(/\r/g, "").split("\n").filter((l) => l.trim());
  lines.slice(1).forEach((line, i) => {
    const cells = splitCsvLine(line);
    const [id, kind, , stockCell] = cells;
    const row = byId.get(`${kind}:${id}`);
    if (!row) return errors.push(`Line ${i + 2}: unknown item`);
    if (stockCell === undefined || stockCell.trim() === "") return;
    const n = Number(stockCell);
    if (!Number.isInteger(n)) return errors.push(`Line ${i + 2}: stock must be a whole number`);
    if (n < 0) return errors.push(`Line ${i + 2}: stock can't be negative`);
    if (n !== row.stock) changes.push({ ...row, next: n });
  });
  return { changes, errors };
}

export function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') q = false;
      else cur += ch;
    } else if (ch === '"') q = true;
    else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

export function toCsv(rows: (string | number | null | undefined)[][]): string {
  return rows
    .map((r) =>
      r
        .map((v) => {
          let s = v == null ? "" : String(v);
          if (/^[=+\-@]/.test(s)) s = `'${s}`; // block spreadsheet formula injection
          return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(","),
    )
    .join("\n");
}

export function downloadCsv(name: string, rows: (string | number | null | undefined)[][]) {
  const blob = new Blob(["\ufeff" + toCsv(rows)], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/** Build a tracking link from a template containing {code}; https only. */
export function trackingLink(template: string, code: string): string | null {
  if (!/^https:\/\//.test(template) || !code.trim()) return null;
  return template.includes("{code}")
    ? template.replace("{code}", encodeURIComponent(code.trim()))
    : template;
}
