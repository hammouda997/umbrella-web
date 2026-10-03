import type { AuthSession, StatusCard } from "@/lib/api";
import type {
  AppNotification,
  CodPayload,
  PaymentStatus,
  TicketStatus,
  TimelineEntry,
} from "@/lib/domain";
import type { Agency } from "@/lib/domain";
import {
  MOCK_AGENCIES,
  MOCK_PARCELS,
  MOCK_PAYMENTS,
  MOCK_TICKETS,
  MOCK_USERS,
  MOCK_ZONES,
  type MockParcel,
  type MockPayment,
  type MockTicket,
  type MockUser,
  type MockZone,
} from "@/lib/mock-data";
import { AGENCY_ROLES, roleNeedsAgency } from "@/lib/roles";
import {
  canTransition,
  requiresComment,
} from "@/lib/parcel-transitions";
import { STATUS_ORDER } from "@/lib/portal-nav";
import { PORTAL_BY_ROLE, type AppRole } from "@/lib/roles";
import {
  DEFAULT_STATUS_CATEGORIES,
  isStatusCategoryIcon,
  type StatusCategory,
  type StatusCategoryIcon,
} from "@/lib/status-categories";
import { STATUS_META } from "@/lib/status-meta";

/**
 * Browser-persisted demo backend. Mirrors the NestJS API contract (routes, scoping, rules)
 * so the UI behaves the same with NEXT_PUBLIC_USE_MOCK=true or against umbrella/api.
 */

const STORAGE_KEY = "umbrella.mock-db.v4";
export const MOCK_RESET_EVENT = "umbrella:mock-db-reset";

type MockDb = {
  users: MockUser[];
  parcels: MockParcel[];
  tickets: MockTicket[];
  payments: MockPayment[];
  zones: MockZone[];
  agencies: Agency[];
  statusCategories: StatusCategory[];
};

type Actor = {
  id: number;
  role: AppRole;
  name: string;
  email: string;
  phone: string;
  agencyId?: number | null;
};

export class MockHttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "MockHttpError";
  }
}

const STAFF: AppRole[] = ["SUPER_ADMIN", "ADMIN"];
const OPS_STAFF: AppRole[] = ["SUPER_ADMIN", "ADMIN", "CHEF_AGENCE"];
const RETURN_STATUSES_LIST = [
  "RETOUR_DEPOT",
  "RETOUR_DEFINITIF",
  "RETOUR_INTER_AGENCE",
  "RETOUR_EXPEDITEURS",
  "RETOUR_RECU",
];
const DELIVERED = ["LIVRES", "LIVRES_PAYES"];
const SENDER_EDITABLE = ["EN_ATTENTE", "NON_SERIEUX"];
const RETURN_PREFIX = "RETOUR";
const ACTIVE_PAYMENT: PaymentStatus[] = ["EN_DEMANDE", "APPROUVE", "PAYE"];
const PAYMENT_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  EN_DEMANDE: ["APPROUVE", "REJETE"],
  APPROUVE: ["PAYE", "REJETE"],
  PAYE: [],
  REJETE: [],
};
const DELIVERY_WINDOWS = ["matin", "apres-midi", "soir", "journee"];

export const EVENT_LABEL: Record<string, string> = {
  NON_SERIEUX: "Non sérieux",
  EN_ATTENTE: "En attente",
  A_ENLEVER: "À enlever",
  ENLEVES: "Enlevé",
  AU_DEPOT: "Au dépôt",
  RETOUR_DEPOT: "Retour dépôt",
  EN_COURS: "En cours de livraison",
  A_VERIFIER: "À vérifier",
  LIVRES: "Livré",
  LIVRES_PAYES: "Livré payé",
  ECHANGES: "Échange",
  REMBOURSES: "Remboursé",
  RETOUR_DEFINITIF: "Retour définitif",
  RETOUR_INTER_AGENCE: "Retour inter-agence",
  RETOUR_EXPEDITEURS: "Retour expéditeur",
  RETOUR_RECU: "Retour reçu",
  SAISIE_DOUANE: "Saisie par la douane",
  SUPPRIME: "Supprimé",
};

let cache: MockDb | null = null;

function seedStatusCategories(): StatusCategory[] {
  return DEFAULT_STATUS_CATEGORIES.map((row, index) => ({
    id: index + 1,
    key: row.key,
    label: row.label,
    color: row.color,
    icon: row.icon,
    sortOrder: row.sortOrder,
    isActive: true,
  }));
}

function seedDb(): MockDb {
  const seededAt = new Date().toISOString();
  const agencies = structuredClone(MOCK_AGENCIES);
  const agencyByGov = new Map(
    agencies.map((a) => [a.governorate.toLowerCase(), a.id] as const),
  );
  return structuredClone({
    users: MOCK_USERS.map((u) => ({ ...u, createdAt: u.createdAt ?? seededAt })),
    parcels: MOCK_PARCELS.map((p) => ({
      ...p,
      agencyId: agencyByGov.get(p.governorate.toLowerCase()) ?? null,
      timeline: p.timeline ?? [{ at: p.createdAt, label: "Colis créé" }],
    })),
    tickets: MOCK_TICKETS,
    payments: MOCK_PAYMENTS,
    zones: MOCK_ZONES,
    agencies,
    statusCategories: seedStatusCategories(),
  });
}

function isMockDb(value: unknown): value is MockDb {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  const baseOk = ["users", "parcels", "tickets", "payments", "zones"].every((k) =>
    Array.isArray(v[k]),
  );
  if (!baseOk) return false;
  if (!Array.isArray(v.statusCategories)) {
    v.statusCategories = seedStatusCategories();
  }
  if (!Array.isArray(v.agencies)) {
    v.agencies = structuredClone(MOCK_AGENCIES);
  }
  const agencies = v.agencies as Agency[];
  const agencyByGov = new Map(
    agencies.map((a) => [a.governorate.toLowerCase(), a.id] as const),
  );
  for (const p of v.parcels as MockParcel[]) {
    if (p.agencyId == null && p.governorate) {
      p.agencyId = agencyByGov.get(p.governorate.toLowerCase()) ?? null;
    }
  }
  return true;
}

function db(): MockDb {
  if (cache) return cache;
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (isMockDb(parsed)) {
          cache = parsed;
          return cache;
        }
      }
    } catch {
      // corrupted storage falls back to the seed
    }
  }
  cache = seedDb();
  return cache;
}

function commit() {
  if (typeof window === "undefined" || !cache) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // quota errors keep the in-memory state
  }
}

export function resetMockDb() {
  cache = seedDb();
  commit();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(MOCK_RESET_EVENT));
  }
}

function nextId(list: Array<{ id: number }>) {
  return list.reduce((max, item) => Math.max(max, item.id), 0) + 1;
}

function round3(n: number) {
  return Math.round(n * 1000) / 1000;
}

function nowIso() {
  return new Date().toISOString();
}

function agencyRef(agencyId?: number | null) {
  if (!agencyId) return null;
  const agency = db().agencies.find((a) => a.id === agencyId);
  return agency
    ? { id: agency.id, name: agency.name, governorate: agency.governorate }
    : null;
}

function publicUser(u: MockUser) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    agencyId: u.agencyId ?? null,
    agency: agencyRef(u.agencyId),
    isActive: u.isActive,
    createdAt: u.createdAt ?? nowIso(),
  };
}

function sessionFor(user: MockUser): AuthSession {
  return {
    accessToken: `mock-access-${user.id}`,
    refreshToken: `mock-refresh-${user.id}`,
    portal: PORTAL_BY_ROLE[user.role],
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      agencyId: user.agencyId ?? null,
    },
  };
}

