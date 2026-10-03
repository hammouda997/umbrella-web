"use client";

import { FormEvent, useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ScanLine,
  Package,
  CheckCircle2,
  AlertTriangle,
  Zap,
} from "lucide-react";
import { DashboardHero } from "@/components/DashboardHero";
import { Button, Panel, buttonClass } from "@/components/ui";
import { useToast } from "@/components/Feedback";
import { PORTAL_BY_ROLE, type AppRole } from "@/lib/roles";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import { formatTnd, type Parcel } from "@/lib/domain";
import { STATUS_META, type StatusKey } from "@/lib/status-meta";
import {
  ACTION_TONE_CLASS,
  livreurActionsFor,
  type LivreurAction,
} from "@/lib/livreur-actions";
import {
  allowedTargets,
  canTransition,
  requiresComment,
} from "@/lib/parcel-transitions";
import { useHidScanner } from "@/lib/use-hid-scanner";
import { cn } from "@/lib/cn";

type ScanFeedback = {
  tone: "ok" | "warn" | "error";
  title: string;
  detail?: string;
};

type ScanAction = {
  id: string;
  label: string;
  status: StatusKey;
  tone: LivreurAction["tone"];
  needsComment?: boolean;
  commentLabel?: string;
};

function actionsForRole(status: string, role: AppRole): ScanAction[] {
  const gateRole: AppRole =
    role === "SUPER_ADMIN" || role === "ADMIN" || role === "CHEF_AGENCE"
      ? "ADMIN"
      : role;

  const fromLivreur = livreurActionsFor(status)
    .filter(
      (a) =>
        a.status === status || canTransition(status, a.status, gateRole).ok,
    )
    .map((a) => ({
      id: a.id,
      label: a.label,
      status: a.status,
      tone: a.tone,
      needsComment: Boolean(a.needsComment) || requiresComment(a.status, status),
      commentLabel: a.commentLabel,
    }));

  if (role === "LIVREUR") return fromLivreur;

  const covered = new Set(fromLivreur.map((a) => a.status));
  const extras: ScanAction[] = allowedTargets(status)
    .filter((to) => !covered.has(to))
    .map((to) => ({
      id: to,
      label: STATUS_META[to].label,
      status: to,
      tone: "neutral" as const,
      needsComment: requiresComment(to, status),
      commentLabel: "Motif",
    }));

  return [...fromLivreur, ...extras];
}

