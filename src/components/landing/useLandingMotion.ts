"use client";

import { RefObject } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export function useLandingMotion(root: RefObject<HTMLElement | null>) {
  useGSAP(
    () => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const scope = root.current;
      if (!scope) return;

      if (reduce) {
        gsap.set(
          scope.querySelectorAll(
            ".hero-chrome, .hero-eyebrow, .hero-3d-copy, .hero-kicker, .hero-track, .hero-ctas, .hero-scene, .reveal, .why-point, .case-row, .landing-footer, .progress-bar",
          ),
          { clearProps: "all", autoAlpha: 1, y: 0, yPercent: 0, scale: 1 },
        );
        return;
      }

      gsap.set(
        [
          ".hero-chrome",
          ".hero-eyebrow",
          ".hero-3d-copy",
          ".hero-kicker",
          ".hero-track",
          ".hero-ctas",
        ],
        { autoAlpha: 0, y: 18 },
      );
      gsap.set(".hero-scene", { autoAlpha: 0, y: 28 });

      const intro = gsap.timeline({ defaults: { ease: "power3.out" } });
      intro
        .to(".hero-chrome", { autoAlpha: 1, y: 0, duration: 0.5 }, 0.04)
        .to(".hero-eyebrow", { autoAlpha: 1, y: 0, duration: 0.4 }, 0.12)
        .to(".hero-3d-copy", { autoAlpha: 1, y: 0, duration: 0.55 }, 0.18)
        .to(".hero-kicker", { autoAlpha: 1, y: 0, duration: 0.45 }, 0.32)
        .to(".hero-track", { autoAlpha: 1, y: 0, duration: 0.5 }, 0.4)
        .to(".hero-ctas", { autoAlpha: 1, y: 0, duration: 0.5 }, 0.5)
        .to(".hero-scene", { autoAlpha: 1, y: 0, duration: 0.75 }, 0.28);

      // Marquee runs via CSS (.marquee-track) — always-on, seamless, no pause.

      gsap.utils.toArray<HTMLElement>(".reveal").forEach((el) => {
        gsap.from(el, {
          autoAlpha: 0,
          y: 32,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 88%" },
        });
      });

      gsap.from(".why-point", {
        autoAlpha: 0,
        y: 16,
        stagger: 0.07,
        duration: 0.5,
        ease: "power3.out",
        scrollTrigger: { trigger: ".why-list", start: "top 85%" },
      });

      gsap.from(".why-media", {
        autoAlpha: 0,
        y: 24,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: { trigger: ".why-visual", start: "top 78%" },
      });

      gsap.from(".service-row", {
        autoAlpha: 0,
        y: 18,
        stagger: 0.06,
        duration: 0.55,
        ease: "power3.out",
        scrollTrigger: { trigger: ".services-list", start: "top 80%" },
      });

      gsap.from(".faq-item", {
        autoAlpha: 0,
        y: 16,
        stagger: 0.05,
        duration: 0.5,
        scrollTrigger: { trigger: "#faq", start: "top 80%" },
      });

      gsap.from(".landing-footer", {
        autoAlpha: 0,
        y: 20,
        duration: 0.65,
        scrollTrigger: { trigger: ".landing-footer", start: "top 92%" },
      });

      gsap.to(".progress-bar", {
        scaleX: 1,
        ease: "none",
        transformOrigin: "left center",
        scrollTrigger: {
          trigger: scope,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.3,
        },
      });

      scope.querySelectorAll<HTMLElement>(".magnet").forEach((btn) => {
        const onMove = (e: MouseEvent) => {
          const r = btn.getBoundingClientRect();
          const x = e.clientX - (r.left + r.width / 2);
          const y = e.clientY - (r.top + r.height / 2);
          gsap.to(btn, {
            x: x * 0.16,
            y: y * 0.16,
            duration: 0.35,
            ease: "power2.out",
          });
        };
        const onLeave = () => {
          gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: "power3.out" });
        };
        btn.addEventListener("mousemove", onMove);
        btn.addEventListener("mouseleave", onLeave);
      });
    },
    { scope: root },
  );
}