function actorFromToken(token?: string): Actor | null {
  if (!token?.startsWith("mock-access-")) return null;
  const id = Number(token.replace("mock-access-", ""));
  const user = db().users.find((u) => u.id === id && u.isActive);
  if (!user) return null;
  return {
    id: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
    phone: user.phone,
    agencyId: user.agencyId ?? null,
  };
}

function requireActor(actor: Actor | null, roles?: AppRole[]): Actor {
  if (!actor) throw new MockHttpError(401, "Session expirée, reconnectez-vous");
  if (roles && !roles.includes(actor.role)) {
    throw new MockHttpError(403, "Accès refusé");
  }
  return actor;
}

function isStaff(actor: Actor) {
  return STAFF.includes(actor.role);
}

function record(body: unknown): Record<string, unknown> {
  return body && typeof body === "object" ? (body as Record<string, unknown>) : {};
}

function str(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function num(value: unknown): number | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function bool(value: unknown): boolean | undefined {
  if (value === undefined || value === null) return undefined;
  return value === true || value === "true" || value === "Oui";
}

function pushEvent(
  parcel: MockParcel,
  label: string,
  opts: { status?: string; comment?: string | null; actor?: Actor | null } = {},
) {
  const comment = opts.comment?.trim() || null;
  const entry: TimelineEntry = {
    at: nowIso(),
    label: comment ? `${label} — ${comment}` : label,
    comment,
    status: opts.status ?? null,
    actor: opts.actor?.name ?? null,
  };
  parcel.timeline = [...(parcel.timeline ?? []), entry];
  parcel.updatedAt = entry.at;
}

function agencyIdForGov(governorate: string): number | null {
  const hit = db().agencies.find(
    (a) => a.isActive && a.governorate.toLowerCase() === governorate.toLowerCase(),
  );
  return hit?.id ?? null;
}

function enrichParcel(parcel: MockParcel): MockParcel {
  const sender = parcel.senderId
    ? db().users.find((u) => u.id === parcel.senderId)
    : null;
  const driver = parcel.driverId
    ? db().users.find((u) => u.id === parcel.driverId)
    : null;
  return {
    ...parcel,
    agency: agencyRef(parcel.agencyId),
    sender: sender
      ? {
          id: sender.id,
          name: sender.name,
          email: sender.email,
          phone: sender.phone,
        }
      : parcel.sender,
    driver: driver
      ? { id: driver.id, name: driver.name, phone: driver.phone }
      : parcel.driver,
  };
}

function scopeParcels(actor: Actor): MockParcel[] {
  const live = db().parcels.filter((p) => p.status !== "SUPPRIME");
  let list: MockParcel[];
  if (isStaff(actor)) list = live;
  else if (AGENCY_ROLES.includes(actor.role)) {
    const agencyId = actor.agencyId;
    if (!agencyId) return [];
    const scoped = live.filter((p) => p.agencyId === agencyId);
    list =
      actor.role === "SUPPORT"
        ? scoped.filter((p) => RETURN_STATUSES_LIST.includes(p.status))
        : scoped;
  } else if (actor.role === "LIVREUR") {
    list = live.filter((p) => p.driverId === actor.id);
  } else if (actor.role === "CLIENT") {
    list = live.filter((p) => p.phone === actor.phone);
  } else {
    list = live.filter((p) => p.senderId === actor.id);
  }
  return list.map(enrichParcel);
}

function findScopedParcel(actor: Actor, id: number): MockParcel {
  const parcel = scopeParcels(actor).find((p) => p.id === id);
  if (!parcel) throw new MockHttpError(404, "Colis introuvable");
  return parcel;
}

function inAgency(actor: Actor, parcel: MockParcel): boolean {
  return (
    AGENCY_ROLES.includes(actor.role) &&
    !!actor.agencyId &&
    parcel.agencyId === actor.agencyId
  );
}

function ownedOrStaff(actor: Actor, id: number): MockParcel {
  const parcel = db().parcels.find((p) => p.id === id && p.status !== "SUPPRIME");
  if (!parcel) throw new MockHttpError(404, "Colis introuvable");
  if (isStaff(actor)) return enrichParcel(parcel);
  if (actor.role === "CHEF_AGENCE" && inAgency(actor, parcel)) {
    return enrichParcel(parcel);
  }
  if (actor.role === "EXPEDITEUR" && parcel.senderId === actor.id) {
    return enrichParcel(parcel);
  }
  throw new MockHttpError(403, "Accès refusé");
}

function generateCode(prefix: string) {
  const stamp = Date.now().toString(36).toUpperCase();
  const salt = Math.floor(Math.random() * 1296).toString(36).toUpperCase().padStart(2, "0");
  return `${prefix}-${stamp}${salt}`;
}

function applyParcelFields(target: MockParcel, dto: Record<string, unknown>) {
  const required = (key: string, current: string) => {
    if (dto[key] === undefined) return current;
    const value = str(dto[key]);
    if (!value) throw new MockHttpError(400, `Champ requis : ${key}`);
    return value;
  };
  const optionalText = (key: string, current: string | null | undefined) =>
    dto[key] === undefined ? current ?? null : str(dto[key]) ?? null;
  const optionalNumber = (key: string, current: number | null | undefined) =>
    dto[key] === undefined ? current ?? null : num(dto[key]) ?? null;
  const flag = (key: string, current: boolean | undefined) =>
    dto[key] === undefined ? current ?? false : bool(dto[key]) ?? false;

  target.recipientName = required("recipientName", target.recipientName);
  target.phone = required("phone", target.phone);
  const prevGov = target.governorate;
  target.governorate = required("governorate", target.governorate);
  if (dto.governorate !== undefined && target.governorate !== prevGov) {
    target.agencyId = agencyIdForGov(target.governorate);
  }
  target.city = required("city", target.city);
  target.address = required("address", target.address);
  target.phone2 = optionalText("phone2", target.phone2);
  target.locality = optionalText("locality", target.locality);
  target.designation = optionalText("designation", target.designation);
  target.notes = optionalText("notes", target.notes);
  target.paymentMode = optionalText("paymentMode", target.paymentMode);
  target.exchangeNotes = optionalText("exchangeNotes", target.exchangeNotes);
  target.landmarkPhotoName = optionalText("landmarkPhotoName", target.landmarkPhotoName);
  target.lat = optionalNumber("lat", target.lat);
  target.lng = optionalNumber("lng", target.lng);
  target.addressQuality = optionalNumber("addressQuality", target.addressQuality);
  target.articleCount = optionalNumber("articleCount", target.articleCount) ?? 1;
  target.parcelCount = optionalNumber("parcelCount", target.parcelCount) ?? 1;
  target.allowOpen = flag("allowOpen", target.allowOpen);
  target.tryProduct = flag("tryProduct", target.tryProduct);
  target.isExchange = flag("isExchange", target.isExchange);
  if (dto.price !== undefined) {
    const price = num(dto.price);
    if (price === undefined || price < 0) throw new MockHttpError(400, "Prix invalide");
    target.price = price;
  }
  if (dto.deliveryWindow !== undefined) {
    const w = str(dto.deliveryWindow);
    if (w && !DELIVERY_WINDOWS.includes(w)) {
      throw new MockHttpError(400, "Créneau invalide");
    }
    target.deliveryWindow = w ?? null;
  }
  if (dto.liabilityAcceptedAt !== undefined) {
    target.liabilityAcceptedAt = str(dto.liabilityAcceptedAt) ?? null;
  }
  if (dto.zoneId !== undefined) {
    const zoneId = num(dto.zoneId);
    const zone = zoneId ? db().zones.find((z) => z.id === zoneId) : undefined;
    target.zoneId = zone?.id ?? null;
    target.zone = zone ? { id: zone.id, name: zone.name } : null;
  }
  if (dto.zoneName !== undefined) {
    const name = str(dto.zoneName);
    if (!name) {
      target.zoneId = null;
      target.zone = null;
    } else {
      const store = db();
      let zone = store.zones.find(
        (z) => z.name.localeCompare(name, "fr", { sensitivity: "base" }) === 0,
      );
      if (!zone) {
        zone = {
          id: nextId(store.zones),
          name,
          governorate: null,
          centerLat: null,
          centerLng: null,
          radiusKm: null,
          isActive: true,
        };
        store.zones.push(zone);
      }
      target.zoneId = zone.id;
      target.zone = { id: zone.id, name: zone.name };
    }
  }
}

function createParcel(actor: Actor, dto: Record<string, unknown>) {
  const recipientName = str(dto.recipientName);
  const phone = str(dto.phone);
  const governorate = str(dto.governorate);
  const city = str(dto.city);
  const address = str(dto.address);
  if (!recipientName || recipientName.length < 2 || !phone || !governorate || !city || !address) {
    throw new MockHttpError(400, "Champs obligatoires manquants");
  }
  const mode = dto.mode === "INTERNAL" ? "INTERNAL" : "EXTERNAL";
  const at = nowIso();
  const price = num(dto.price);
  if (price === undefined || price < 0) throw new MockHttpError(400, "Prix invalide");
  const parcel: MockParcel = {
    id: nextId(db().parcels),
    code: generateCode(mode === "EXTERNAL" ? "UMB-EXT" : "UMB"),
    recipientName,
    phone,
    governorate,
    city,
    address,
    price,
    notes: null,
    status: "EN_ATTENTE",
    mode,
    bordereauUrl: null,
    createdAt: at,
    updatedAt: at,
    senderId: actor.id,
    sender: { id: actor.id, name: actor.name, email: actor.email, phone: actor.phone },
    driverId: null,
    driver: null,
    zone: null,
    agencyId: agencyIdForGov(governorate),
    articleCount: 1,
    parcelCount: 1,
    timeline: [],
  };
  applyParcelFields(parcel, dto);
  parcel.tryProduct = bool(dto.tryProduct) ?? bool(dto.allowOpen) ?? false;
  if (!parcel.agencyId) parcel.agencyId = agencyIdForGov(parcel.governorate);
  pushEvent(parcel, "Colis créé", { status: "EN_ATTENTE", actor });
  db().parcels.unshift(parcel);
  commit();
  return enrichParcel(parcel);
}

function trackParcel(code: string) {
  const parcel = db().parcels.find((p) => p.code === code && p.status !== "SUPPRIME");
  if (!parcel) throw new MockHttpError(404, "Colis introuvable");
  const name = parcel.recipientName.trim();
  const masked =
    name.length <= 2
      ? `${name[0] ?? "*"}*`
      : `${name.slice(0, 1)}${"*".repeat(Math.min(name.length - 1, 6))}`;
  return {
    code: parcel.code,
    status: parcel.status,
    recipientName: masked,
    city: parcel.city,
    governorate: parcel.governorate,
    updatedAt: parcel.updatedAt ?? parcel.createdAt,
    timeline: (parcel.timeline ?? []).map((e) => ({
      at: e.at,
      label: e.comment ? e.label.replace(` — ${e.comment}`, "") : e.label,
    })),
  };
}

function statusCounts(actor: Actor): StatusCard[] {
  const map = new Map<string, number>();
  for (const p of scopeParcels(actor)) map.set(p.status, (map.get(p.status) ?? 0) + 1);
  return STATUS_ORDER.map((key) => ({
    key,
    label: STATUS_META[key].label,
    tone: "custom",
    count: map.get(key) ?? 0,
  }));
}

function senderPayments(actor: Actor) {
  const payments = db().payments;
  return isStaff(actor) ? payments : payments.filter((p) => p.sender?.email === actor.email);
}

function analytics(actor: Actor) {
  const list = scopeParcels(actor);
  const isSender = actor.role === "EXPEDITEUR";
  const total = list.length;
  const external = list.filter((p) => p.mode === "EXTERNAL").length;
  const internal = total - external;
  const delivered = list.filter((p) => DELIVERED.includes(p.status)).length;
  const awaiting = list.filter((p) => p.status === "EN_ATTENTE").length;
  const inProgress = list.filter((p) =>
    ["EN_COURS", "AU_DEPOT", "A_ENLEVER", "ENLEVES"].includes(p.status),
  ).length;
  const returnList = list.filter((p) => p.status.startsWith(RETURN_PREFIX));
  const returns = returnList.length;
  const exchanges = list.filter((p) => p.status === "ECHANGES").length;
  const revenue = list.reduce((s, p) => s + p.price, 0);
  const encaisse = list
    .filter((p) => DELIVERED.includes(p.status))
    .reduce((s, p) => s + p.price, 0);
  const retoursMontant = returnList.reduce((s, p) => s + p.price, 0);

  const payments = senderPayments(actor);
  const sumBy = (status: PaymentStatus) =>
    payments.filter((p) => p.status === status).reduce((s, p) => s + p.amount, 0);
  const enDemande = sumBy("EN_DEMANDE");
  const aVerser = sumBy("APPROUVE");
  const verse = sumBy("PAYE");
  const retoursFrais = round3(returns * 7);
  const disponible = Math.max(0, encaisse - enDemande - aVerser - verse);

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().slice(0, 10);
    const dayParcels = list.filter((p) => p.createdAt.startsWith(key));
    const fallbackTotal = isSender ? (i % 3 === 0 ? 1 : 0) : i % 3 === 0 ? 2 : 1;
    return {
      date: key,
      label: key.slice(5),
      total: dayParcels.length || fallbackTotal,
      delivered: Math.min(1, dayParcels.filter((p) => DELIVERED.includes(p.status)).length),
      external:
        dayParcels.filter((p) => p.mode === "EXTERNAL").length || (i % 2 === 0 ? 1 : 0),
      internal:
        dayParcels.filter((p) => p.mode === "INTERNAL").length || (i % 2 === 1 ? 1 : 0),
    };
  });

  return {
    kpis: {
      total,
      external,
      internal,
      delivered,
      inProgress,
      returns,
      awaiting,
      exchanges,
      revenue,
      deliveryRate: total ? Math.round((delivered / total) * 100) : 0,
      returnRate: total ? Math.round((returns / total) * 100) : 0,
    },
    soldes: { disponible, enDemande, aVerser, verse, encaisse, retoursMontant, retoursFrais },
    last7Days,
  };
}

