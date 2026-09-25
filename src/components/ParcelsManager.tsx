"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BookUser, Camera, Clock3 } from "lucide-react";
import {
  AddressLocationFields,
  type AddressLocationValue,
} from "@/components/AddressLocationFields";
import { Modal } from "@/components/Modal";
import { ParcelDetailTable, type DetailParcel } from "@/components/ParcelDetailTable";
import { loadAddressBook, type SavedAddress } from "@/lib/address-book";
import { scoreAddress } from "@/lib/address-quality";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { DELIVERY_WINDOWS, type DeliveryWindowId } from "@/lib/delivery-windows";
import { displayGovernorate } from "@/lib/normalize-text";
import {
  RETURN_STATUSES,
  STATUS_META,
  type StatusKey,
} from "@/lib/status-meta";
import { canSeeDeliveryMode } from "@/lib/roles";

const EMPTY_ADDRESS: AddressLocationValue = {
  governorate: "",
  city: "",
  locality: "",
  address: "",
  lat: null,
  lng: null,
  accuracyMeters: null,
};

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
  const [location, setLocation] = useState<AddressLocationValue>(EMPTY_ADDRESS);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [deliveryWindow, setDeliveryWindow] =
    useState<DeliveryWindowId>("journee");
  const [landmarkPreview, setLandmarkPreview] = useState<string | null>(null);
  const [landmarkName, setLandmarkName] = useState<string | null>(null);
  const [forceWeakAddress, setForceWeakAddress] = useState(false);

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

  useEffect(() => {
    if (openForm) setSavedAddresses(loadAddressBook());
  }, [openForm]);

  const addressQuality = useMemo(() => scoreAddress(location), [location]);

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
    setLocation(EMPTY_ADDRESS);
    setDeliveryWindow("journee");
    setLandmarkPreview(null);
    setLandmarkName(null);
    setForceWeakAddress(false);
  }

  function applySavedAddress(entry: SavedAddress) {
    setLocation({
      governorate: entry.governorate,
      city: entry.city,
      locality: entry.locality,
      address: entry.line,
      lat: entry.lat ?? null,
      lng: entry.lng ?? null,
      accuracyMeters: null,
    });
    const form = document.getElementById(
      "parcel-create-form",
    ) as HTMLFormElement | null;
    if (form) {
      const name = form.elements.namedItem("recipientName") as HTMLInputElement | null;
      const phone = form.elements.namedItem("phone") as HTMLInputElement | null;
      if (name && entry.contact) name.value = entry.contact;
      if (phone && entry.phone) phone.value = entry.phone;
    }
    setMessage(`Adresse « ${entry.label} » appliquée`);
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
    if (!location.governorate || !location.city) {
      setMessage("Gouvernorat et ville sont requis");
      return;
    }

    const quality = scoreAddress(location);
    if (quality.level === "weak" && !forceWeakAddress) {
      setMessage(
        "Adresse trop vague — précisez rue/GPS, ou confirmez quand même ci-dessous.",
      );
      setForceWeakAddress(true);
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

    const street = location.address.trim();
    const address = location.locality.trim()
      ? `${location.locality.trim()}, ${street}`
      : street;

    const windowMeta = DELIVERY_WINDOWS.find((w) => w.id === deliveryWindow);
    const noteParts = [
      String(form.get("notes") || "").trim(),
      windowMeta ? `Créneau: ${windowMeta.label} (${windowMeta.hint})` : "",
      landmarkName ? `Repère photo: ${landmarkName}` : "",
      location.lat != null && location.lng != null
        ? `GPS: ${location.lat.toFixed(5)},${location.lng.toFixed(5)}`
        : "",
    ].filter(Boolean);

    setSaving(true);
    try {
      await apiFetch("/parcels", {
        method: "POST",
        token: session.accessToken,
        body: JSON.stringify({
          recipientName: form.get("recipientName"),
          phone: form.get("phone"),
          phone2: form.get("phone2") || undefined,
          governorate: location.governorate,
          city: location.city,
          address,
          price: Number(form.get("price")),
          articleCount: Number(form.get("articleCount") || 1),
          designation: form.get("designation") || undefined,
          notes: noteParts.join(" · ") || undefined,
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
          locality: location.locality || undefined,
          lat: location.lat ?? undefined,
          lng: location.lng ?? undefined,
          deliveryWindow,
          landmarkPhotoName: landmarkName || undefined,
          addressQuality: quality.score,
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
            {savedAddresses.length > 0 ? (
              <div className="space-y-2">
                <p className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted">
                  <BookUser className="h-3.5 w-3.5" />
                  Depuis le carnet
                </p>
                <div className="flex flex-wrap gap-2">
                  {savedAddresses.slice(0, 6).map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => applySavedAddress(a)}
                      className="rounded-full border border-cream bg-surface px-3 py-1.5 text-left text-xs font-semibold text-ink transition hover:border-brand hover:text-brand"
                    >
                      {a.label}
                      <span className="mt-0.5 block font-normal text-ink-muted">
                        {a.city}
                        {a.governorate
                          ? ` · ${displayGovernorate(a.governorate)}`
                          : ""}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            <AddressLocationFields
              value={location}
              onChange={(next) => {
                setLocation(next);
                setForceWeakAddress(false);
              }}
              required
              fieldClass={fieldClass}
            />
            {forceWeakAddress && addressQuality.level === "weak" ? (
              <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
                Cliquez encore sur « Ajouter » pour confirmer malgré une adresse
                faible ({addressQuality.score}/100).
              </p>
            ) : null}
          </section>

          <section className="space-y-3 border-t border-cream pt-5">
            <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted">
              Créneau &amp; repère
            </h3>
            <div>
              <p className="mb-2 inline-flex items-center gap-1.5 text-sm font-medium text-ink">
                <Clock3 className="h-4 w-4 text-brand" />
                Créneau de livraison
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {DELIVERY_WINDOWS.map((w) => (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => setDeliveryWindow(w.id)}
                    className={`rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                      deliveryWindow === w.id
                        ? "border-brand bg-brand/10 text-brand"
                        : "border-cream-soft text-ink hover:border-brand/40"
                    }`}
                  >
                    <span className="font-semibold">{w.label}</span>
                    <span className="mt-0.5 block text-xs text-ink-muted">
                      {w.hint}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <FieldLabel htmlFor="landmarkPhoto">
                Photo repère (optionnel)
              </FieldLabel>
              <label className="mt-1 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-cream-soft bg-cream-soft/20 px-4 py-5 text-center transition hover:border-brand/40">
                <Camera className="h-5 w-5 text-brand" />
                <span className="text-sm font-medium text-ink">
                  {landmarkName ?? "Ajouter une photo du lieu (façade, pharmacie…)"}
                </span>
                <span className="text-[11px] text-ink-muted">
                  Stockage local uniquement (démo front)
                </span>
                <input
                  id="landmarkPhoto"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setLandmarkName(file.name);
                    const reader = new FileReader();
                    reader.onload = () => {
                      setLandmarkPreview(
                        typeof reader.result === "string" ? reader.result : null,
                      );
                    };
                    reader.readAsDataURL(file);
                  }}
                />
              </label>
              {landmarkPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={landmarkPreview}
                  alt="Repère"
                  className="mt-3 max-h-40 w-full rounded-xl object-cover"
                />
              ) : null}
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
