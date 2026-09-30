"use client";

import Link from "next/link";
import { FormEvent, useRef, useState } from "react";
import { ArrowRight, Menu, Search, X } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { BrandLogo } from "@/components/landing/BrandLogo";
import { HeroVanScene } from "@/components/landing/HeroVanScene";
import { LandingMarquee } from "@/components/landing/LandingMarquee";
import { NAV_LINKS } from "@/components/landing/landing-data";

gsap.registerPlugin(useGSAP);

const HERO_PHRASES = [
  "SAFE &\nSPEEDY",
  "SPEEDY\nDELIVERY",
  "FAST ACROSS\nTUNISIA",
] as const;

type LandingHeroProps = {
  trackingCode: string;
  onTrackingCodeChange: (value: string) => void;
  onTrack: (e: FormEvent) => void;
};

export function LandingHero({
  trackingCode,
  onTrackingCodeChange,
  onTrack,
}: LandingHeroProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!contentRef.current) return;
      const phrases = Array.from(
        contentRef.current.querySelectorAll<HTMLElement>(".hero-phrase"),
      );
      if (phrases.length < 2) return;

      if (reduce) {
        gsap.set(phrases, { autoAlpha: 0 });
        gsap.set(phrases[0], { autoAlpha: 1 });
        return;
      }

      gsap.set(phrases, { autoAlpha: 0, y: 10 });
      gsap.set(phrases[0], { autoAlpha: 1, y: 0 });

      let active = 0;
      const cycle = () => {
        const next = (active + 1) % phrases.length;
        const tl = gsap.timeline();
        phrases.forEach((el, i) => {
          if (i === next) {
            tl.fromTo(
              el,
              { autoAlpha: 0, y: 10 },
              { autoAlpha: 1, y: 0, duration: 0.32, ease: "power2.out" },
              0,
            );
          } else if (i === active) {
            tl.to(el, { autoAlpha: 0, y: -8, duration: 0.22, ease: "power2.in" }, 0);
          } else {
            gsap.set(el, { autoAlpha: 0 });
          }
        });
        active = next;
      };

      const loop = gsap.timeline({ repeat: -1, delay: 2.2 });
      loop.call(cycle).to({}, { duration: 2.4 });
    },
    { scope: contentRef },
  );

  return (
    <section className="hero-block relative isolate flex min-h-[100svh] flex-col overflow-x-hidden bg-[#991211] text-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        aria-hidden
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, #E5DBD4 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
      />
      <div
        className="pointer-events-none absolute left-1/2 top-1/3 h-[50vh] w-[50vh] -translate-x-1/2 rounded-full bg-[#986A36]/10 blur-3xl"
        aria-hidden
      />

      <header className="hero-chrome relative z-40 shrink-0">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-5 sm:px-6 md:h-16 md:px-10 lg:px-14">
          <Link href="/" className="shrink-0" aria-label="Umbrella Express">
            <BrandLogo surface="dark" priority />
          </Link>

          <nav className="hidden items-center gap-0.5 md:flex" aria-label="Principal">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-full px-3.5 py-2 text-[13px] font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="magnet hidden rounded-full bg-white px-5 py-2.5 text-[13px] font-medium text-[#991211] transition hover:bg-white/90 sm:inline-flex"
            >
              Se connecter
            </Link>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/25 text-white md:hidden"
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
              onClick={() => setMenuOpen((o) => !o)}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {menuOpen ? (
          <div
            id="mobile-nav"
            className="border-t border-white/15 bg-[#7a0e0e] px-5 py-4 text-center sm:px-6 md:hidden"
          >
            <nav className="flex flex-col gap-1" aria-label="Mobile">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="rounded-md px-3 py-3 text-sm font-medium text-white/90"
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <Link
                href="/login"
                className="mt-2 rounded-full bg-white px-4 py-3 text-center text-sm font-medium text-[#991211]"
                onClick={() => setMenuOpen(false)}
              >
                Se connecter
              </Link>
            </nav>
          </div>
        ) : null}
      </header>

      <div className="relative z-20 mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 items-center gap-6 px-5 pb-6 pt-4 sm:px-6 md:px-10 lg:grid-cols-2 lg:gap-10 lg:px-14 lg:pb-8 lg:pt-4">
        <div
          ref={contentRef}
          className="hero-content flex w-full max-w-lg flex-col items-center justify-center text-center lg:mx-0 lg:items-start lg:justify-center lg:text-left"
        >
          <p className="hero-eyebrow text-[11px] font-semibold uppercase tracking-[0.2em] text-[#E1D2A7] sm:text-xs">
            Last-mile · Tunisie · COD
          </p>

          <h1 className="sr-only">
            Livraison rapide et sécurisée pour e-commerce en Tunisie
          </h1>

          <div className="hero-3d-copy relative mt-4 h-[2.35em] w-full text-[clamp(2.15rem,7vw,3.75rem)] sm:mt-5">
            {HERO_PHRASES.map((phrase, i) => (
              <p
                key={phrase}
                className={`hero-phrase absolute inset-x-0 top-0 select-none font-display text-[length:inherit] font-extrabold uppercase leading-[1.08] tracking-[-0.04em] text-white ${
                  i === 0 ? "opacity-100" : "opacity-0"
                }`}
                data-phrase={i}
                aria-hidden={i !== 0}
              >
                {phrase.split("\n").map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </p>
            ))}
          </div>

          <p className="hero-kicker mt-5 max-w-md text-[15px] leading-relaxed text-white/75 sm:mt-6 sm:text-base">
            Pickup, suivi live et paiement à la livraison — sans friction pour
            votre e-commerce.
          </p>

          <form onSubmit={onTrack} className="hero-track mt-5 w-full sm:mt-6">
            <label className="sr-only" htmlFor="track-code">
              Numéro de suivi
            </label>
            <div className="flex min-w-0 items-center gap-2 rounded-full bg-[#E5DBD4] p-1.5">
              <input
                id="track-code"
                value={trackingCode}
                onChange={(e) => onTrackingCodeChange(e.target.value)}
                placeholder="Numéro de suivi…"
                className="min-w-0 flex-1 bg-transparent px-4 py-2.5 text-left text-[14px] text-[#1a1414] outline-none placeholder:text-[#1a1414]/40 sm:text-[15px]"
              />
              <button
                type="submit"
                className="magnet inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full bg-[#991211] px-5 text-[13px] font-semibold text-white transition hover:bg-[#7a0e0e] sm:h-11 sm:px-6"
              >
                <Search className="h-4 w-4" aria-hidden />
                <span className="hidden sm:inline">Suivre</span>
              </button>
            </div>
          </form>

          <div className="hero-ctas mt-6 flex w-full flex-col gap-3 sm:mt-7 sm:flex-row sm:items-center sm:justify-center lg:justify-start">
            <Link
              href="/signup"
              className="magnet inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#E5DBD4] px-7 text-[14px] font-semibold text-[#991211] transition hover:bg-white"
            >
              Créer un compte
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <a
              href="#parcours"
              className="magnet inline-flex h-12 items-center justify-center rounded-full border border-white/35 px-7 text-[14px] font-medium text-white transition hover:border-white hover:bg-white/10"
            >
              Voir le parcours
            </a>
          </div>
        </div>

        <div className="hero-stage relative hidden min-h-[320px] w-full lg:block lg:min-h-[380px]">
          <div
            className="pointer-events-none absolute inset-[8%] rounded-[40%] bg-[#E5DBD4]/[0.06] blur-2xl"
            aria-hidden
          />
          <HeroVanScene />
        </div>
      </div>

      <LandingMarquee />
    </section>
  );
}