function ticketsFor(actor: Actor) {
  const tickets = db().tickets;
  return isStaff(actor) ? tickets : tickets.filter((t) => t.createdBy?.id === actor.id);
}

function createTicket(actor: Actor, dto: Record<string, unknown>) {
  const title = str(dto.title);
  if (!title || title.length < 3) throw new MockHttpError(400, "Sujet trop court");
  const parcelId = num(dto.parcelId);
  const parcel = parcelId ? db().parcels.find((p) => p.id === parcelId) : undefined;
  if (parcelId && !parcel) throw new MockHttpError(400, "Colis introuvable");
  const at = nowIso();
  const ticket: MockTicket = {
    id: nextId(db().tickets),
    title,
    description: str(dto.description) ?? null,
    status: "EN_COURS",
    createdAt: at,
    updatedAt: at,
    parcel: parcel ? { id: parcel.id, code: parcel.code } : null,
    createdBy: { id: actor.id, name: actor.name, email: actor.email },
  };
  db().tickets.unshift(ticket);
  commit();
  return ticket;
}

function updateTicketStatus(actor: Actor, id: number, dto: Record<string, unknown>) {
  const ticket = db().tickets.find((t) => t.id === id);
  if (!ticket) throw new MockHttpError(404, "Ticket introuvable");
  const status = dto.status as TicketStatus;
  if (!["EN_COURS", "RESOLU", "FERME"].includes(status)) {
    throw new MockHttpError(400, "Statut invalide");
  }
  if (!isStaff(actor) && ticket.createdBy?.id !== actor.id) {
    throw new MockHttpError(403, "Accès refusé");
  }
  if (!isStaff(actor) && status !== "FERME") {
    throw new MockHttpError(403, "Seul le support peut résoudre un ticket");
  }
  ticket.status = status;
  ticket.updatedAt = nowIso();
  commit();
  return ticket;
}

