import Image from "next/image";
import { cn } from "@/lib/cn";

/**
 * Flat yellow delivery van. faceRight mirrors the body for L→R travel
 * while keeping the Umbrella logo readable.
 */
export function JourneyTruck({
  className,
  faceRight = false,
}: {
  className?: string;
  faceRight?: boolean;
}) {
  return (
    <div className={cn("relative", className)} aria-hidden>
      <div
        className={cn(
          "relative aspect-[2/1] w-full",
          faceRight && "-scale-x-100",
        )}
      >
        <Image
          src="/assets/van-illustration.png"
          alt=""
          fill
          priority
          sizes="(max-width: 768px) 160px, 200px"
          className="object-contain object-bottom"
        />
        {/* Cover DELIVERY + logo on rear (left in source art) */}
        <div className="pointer-events-none absolute left-[14%] top-[28%] h-[36%] w-[38%]">
          <div className="absolute inset-y-[18%] left-0 right-[42%] rounded-sm bg-[#E5A622]/95" />
          <div
            className={cn(
              "absolute inset-y-[8%] left-[2%] w-[48%]",
              faceRight && "-scale-x-100",
            )}
          >
            <Image
              src="/assets/logo-umbrella-clear.png"
              alt=""
              fill
              sizes="90px"
              className="object-contain"
              priority
            />
          </div>
        </div>
      </div>
    </div>
  );
}
