"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BookUser, Camera, Clock3, Plus } from "lucide-react";
import {
  AddressLocationFields,
  type AddressLocationValue,
} from "@/components/AddressLocationFields";
import { errorText, useConfirm, useToast } from "@/components/Feedback";
import { Modal } from "@/components/Modal";
import { ParcelDetailTable } from "@/components/ParcelDetailTable";
import { StatusFilterBar } from "@/components/StatusFilterBar";
import { Button, ErrorBanner, PageHeader } from "@/components/ui";
import { loadAddressBook, type SavedAddress } from "@/lib/address-book";
import { scoreAddress } from "@/lib/address-quality";
import { useAuth } from "@/lib/auth-context";
import { DELIVERY_WINDOWS, type DeliveryWindowId } from "@/lib/delivery-windows";
import type { Parcel } from "@/lib/domain";
import { displayGovernorate } from "@/lib/normalize-text";
import {
  RETURN_STATUSES,
  STATUS_META,
  type StatusKey,
} from "@/lib/status-meta";
import { canSeeDeliveryMode } from "@/lib/roles";
import { useApi, useApiQuery } from "@/lib/use-api";

const SENDER_EDITABLE_STATUSES = ["EN_ATTENTE", "NON_SERIEUX"];

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
  const role = session?.user.role;
  const showModes = canSeeDeliveryMode(role);
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get("status");
  const request = useApi();
  const toast = useToast();
  const confirm = useConfirm();
  const { data, error, loading, reload } = useApiQuery<Parcel[]>("/parcels");
  const parcels = useMemo(() => data ?? [], [data]);
  const [openForm, setOpenForm] = useState(defaultOpenCreate);
  const [editing, setEditing] = useState<Parcel | null>(null);
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

  function canEditRow(row: Parcel) {
    if (!canEdit) return false;
    return role !== "EXPEDITEUR" || SENDER_EDITABLE_STATUSES.includes(row.status);
  }

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
    toast.info(`Adresse « ${entry.label} » appliquée`);
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
    if (!location.governorate || !location.city) {
      toast.error("Gouvernorat et ville sont requis");
      return;
    }

    const quality = scoreAddress(location);
    if (quality.level === "weak" && !forceWeakAddress) {
      toast.info(
        "Adresse trop vague",
        "Précisez la rue ou le GPS, ou cliquez à nouveau sur « Ajouter » pour confirmer.",
      );
      setForceWeakAddress(true);
      return;
    }

    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    const allowOpen = form.get("allowOpen") === "Oui";

    if (allowOpen && !liabilityAccepted) {
      toast.error("Acceptez la responsabilité (dommage / vol) pour l'essai produit.");
      return;
    }

    const street = location.address.trim();
    const address = location.locality.trim()
      ? `${location.locality.trim()}, ${street}`
      : street;

    setSaving(true);
    try {
      const created = await request<Parcel>("/parcels", "POST", {
        recipientName: form.get("recipientName"),
        phone: form.get("phone"),
        phone2: form.get("phone2") || undefined,
        governorate: location.governorate,
        city: location.city,
        address,
        price: Number(form.get("price")),
        articleCount: Number(form.get("articleCount") || 1),
        designation: form.get("designation") || undefined,
        notes: String(form.get("notes") || "").trim() || undefined,
        mode: showModes ? form.get("mode") : "EXTERNAL",
        allowOpen,
        tryProduct: allowOpen,
        liabilityAcceptedAt: allowOpen ? new Date().toISOString() : undefined,
        isExchange: exchange,
        exchangeNotes: exchange ? String(form.get("exchangeNotes") || "") : undefined,
        paymentMode: form.get("paymentMode") || undefined,
        parcelCount: Number(form.get("parcelCount") || 1),
        locality: location.locality || undefined,
        lat: location.lat ?? undefined,
        lng: location.lng ?? undefined,
        deliveryWindow,
        landmarkPhotoName: landmarkName || undefined,
        addressQuality: quality.score,
      });
      formEl.reset();
      closeCreate();
      toast.success("Colis créé", created.code ?? undefined);
      await reload();
    } catch (err) {
      toast.error("Création impossible", errorText(err));
    } finally {
      setSaving(false);
    }
  }

  async function onUpdate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing) return;
    const form = new FormData(e.currentTarget);
    setSaving(true);
    try {
      await request(`/parcels/${editing.id}`, "PATCH", {
        recipientName: form.get("recipientName"),
        phone: form.get("phone"),
        address: form.get("address"),
        price: Number(form.get("price")),
        notes: String(form.get("notes") || "").trim() || undefined,
      });
      closeEdit();
      toast.success("Colis mis à jour");
      await reload();
    } catch (err) {
      toast.error("Mise à jour impossible", errorText(err));
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(row: Parcel) {
    if (!canDelete) return;
    const ok = await confirm({
      title: `Supprimer ${row.code ?? `#${row.id}`} ?`,
      description: `${row.recipientName} · ${row.city}`,
      confirmLabel: "Supprimer",
      tone: "danger",
    });
    if (!ok) return;
    try {
      await request(`/parcels/${row.id}`, "DELETE");
      closeEdit();
      toast.success("Colis supprimé");
      await reload();
    } catch (err) {
      toast.error("Suppression impossible", errorText(err));
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={heading}
        description={`${filtered.length} colis · ${description}`}
        actions={
          canCreate ? (
            <Button
              icon={Plus}
              onClick={() => {
                setEditing(null);
                setOpenForm(true);
              }}
              className="w-full sm:w-auto"
            >
              Nouveau colis
            </Button>
          ) : undefined
        }
      />

      {error ? <ErrorBanner message={error} onRetry={() => void reload()} /> : null}

      {!returnsOnly ? <StatusFilterBar parcels={parcels} /> : null}

      <ParcelDetailTable
        rows={filtered}
        loading={loading && parcels.length === 0}
        detailBasePath={detailBasePath}
        reportTitle={heading}
        canEditRow={canEdit ? canEditRow : undefined}
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
            <Button variant="secondary" onClick={closeCreate}>
              Annuler
            </Button>
            <Button
              type="submit"
              form="parcel-create-form"
              icon={Plus}
              loading={saving}
              disabled={allowTry && !liabilityAccepted}
            >
              Ajouter
            </Button>
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
              <Button variant="danger" onClick={() => void onDelete(editing)}>
                Supprimer
              </Button>
            ) : (
              <span />
            )}
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button variant="secondary" onClick={closeEdit}>
                Annuler
              </Button>
              <Button type="submit" form="parcel-edit-form" loading={saving}>
                Enregistrer
              </Button>
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