function createPayment(actor: Actor, dto: Record<string, unknown>) {
  const ids = Array.isArray(dto.parcelIds)
    ? Array.from(new Set(dto.parcelIds.map(Number).filter(Number.isInteger)))
    : [];
  if (ids.length === 0) throw new MockHttpError(400, "Sélectionnez au moins un colis");
  const blocked = new Set(
    db()
      .payments.filter((p) => ACTIVE_PAYMENT.includes(p.status))
      .flatMap((p) => p.items.map((i) => i.parcel.id)),
  );
  const parcels = db().parcels.filter(
    (p) =>
      ids.includes(p.id) &&
      DELIVERED.includes(p.status) &&
      !blocked.has(p.id) &&
      (actor.role !== "EXPEDITEUR" || p.senderId === actor.id),
  );
  if (parcels.length !== ids.length) {
    throw new MockHttpError(
      400,
      "Certains colis sont introuvables, non livrés ou déjà dans une demande",
    );
  }
  const senderId = parcels[0].senderId;
  if (parcels.some((p) => p.senderId !== senderId)) {
    throw new MockHttpError(400, "Une demande ne peut concerner qu’un seul expéditeur");
  }
  const sender = db().users.find((u) => u.id === senderId);
  const at = nowIso();
  const payment: MockPayment = {
    id: nextId(db().payments),
    amount: round3(parcels.reduce((s, p) => s + p.price, 0)),
    status: "EN_DEMANDE",
    note: str(dto.note) ?? null,
    createdAt: at,
    updatedAt: at,
    sender: sender
      ? { id: sender.id, name: sender.name, email: sender.email }
      : undefined,
    items: parcels.map((p) => ({ parcel: { id: p.id, code: p.code }, amount: p.price })),
  };
  db().payments.unshift(payment);
  commit();
  return payment;
}

function updatePaymentStatus(actor: Actor, id: number, dto: Record<string, unknown>) {
  const payment = db().payments.find((p) => p.id === id);
  if (!payment) throw new MockHttpError(404, "Demande introuvable");
  const status = dto.status as PaymentStatus;
  if (!PAYMENT_TRANSITIONS[payment.status]?.includes(status)) {
    throw new MockHttpError(400, `Transition ${payment.status} → ${String(status)} impossible`);
  }
  payment.status = status;
  payment.updatedAt = nowIso();
  if (status === "PAYE") {
    for (const item of payment.items) {
      const parcel = db().parcels.find((p) => p.id === item.parcel.id);
      if (!parcel) continue;
      parcel.status = "LIVRES_PAYES";
      pushEvent(parcel, EVENT_LABEL.LIVRES_PAYES, {
        status: "LIVRES_PAYES",
        comment: `Paiement #${id} versé`,
        actor,
      });
    }
  }
  commit();
  return payment;
}

function zonesFor(actor: Actor) {
  const counts = new Map<number, number>();
  for (const p of db().parcels) {
    if (p.zone?.id && p.status !== "SUPPRIME") {
      counts.set(p.zone.id, (counts.get(p.zone.id) ?? 0) + 1);
    }
  }
  return db()
    .zones.filter((z) => isStaff(actor) || z.isActive)
    .map((z) => ({ ...z, parcelCount: counts.get(z.id) ?? 0 }))
    .sort((a, b) => a.name.localeCompare(b.name, "fr"));
}

function applyZoneFields(zone: MockZone, dto: Record<string, unknown>) {
  if (dto.name !== undefined) {
    const name = str(dto.name);
    if (!name || name.length < 2) throw new MockHttpError(400, "Nom de zone invalide");
    zone.name = name;
  }
  if (dto.governorate !== undefined) zone.governorate = str(dto.governorate) ?? null;
  if (dto.centerLat !== undefined) zone.centerLat = num(dto.centerLat) ?? null;
  if (dto.centerLng !== undefined) zone.centerLng = num(dto.centerLng) ?? null;
  if (dto.radiusKm !== undefined) zone.radiusKm = num(dto.radiusKm) ?? null;
  if (dto.isActive !== undefined) zone.isActive = Boolean(dto.isActive);
}

function usersFor(actor: Actor) {
  return db()
    .users.filter((u) => actor.role === "SUPER_ADMIN" || u.role !== "SUPER_ADMIN")
    .map(publicUser);
}

const ALL_ROLES: AppRole[] = [
  "SUPER_ADMIN",
  "ADMIN",
  "CHEF_AGENCE",
  "SUPPORT",
  "PICKUP",
  "MAGASINIER",
  "EXPEDITEUR",
  "LIVREUR",
  "CLIENT",
];

const ADMIN_CREATABLE: AppRole[] = [
  "ADMIN",
  "SUPPORT",
  "PICKUP",
  "MAGASINIER",
  "EXPEDITEUR",
  "LIVREUR",
  "CLIENT",
];

function resolveAgencyId(role: AppRole, agencyId?: number | null): number | null {
  if (roleNeedsAgency(role)) {
    if (agencyId == null) {
      throw new MockHttpError(400, "agencyId is required for this role");
    }
    const agency = db().agencies.find((a) => a.id === agencyId && a.isActive);
    if (!agency) throw new MockHttpError(400, "Agency not found");
    return agency.id;
  }
  return agencyId ?? null;
}

function createUser(actor: Actor, dto: Record<string, unknown>) {
  const role = dto.role as AppRole;
  if (!ALL_ROLES.includes(role)) {
    throw new MockHttpError(400, "Rôle invalide");
  }
  if (actor.role === "ADMIN") {
    if (!ADMIN_CREATABLE.includes(role)) {
      throw new MockHttpError(403, "Admins cannot create this role");
    }
  } else if (actor.role !== "SUPER_ADMIN") {
    throw new MockHttpError(403, "Accès refusé");
  }
  if (role === "SUPER_ADMIN" && actor.role !== "SUPER_ADMIN") {
    throw new MockHttpError(403, "Seul un super admin peut créer ce rôle");
  }
  if (role === "CHEF_AGENCE" && actor.role !== "SUPER_ADMIN") {
    throw new MockHttpError(403, "Seul un super admin peut créer un chef d'agence");
  }
  const email = str(dto.email)?.toLowerCase();
  const name = str(dto.name);
  const password = typeof dto.password === "string" ? dto.password : "";
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    throw new MockHttpError(400, "Email invalide");
  }
  if (!name) throw new MockHttpError(400, "Nom requis");
  if (password.length < 8) throw new MockHttpError(400, "Mot de passe : 8 caractères minimum");
  if (db().users.some((u) => u.email.toLowerCase() === email)) {
    throw new MockHttpError(409, "Email déjà utilisé");
  }
  const agencyId = resolveAgencyId(role, num(dto.agencyId) ?? null);
  const user: MockUser = {
    id: nextId(db().users),
    name,
    email,
    role,
    phone: str(dto.phone) ?? "",
    password,
    isActive: true,
    agencyId,
    createdAt: nowIso(),
  };
  db().users.push(user);
  commit();
  return publicUser(user);
}

