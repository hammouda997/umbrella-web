"use client";

import Image from "next/image";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

/** Desktop hero van: one-shot drive-in. Phrases rotate in LandingHero. */
export function HeroVanScene() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!root.current) return;

      const van = root.current.querySelector<HTMLElement>(".hero-van");
      if (!van) return;

      if (reduce) {
        gsap.set(van, { left: "50%", xPercent: -50, rotate: 0 });
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
          { left: "52%", duration: 2.05 },
        )
        .to(van, { rotate: -1.6, duration: 0.14, ease: "power3.in" })
        .to(van, { rotate: 0.3, duration: 0.18, ease: "power2.out" })
        .to(van, { rotate: 0, duration: 0.24, ease: "power2.inOut" });
    },
    { scope: root },
  );

  return (
    <div
      ref={root}
      className="hero-scene pointer-events-none absolute inset-0 z-10 overflow-hidden"
      aria-hidden
    >
      <div className="hero-van absolute bottom-0 w-[min(95%,540px)] will-change-transform lg:bottom-2">
        <div className="relative aspect-[1017/468] w-full">
          <Image
            src="/assets/hero-van-v9.png"
            alt=""
            fill
            priority
            sizes="540px"
            className="object-contain object-bottom"
          />
        </div>
      </div>
    </div>
  );
}
