"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

const INTERESTS = [
  "Pickup",
  "Livraison",
  "COD",
  "Suivi",
  "Console",
  "Retours",
] as const;

export function LandingContact() {
  const [sent, setSent] = useState(false);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [interests, setInterests] = useState<string[]>([]);

  function toggleInterest(value: string) {
    setInterests((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !phone.trim()) return;
    setSent(true);
  }

  return (
    <section
      id="contact"
      className="relative flex h-[100svh] max-h-[100svh] flex-col overflow-hidden bg-[#EFE8E0] px-5 py-6 sm:px-6 sm:py-8 md:px-10 md:py-10"
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

      <div className="relative mx-auto grid h-full w-full max-w-6xl min-h-0 grid-cols-1 items-stretch gap-5 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-10">
        <div className="flex shrink-0 flex-col justify-center text-center lg:pr-4 lg:text-left">
          <p className="reveal text-[10px] font-semibold uppercase tracking-[0.24em] text-[#991211]/75 sm:text-[11px]">
            / Contact
          </p>
          <h2 className="reveal mt-1.5 font-display text-[clamp(1.55rem,3.6vw,2.35rem)] font-semibold leading-[1.08] tracking-[-0.035em] text-black sm:mt-2">
            Parlez-nous de
            <span className="mt-0.5 block text-[#991211]">votre volume</span>
          </h2>
          <p className="reveal mx-auto mt-2 max-w-sm text-[13px] leading-snug text-black/55 sm:text-[14px] lg:mx-0">
            On revient vite. En attendant, créez un compte pour démarrer le
            last-mile.
          </p>
          <div className="reveal mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2 text-[13px] text-black/60 lg:justify-start">
            <a
              href="mailto:contact@umbrella.tn"
              className="font-medium text-[#991211] underline-offset-4 hover:underline"
            >
              contact@umbrella.tn
            </a>
            <a href="tel:+21625025073" className="hover:text-[#991211]">
              +216 25 025 073
            </a>
          </div>
        </div>

        <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl bg-white/90 p-4 ring-1 ring-black/[0.05] sm:p-5 md:p-6">
          {sent ? (
            <div className="flex flex-1 flex-col items-start justify-center">
              <h3 className="font-display text-xl font-semibold text-black sm:text-2xl">
                Merci — on vous contacte bientôt.
              </h3>
              <p className="mt-2 text-[13px] text-black/50 sm:text-sm">
                Créez votre compte pour démarrer en parallèle.
              </p>
              <Link
                href="/signup"
                className="magnet mt-5 rounded-full bg-[#991211] px-6 py-2.5 text-[13px] font-semibold text-white transition hover:bg-[#7a0e0e]"
              >
                Créer un compte
              </Link>
            </div>
          ) : (
            <form
              onSubmit={onSubmit}
              className="flex min-h-0 flex-1 flex-col gap-3 sm:gap-3.5"
            >
              <div className="grid gap-3 sm:grid-cols-2 sm:gap-3.5">
                <Field
                  label="Nom"
                  value={name}
                  onChange={setName}
                  placeholder="Sarra"
                  required
                />
                <Field
                  label="Boutique"
                  value={company}
                  onChange={setCompany}
                  placeholder="Atlas Mode"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2 sm:gap-3.5">
                <Field
                  label="Email"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  placeholder="vous@boutique.tn"
                  required
                />
                <Field
                  label="Téléphone"
                  type="tel"
                  value={phone}
                  onChange={setPhone}
                  placeholder="+216 …"
                  required
                />
              </div>

              <fieldset className="min-w-0">
                <legend className="text-[10px] font-semibold uppercase tracking-[0.14em] text-black/40">
                  Intéressé par…
                </legend>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {INTERESTS.map((item) => {
                    const on = interests.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleInterest(item)}
                        className={`rounded-full px-3 py-1.5 text-[11px] font-medium transition ${
                          on
                            ? "bg-[#991211] text-white"
                            : "bg-[#EFE8E0] text-black/60 hover:bg-[#E5DBD4]"
                        }`}
                      >
                        {item}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <div className="min-h-0 flex-1">
                <label
                  htmlFor="contact-msg"
                  className="text-[10px] font-semibold uppercase tracking-[0.14em] text-black/40"
                >
                  Votre besoin
                </label>
                <textarea
                  id="contact-msg"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  placeholder="Volumes, villes, COD…"
                  className="mt-1.5 h-[calc(100%-1.25rem)] min-h-[4.5rem] w-full resize-none rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-[13px] text-black outline-none placeholder:text-black/30 focus:border-[#991211]/40"
                />
              </div>

              <button
                type="submit"
                className="magnet mt-auto w-full shrink-0 rounded-full bg-[#991211] py-2.5 text-[13px] font-semibold text-white transition hover:bg-[#7a0e0e] sm:w-auto sm:px-9"
              >
                Envoyer
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  required?: boolean;
  type?: string;
}) {
  const id = `field-${label}`;
  return (
    <div>
      <label
        htmlFor={id}
        className="text-[10px] font-semibold uppercase tracking-[0.14em] text-black/40"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-full border border-black/10 bg-white px-3.5 py-2 text-[13px] text-black outline-none placeholder:text-black/30 focus:border-[#991211]/40"
      />
    </div>
  );
}
