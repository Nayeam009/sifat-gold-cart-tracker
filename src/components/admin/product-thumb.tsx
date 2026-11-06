import { useState } from "react";
import { ImageOff } from "lucide-react";

export function ProductThumb({ src }: { src?: string | null | undefined }) {
  const [broken, setBroken] = useState(false);
  if (!src || broken)
    return (
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <ImageOff className="h-4 w-4" aria-hidden />
      </span>
    );
  return (
    <img
      src={src}
      alt=""
      width={48}
      height={48}
      loading="lazy"
      decoding="async"
      onError={() => setBroken(true)}
      className="h-12 w-12 shrink-0 rounded-md bg-muted object-cover"
    />
  );
}
