import { useEffect, useRef } from "react";

// Decorative layered hills drawn on a canvas in SifatMart colours.
// Back to front: pale champagne -> espresso. Drawn only while visible.
const LAYERS = [
  { base: 0.34, amp: 0.06, freq: 1.3, color: "rgba(232,214,180,0.75)" },
  { base: 0.44, amp: 0.07, freq: 1.7, color: "rgba(214,186,138,0.8)" },
  { base: 0.54, amp: 0.06, freq: 2.1, color: "rgba(194,154,82,0.85)" },
  { base: 0.64, amp: 0.05, freq: 1.5, color: "rgba(140,96,58,0.92)" },
  { base: 0.74, amp: 0.04, freq: 2.4, color: "rgba(84,54,36,0.97)" },
  { base: 0.84, amp: 0.03, freq: 1.9, color: "rgb(50,31,22)" },
];

export function MeadowHills({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0, h = 0, raf = 0, visible = false, start = 0, px = 0, tx = 0;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw(performance.now());
    };
    const draw = (now: number) => {
      if (!start) start = now;
      const t = reduce ? 10 : (now - start) / 1000;
      px += (tx - px) * 0.05;
      ctx.clearRect(0, 0, w, h);
      LAYERS.forEach((l, i) => {
        const rise = reduce ? 1 : Math.min(1, Math.max(0, (t - i * 0.12) / 0.9));
        const ease = 1 - Math.pow(1 - rise, 3);
        const off = (1 - ease) * h * 0.35;
        const shift = px * (i + 1) * 4 + t * (6 - i) * 2;
        ctx.beginPath();
        ctx.moveTo(0, h);
        for (let x = 0; x <= w + 8; x += 8) {
          const u = (x + shift) / Math.max(w, 1);
          const y = h * l.base + off
            + Math.sin(u * Math.PI * l.freq + i * 1.7) * h * l.amp
            + Math.sin(u * Math.PI * l.freq * 2.3 + i) * h * l.amp * 0.35;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fillStyle = l.color;
        ctx.fill();
      });
      // drifting mist
      if (!reduce) {
        const mx = ((t * 20) % (w * 1.5)) - w * 0.25;
        const g = ctx.createRadialGradient(mx, h * 0.5, 0, mx, h * 0.5, w * 0.35);
        g.addColorStop(0, "rgba(255,248,238,0.22)");
        g.addColorStop(1, "rgba(255,248,238,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      }
    };
    const loop = (now: number) => { draw(now); if (visible && !reduce) raf = requestAnimationFrame(loop); };
    const io = new IntersectionObserver(([e]) => {
      visible = !!e?.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible) raf = requestAnimationFrame(loop);
    }, { rootMargin: "200px" });
    const onMove = (e: PointerEvent) => { tx = e.clientX / window.innerWidth - 0.5; };
    io.observe(canvas);
    window.addEventListener("resize", resize);
    if (!reduce) window.addEventListener("pointermove", onMove, { passive: true });
    resize();
    return () => { io.disconnect(); cancelAnimationFrame(raf); window.removeEventListener("resize", resize); window.removeEventListener("pointermove", onMove); };
  }, []);
  return <canvas ref={ref} aria-hidden className={className} />;
}
