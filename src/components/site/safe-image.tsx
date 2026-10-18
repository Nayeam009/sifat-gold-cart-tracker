import { ImageOff } from "lucide-react";
import { useState, type ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/** Image that shows a soft placeholder instead of a broken icon when the file is missing or fails. */
export function SafeImage({ src, alt, className, ...rest }: ImgHTMLAttributes<HTMLImageElement>) {
  const [failed, setFailed] = useState(false);
  if (!src || failed)
    return (
      <div role="img" aria-label={alt} className={cn("grid place-items-center bg-muted text-muted-foreground", className)}>
        <ImageOff className="h-6 w-6" aria-hidden />
      </div>
    );
  return <img src={src} alt={alt} onError={() => setFailed(true)} className={className} {...rest} />;
}
