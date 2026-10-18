import { useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";

// Optional analytics. Nothing loads unless an ID is configured AND the visitor accepts.
// Only page paths are sent — never names, phones, addresses or order details.
const GA = /^G-[A-Z0-9]{4,15}$/.test(import.meta.env.VITE_GA_MEASUREMENT_ID ?? "") ? (import.meta.env.VITE_GA_MEASUREMENT_ID as string) : null;
const PIXEL = /^\d{10,20}$/.test(import.meta.env.VITE_META_PIXEL_ID ?? "") ? (import.meta.env.VITE_META_PIXEL_ID as string) : null;
const KEY = "sifatmart_analytics_consent";
// Private pages never get tracked.
const PRIVATE = /^\/(admin|account|checkout|order-confirmation|track-order|login|signup|forgot-password|reset-password)/;

type W = Window & { dataLayer?: unknown[]; gtag?: (...a: unknown[]) => void; fbq?: ((...a: unknown[]) => void) & { queue?: unknown[]; callMethod?: unknown } };

function load() {
  const w = window as W;
  if (GA && !w.gtag) {
    const s = document.createElement("script");
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${GA}`;
    document.head.appendChild(s);
    w.dataLayer = w.dataLayer ?? [];
    w.gtag = function () { (w.dataLayer as unknown[]).push(arguments); };
    w.gtag("js", new Date());
    w.gtag("config", GA, { send_page_view: false, anonymize_ip: true, allow_google_signals: false, allow_ad_personalization_signals: false });
  }
  if (PIXEL && !w.fbq) {
    const q: unknown[] = [];
    const f = ((...a: unknown[]) => { q.push(a); }) as NonNullable<W["fbq"]>;
    f.queue = q;
    w.fbq = f;
    const s = document.createElement("script");
    s.async = true;
    s.src = "https://connect.facebook.net/en_US/fbevents.js";
    s.onload = () => { const real = (window as W).fbq; if (real && real !== f) q.forEach((a) => real(...(a as unknown[]))); };
    document.head.appendChild(s);
    w.fbq("init", PIXEL);
  }
}

function pageView(path: string) {
  const w = window as W;
  if (PRIVATE.test(path)) return;
  w.gtag?.("event", "page_view", { page_path: path, page_location: window.location.origin + path });
  w.fbq?.("track", "PageView");
}

export function AnalyticsConsent() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [consent, setConsent] = useState<"granted" | "denied" | null | "unknown">("unknown");

  useEffect(() => {
    const v = localStorage.getItem(KEY);
    setConsent(v === "granted" || v === "denied" ? v : null);
  }, []);
  useEffect(() => {
    if (consent === "granted") { load(); pageView(path); }
  }, [consent, path]);

  if (!GA && !PIXEL) return null;
  if (consent !== null) return null;
  const choose = (v: "granted" | "denied") => { localStorage.setItem(KEY, v); setConsent(v); };
  return (
    <div role="dialog" aria-label="Cookie preferences" className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-xl rounded-lg border border-border bg-card p-4 text-sm text-card-foreground shadow-soft">
      <p>We'd like to use anonymous analytics cookies to understand which pages are popular. We never share your name, phone, address or orders.</p>
      <div className="mt-3 flex justify-end gap-2">
        <button onClick={() => choose("denied")} className="rounded-md border border-input px-4 py-2">No thanks</button>
        <button onClick={() => choose("granted")} className="rounded-md bg-primary px-4 py-2 text-primary-foreground">Allow</button>
      </div>
    </div>
  );
}
