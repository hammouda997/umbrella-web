"use client";

import Link from "next/link";
import Image from "next/image";
import { FormEvent, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Clock3,
  MapPinned,
  Menu,
  Package,
  Phone,
  Route,
  Search,
  ShieldCheck,
  Truck,
  Wallet,
  X,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/** Official logo artwork — presentation only changes by surface. */
function BrandLogo({
  surface = "dark",
  className,
}: {
  surface?: "dark" | "light";
  className?: string;
}) {
  const image = (
    <Image
      src="/logo-umbrella.png"
      alt="Umbrella Express"
      width={160}
      height={72}
      className={
        surface === "dark"
          ? "h-11 w-auto object-contain object-left md:h-12"
          : "h-10 w-auto object-contain object-left"
      }
      priority={surface === "dark"}
    />
  );

  if (surface === "dark") {
    return (
      <span className={className ?? "inline-flex items-center"}>
        {image}
      </span>
    );
  }

  return (
    <span
      className={
        className ??
        "inline-flex items-center rounded-lg bg-panel px-2.5 py-2"
      }
    >
      {image}
    </span>
  );
}

const STATUS_STRIP = [
  "En attente",
  "À enlever",
  "Enlevés",
  "Au dépôt",
  "En cours",
  "Livrés",
  "Livrés payés",
  "Échanges",
  "Mes retours",
] as const;

const STEPS = [
  {
    n: "01",
    title: "Récupération de vos colis",
    body: "Nous venons chercher vos colis directement chez vous ou dans votre entreprise.",
    Icon: Package,
  },
  {
    n: "02",
    title: "Planification de la livraison",
    body: "Nous organisons la livraison selon l’adresse et l’horaire convenu avec votre client.",
    Icon: Route,
  },
  {
    n: "03",
    title: "Livraison au destinataire",
    body: "Nos livreurs assurent un service rapide, fiable et sécurisé partout en Tunisie.",
    Icon: Truck,
  },
  {
    n: "04",
    title: "Encaissement et versement",
    body: "Nous collectons le paiement en espèce (Cash on Delivery) et versons votre argent tous les jours de la semaine.",
    Icon: Wallet,
  },
] as const;

const BENEFITS = [
  {
    t: "Suivi avancé en temps réel",
    d: "Suivez chaque colis — attente, dépôt, en cours, livré.",
    Icon: MapPinned,
  },
  {
    t: "Service client réactif et humain",
    d: "Une équipe proche de toi, à l’écoute pour t’aider à évoluer.",
    Icon: Phone,
  },
  {
    t: "Meilleure connaissance du terrain",
    d: "Des Tunisiens, au service des Tunisiens — partout en Tunisie.",
    Icon: ShieldCheck,
  },
  {
    t: "Respect des délais et sécurité",
    d: "Livraison rapide, fiable et sécurisée pour vos clients.",
    Icon: Clock3,
  },
  {
    t: "Application simple et intuitive",
    d: "Crée ton profil, prépare tes colis et suis ta livraison.",
    Icon: Package,
  },
  {
    t: "Versements d’argent rapides",
    d: "Cash on Delivery — versement tous les jours de la semaine.",
    Icon: Wallet,
  },
] as const;

const TRUST = [
  { label: "Couverture", value: "Toute la Tunisie" },
  { label: "Disponibilité", value: "6j / 7" },
  { label: "Paiement", value: "Cash on Delivery" },
  { label: "Suivi", value: "Temps réel" },
] as const;

const NAV_LINKS = [
  { href: "#comment", label: "Comment ça marche" },
  { href: "#pourquoi", label: "Pourquoi Umbrella" },
  { href: "#confiance", label: "Ils nous font confiance" },
] as const;

export default function LandingPage() {
  const root = useRef<HTMLElement>(null);
  const [trackingCode, setTrackingCode] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  useGSAP(
    () => {
      const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      const animated = [
        ".hero-chrome",
        ".hero-brand .char",
        ".hero-express",
        ".hero-line",
        ".hero-cta",
        ".hero-meta",
        ".hero-track",
        ".trust-item",
        ".reveal",
        ".step-card",
        ".step-icon",
        ".step-line",
        ".feat-item",
        ".confiance-copy > *",
        ".confiance-media",
      ];

      if (reduce) {
        gsap.set(animated, { clearProps: "all", autoAlpha: 1, y: 0, x: 0, scale: 1 });
        return;
      }

      gsap.set(".hero-brand .char", { yPercent: 110, autoAlpha: 0 });
      gsap.set(
        [
          ".hero-chrome",
          ".hero-express",
          ".hero-line",
          ".hero-meta",
          ".hero-track",
          ".hero-cta",
          ".trust-item",
        ],
        { autoAlpha: 0, y: 20 },
      );
      gsap.set(".step-line", { scaleX: 0, transformOrigin: "left center" });

      const brandChars = gsap.utils.toArray<HTMLElement>(".hero-brand .char");
      const intro = gsap.timeline({ defaults: { ease: "power3.out" } });

      intro
        .from(
          ".hero-media",
          { scale: 1.18, duration: 1.8, ease: "power2.out" },
          0,
        )
        .from(
          ".hero-veil",
          { autoAlpha: 0, duration: 1.1, ease: "power2.inOut" },
          0.05,
        )
        .to(".hero-chrome", { autoAlpha: 1, y: 0, duration: 0.55 }, 0.2)
        .to(
          brandChars,
          {
            yPercent: 0,
            autoAlpha: 1,
            stagger: 0.035,
            duration: 0.7,
            ease: "power4.out",
          },
          0.35,
        )
        .to(
          ".hero-express",
          { autoAlpha: 1, y: 0, duration: 0.5, ease: "power3.out" },
          "-=0.35",
        )
        .to(".hero-meta", { autoAlpha: 1, y: 0, duration: 0.4 }, "-=0.45")
        .to(".hero-line", { autoAlpha: 1, y: 0, duration: 0.5 }, "-=0.25")
        .to(".hero-track", { autoAlpha: 1, y: 0, duration: 0.55 }, "-=0.2")
        .to(".hero-cta", { autoAlpha: 1, y: 0, duration: 0.45 }, "-=0.3")
        .to(
          ".trust-item",
          { autoAlpha: 1, y: 0, stagger: 0.08, duration: 0.45 },
          "-=0.2",
        );

      gsap.to(".hero-media", {
        yPercent: 14,
        ease: "none",
        scrollTrigger: {
          trigger: ".hero-block",
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });

      gsap.to(".hero-content", {
        yPercent: -6,
        autoAlpha: 0.35,
        ease: "none",
        scrollTrigger: {
          trigger: ".hero-block",
          start: "center top",
          end: "bottom top",
          scrub: true,
        },
      });

      gsap.fromTo(
        ".hero-media img",
        { scale: 1.08 },
        {
          scale: 1.16,
          duration: 18,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
        },
      );

      const marquee = gsap.to(".marquee-track", {
        xPercent: -50,
        duration: 28,
        ease: "none",
        repeat: -1,
      });
      const marqueeEl = document.querySelector(".marquee-band");
      marqueeEl?.addEventListener("mouseenter", () => marquee.pause());
      marqueeEl?.addEventListener("mouseleave", () => marquee.resume());

      gsap.utils.toArray<HTMLElement>(".reveal").forEach((el) => {
        gsap.from(el, {
          y: 36,
          autoAlpha: 0,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: "top 86%",
            toggleActions: "play none none none",
          },
        });
      });

      const stepsTl = gsap.timeline({
        scrollTrigger: {
          trigger: ".steps-grid",
          start: "top 78%",
        },
      });
      stepsTl
        .from(".step-card", {
          y: 40,
          autoAlpha: 0,
          stagger: 0.12,
          duration: 0.65,
          ease: "power3.out",
        })
        .from(
          ".step-icon",
          {
            scale: 0.55,
            autoAlpha: 0,
            stagger: 0.12,
            duration: 0.5,
            ease: "back.out(1.6)",
          },
          "-=0.55",
        )
        .to(
          ".step-line",
          {
            scaleX: 1,
            stagger: 0.14,
            duration: 0.55,
            ease: "power2.inOut",
          },
          "-=0.7",
        );

      gsap.from(".feat-item", {
        y: 48,
        autoAlpha: 0,
        rotateX: 8,
        transformOrigin: "center top",
        stagger: { each: 0.09, from: "start" },
        duration: 0.7,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".feat-grid",
          start: "top 80%",
        },
      });

      gsap.from(".pourquoi-media", {
        clipPath: "inset(12% 8% 12% 8% round 16px)",
        scale: 1.08,
        duration: 1.1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".pourquoi-media",
          start: "top 82%",
        },
      });

      const confianceTl = gsap.timeline({
        scrollTrigger: {
          trigger: "#confiance",
          start: "top 72%",
        },
      });
      confianceTl
        .from(".confiance-copy > *", {
          y: 28,
          autoAlpha: 0,
          stagger: 0.1,
          duration: 0.65,
          ease: "power3.out",
        })
        .from(
          ".confiance-media",
          {
            x: 48,
            autoAlpha: 0,
            duration: 0.9,
            ease: "power3.out",
          },
          "-=0.45",
        );

      gsap.to(".confiance-media img", {
        yPercent: -10,
        ease: "none",
        scrollTrigger: {
          trigger: "#confiance",
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });

      gsap.from(".landing-footer", {
        y: 24,
        autoAlpha: 0,
        duration: 0.7,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ".landing-footer",
          start: "top 92%",
        },
      });
    },
    { scope: root },
  );

  const brandWord = "Umbrella";

  const onTrack = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!trackingCode.trim()) return;
    window.location.href = `/track?code=${encodeURIComponent(trackingCode.trim())}`;
  };

  return (
    <main
      ref={root}
      className="landing min-h-screen overflow-x-hidden bg-surface text-ink"
    >
      <section className="hero-block relative isolate min-h-[100svh] overflow-hidden bg-panel">
        <div className="hero-media absolute inset-0">
          <Image
            src="/assets/hero-bg.jpg"
            alt="Livreur Umbrella Express en livraison"
            fill
            priority
            sizes="100vw"
            className="object-cover object-[68%_center]"
          />
        </div>
        <div
          className="hero-veil absolute inset-0"
          style={{
            background:
              "linear-gradient(105deg, rgba(26,20,20,0.92) 0%, rgba(26,20,20,0.78) 36%, rgba(153,18,17,0.45) 70%, rgba(153,18,17,0.28) 100%)",
          }}
        />

        <header className="hero-chrome absolute inset-x-0 top-0 z-40">
          <div className="border-b border-white/10 bg-panel/30 backdrop-blur-md">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-6 md:h-[4.25rem] md:px-10 lg:px-14">
              <Link href="/" className="shrink-0" aria-label="Umbrella Express">
                <BrandLogo surface="dark" />
              </Link>

              <nav className="hidden items-center gap-1 lg:flex" aria-label="Principal">
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="rounded-md px-3 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>

              <div className="flex items-center gap-2 sm:gap-3">
                <ThemeToggle tone="on-dark" />
                <a
                  href="tel:+21625025073"
                  className="hidden items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-white/85 transition hover:bg-white/10 hover:text-white md:inline-flex"
                >
                  <Phone className="h-4 w-4" aria-hidden />
                  +216 25 025 073
                </a>
                <Link
                  href="/login"
                  className="rounded-md bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-soft"
                >
                  Se connecter
                </Link>
                <button
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/20 text-white transition hover:bg-white/10 lg:hidden"
                  aria-expanded={menuOpen}
                  aria-controls="mobile-nav"
                  aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
                  onClick={() => setMenuOpen((open) => !open)}
                >
                  {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>

          {menuOpen ? (
            <div
              id="mobile-nav"
              className="border-b border-white/10 bg-panel/95 px-6 py-4 backdrop-blur-md lg:hidden"
            >
              <nav className="flex flex-col gap-1" aria-label="Mobile">
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="rounded-md px-3 py-3 text-sm font-medium text-white/90 transition hover:bg-white/10"
                    onClick={() => setMenuOpen(false)}
                  >
                    {link.label}
                  </a>
                ))}
                <a
                  href="tel:+21625025073"
                  className="mt-1 inline-flex items-center gap-2 rounded-md px-3 py-3 text-sm font-medium text-white/90"
                  onClick={() => setMenuOpen(false)}
                >
                  <Phone className="h-4 w-4" aria-hidden />
                  +216 25 025 073
                </a>
              </nav>
            </div>
          ) : null}
        </header>

        <div className="hero-content relative z-20 mx-auto flex min-h-[calc(100svh-5.5rem)] max-w-7xl flex-col justify-end px-6 pb-16 pt-24 md:px-10 md:pb-20 lg:px-14">
          <div className="relative max-w-xl text-white">
            <p className="hero-meta text-xs font-semibold uppercase tracking-[0.28em] text-cream-soft">
              Livrez plus vite et plus facile avec
            </p>

            <h1 className="hero-brand mt-4 font-display text-5xl font-extrabold leading-[0.92] tracking-tight md:text-6xl xl:text-7xl">
              <span className="inline-flex overflow-hidden">
                {brandWord.split("").map((ch, i) => (
                  <span key={`${ch}-${i}`} className="char inline-block origin-bottom">
                    {ch}
                  </span>
                ))}
              </span>
              <span className="hero-express mt-1 block italic text-cream-soft">Express</span>
            </h1>

            <p className="hero-line mt-5 max-w-md text-base leading-relaxed text-white/78 md:text-lg">
              La solution express pour les boutiques. Crée ton profil, prépare tes
              colis et suis ta livraison en temps réel.
            </p>

            <form
              onSubmit={onTrack}
              className="hero-track mt-8 flex w-full max-w-lg overflow-hidden rounded-md bg-surface shadow-soft"
            >
              <label className="sr-only" htmlFor="track-code">
                Numéro de suivi
              </label>
              <div className="flex min-w-0 flex-1 items-center gap-2 px-4">
                <Search className="h-4 w-4 shrink-0 text-ink-muted" aria-hidden />
                <input
                  id="track-code"
                  value={trackingCode}
                  onChange={(e) => setTrackingCode(e.target.value)}
                  placeholder="CMD123456789"
                  className="min-w-0 flex-1 bg-transparent py-4 text-sm text-ink outline-none placeholder:text-ink-muted/70"
                />
              </div>
              <button
                type="submit"
                className="bg-brand px-5 py-4 text-sm font-semibold text-white transition hover:bg-brand-soft md:px-6"
              >
                Suivi commande
              </button>
            </form>

            <div className="hero-cta mt-5 flex flex-col gap-3 sm:flex-row">
                <Link
                href="/signup"
                className="rounded-md bg-brand px-7 py-3.5 text-center text-sm font-semibold text-white transition hover:bg-brand-soft"
              >
                Créer un compte
              </Link>
              <a
                href="#comment"
                className="rounded-md border border-cream/40 bg-white/10 px-7 py-3.5 text-center text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/18"
              >
                Comment ça marche
              </a>
            </div>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-4 border-t border-white/15 pt-8 md:grid-cols-4 md:gap-8">
            {TRUST.map((item) => (
              <div key={item.label} className="trust-item">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cream-soft/70">
                  {item.label}
                </p>
                <p className="mt-1 text-sm font-semibold text-white md:text-base">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="marquee-band overflow-hidden border-y border-cream bg-brand py-3.5 text-white">
        <div className="marquee-track flex w-max gap-10 whitespace-nowrap text-sm font-medium tracking-wide">
          {[...STATUS_STRIP, ...STATUS_STRIP].map((label, i) => (
            <span key={`${label}-${i}`} className="inline-flex items-center gap-10">
              <span>{label}</span>
              <span className="text-cream-soft">◆</span>
            </span>
          ))}
        </div>
      </div>

      <section id="comment" className="bg-surface px-6 py-20 md:px-12 md:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="reveal text-xs font-semibold uppercase tracking-[0.22em] text-gold">
              Processus
            </p>
            <h2 className="reveal mt-3 font-display text-3xl font-bold text-ink md:text-4xl lg:text-[2.75rem]">
              Comment Umbrella fonctionne&nbsp;?
            </h2>
            <p className="reveal mt-4 text-sm leading-relaxed text-ink-muted md:text-base">
              De la récupération au versement — un parcours clair, fiable et
              maîtrisé de bout en bout.
            </p>
          </div>

          <ol className="steps-grid mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
            {STEPS.map((step, index) => {
              const Icon = step.Icon;
              return (
                <li key={step.n} className="step-card relative">
                  {index < STEPS.length - 1 ? (
                    <span
                      className="step-line absolute left-[3.25rem] top-6 hidden h-px w-[calc(100%-1.5rem)] bg-gradient-to-r from-brand/40 to-cream lg:block"
                      aria-hidden
                    />
                  ) : null}
                  <div className="step-icon relative mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-brand text-white shadow-soft">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">
                    Étape {step.n}
                  </p>
                  <h3 className="mt-2 font-display text-xl font-bold leading-snug text-ink">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                    {step.body}
                  </p>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <section id="pourquoi" className="border-y border-cream-soft bg-surface px-6 py-20 md:px-12 md:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-end gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="reveal text-xs font-semibold uppercase tracking-[0.22em] text-gold">
                Pourquoi Umbrella
              </p>
              <h2 className="reveal mt-3 font-display text-3xl font-bold text-ink md:text-4xl">
                Pourquoi Umbrella est le meilleur&nbsp;?
              </h2>
              <p className="reveal mt-4 max-w-xl text-sm leading-relaxed text-ink-muted md:text-base">
                Une logistique pensée pour les commerçants e-commerce — suivi,
                terrain, délais et versements.
              </p>
            </div>
            <div className="pourquoi-media reveal relative hidden aspect-[16/10] overflow-hidden rounded-2xl border border-cream-soft lg:block">
              <Image
                src="/assets/livreur.png"
                alt="Livraison Umbrella Express"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 0vw, 40vw"
              />
            </div>
          </div>

          <div className="feat-grid mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map((f) => {
              const Icon = f.Icon;
              return (
                <article
                  key={f.t}
                  className="feat-item rounded-2xl border border-cream-soft bg-surface p-6 shadow-soft"
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-cream-soft text-brand">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 font-display text-lg font-semibold text-ink">
                    {f.t}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-muted">{f.d}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section
        id="confiance"
        className="relative overflow-hidden bg-brand px-6 py-20 text-white md:px-12 md:py-28"
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 55% 60% at 90% 15%, rgba(229,219,212,0.18), transparent 55%)",
          }}
        />
        <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="confiance-copy">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cream-soft">
              Ils nous font confiance
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold md:text-4xl">
              Regardez vos colis être livrés aux clients
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-cream-soft/90 md:text-base">
              Boutiques et marques e-commerce qui nous confient leur last-mile
              chaque jour.
            </p>
            <blockquote className="mt-8 border-l-2 border-cream-soft/50 pl-4 text-sm italic text-cream-soft/90">
              « On a divisé les retours et accéléré les versements. »
              <span className="mt-1 block not-italic text-xs text-white/70">
                — Boutique mode, Tunis
              </span>
            </blockquote>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="rounded-md bg-white px-7 py-3.5 text-center text-sm font-semibold text-brand transition hover:bg-cream-soft"
              >
                Créer un compte
              </Link>
              <a
                href="tel:+21625025073"
                className="rounded-md border border-cream-soft/50 px-7 py-3.5 text-center text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Nous appeler
              </a>
            </div>
          </div>
          <div className="confiance-media relative aspect-[5/4] overflow-hidden rounded-2xl border border-cream-soft/30">
            <Image
              src="/assets/hero-bg.jpg"
              alt="Livraison Umbrella Express"
              fill
              className="object-cover object-center"
              sizes="(max-width: 1024px) 100vw, 45vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand/55 to-transparent" />
          </div>
        </div>
      </section>

      <footer className="landing-footer border-t border-cream-soft bg-surface px-6 py-12 md:px-12">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <BrandLogo surface="light" />
            <p className="mt-4 text-sm leading-relaxed text-ink-muted">
              Umbrella Express est un service de livraison conçu spécialement pour
              les commerçants et les personnes qui travaillent dans le e-commerce
              en Tunisie.
            </p>
          </div>
          <div className="flex flex-wrap gap-10 text-sm">
            <div>
              <p className="font-semibold text-ink">Navigation</p>
              <ul className="mt-3 space-y-2 text-ink-muted">
                {NAV_LINKS.map((link) => (
                  <li key={link.href}>
                    <a href={link.href} className="transition hover:text-brand">
                      {link.label}
                    </a>
                  </li>
                ))}
                <li>
                  <Link href="/tarifs" className="transition hover:text-brand">
                    Tarifs
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="transition hover:text-brand">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link href="/signup" className="transition hover:text-brand">
                    Créer un compte
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="transition hover:text-brand">
                    Connexion
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-ink">Contact & légal</p>
              <ul className="mt-3 space-y-2 text-ink-muted">
                <li>
                  <Link href="/contact" className="transition hover:text-brand">
                    Contact
                  </Link>
                </li>
                <li>
                  <a href="tel:+21625025073" className="transition hover:text-brand">
                    +216 25 025 073
                  </a>
                </li>
                <li>
                  <Link href="/legal/cgu" className="transition hover:text-brand">
                    CGU
                  </Link>
                </li>
                <li>
                  <Link
                    href="/legal/confidentialite"
                    className="transition hover:text-brand"
                  >
                    Confidentialité
                  </Link>
                </li>
                <li>
                  <Link href="/legal/mentions" className="transition hover:text-brand">
                    Mentions légales
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mx-auto mt-10 max-w-6xl border-t border-cream-soft pt-6 text-xs text-ink-muted">
          © {new Date().getFullYear()} Umbrella Express
        </div>
      </footer>
    </main>
  );
}