function setUserActive(actor: Actor, id: number, dto: Record<string, unknown>) {
  const target = db().users.find((u) => u.id === id);
  if (!target) throw new MockHttpError(404, "Utilisateur introuvable");
  if (target.id === actor.id) {
    throw new MockHttpError(400, "Impossible de modifier votre propre statut");
  }
  if (
    actor.role === "ADMIN" &&
    (target.role === "SUPER_ADMIN" || target.role === "CHEF_AGENCE")
  ) {
    throw new MockHttpError(403, "Accès refusé");
  }
  target.isActive = Boolean(dto.isActive);
  commit();
  return publicUser(target);
}

function updateUser(actor: Actor, id: number, dto: Record<string, unknown>) {
  const target = db().users.find((u) => u.id === id);
  if (!target) throw new MockHttpError(404, "Utilisateur introuvable");
  if (actor.role !== "SUPER_ADMIN" && actor.role !== "ADMIN") {
    throw new MockHttpError(403, "Accès refusé");
  }
  if (
    actor.role === "ADMIN" &&
    (target.role === "SUPER_ADMIN" || target.role === "CHEF_AGENCE")
  ) {
    throw new MockHttpError(403, "Les admins ne peuvent pas gérer cet utilisateur");
  }

  const nextRole = (dto.role as AppRole | undefined) ?? target.role;
  if (dto.role !== undefined) {
    if (!ALL_ROLES.includes(nextRole)) {
      throw new MockHttpError(400, "Rôle invalide");
    }
    if (
      (nextRole === "SUPER_ADMIN" || nextRole === "CHEF_AGENCE") &&
      actor.role !== "SUPER_ADMIN"
    ) {
      throw new MockHttpError(403, "Seul un super admin peut assigner ce rôle");
    }
    if (actor.role === "ADMIN" && !ADMIN_CREATABLE.includes(nextRole)) {
      throw new MockHttpError(403, "Admins cannot assign this role");
    }
    if (target.id === actor.id && nextRole !== target.role) {
      throw new MockHttpError(400, "Impossible de changer votre propre rôle");
    }
    target.role = nextRole;
  }

  if (dto.agencyId !== undefined || dto.role !== undefined) {
    target.agencyId = roleNeedsAgency(nextRole)
      ? resolveAgencyId(
          nextRole,
          dto.agencyId !== undefined ? (num(dto.agencyId) ?? null) : (target.agencyId ?? null),
        )
      : null;
  }

  const email = str(dto.email)?.toLowerCase();
  if (email && email !== target.email) {
    if (db().users.some((u) => u.id !== id && u.email.toLowerCase() === email)) {
      throw new MockHttpError(409, "Email déjà utilisé");
    }
    target.email = email;
  }
  const name = str(dto.name);
  if (name) target.name = name;
  const phone = str(dto.phone);
  if (phone !== undefined) {
    if (phone && !/^[0-9]{8}$/.test(phone)) {
      throw new MockHttpError(400, "Téléphone : 8 chiffres");
    }
    target.phone = phone ?? "";
  }
  const password = typeof dto.password === "string" ? dto.password : "";
  if (password) {
    if (password.length < 8) {
      throw new MockHttpError(400, "Mot de passe : 8 caractères minimum");
    }
    target.password = password;
  }
  commit();
  return publicUser(target);
}

function updateProfile(actor: Actor, dto: Record<string, unknown>) {
  const user = db().users.find((u) => u.id === actor.id);
  if (!user) throw new MockHttpError(404, "Utilisateur introuvable");
  const email = str(dto.email)?.toLowerCase();
  if (email && db().users.some((u) => u.id !== user.id && u.email.toLowerCase() === email)) {
    throw new MockHttpError(409, "Email déjà utilisé");
  }
  const phone = str(dto.phone);
  if (phone && !/^[0-9]{8}$/.test(phone)) {
    throw new MockHttpError(400, "Téléphone : 8 chiffres");
  }
  const name = str(dto.name);
  if (name) user.name = name;
  if (email) user.email = email;
  if (phone) user.phone = phone;
  commit();
  return publicUser(user);
}

function changePassword(actor: Actor, dto: Record<string, unknown>) {
  const user = db().users.find((u) => u.id === actor.id);
  if (!user) throw new MockHttpError(404, "Utilisateur introuvable");
  if (dto.currentPassword !== user.password) {
    throw new MockHttpError(400, "Mot de passe actuel incorrect");
  }
  const next = typeof dto.newPassword === "string" ? dto.newPassword : "";
  if (next.length < 8) throw new MockHttpError(400, "Mot de passe : 8 caractères minimum");
  if (next === user.password) {
    throw new MockHttpError(400, "Le nouveau mot de passe doit être différent");
  }
  user.password = next;
  commit();
  return { updated: true };
}

function codPayload(): CodPayload {
  const items = db()
    .parcels.filter((p) => DELIVERED.includes(p.status))
    .map((p) => ({
      id: p.id,
      code: p.code,
      recipientName: p.recipientName,
      city: p.city,
      price: p.price,
      status: p.status,
      codSettledAt: p.codSettledAt ?? null,
      codSettledBy: null,
      driver: p.driver ?? null,
    }))
    .sort((a, b) => Number(Boolean(a.codSettledAt)) - Number(Boolean(b.codSettledAt)));
  const open = items.filter((i) => !i.codSettledAt);
  const settled = items.filter((i) => i.codSettledAt);
  const sum = (list: typeof items) => round3(list.reduce((s, i) => s + i.price, 0));
  return {
    items,
    summary: {
      openAmount: sum(open),
      openCount: open.length,
      settledAmount: sum(settled),
      settledCount: settled.length,
    },
  };
}

function settleCod(actor: Actor, dto: Record<string, unknown>) {
  const ids = Array.isArray(dto.parcelIds) ? dto.parcelIds.map(Number) : [];
  let settled = 0;
  const at = nowIso();
  for (const parcel of db().parcels) {
    if (!ids.includes(parcel.id) || !DELIVERED.includes(parcel.status) || parcel.codSettledAt) {
      continue;
    }
    parcel.codSettledAt = at;
    pushEvent(parcel, "Montant COD encaissé", { actor });
    settled += 1;
  }
  commit();
  return { settled };
}

