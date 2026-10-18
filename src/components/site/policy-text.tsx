import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { siteSettingQuery } from "@/lib/store-data";

/** Shows the owner's policy text from the admin dashboard when set; otherwise the built-in default. */
export function PolicyText({ field, children }: { field: "shipping" | "returns" | "terms" | "privacy" | "about"; children: ReactNode }) {
  const { data } = useQuery(siteSettingQuery("policies"));
  const text = data?.[field];
  if (typeof text === "string" && text.trim()) return <>{text.trim().split(/\n{2,}/).map((p, i) => <p key={i} className="whitespace-pre-line">{p}</p>)}</>;
  return <>{children}</>;
}
