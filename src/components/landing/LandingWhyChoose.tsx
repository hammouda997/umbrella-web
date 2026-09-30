"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { WHY_POINTS } from "@/components/landing/landing-data";

export function LandingWhyChoose() {
  return (
    <section
      id="choisir"
      className="why-visual relative flex h-[100svh] max-h-[100svh] flex-col overflow-hidden bg-white px-5 py-6 sm:px-6 sm:py-8 md:px-10 md:py-10"
    >
      <div className="mx-auto flex h-full w-full max-w-6xl min-h-0 flex-col">
        <header className="why-copy mx-auto w-full max-w-2xl shrink-0 text-center lg:mx-0 lg:text-left">
          <p className="reveal text-[10px] font-semibold uppercase tracking-[0.24em] text-[#986A36] sm:text-[11px]">
            Confiance
          </p>
          <h2 className="reveal mt-1.5 font-display text-[clamp(1.55rem,3.6vw,2.35rem)] font-semibold leading-[1.08] tracking-[-0.035em] text-black sm:mt-2">
            Pourquoi les boutiques{" "}
            <span className="text-[#991211]">choisissent Umbrella</span>
          </h2>
        </header>

        <div className="mt-4 grid min-h-0 flex-1 items-stretch gap-5 sm:mt-5 lg:mt-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-10 xl:gap-12">
          <figure className="why-media relative hidden min-h-0 md:block">
            <div className="relative h-full min-h-[220px] overflow-hidden rounded-[1.25rem] bg-[#1a1414]">
              <Image
                src="/assets/livreur.png"
                alt="Livreur Umbrella Express en opération"
                fill
                className="object-cover object-[center_18%]"
                sizes="(max-width: 1024px) 45vw, 440px"
                priority={false}
              />
              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent"
                aria-hidden
              />
              <figcaption className="absolute inset-x-0 bottom-0 z-10 p-4 lg:p-5">
                <p className="font-display text-[12px] font-medium tracking-wide text-white/95 lg:text-[13px]">
                  Ops terrain · suivi tablet · remise soignée
                </p>
              </figcaption>
            </div>
          </figure>

          <div className="flex min-h-0 flex-col text-center lg:text-left">
            <p className="reveal mx-auto max-w-md shrink-0 text-[13px] leading-snug text-black/55 sm:text-[14px] lg:mx-0">
              Moins d’outils, plus de contrôle. Pickup, livreurs et COD dans un
              seul rythme — pensé pour l’e-commerce tunisien.
            </p>

            <ol className="why-list mt-3 min-h-0 flex-1 overflow-hidden border-t border-black/[0.08] text-left sm:mt-4">
              {WHY_POINTS.map((point) => (
                <li
                  key={point.n}
                  className="why-point group grid grid-cols-[2.5rem_1fr] gap-3 border-b border-black/[0.08] py-2.5 sm:grid-cols-[3rem_1fr] sm:gap-4 sm:py-3 md:py-3.5"
                >
                  <span className="pt-0.5 font-display text-[11px] font-bold tracking-[0.12em] text-[#986A36] sm:text-[12px]">
                    {point.n}
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-display text-[14px] font-semibold tracking-tight text-black transition group-hover:text-[#991211] sm:text-[15px] md:text-[16px]">
                      {point.title}
                    </h3>
                    <p className="mt-0.5 line-clamp-2 max-w-md text-[12px] leading-snug text-black/50 sm:text-[13px]">
                      {point.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            <Link
              href="/signup"
              className="reveal magnet mx-auto mt-3 inline-flex w-fit shrink-0 items-center gap-2 border-b border-[#991211] pb-0.5 text-[13px] font-semibold text-[#991211] transition hover:gap-3 sm:mt-4 sm:text-[14px] lg:mx-0"
            >
              Créer mon compte
              <ArrowUpRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