function notificationsFor(actor: Actor): AppNotification[] {
  const staff = isStaff(actor);
  const events: AppNotification[] = scopeParcels(actor).flatMap((p) =>
    (p.timeline ?? [])
      .filter((e) => e.actor !== actor.name)
      .map((e, i) => ({
        id: `event-${p.id}-${i}`,
        kind: "parcel" as const,
        title: p.code,
        body: e.label,
        at: e.at,
        targetId: p.id,
      })),
  );
  const tickets: AppNotification[] = db()
    .tickets.filter((t) =>
      staff ? t.status === "EN_COURS" : t.createdBy?.id === actor.id && t.status !== "EN_COURS",
    )
    .map((t) => ({
      id: `ticket-${t.id}-${t.status}`,
      kind: "ticket" as const,
      title: staff ? "Ticket ouvert" : `Ticket ${t.status === "RESOLU" ? "résolu" : "fermé"}`,
      body: t.title,
      at: t.updatedAt ?? t.createdAt,
      targetId: t.id,
    }));
  const payments: AppNotification[] =
    staff || actor.role === "EXPEDITEUR"
      ? senderPayments(actor)
          .filter((p) => (staff ? p.status === "EN_DEMANDE" : p.status !== "EN_DEMANDE"))
          .map((p) => ({
            id: `payment-${p.id}-${p.status}`,
            kind: "payment" as const,
            title: staff ? "Demande de paiement" : `Paiement ${p.status.toLowerCase()}`,
            body: `#${p.id} · ${p.amount.toFixed(3)} TND`,
            at: p.updatedAt ?? p.createdAt,
            targetId: p.id,
          }))
      : [];
  return [...events, ...tickets, ...payments]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 15);
}

