"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AutocompleteField } from "@/components/AutocompleteField";
import { Modal } from "@/components/Modal";
import { ParcelDetailTable, type DetailParcel } from "@/components/ParcelDetailTable";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import {
  RETURN_STATUSES,
  STATUS_META,
  type StatusKey,
} from "@/lib/status-meta";
import { governoratesWithCities } from "@/lib/tunisia-address";
import { canSeeDeliveryMode } from "@/lib/roles";

const GOVERNORATES = Object.keys(governoratesWithCities);

function FieldLabel({
  children,
  htmlFor,
}: {
  children: string;
  htmlFor?: string;
}) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-ink">
      {children}
    </label>
  );
}

const fieldClass =
  "w-full rounded-xl border border-cream-soft bg-surface px-3 py-2.5 text-sm outline-none ring-brand focus:ring-2";

export function ParcelsManager({
  canCreate = false,
  canEdit = false,
  canDelete = false,
  title = "Colis",
  description = "Liste des colis",
  defaultOpenCreate = false,
  returnsOnly = false,
  detailBasePath,
}: {
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  title?: string;
  description?: string;
  defaultOpenCreate?: boolean;
  returnsOnly?: boolean;
  detailBasePath?: string;
}) {
  const { session } = useAuth();
  const showModes = canSeeDeliveryMode(session?.user.role);
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get("status");
  const [parcels, setParcels] = useState<DetailParcel[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [openForm, setOpenForm] = useState(defaultOpenCreate);
  const [editing, setEditing] = useState<DetailParcel | null>(null);
  const [saving, setSaving] = useState(false);
  const [exchange, setExchange] = useState(false);
  const [allowTry, setAllowTry] = useState(false);
  const [liabilityAccepted, setLiabilityAccepted] = useState(false);
  const [governorate, setGovernorate] = useState("");
  const [city, setCity] = useState("");
  const [locality, setLocality] = useState("");

  const cityOptions = useMemo(
    () => (governorate ? governoratesWithCities[governorate] ?? [] : []),
    [governorate],
  );

  const localityOptions = useMemo(() => {
    if (!governorate) return [];
    const cities = governoratesWithCities[governorate] ?? [];
    if (!city) return cities;
    return cities.filter((c) => c.toLowerCase() !== city.toLowerCase());
  }, [governorate, city]);

  async function load() {
    if (!session?.accessToken) return;
    const data = await apiFetch<DetailParcel[]>("/parcels", {
      token: session.accessToken,
    });
    setParcels(data);
  }

  useEffect(() => {
    load().catch((e: Error) => setMessage(e.message));
  }, [session]);

  const filtered = useMemo(() => {
    let list = parcels;
    if (returnsOnly) {
      list = list.filter((p) =>
        RETURN_STATUSES.includes(p.status as StatusKey),
      );
    } else if (statusFilter) {
      list = list.filter((p) => p.status === statusFilter);
    }
    return list;
  }, [parcels, statusFilter, returnsOnly]);

  const heading =
    statusFilter && STATUS_META[statusFilter as StatusKey]
      ? STATUS_META[statusFilter as StatusKey].label
      : returnsOnly
        ? "Mes retours"
        : title;

  function resetCreateForm() {
    setExchange(false);
    setAllowTry(false);
    setLiabilityAccepted(false);
    setGovernorate("");
    setCity("");
    setLocality("");
  }

  function closeCreate() {
    setOpenForm(false);
    resetCreateForm();
  }

  function closeEdit() {
    setEditing(null);
  }

  async function onCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!session?.accessToken) return;
    if (!governorate || !city) {
      setMessage("Gouvernorat et ville sont requis");
      return;
    }

    const form = new FormData(e.currentTarget);
    const allowOpen = form.get("allowOpen") === "Oui";

    if (allowOpen && !liabilityAccepted) {
      setMessage(
        "Vous devez accepter la responsabilité (dommage / vol) pour l'essai produit.",
      );
      return;
    }

    const street = String(form.get("address") || "").trim();
    const address = locality.trim()
      ? `${locality.trim()}, ${street}`
      : street;

    setSaving(true);
    try {
      await apiFetch("/parcels", {
        method: "POST",
        token: session.accessToken,
        body: JSON.stringify({
          recipientName: form.get("recipientName"),
          phone: form.get("phone"),
          phone2: form.get("phone2") || undefined,
          governorate,
          city,
          address,
          price: Number(form.get("price")),
          articleCount: Number(form.get("articleCount") || 1),
          designation: form.get("designation") || undefined,
          notes: form.get("notes") || undefined,
          mode: showModes ? form.get("mode") : "EXTERNAL",
          allowOpen,
          tryProduct: allowOpen,
          liabilityAcceptedAt: allowOpen ? new Date().toISOString() : undefined,
          isExchange: exchange,
          exchangeNotes: exchange
            ? String(form.get("exchangeNotes") || "")
            : undefined,
          paymentMode: form.get("paymentMode") || undefined,
          parcelCount: Number(form.get("parcelCount") || 1),
          locality: locality || undefined,
        }),
      });
      e.currentTarget.reset();
      closeCreate();
      setMessage("Colis créé");
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Création impossible");
    } finally {
      setSaving(false);
    }
  }

  async function onUpdate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!session?.accessToken || !editing) return;
    const form = new FormData(e.currentTarget);
    setSaving(true);
    try {
      await apiFetch(`/parcels/${editing.id}`, {
        method: "PATCH",
        token: session.accessToken,
        body: JSON.stringify({
          recipientName: form.get("recipientName"),
          phone: form.get("phone"),
          address: form.get("address"),
          price: Number(form.get("price")),
          notes: form.get("notes") || undefined,
        }),
      });
      closeEdit();
      setMessage("Colis mis à jour");
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Mise à jour impossible");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(row: DetailParcel) {
    if (!session?.accessToken || !canDelete) return;
    if (!window.confirm(`Supprimer ${row.code ?? row.id} ?`)) return;
    try {
      await apiFetch(`/parcels/${row.id}`, {
        method: "DELETE",
        token: session.accessToken,
      });
      closeEdit();
      setMessage("Colis supprimé");
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Suppression impossible");
    }
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink sm:text-3xl">
            {heading}
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            {filtered.length} colis · {description}
          </p>
        </div>
        {canCreate ? (
          <button
            type="button"
            onClick={() => {
              setEditing(null);
              setOpenForm(true);
            }}
            className="w-full rounded-full bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-soft sm:w-auto"
          >
            Nouveau Pickup
          </button>
        ) : null}
      </header>

      {message ? (
        <p className="text-sm font-medium text-gold" role="status">
          {message}
        </p>
      ) : null}

      <ParcelDetailTable
        rows={filtered}
        detailBasePath={detailBasePath}
        reportTitle={heading}
        onEdit={
          canEdit
            ? (row) => {
                setOpenForm(false);
                setEditing(row);
              }
            : undefined
        }
      />

      <Modal
        open={openForm && canCreate}
        onClose={closeCreate}
        title="Nouveau Pickup"
        description="Renseignez destinataire, adresse et COD"
        size="xl"
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={closeCreate}
              className="w-full rounded-full border border-cream px-4 py-2.5 text-sm font-semibold text-ink sm:w-auto"
            >
              Annuler
            </button>
            <button
              type="submit"
              form="parcel-create-form"
              disabled={saving || (allowTry && !liabilityAccepted)}
              className="w-full rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-soft disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {saving ? "Enregistrement…" : "+ Ajouter"}
            </button>
          </div>
        }
      >
        <form
          id="parcel-create-form"
          onSubmit={onCreate}
          className="space-y-5"
        >
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted">
              Destinataire
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <FieldLabel htmlFor="recipientName">Nom complet</FieldLabel>
                <input
                  id="recipientName"
                  name="recipientName"
                  required
                  autoComplete="name"
                  className={fieldClass}
                />
              </div>
              <div>
                <FieldLabel htmlFor="phone">Téléphone</FieldLabel>
                <input
                  id="phone"
                  name="phone"
                  required
                  inputMode="numeric"
                  pattern="[0-9]{8}"
                  placeholder="8 chiffres"
                  className={fieldClass}
                />
              </div>
              <div>
                <FieldLabel htmlFor="phone2">Téléphone 2</FieldLabel>
                <input
                  id="phone2"
                  name="phone2"
                  inputMode="numeric"
                  pattern="[0-9]{8}"
                  placeholder="Optionnel"
                  className={fieldClass}
                />
              </div>
            </div>
          </section>

          <section className="space-y-3 border-t border-cream pt-5">
            <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted">
              Adresse
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <FieldLabel htmlFor="governorate">Gouvernorat</FieldLabel>
                <select
                  id="governorate"
                  name="governorate"
                  required
                  value={governorate}
                  onChange={(e) => {
                    setGovernorate(e.target.value);
                    setCity("");
                    setLocality("");
                  }}
                  className={fieldClass}
                >
                  <option value="">Sélectionner</option>
                  {GOVERNORATES.map((g) => (
                    <option key={g} value={g}>
                      {g.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>
              <AutocompleteField
                label="Ville"
                name="city"
                value={city}
                options={cityOptions}
                onChange={(value) => {
                  setCity(value);
                  setLocality("");
                }}
                disabled={!governorate}
                required
                allowCustom={false}
                placeholder="Rechercher une ville"
              />
              <div className="sm:col-span-2">
                <AutocompleteField
                  label="Localité"
                  name="locality"
                  value={locality}
                  options={localityOptions}
                  onChange={setLocality}
                  disabled={!governorate}
                  allowCustom
                  placeholder="Rechercher une localité"
                />
              </div>
              <div className="sm:col-span-2">
                <FieldLabel htmlFor="address">Adresse complète</FieldLabel>
                <input
                  id="address"
                  name="address"
                  required
                  autoComplete="street-address"
                  className={fieldClass}
                />
              </div>
            </div>
          </section>

          <section className="space-y-3 border-t border-cream pt-5">
            <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted">
              Colis & paiement
            </h3>
            <div>
              <FieldLabel htmlFor="designation">Désignation</FieldLabel>
              <input
                id="designation"
                name="designation"
                required
                className={fieldClass}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <FieldLabel htmlFor="price">Prix en DT</FieldLabel>
                <input
                  id="price"
                  name="price"
                  required
                  type="number"
                  step="0.001"
                  min={0}
                  inputMode="decimal"
                  className={fieldClass}
                />
              </div>
              <div>
                <FieldLabel htmlFor="articleCount">
                  Nombre d&apos;articles
                </FieldLabel>
                <input
                  id="articleCount"
                  name="articleCount"
                  type="number"
                  min={1}
                  defaultValue={1}
                  className={fieldClass}
                />
              </div>
              <div>
                <FieldLabel htmlFor="parcelCount">Nombre de colis</FieldLabel>
                <input
                  id="parcelCount"
                  name="parcelCount"
                  type="number"
                  min={1}
                  defaultValue={1}
                  className={fieldClass}
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <FieldLabel htmlFor="paymentMode">Mode de paiement</FieldLabel>
                <select
                  id="paymentMode"
                  name="paymentMode"
                  className={fieldClass}
                  defaultValue="espece"
                >
                  <option value="espece">Espèce seulement</option>
                  <option value="cheque">Chèque seulement</option>
                  <option value="espece_ou_cheque">Espèce ou chèque</option>
                </select>
              </div>
              {showModes ? (
                <div>
                  <FieldLabel htmlFor="mode">Mode livraison</FieldLabel>
                  <select
                    id="mode"
                    name="mode"
                    className={fieldClass}
                    defaultValue="EXTERNAL"
                  >
                    <option value="EXTERNAL">EXTERNAL</option>
                    <option value="INTERNAL">INTERNAL</option>
                  </select>
                </div>
              ) : null}
            </div>
          </section>

          <section className="space-y-3 border-t border-cream pt-5">
            <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted">
              Options
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <fieldset>
                <legend className="mb-2 text-sm font-medium text-ink">
                  Essai produit / ouvrir avant paiement
                </legend>
                <div className="flex flex-wrap gap-4 text-sm">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      name="allowOpen"
                      value="Non"
                      checked={!allowTry}
                      onChange={() => {
                        setAllowTry(false);
                        setLiabilityAccepted(false);
                      }}
                    />
                    Non
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      name="allowOpen"
                      value="Oui"
                      checked={allowTry}
                      onChange={() => setAllowTry(true)}
                    />
                    Oui
                  </label>
                </div>
              </fieldset>
              <fieldset>
                <legend className="mb-2 text-sm font-medium text-ink">
                  Échange
                </legend>
                <div className="flex flex-wrap gap-4 text-sm">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      name="exchangeRadio"
                      checked={!exchange}
                      onChange={() => setExchange(false)}
                    />
                    Non
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      name="exchangeRadio"
                      checked={exchange}
                      onChange={() => setExchange(true)}
                    />
                    Oui
                  </label>
                </div>
              </fieldset>
            </div>

            {allowTry ? (
              <div className="rounded-xl border border-brand/25 bg-brand/[0.04] p-4">
                <p className="text-sm font-semibold text-ink">
                  Responsabilité expéditeur — essai produit
                </p>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                  En autorisant l&apos;essai / l&apos;ouverture du colis avant
                  paiement, vous acceptez que tout dommage, détérioration,
                  perte ou vol survenant pendant cette phase est à votre
                  charge. Umbrella Express et le livreur ne peuvent pas en être
                  tenus responsables.
                </p>
                <label className="mt-4 flex items-start gap-3 text-sm text-ink">
                  <input
                    type="checkbox"
                    checked={liabilityAccepted}
                    onChange={(e) => setLiabilityAccepted(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-cream accent-brand"
                    required
                  />
                  <span>
                    Je confirme et j&apos;assume toute responsabilité en cas de
                    dommage ou de vol lié à l&apos;essai du produit.
                  </span>
                </label>
              </div>
            ) : null}

            {exchange ? (
              <div>
                <FieldLabel htmlFor="exchangeNotes">
                  Articles à échanger
                </FieldLabel>
                <input
                  id="exchangeNotes"
                  name="exchangeNotes"
                  className={fieldClass}
                />
              </div>
            ) : null}

            <div>
              <FieldLabel htmlFor="notes">Remarques</FieldLabel>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                className={fieldClass}
              />
            </div>
          </section>
        </form>
      </Modal>

      <Modal
        open={Boolean(editing && canEdit)}
        onClose={closeEdit}
        title={editing ? `Modifier ${editing.code ?? editing.id}` : "Modifier"}
        description="Mettez à jour les infos destinataire"
        size="md"
        footer={
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            {canDelete && editing ? (
              <button
                type="button"
                onClick={() =>
                  onDelete(editing).catch((err: Error) =>
                    setMessage(err.message),
                  )
                }
                className="w-full rounded-full border border-brand/30 px-4 py-2.5 text-sm font-semibold text-brand sm:w-auto"
              >
                Supprimer
              </button>
            ) : (
              <span />
            )}
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <button
                type="button"
                onClick={closeEdit}
                className="w-full rounded-full border border-cream px-4 py-2.5 text-sm font-semibold text-ink sm:w-auto"
              >
                Annuler
              </button>
              <button
                type="submit"
                form="parcel-edit-form"
                disabled={saving}
                className="w-full rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-soft disabled:opacity-50 sm:w-auto"
              >
                {saving ? "Enregistrement…" : "Enregistrer"}
              </button>
            </div>
          </div>
        }
      >
        {editing ? (
          <form
            id="parcel-edit-form"
            onSubmit={onUpdate}
            className="grid gap-3 sm:grid-cols-2"
          >
            <div className="sm:col-span-2">
              <FieldLabel htmlFor="edit-recipientName">Nom</FieldLabel>
              <input
                id="edit-recipientName"
                name="recipientName"
                defaultValue={editing.recipientName}
                required
                className={fieldClass}
              />
            </div>
            <div>
              <FieldLabel htmlFor="edit-phone">Téléphone</FieldLabel>
              <input
                id="edit-phone"
                name="phone"
                defaultValue={editing.phone}
                required
                inputMode="numeric"
                className={fieldClass}
              />
            </div>
            <div>
              <FieldLabel htmlFor="edit-price">Prix (TND)</FieldLabel>
              <input
                id="edit-price"
                name="price"
                type="number"
                step="0.001"
                defaultValue={Number(editing.price)}
                required
                inputMode="decimal"
                className={fieldClass}
              />
            </div>
            <div className="sm:col-span-2">
              <FieldLabel htmlFor="edit-address">Adresse</FieldLabel>
              <input
                id="edit-address"
                name="address"
                defaultValue={editing.address}
                required
                className={fieldClass}
              />
            </div>
            <div className="sm:col-span-2">
              <FieldLabel htmlFor="edit-notes">Remarques</FieldLabel>
              <input
                id="edit-notes"
                name="notes"
                defaultValue={editing.notes ?? ""}
                className={fieldClass}
              />
            </div>
          </form>
        ) : null}
      </Modal>
    </div>
  );
}
