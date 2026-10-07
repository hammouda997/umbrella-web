"use client";

import Image from "next/image";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { cn } from "@/lib/cn";

gsap.registerPlugin(useGSAP);

type HeroVanSceneProps = {
  /** Landing = full hero drive-in; portal = banner media plane. */
  variant?: "landing" | "portal";
  className?: string;
};

/** Shared Umbrella night van + brand mark (landing + portal heroes). */
export function HeroVanScene({
  variant = "landing",
  className,
}: HeroVanSceneProps) {
  const root = useRef<HTMLDivElement>(null);
  const isPortal = variant === "portal";

  useGSAP(
    () => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!root.current) return;

      const van = root.current.querySelector<HTMLElement>(".hero-van");
      if (!van) return;

      if (reduce) {
        gsap.set(van, { x: 0, autoAlpha: 1, scale: 1 });
        return;
      }

      gsap.fromTo(
        van,
        { x: isPortal ? "12%" : "18%", autoAlpha: 0.85, scale: 1.04 },
        {
          x: 0,
          autoAlpha: 1,
          scale: 1,
          duration: isPortal ? 1.25 : 1.9,
          ease: "power2.out",
        },
      );
    },
    { scope: root, dependencies: [isPortal] },
  );

  return (
    <div
      ref={root}
      className={cn(
        "hero-scene pointer-events-none absolute inset-0 overflow-hidden",
        isPortal ? "z-0" : "z-10",
        className,
      )}
      aria-hidden
    >
      <div className="hero-van absolute inset-0 will-change-transform">
        <div
          className="absolute inset-0"
          style={
            isPortal
              ? {
                  WebkitMaskImage:
                    "linear-gradient(90deg, transparent 0%, transparent 18%, rgba(0,0,0,0.35) 34%, rgba(0,0,0,0.85) 48%, #000 62%, #000 100%)",
                  maskImage:
                    "linear-gradient(90deg, transparent 0%, transparent 18%, rgba(0,0,0,0.35) 34%, rgba(0,0,0,0.85) 48%, #000 62%, #000 100%)",
                }
              : {
                  WebkitMaskImage:
                    "linear-gradient(90deg, transparent 0%, transparent 8%, rgba(0,0,0,0.45) 28%, #000 48%, #000 100%)",
                  maskImage:
                    "linear-gradient(90deg, transparent 0%, transparent 8%, rgba(0,0,0,0.45) 28%, #000 48%, #000 100%)",
                }
          }
        >
          <Image
            src="/assets/hero-van-night.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className={cn(
              "object-cover",
              isPortal
                ? "object-[72%_52%] sm:object-[68%_50%]"
                : "object-[70%_48%] lg:object-[62%_46%]",
            )}
          />
        </div>

        <div
          className={cn(
            "pointer-events-none absolute flex items-center justify-center",
            isPortal
              ? "bottom-[34%] left-[48%] right-[10%] top-[28%] sm:left-[50%] sm:right-[12%] lg:left-[52%] lg:right-[14%]"
              : "bottom-[36%] left-[42%] right-[8%] top-[30%] sm:left-[46%] lg:left-[48%] lg:right-[10%] lg:top-[28%] lg:bottom-[34%]",
          )}
        >
          <Image
            src="/logo-umbrella.png"
            alt=""
            width={360}
            height={150}
            className={cn(
              "h-auto w-full object-contain drop-shadow-[0_8px_20px_rgba(0,0,0,0.65)]",
              isPortal
                ? "max-w-[150px] sm:max-w-[190px] lg:max-w-[220px]"
                : "max-w-[180px] sm:max-w-[240px] lg:max-w-[300px]",
            )}
          />
        </div>
      </div>
    </div>
  );
}