export function mockSignIn(email: string, password: string): AuthSession {
  const user = db().users.find(
    (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password,
  );
  if (!user) throw new MockHttpError(401, "Identifiants invalides");
  if (!user.isActive) throw new MockHttpError(401, "Compte désactivé — contactez le support");
  return sessionFor(user);
}

export function mockSignUp(dto: Record<string, unknown>): AuthSession {
  const email = str(dto.email)?.toLowerCase();
  const name = str(dto.name);
  const password = typeof dto.password === "string" ? dto.password : "";
  if (!email || !name) throw new MockHttpError(400, "Nom et email requis");
  if (password.length < 8) throw new MockHttpError(400, "Mot de passe : 8 caractères minimum");
  if (db().users.some((u) => u.email.toLowerCase() === email)) {
    throw new MockHttpError(409, "Email déjà utilisé");
  }
  const role: AppRole =
    dto.role === "LIVREUR" || dto.role === "CLIENT" ? dto.role : "EXPEDITEUR";
  const user: MockUser = {
    id: nextId(db().users),
    name,
    email,
    role,
    phone: str(dto.phone) ?? "",
    password,
    isActive: true,
    createdAt: nowIso(),
  };
  db().users.push(user);
  commit();
  return sessionFor(user);
}

export function mockRefresh(refreshToken: string): AuthSession {
  const id = Number(refreshToken.replace("mock-refresh-", ""));
  const user = db().users.find((u) => u.id === id && u.isActive);
  if (!user) throw new MockHttpError(401, "Session expirée");
  return sessionFor(user);
}

type Route = {
  method: string;
  pattern: RegExp;
  roles?: AppRole[];
  handler: (ctx: { actor: Actor; params: string[]; body: Record<string, unknown> }) => unknown;
};

const SENDERS: AppRole[] = ["SUPER_ADMIN", "ADMIN", "CHEF_AGENCE", "EXPEDITEUR"];
const ALL: AppRole[] = [
  "SUPER_ADMIN",
  "ADMIN",
  "CHEF_AGENCE",
  "SUPPORT",
  "PICKUP",
  "MAGASINIER",
  "EXPEDITEUR",
  "LIVREUR",
  "CLIENT",
];
const PARCEL_OPS: AppRole[] = [
  "SUPER_ADMIN",
  "ADMIN",
  "CHEF_AGENCE",
  "SUPPORT",
  "PICKUP",
  "MAGASINIER",
  "LIVREUR",
];
const SCAN_ROLES: AppRole[] = [
  "SUPER_ADMIN",
  "ADMIN",
  "CHEF_AGENCE",
  "SUPPORT",
  "PICKUP",
  "MAGASINIER",
  "LIVREUR",
];

const ROUTES: Route[] = [
  { method: "GET", pattern: /^\/parcels$/, handler: ({ actor }) => scopeParcels(actor) },
  {
    method: "GET",
    pattern: /^\/parcels\/by-code\/([^/]+)$/,
    handler: ({ actor, params }) => {
      const code = decodeURIComponent(params[0] ?? "").trim();
      const hit = db().parcels.find(
        (p) =>
          p.status !== "SUPPRIME" &&
          p.code?.toLowerCase() === code.toLowerCase(),
      );
      if (!hit) throw new MockHttpError(404, "Colis introuvable");
      return findScopedParcel(actor, hit.id);
    },
  },
  {
    method: "POST",
    pattern: /^\/parcels\/scan$/,
    roles: SCAN_ROLES,
    handler: ({ actor, body }) => {
      const code = str(body.code)?.trim() ?? "";
      const hit = db().parcels.find(
        (p) =>
          p.status !== "SUPPRIME" &&
          p.code?.toLowerCase() === code.toLowerCase(),
      );
      if (!hit) throw new MockHttpError(404, "Colis introuvable");
      if (actor.role === "LIVREUR" && hit.driverId !== actor.id) {
        throw new MockHttpError(403, "Ce colis ne vous est pas assigné");
      }
      if (AGENCY_ROLES.includes(actor.role) && !inAgency(actor, hit)) {
        throw new MockHttpError(403, "Colis hors de votre agence");
      }
      const status = body.status ? String(body.status) : null;
      if (!status) {
        pushEvent(hit, "Scan bordereau", {
          status: hit.status,
          comment: hit.code ? `Code ${hit.code}` : null,
          actor,
        });
        commit();
        return findScopedParcel(actor, hit.id);
      }
      if (!(status in STATUS_META)) throw new MockHttpError(400, "Statut invalide");
      const gate = canTransition(hit.status, status, actor.role);
      if (!gate.ok) throw new MockHttpError(400, gate.reason);
      const comment = str(body.comment) ?? null;
      if (requiresComment(status, hit.status) && !comment?.trim()) {
        throw new MockHttpError(
          400,
          "Un motif / commentaire est obligatoire pour ce statut",
        );
      }
      hit.status = status;
      pushEvent(hit, EVENT_LABEL[status] ?? status, {
        status,
        comment,
        actor,
      });
      commit();
      return findScopedParcel(actor, hit.id);
    },
  },
  {
    method: "GET",
    pattern: /^\/parcels\/(\d+)$/,
    handler: ({ actor, params }) => findScopedParcel(actor, Number(params[0])),
  },
  {
    method: "POST",
    pattern: /^\/parcels$/,
    roles: SENDERS,
    handler: ({ actor, body }) => createParcel(actor, body),
  },
  {
    method: "POST",
    pattern: /^\/parcels\/sync-external$/,
    roles: STAFF,
    handler: () => ({
      checked: db().parcels.filter((p) => p.mode === "EXTERNAL" && p.status !== "SUPPRIME")
        .length,
      updated: 0,
      enabled: false,
    }),
  },
  {
    method: "PATCH",
    pattern: /^\/parcels\/(\d+)$/,
    roles: SENDERS,
    handler: ({ actor, params, body }) => {
      const parcel = ownedOrStaff(actor, Number(params[0]));
      if (actor.role === "EXPEDITEUR" && !SENDER_EDITABLE.includes(parcel.status)) {
        throw new MockHttpError(403, "Seuls les colis en attente sont modifiables");
      }
      applyParcelFields(parcel, body);
      pushEvent(parcel, "Colis modifié", { actor });
      commit();
      return parcel;
    },
  },
  {
    method: "DELETE",
    pattern: /^\/parcels\/(\d+)$/,
    roles: SENDERS,
    handler: ({ actor, params }) => {
      const parcel = ownedOrStaff(actor, Number(params[0]));
      parcel.status = "SUPPRIME";
      pushEvent(parcel, "Colis supprimé", { status: "SUPPRIME", actor });
      commit();
      return { id: parcel.id, deleted: true };
    },
  },
  {
    method: "PATCH",
    pattern: /^\/parcels\/(\d+)\/assign$/,
    roles: OPS_STAFF,
    handler: ({ actor, params, body }) => {
      const parcel = ownedOrStaff(actor, Number(params[0]));
      if (parcel.mode !== "INTERNAL") {
        throw new MockHttpError(400, "Seuls les colis INTERNAL sont assignables");
      }
      const driver = db().users.find(
        (u) => u.id === Number(body.driverId) && u.role === "LIVREUR" && u.isActive,
      );
      if (!driver) throw new MockHttpError(400, "Livreur introuvable");
      const raw = db().parcels.find((p) => p.id === parcel.id)!;
      raw.driverId = driver.id;
      raw.driver = { id: driver.id, name: driver.name, phone: driver.phone };
      raw.status = "A_ENLEVER";
      pushEvent(raw, `Assigné à ${driver.name}`, { status: "A_ENLEVER", actor });
      commit();
      return enrichParcel(raw);
    },
  },
  {
    method: "PATCH",
    pattern: /^\/parcels\/(\d+)\/status$/,
    roles: PARCEL_OPS,
    handler: ({ actor, params, body }) => {
      const parcel = db().parcels.find(
        (p) => p.id === Number(params[0]) && p.status !== "SUPPRIME",
      );
      if (!parcel) throw new MockHttpError(404, "Colis introuvable");
      if (actor.role === "LIVREUR" && parcel.driverId !== actor.id) {
        throw new MockHttpError(403, "Ce colis ne vous est pas assigné");
      }
      if (AGENCY_ROLES.includes(actor.role) && !inAgency(actor, parcel)) {
        throw new MockHttpError(403, "Colis hors de votre agence");
      }
      const status = String(body.status ?? "");
      if (!(status in STATUS_META)) throw new MockHttpError(400, "Statut invalide");
      const gate = canTransition(parcel.status, status, actor.role);
      if (!gate.ok) throw new MockHttpError(400, gate.reason);
      const comment = str(body.comment) ?? null;
      if (requiresComment(status, parcel.status) && !comment?.trim()) {
        throw new MockHttpError(
          400,
          "Un motif / commentaire est obligatoire pour ce statut",
        );
      }
      parcel.status = status;
      pushEvent(parcel, EVENT_LABEL[status] ?? status, {
        status,
        comment,
        actor,
      });
      commit();
      return enrichParcel(parcel);
    },
  },
  { method: "GET", pattern: /^\/tickets$/, handler: ({ actor }) => ticketsFor(actor) },
  {
    method: "POST",
    pattern: /^\/tickets$/,
    roles: ["SUPER_ADMIN", "ADMIN", "EXPEDITEUR", "CLIENT"],
    handler: ({ actor, body }) => createTicket(actor, body),
  },
  {
    method: "PATCH",
    pattern: /^\/tickets\/(\d+)\/status$/,
    roles: ["SUPER_ADMIN", "ADMIN", "EXPEDITEUR", "CLIENT"],
    handler: ({ actor, params, body }) => updateTicketStatus(actor, Number(params[0]), body),
  },
  {
    method: "GET",
    pattern: /^\/payments$/,
    roles: SENDERS,
    handler: ({ actor }) => senderPayments(actor),
  },
  {
    method: "POST",
    pattern: /^\/payments$/,
    roles: SENDERS,
    handler: ({ actor, body }) => createPayment(actor, body),
  },
  {
    method: "PATCH",
    pattern: /^\/payments\/(\d+)\/status$/,
    roles: STAFF,
    handler: ({ actor, params, body }) => updatePaymentStatus(actor, Number(params[0]), body),
  },
  {
    method: "GET",
    pattern: /^\/agencies$/,
    roles: ["SUPER_ADMIN", "ADMIN", "CHEF_AGENCE"],
    handler: () => {
      const store = db();
      return store.agencies
        .map((a) => ({
          ...a,
          userCount: store.users.filter((u) => u.agencyId === a.id).length,
          parcelCount: store.parcels.filter(
            (p) => p.agencyId === a.id && p.status !== "SUPPRIME",
          ).length,
        }))
        .sort((a, b) => a.governorate.localeCompare(b.governorate, "fr"));
    },
  },
  {
    method: "POST",
    pattern: /^\/agencies$/,
    roles: ["SUPER_ADMIN"],
    handler: ({ body }) => {
      const name = str(body.name);
      const governorate = str(body.governorate);
      if (!name || name.length < 2) throw new MockHttpError(400, "Nom invalide");
      if (!governorate) throw new MockHttpError(400, "Gouvernorat requis");
      if (
        db().agencies.some(
          (a) => a.governorate.toLowerCase() === governorate.toLowerCase(),
        )
      ) {
        throw new MockHttpError(409, `Agency for ${governorate} already exists`);
      }
      const agency: Agency = {
        id: nextId(db().agencies),
        name,
        governorate,
        isActive: true,
      };
      db().agencies.push(agency);
      commit();
      return agency;
    },
  },
  {
    method: "PATCH",
    pattern: /^\/agencies\/(\d+)$/,
    roles: ["SUPER_ADMIN"],
    handler: ({ params, body }) => {
      const agency = db().agencies.find((a) => a.id === Number(params[0]));
      if (!agency) throw new MockHttpError(404, "Agency not found");
      if (body.name !== undefined) {
        const name = str(body.name);
        if (!name || name.length < 2) throw new MockHttpError(400, "Nom invalide");
        agency.name = name;
      }
      if (body.governorate !== undefined) {
        const governorate = str(body.governorate);
        if (!governorate) throw new MockHttpError(400, "Gouvernorat requis");
        if (
          db().agencies.some(
            (a) =>
              a.id !== agency.id &&
              a.governorate.toLowerCase() === governorate.toLowerCase(),
          )
        ) {
          throw new MockHttpError(409, `Agency for ${governorate} already exists`);
        }
        agency.governorate = governorate;
      }
      if (body.isActive !== undefined) agency.isActive = Boolean(body.isActive);
      commit();
      return agency;
    },
  },
  {
    method: "DELETE",
    pattern: /^\/agencies\/(\d+)$/,
    roles: ["SUPER_ADMIN"],
    handler: ({ params }) => {
      const id = Number(params[0]);
      const store = db();
      if (!store.agencies.some((a) => a.id === id)) {
        throw new MockHttpError(404, "Agency not found");
      }
      store.agencies = store.agencies.filter((a) => a.id !== id);
      for (const p of store.parcels) {
        if (p.agencyId === id) p.agencyId = null;
      }
      for (const u of store.users) {
        if (u.agencyId === id) u.agencyId = null;
      }
      commit();
      return { id, deleted: true };
    },
  },
  {
    method: "GET",
    pattern: /^\/zones$/,
    roles: ["SUPER_ADMIN", "ADMIN", "CHEF_AGENCE", "EXPEDITEUR", "LIVREUR"],
    handler: ({ actor }) => zonesFor(actor),
  },
  {
    method: "POST",
    pattern: /^\/zones$/,
    roles: ["SUPER_ADMIN", "ADMIN", "EXPEDITEUR"],
    handler: ({ body }) => {
      const zone: MockZone = {
        id: nextId(db().zones),
        name: "",
        governorate: null,
        centerLat: null,
        centerLng: null,
        radiusKm: null,
        isActive: true,
      };
      applyZoneFields(zone, { ...body, name: body.name ?? "" });
      db().zones.push(zone);
      commit();
      return zone;
    },
  },
  {
    method: "PATCH",
    pattern: /^\/zones\/(\d+)$/,
    roles: ["SUPER_ADMIN", "ADMIN", "EXPEDITEUR"],
    handler: ({ params, body }) => {
      const zone = db().zones.find((z) => z.id === Number(params[0]));
      if (!zone) throw new MockHttpError(404, "Zone introuvable");
      applyZoneFields(zone, body);
      commit();
      return zone;
    },
  },
  {
    method: "DELETE",
    pattern: /^\/zones\/(\d+)$/,
    roles: STAFF,
    handler: ({ params }) => {
      const id = Number(params[0]);
      const store = db();
      if (!store.zones.some((z) => z.id === id)) {
        throw new MockHttpError(404, "Zone introuvable");
      }
      store.zones = store.zones.filter((z) => z.id !== id);
      for (const p of store.parcels) {
        if (p.zone?.id === id) {
          p.zone = null;
          p.zoneId = null;
        }
      }
      commit();
      return { id, deleted: true };
    },
  },
  {
    method: "GET",
    pattern: /^\/status-categories$/,
    roles: ALL,
    handler: () =>
      [...db().statusCategories].sort(
        (a, b) => a.sortOrder - b.sortOrder || a.id - b.id,
      ),
  },
  {
    method: "POST",
    pattern: /^\/status-categories$/,
    roles: ["SUPER_ADMIN"],
    handler: ({ body }) => {
      const store = db();
      const key = String(body.key ?? "");
      if (store.statusCategories.some((c) => c.key === key)) {
        throw new MockHttpError(409, `Category ${key} already exists`);
      }
      if (!isStatusCategoryIcon(String(body.icon ?? ""))) {
        throw new MockHttpError(400, "Invalid icon");
      }
      const row: StatusCategory = {
        id: nextId(store.statusCategories),
        key,
        label: String(body.label ?? "").trim(),
        color: String(body.color ?? "#E11D48").toUpperCase(),
        icon: body.icon as StatusCategoryIcon,
        sortOrder:
          typeof body.sortOrder === "number"
            ? body.sortOrder
            : store.statusCategories.length,
        isActive: body.isActive !== false,
      };
      store.statusCategories.push(row);
      commit();
      return row;
    },
  },
  {
    method: "PATCH",
    pattern: /^\/status-categories\/(\d+)$/,
    roles: ["SUPER_ADMIN"],
    handler: ({ params, body }) => {
      const store = db();
      const row = store.statusCategories.find((c) => c.id === Number(params[0]));
      if (!row) throw new MockHttpError(404, "Category not found");
      if (body.key && body.key !== row.key) {
        if (store.statusCategories.some((c) => c.key === body.key)) {
          throw new MockHttpError(409, `Category ${body.key} already exists`);
        }
        row.key = String(body.key);
      }
      if (typeof body.label === "string") row.label = body.label.trim();
      if (typeof body.color === "string") row.color = body.color.toUpperCase();
      if (typeof body.icon === "string") {
        if (!isStatusCategoryIcon(body.icon)) {
          throw new MockHttpError(400, "Invalid icon");
        }
        row.icon = body.icon;
      }
      if (typeof body.sortOrder === "number") row.sortOrder = body.sortOrder;
      if (typeof body.isActive === "boolean") row.isActive = body.isActive;
      commit();
      return row;
    },
  },
  {
    method: "DELETE",
    pattern: /^\/status-categories\/(\d+)$/,
    roles: ["SUPER_ADMIN"],
    handler: ({ params }) => {
      const id = Number(params[0]);
      const store = db();
      if (!store.statusCategories.some((c) => c.id === id)) {
        throw new MockHttpError(404, "Category not found");
      }
      store.statusCategories = store.statusCategories.filter((c) => c.id !== id);
      commit();
      return { id, deleted: true };
    },
  },
  { method: "GET", pattern: /^\/users$/, roles: STAFF, handler: ({ actor }) => usersFor(actor) },
  {
    method: "GET",
    pattern: /^\/users\/livreurs$/,
    roles: STAFF,
    handler: () =>
      db()
        .users.filter((u) => u.role === "LIVREUR" && u.isActive)
        .map((u) => ({ id: u.id, name: u.name, email: u.email, phone: u.phone })),
  },
  {
    method: "POST",
    pattern: /^\/users$/,
    roles: STAFF,
    handler: ({ actor, body }) => createUser(actor, body),
  },
  {
    method: "PATCH",
    pattern: /^\/users\/me$/,
    handler: ({ actor, body }) => updateProfile(actor, body),
  },
  {
    method: "PATCH",
    pattern: /^\/users\/me\/password$/,
    handler: ({ actor, body }) => changePassword(actor, body),
  },
  {
    method: "PATCH",
    pattern: /^\/users\/(\d+)$/,
    roles: STAFF,
    handler: ({ actor, params, body }) =>
      updateUser(actor, Number(params[0]), body),
  },
  {
    method: "PATCH",
    pattern: /^\/users\/(\d+)\/active$/,
    roles: STAFF,
    handler: ({ actor, params, body }) => setUserActive(actor, Number(params[0]), body),
  },
  {
    method: "GET",
    pattern: /^\/dashboard\/status-counts$/,
    roles: ALL,
    handler: ({ actor }) => statusCounts(actor),
  },
  {
    method: "GET",
    pattern: /^\/dashboard\/analytics$/,
    roles: ["SUPER_ADMIN", "ADMIN", "CHEF_AGENCE", "EXPEDITEUR"],
    handler: ({ actor }) => analytics(actor),
  },
  { method: "GET", pattern: /^\/cod$/, roles: STAFF, handler: () => codPayload() },
  {
    method: "POST",
    pattern: /^\/cod\/settle$/,
    roles: STAFF,
    handler: ({ actor, body }) => settleCod(actor, body),
  },
  {
    method: "GET",
    pattern: /^\/notifications$/,
    handler: ({ actor }) => notificationsFor(actor),
  },
  {
    method: "GET",
    pattern: /^\/auth\/me$/,
    handler: ({ actor }) => {
      const user = db().users.find((u) => u.id === actor.id);
      return user ? { ...publicUser(user), portal: PORTAL_BY_ROLE[user.role] } : null;
    },
  },
];

export function mockHandle(
  method: string,
  path: string,
  body: unknown,
  token?: string,
): unknown {
  const clean = path.split("?")[0];
  const payload = record(body);

  if (method === "GET" && clean.startsWith("/parcels/track/")) {
    return trackParcel(decodeURIComponent(clean.replace("/parcels/track/", "")));
  }
  if (method === "POST" && clean === "/auth/signin") {
    return mockSignIn(String(payload.email ?? ""), String(payload.password ?? ""));
  }
  if (method === "POST" && clean === "/auth/signup") return mockSignUp(payload);
  if (method === "POST" && clean === "/auth/refresh") {
    return mockRefresh(String(payload.refreshToken ?? ""));
  }
  if (method === "POST" && clean === "/auth/logout") return undefined;

  for (const route of ROUTES) {
    if (route.method !== method) continue;
    const match = route.pattern.exec(clean);
    if (!match) continue;
    const actor = requireActor(actorFromToken(token), route.roles);
    return route.handler({ actor, params: match.slice(1), body: payload });
  }

  throw new MockHttpError(404, `Fonction non disponible en mode démo (${method} ${clean})`);
}

