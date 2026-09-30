import Image from "next/image";
import { cn } from "@/lib/cn";

export function BrandLogo({
  surface = "dark",
  className,
  priority = false,
}: {
  surface?: "dark" | "light";
  className?: string;
  priority?: boolean;
}) {
  const image = (
    <Image
      src="/logo-umbrella.png"
      alt="Umbrella Express"
      width={160}
      height={72}
      priority={priority}
      className={
        surface === "dark"
          ? "h-11 w-auto object-contain object-left md:h-12"
          : "h-10 w-auto object-contain object-left"
      }
    />
  );

  return <span className={cn("inline-flex items-center", className)}>{image}</span>;
}
