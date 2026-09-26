import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

const HIGHLIGHTS = [
  "Suivi en temps réel de chaque colis",
  "Paiements COD versés rapidement",
  "Flotte interne et réseau partenaire",
];

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-[#1A1414] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-[#991211]/40 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-[#986A36]/30 blur-3xl"
          aria-hidden
        />
        <Link href="/" className="relative inline-flex items-center gap-3">
          <Image src="/logo-umbrella.png" alt="" width={44} height={44} className="h-11 w-11 object-contain" />
          <span className="font-display text-2xl font-extrabold tracking-tight text-white">
            Umbrella Express
          </span>
        </Link>
        <div className="relative max-w-md space-y-6">
          <p className="font-display text-4xl font-extrabold leading-tight text-white">
            La livraison tunisienne, pilotée de bout en bout.
          </p>
          <ul className="space-y-3">
            {HIGHLIGHTS.map((h) => (
              <li key={h} className="flex items-center gap-3 text-sm text-[#E5DBD4]">
                <CheckCircle2 className="h-4 w-4 text-[#E8C07A]" aria-hidden />
                {h}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-white/50">© Umbrella Express · Tunis</p>
      </aside>

      <main className="relative flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="absolute right-4 top-4">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-md">
          <Link href="/" className="mb-8 inline-flex items-center gap-2 lg:hidden">
            <Image src="/logo-umbrella.png" alt="" width={36} height={36} className="h-9 w-9 object-contain" />
            <span className="font-display text-xl font-extrabold text-brand">Umbrella Express</span>
          </Link>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">{title}</h1>
          {subtitle ? <p className="mt-2 text-sm text-ink-muted">{subtitle}</p> : null}
          <div className="mt-8">{children}</div>
          {footer ? <div className="mt-6 text-center text-sm text-ink-muted">{footer}</div> : null}
        </div>
      </main>
    </div>
  );
}
