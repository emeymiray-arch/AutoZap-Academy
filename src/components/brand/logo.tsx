import Image from "next/image";
import { cn } from "@/lib/utils";

export function BrandMark({
  size = 56,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src="/brand/autozap-mark.png"
      alt="AutoZap"
      width={size}
      height={size}
      priority
      className={cn("select-none", className)}
    />
  );
}
