"use client";

import { SERVICES } from "@/components/landing/landing-data";

export function LandingServices() {
  return (
    <section
      id="services"
      className="relative flex flex-col overflow-hidden bg-[#EFE8E0] px-5 py-10 sm:px-6 sm:py-12 md:px-10 md:py-14 lg:h-[100svh] lg:max-h-[100svh] lg:py-8"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.28]"
        aria-hidden
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(153,18,17,0.1) 1px, transparent 0)",
          backgroundSize: "26px 26px",
        }}
      />

      <div className="relative mx-auto flex h-full w-full max-w-6xl min-h-0 flex-col justify-center lg:justify-stretch">
        <header className="mx-auto w-full max-w-xl shrink-0 text-center lg:mx-0 lg:text-left">
          <p className="reveal text-[10px] font-semibold uppercase tracking-[0.24em] text-[#991211]/75 sm:text-[11px]">
            / Services
          </p>
          <h2 className="reveal mt-1 font-display text-[clamp(1.55rem,3.6vw,2.35rem)] font-semibold leading-[1.08] tracking-[-0.035em] text-black sm:mt-2">
            Tout le last-mile,
            <span className="mt-0.5 block text-[#991211]">une seule console</span>
          </h2>
          <p className="reveal mx-auto mt-1.5 max-w-md text-[13px] leading-snug text-black/55 sm:mt-2 sm:text-[14px] lg:mx-0">
            Du pickup au versement COD — le même pipeline pour votre boutique.
          </p>
        </header>

        <ul className="services-list mt-3 grid grid-cols-1 gap-x-8 gap-y-0 overflow-hidden border-t border-black/[0.08] text-center sm:mt-5 sm:grid-cols-2 sm:text-left lg:mt-6 lg:min-h-0 lg:flex-1 lg:grid-cols-3">
          {SERVICES.map((service) => (
            <li
              key={service.n}
              className="service-row flex flex-col border-b border-black/[0.08] py-2.5 sm:py-3.5 md:py-4"
            >
              <span className="font-display text-[11px] font-bold tracking-[0.14em] text-[#986A36]">
                {service.n}
              </span>
              <h3 className="mt-1 font-display text-[15px] font-semibold tracking-tight text-black sm:mt-2 sm:text-[17px]">
                {service.title}
              </h3>
              <p className="mt-0.5 text-[12px] leading-snug text-black/50 sm:mt-1 sm:text-[13px]">
                {service.body}
              </p>
            </li>
          ))}
        </ul>

      </div>
    </section>
  );
}
