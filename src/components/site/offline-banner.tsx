import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

/** Shows a small notice while the device is offline. Cart stays in local storage. */
export function OfflineBanner() {
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  if (!offline) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 bottom-0 z-[60] flex items-center justify-center gap-2 bg-foreground px-4 py-3 text-sm text-background pb-[max(0.75rem,env(safe-area-inset-bottom))]"
    >
      <WifiOff className="h-4 w-4" aria-hidden="true" />
      You're offline. Your cart is saved — we'll reconnect automatically.
    </div>
  );
}