export function ScannerPage({ role }: { role: AppRole }) {
  const router = useRouter();
  const toast = useToast();
  const { session } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const inflight = useRef(false);
  const bulkRef = useRef<ScanAction | null>(null);
  const commentRef = useRef("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [comment, setComment] = useState("");
  const [parcel, setParcel] = useState<Parcel | null>(null);
  const [feedback, setFeedback] = useState<ScanFeedback | null>(null);
  const [pendingAction, setPendingAction] = useState<ScanAction | null>(null);
  const [bulkAction, setBulkAction] = useState<ScanAction | null>(null);
  const base = PORTAL_BY_ROLE[role];
  const firstName = session?.user.name?.split(/\s+/)[0] ?? "";
  const canMutate =
    role === "SUPER_ADMIN" || role === "ADMIN" || role === "LIVREUR";

  commentRef.current = comment;
  bulkRef.current = bulkAction;

  const actions = useMemo(
    () => (parcel && canMutate ? actionsForRole(parcel.status, role) : []),
    [parcel, canMutate, role],
  );

  const focusInput = useCallback(() => {
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
  }, []);

  const applyStatus = useCallback(
    async (target: Parcel, action: ScanAction, note: string) => {
      const needComment =
        Boolean(action.needsComment) ||
        requiresComment(action.status, target.status);
      if (needComment && !note.trim()) {
        setPendingAction(action);
        setFeedback({
          tone: "warn",
          title: "Motif requis",
          detail: action.commentLabel ?? "Saisissez un commentaire.",
        });
        return false;
      }

      const gate = canTransition(target.status, action.status, role);
      if (!gate.ok) {
        setFeedback({
          tone: "error",
          title: "Action refusée",
          detail: gate.reason,
        });
        toast.error("Action refusée", gate.reason);
        return false;
      }

      if (inflight.current) return false;
      inflight.current = true;
      setBusy(true);
      try {
        const result = await apiFetch<Parcel>("/parcels/scan", {
          method: "POST",
          token: session?.accessToken,
          body: JSON.stringify({
            code: target.code ?? String(target.id),
            status: action.status,
            comment: note.trim() || undefined,
          }),
        });
        setParcel(result);
        setPendingAction(null);
        setComment("");
        const label = STATUS_META[action.status]?.label ?? action.label;
        setFeedback({
          tone: "ok",
          title: `OK — ${label}`,
          detail: result.code ?? undefined,
        });
        toast.success(label, result.code ?? undefined);
        setCode("");
        return true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Erreur";
        setFeedback({ tone: "error", title: "Échec", detail: msg });
        toast.error("Échec", msg);
        return false;
      } finally {
        inflight.current = false;
        setBusy(false);
        focusInput();
      }
    },
    [role, session?.accessToken, toast, focusInput],
  );

  const lookupParcel = useCallback(
    async (raw: string) => {
      const q = raw.trim();
      if (!q || inflight.current) return;

      inflight.current = true;
      setBusy(true);
      setFeedback(null);
      setPendingAction(null);

      try {
        if (role === "CLIENT") {
          router.push(`/track?code=${encodeURIComponent(q)}`);
          return;
        }

        let found: Parcel;
        if (canMutate) {
          found = await apiFetch<Parcel>("/parcels/scan", {
            method: "POST",
            token: session?.accessToken,
            body: JSON.stringify({ code: q }),
          });
        } else {
          found = await apiFetch<Parcel>(
            `/parcels/by-code/${encodeURIComponent(q)}`,
            { token: session?.accessToken },
          );
        }

        setParcel(found);
        setCode("");
        setFeedback({
          tone: "ok",
          title: "Colis trouvé",
          detail: `${found.code ?? q} · ${STATUS_META[found.status as StatusKey]?.label ?? found.status}`,
        });

        if (role === "EXPEDITEUR") {
          router.push(
            `${base}/parcels?q=${encodeURIComponent(found.code ?? q)}`,
          );
          return;
        }

        const rapid = bulkRef.current;
        if (rapid && canMutate) {
          inflight.current = false;
          setBusy(false);
          await applyStatus(found, rapid, commentRef.current);
          return;
        }
      } catch (err) {
        setParcel(null);
        const msg = err instanceof Error ? err.message : "Introuvable";
        setFeedback({ tone: "error", title: "Scan échoué", detail: msg });
        toast.error("Scan échoué", msg);
        setCode(q);
      } finally {
        if (inflight.current) {
          inflight.current = false;
          setBusy(false);
        }
        focusInput();
      }
    },
    [
      role,
      canMutate,
      session?.accessToken,
      router,
      base,
      toast,
      focusInput,
      applyStatus,
    ],
  );

  useHidScanner({
    enabled: role !== "CLIENT",
    onScan: (scanned) => {
      void lookupParcel(scanned);
    },
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void lookupParcel(code);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-8">
      <div className="lg:hidden">
        <DashboardHero
          subtitle={`Bonjour${firstName ? ` ${firstName}` : ""} — scannez le bordereau.`}
        />
      </div>

      <Panel className="space-y-4">
        <div className="flex flex-col items-center text-center">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-ops-accent/15 text-ops-accent">
            <ScanLine className="h-7 w-7" />
          </span>
          <h1 className="mt-3 font-display text-xl font-bold text-ops-ink">
            Scanner bordereau
          </h1>
          <p className="mt-1 max-w-md text-sm text-ops-ink/50">
            Scannez le code-barres — les actions disponibles s’affichent selon
            l’état du colis.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <label className="block text-sm font-medium text-ops-ink">
            Code colis
            <input
              ref={inputRef}
              data-scan-input="1"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoFocus
              inputMode="text"
              autoComplete="off"
              spellCheck={false}
              placeholder="Pointez le HENEX ici…"
              disabled={busy}
              className="mt-1.5 w-full rounded-xl border border-ops-card bg-ops-page px-4 py-3 text-center font-mono text-base outline-none ring-ops-accent focus:ring-2 disabled:opacity-60"
            />
          </label>
          <Button type="submit" className="w-full" disabled={!code.trim() || busy}>
            {busy ? "Lecture…" : "Lire le code"}
          </Button>
        </form>

        {canMutate && bulkAction && (
          <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
            <Zap className="h-4 w-4 shrink-0" />
            <span className="flex-1">
              Mode rapide : chaque scan → « {bulkAction.label} »
            </span>
            <button
              type="button"
              className="font-semibold underline"
              onClick={() => setBulkAction(null)}
            >
              Arrêter
            </button>
          </div>
        )}

        {feedback && (
          <div
            className={cn(
              "flex items-start gap-3 rounded-xl border px-3 py-3 text-sm",
              feedback.tone === "ok" &&
                "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
              feedback.tone === "warn" &&
                "border-amber-500/30 bg-amber-500/10 text-amber-100",
              feedback.tone === "error" &&
                "border-ops-accent/40 bg-ops-accent/10 text-rose-100",
            )}
          >
            {feedback.tone === "ok" ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            ) : (
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            )}
            <div>
              <p className="font-semibold">{feedback.title}</p>
              {feedback.detail && (
                <p className="mt-0.5 opacity-80">{feedback.detail}</p>
              )}
            </div>
          </div>
        )}
      </Panel>

      {parcel && (
        <Panel className="space-y-4">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-ops-card text-ops-accent">
              <Package className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-mono text-lg font-bold text-ops-ink">
                {parcel.code}
              </p>
              <p className="truncate text-sm text-ops-ink/70">
                {parcel.recipientName} · {parcel.phone}
              </p>
              <p className="mt-1 text-sm text-ops-ink/55">
                {parcel.address}, {parcel.city}
              </p>
            </div>
            <StatusPill status={parcel.status} />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-ops-card pt-3 text-sm">
            <span className="font-display text-lg font-bold text-ops-accent">
              {formatTnd(parcel.price)}
            </span>
            <div className="flex gap-2">
              <Link
                href={`${base}/parcels/${parcel.id}`}
                className={buttonClass("secondary")}
              >
                Détail
              </Link>
              <Link
                href={`${base}/bordereau?id=${parcel.id}`}
                className={buttonClass("primary")}
              >
                Bordereau
              </Link>
            </div>
          </div>

          {canMutate && actions.length > 0 && (
            <div className="space-y-3 border-t border-ops-card pt-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-ops-ink/45">
                Actions possibles
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {actions.map((action) => (
                  <button
                    key={action.id}
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      if (action.needsComment) {
                        setPendingAction(action);
                        setFeedback({
                          tone: "warn",
                          title: action.label,
                          detail:
                            action.commentLabel ??
                            "Saisissez un motif puis validez.",
                        });
                        return;
                      }
                      void applyStatus(parcel, action, "");
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      if (action.needsComment) {
                        toast.info(
                          "Mode rapide",
                          "Choisissez une action sans motif obligatoire (ex. Entrée dépôt).",
                        );
                        return;
                      }
                      setBulkAction(action);
                      toast.info(
                        "Mode rapide",
                        `Prochains scans → ${action.label}`,
                      );
                    }}
                    className={cn(
                      "rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition disabled:opacity-50",
                      ACTION_TONE_CLASS[action.tone],
                    )}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-ops-ink/40">
                Clic droit = mode rapide (même action à chaque scan).
              </p>
            </div>
          )}

          {pendingAction && canMutate && (
            <div className="space-y-2 rounded-xl border border-ops-card bg-ops-page p-3">
              <p className="text-sm font-semibold text-ops-ink">
                {pendingAction.label}
              </p>
              <label className="block text-sm text-ops-ink/80">
                {pendingAction.commentLabel ?? "Motif"}
                <input
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  autoFocus
                  className="mt-1.5 w-full rounded-xl border border-ops-card bg-ops-surface px-3 py-2 text-sm outline-none ring-ops-accent focus:ring-2"
                  placeholder="Obligatoire"
                />
              </label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  className="flex-1"
                  disabled={busy || !comment.trim()}
                  onClick={() => void applyStatus(parcel, pendingAction, comment)}
                >
                  Valider
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setPendingAction(null);
                    focusInput();
                  }}
                >
                  Annuler
                </Button>
              </div>
            </div>
          )}

          {canMutate && actions.length === 0 && (
            <p className="text-sm text-ops-ink/50">
              Aucune action disponible pour ce statut.
            </p>
          )}
        </Panel>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const meta = STATUS_META[status as StatusKey];
  return (
    <span
      className="shrink-0 rounded-lg px-2 py-1 text-[11px] font-semibold"
      style={{
        background: meta?.color ?? "#334155",
        color: meta?.ink ?? "#fff",
      }}
    >
      {meta?.label ?? status}
    </span>
  );
}
