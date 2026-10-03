"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { cn } from "@/lib/cn";

gsap.registerPlugin(useGSAP);

type HeroVanSceneProps = {
  /** Landing = full hero drive-in; portal = compact banner on the right. */
  variant?: "landing" | "portal";
  className?: string;
};

/** Shared Umbrella van: one-shot drive-in (landing + portal heroes). */
export function HeroVanScene({
  variant = "landing",
  className,
}: HeroVanSceneProps) {
  const root = useRef<HTMLDivElement>(null);
  const isPortal = variant === "portal";
  const [parkLeft, setParkLeft] = useState(isPortal ? "88%" : "52%");

  useEffect(() => {
    if (!isPortal) {
      setParkLeft("52%");
      return;
    }
    const mq = window.matchMedia("(min-width: 640px)");
    const sync = () => setParkLeft(mq.matches ? "68%" : "92%");
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [isPortal]);

  useGSAP(
    () => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!root.current) return;

      const van = root.current.querySelector<HTMLElement>(".hero-van");
      if (!van) return;

      if (reduce) {
        gsap.set(van, { left: parkLeft, xPercent: -50, rotate: 0 });
        return;
      }

      gsap.set(van, {
        left: "118%",
        xPercent: -50,
        rotate: 0,
        transformOrigin: "50% 88%",
      });

      const enter = gsap.timeline({ defaults: { ease: "power2.out" } });
      enter
        .fromTo(
          van,
          { left: "118%", rotate: 0 },
          { left: parkLeft, duration: isPortal ? 1.55 : 2.05 },
        )
        .to(van, { rotate: -1.6, duration: 0.14, ease: "power3.in" })
        .to(van, { rotate: 0.3, duration: 0.18, ease: "power2.out" })
        .to(van, { rotate: 0, duration: 0.24, ease: "power2.inOut" });
    },
    { scope: root, dependencies: [parkLeft, isPortal] },
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
      <div
        className={cn(
          "hero-van absolute bottom-0 will-change-transform",
          isPortal
            ? "w-[min(70%,260px)] opacity-55 sm:w-[min(58%,340px)] sm:opacity-80 lg:w-[min(50%,400px)] lg:opacity-100"
            : "w-[min(95%,540px)] lg:bottom-2",
        )}
      >
        <div className="relative aspect-[1017/468] w-full">
          <Image
            src="/assets/hero-van-v9.png"
            alt=""
            fill
            priority
            sizes={isPortal ? "(max-width: 640px) 260px, 400px" : "540px"}
            className="object-contain object-bottom"
          />
        </div>
      </div>
    </div>
  );
}
