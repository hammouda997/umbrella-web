import type { AppRole } from "@/lib/roles";
import type { StatusCard } from "@/lib/api";
import { STATUS_ORDER } from "@/lib/portal-nav";
import { STATUS_META } from "@/lib/status-meta";

export type MockUser = {
  id: number;
  name: string;
  email: string;
  role: AppRole;
  phone: string;
  password: string;
  isActive: boolean;
};

export type MockParcel = {
  id: number;
  code: string;
  recipientName: string;
  phone: string;
  phone2?: string | null;
  governorate: string;
  city: string;
  address: string;
  price: number;
  notes: string | null;
  designation?: string | null;
  status: string;
  mode: "EXTERNAL" | "INTERNAL";
  bordereauUrl: string | null;
  createdAt: string;
  senderId: number;
  driverId?: number | null;
  driver?: { id: number; name: string } | null;
  zone?: { id: number; name: string } | null;
  timeline?: Array<{ at: string; label: string }>;
  tryProduct?: boolean;
  liabilityAcceptedAt?: string | null;
};

export type MockTicket = {
  id: number;
  title: string;
  description: string | null;
  status: "EN_COURS" | "RESOLU" | "FERME";
  createdAt: string;
  parcel?: { id: number; code: string | null } | null;
  createdBy?: { id: number; name: string; email: string };
};

export type MockPayment = {
  id: number;
  amount: number;
  status: "EN_DEMANDE" | "APPROUVE" | "PAYE" | "REJETE";
  note: string | null;
  createdAt: string;
  sender?: { name: string; email: string };
  items: Array<{ parcel: { id: number; code: string | null }; amount: number }>;
};

export type MockZone = {
  id: number;
  name: string;
  governorate: string | null;
  centerLat: number | null;
  centerLng: number | null;
  radiusKm: number | null;
  isActive: boolean;
};

export const MOCK_USERS: MockUser[] = [
  {
    id: 1,
    name: "Super Admin",
    email: "super@umbrella.tn",
    role: "SUPER_ADMIN",
    phone: "20000001",
    password: "Super@12345",
    isActive: true,
  },
  {
    id: 2,
    name: "Umbrella Admin",
    email: "admin@umbrella.tn",
    role: "ADMIN",
    phone: "20000000",
    password: "Admin@12345",
    isActive: true,
  },
  {
    id: 3,
    name: "Demo Expéditeur",
    email: "expediteur@umbrella.tn",
    role: "EXPEDITEUR",
    phone: "21000000",
    password: "Expediteur@12345",
    isActive: true,
  },
  {
    id: 4,
    name: "Demo Livreur",
    email: "livreur@umbrella.tn",
    role: "LIVREUR",
    phone: "22000000",
    password: "Livreur@12345",
    isActive: true,
  },
  {
    id: 5,
    name: "Demo Client",
    email: "client@umbrella.tn",
    role: "CLIENT",
    phone: "51971675",
    password: "Client@12345",
    isActive: true,
  },
  {
    id: 6,
    name: "Karim Ben Salah",
    email: "livreur2@umbrella.tn",
    role: "LIVREUR",
    phone: "22000001",
    password: "Livreur@12345",
    isActive: true,
  },
];

const day = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() - offset);
  return d.toISOString();
};

export const MOCK_ZONES: MockZone[] = [
  {
    id: 1,
    name: "Grand Tunis",
    governorate: "Tunis",
    centerLat: 36.8065,
    centerLng: 10.1815,
    radiusKm: 25,
    isActive: true,
  },
  {
    id: 2,
    name: "Sahel",
    governorate: "Sousse",
    centerLat: 35.8254,
    centerLng: 10.6369,
    radiusKm: 40,
    isActive: true,
  },
  {
    id: 3,
    name: "Sfax Métropole",
    governorate: "Sfax",
    centerLat: 34.7478,
    centerLng: 10.7662,
    radiusKm: 30,
    isActive: true,
  },
];

export const MOCK_PARCELS: MockParcel[] = [
  {
    id: 1,
    code: "UMB-ATT-001",
    recipientName: "Demo Client",
    phone: "51971675",
    governorate: "Ariana",
    city: "Ariana",
    address: "Cité Ennasr 2",
    price: 49.9,
    notes: "Parfum",
    designation: "Parfum",
    status: "EN_ATTENTE",
    mode: "EXTERNAL",
    bordereauUrl: "https://example.com/bordereau.pdf",
    createdAt: day(1),
    senderId: 3,
    timeline: [
      { at: day(1), label: "Colis créé" },
      { at: day(1), label: "En attente d'enlèvement" },
    ],
  },
  {
    id: 2,
    code: "UMB-COURS-001",
    recipientName: "Demo Client",
    phone: "51971675",
    governorate: "Tunis",
    city: "Tunis",
    address: "Avenue Habib Bourguiba 12",
    price: 55,
    notes: "Livres",
    designation: "Livres",
    status: "EN_COURS",
    mode: "INTERNAL",
    bordereauUrl: null,
    createdAt: day(0),
    senderId: 3,
    driverId: 4,
    driver: { id: 4, name: "Demo Livreur" },
    zone: { id: 1, name: "Grand Tunis" },
    timeline: [
      { at: day(2), label: "Colis créé" },
      { at: day(1), label: "Enlevé" },
      { at: day(0), label: "En cours de livraison" },
    ],
  },
  {
    id: 3,
    code: "UMB-LIV-001",
    recipientName: "Demo Client",
    phone: "51971675",
    governorate: "Tunis",
    city: "La Marsa",
    address: "Corniche",
    price: 45.5,
    notes: "Demo paiement",
    designation: "Accessoires",
    status: "LIVRES",
    mode: "INTERNAL",
    bordereauUrl: null,
    createdAt: day(4),
    senderId: 3,
    driverId: 4,
    driver: { id: 4, name: "Demo Livreur" },
    zone: { id: 1, name: "Grand Tunis" },
    timeline: [
      { at: day(5), label: "Colis créé" },
      { at: day(4), label: "Livré" },
    ],
  },
  {
    id: 4,
    code: "UMB-ENL-001",
    recipientName: "Amira Trabelsi",
    phone: "98765432",
    governorate: "Ben Arous",
    city: "Ezzahra",
    address: "Avenue Habib Bourguiba",
    price: 28,
    notes: "Vêtements",
    status: "A_ENLEVER",
    mode: "INTERNAL",
    bordereauUrl: null,
    createdAt: day(2),
    senderId: 3,
    driverId: 4,
    driver: { id: 4, name: "Demo Livreur" },
    zone: { id: 1, name: "Grand Tunis" },
  },
  {
    id: 5,
    code: "UMB-ECH-001",
    recipientName: "Demo Client",
    phone: "51971675",
    governorate: "Mahdia",
    city: "Ksour Essaf",
    address: "Rue 54 Amilcar",
    price: 22,
    notes: "Échange taille",
    status: "ECHANGES",
    mode: "INTERNAL",
    bordereauUrl: null,
    createdAt: day(6),
    senderId: 3,
    driverId: 4,
    driver: { id: 4, name: "Demo Livreur" },
  },
  {
    id: 6,
    code: "UMB-DEP-001",
    recipientName: "Hedi Mansouri",
    phone: "98765432",
    governorate: "Sfax",
    city: "Sfax",
    address: "Route de Gabès km 3",
    price: 95,
    notes: "Pièces auto",
    status: "AU_DEPOT",
    mode: "INTERNAL",
    bordereauUrl: null,
    createdAt: day(3),
    senderId: 3,
    driverId: 6,
    driver: { id: 6, name: "Karim Ben Salah" },
    zone: { id: 3, name: "Sfax Métropole" },
  },
  {
    id: 7,
    code: "UMB-EXT-001",
    recipientName: "Sami Gharbi",
    phone: "51971675",
    governorate: "Sousse",
    city: "Sousse",
    address: "Boulevard 14 Janvier",
    price: 120,
    notes: "Tablette",
    status: "AU_DEPOT",
    mode: "EXTERNAL",
    bordereauUrl: "https://example.com/bordereau-ext.pdf",
    createdAt: day(2),
    senderId: 3,
  },
  {
    id: 8,
    code: "UMB-RET-001",
    recipientName: "Inconnu",
    phone: "50001122",
    governorate: "Kairouan",
    city: "Kairouan",
    address: "Adresse incomplete",
    price: 40,
    notes: "Retour",
    status: "RETOUR_DEFINITIF",
    mode: "EXTERNAL",
    bordereauUrl: null,
    createdAt: day(10),
    senderId: 3,
  },
  {
    id: 9,
    code: "UMB-LIVP-001",
    recipientName: "Demo Client",
    phone: "51971675",
    governorate: "Ariana",
    city: "Raoued",
    address: "Route de Bizerte",
    price: 67,
    notes: "Cosmétiques",
    status: "LIVRES_PAYES",
    mode: "EXTERNAL",
    bordereauUrl: null,
    createdAt: day(8),
    senderId: 3,
  },
  {
    id: 10,
    code: "UMB-VERIF-001",
    recipientName: "Nour Ben Ali",
    phone: "51971675",
    governorate: "Bizerte",
    city: "Bizerte",
    address: "Avenue Habib Thameur",
    price: 88,
    notes: "Montre",
    status: "A_VERIFIER",
    mode: "EXTERNAL",
    bordereauUrl: null,
    createdAt: day(5),
    senderId: 3,
  },
];

export const MOCK_TICKETS: MockTicket[] = [
  {
    id: 1,
    title: "Colis endommagé à la livraison",
    description: "Le carton était ouvert.",
    status: "EN_COURS",
    createdAt: day(1),
    parcel: { id: 3, code: "UMB-LIV-001" },
    createdBy: { id: 5, name: "Demo Client", email: "client@umbrella.tn" },
  },
  {
    id: 2,
    title: "Retard de livraison Sahel",
    description: "Client relance depuis 48h.",
    status: "EN_COURS",
    createdAt: day(2),
    parcel: { id: 2, code: "UMB-COURS-001" },
    createdBy: {
      id: 3,
      name: "Demo Expéditeur",
      email: "expediteur@umbrella.tn",
    },
  },
  {
    id: 3,
    title: "Changement d’adresse",
    description: "Passer à Cité Ennasr.",
    status: "RESOLU",
    createdAt: day(4),
    parcel: { id: 1, code: "UMB-ATT-001" },
    createdBy: { id: 5, name: "Demo Client", email: "client@umbrella.tn" },
  },
];

export const MOCK_PAYMENTS: MockPayment[] = [
  {
    id: 1,
    amount: 100.5,
    status: "EN_DEMANDE",
    note: "Demande COD",
    createdAt: day(1),
    sender: { name: "Demo Expéditeur", email: "expediteur@umbrella.tn" },
    items: [
      { parcel: { id: 3, code: "UMB-LIV-001" }, amount: 45.5 },
      { parcel: { id: 9, code: "UMB-LIVP-001" }, amount: 55 },
    ],
  },
  {
    id: 2,
    amount: 67,
    status: "PAYE",
    note: "Déjà réglé",
    createdAt: day(7),
    sender: { name: "Demo Expéditeur", email: "expediteur@umbrella.tn" },
    items: [{ parcel: { id: 9, code: "UMB-LIVP-001" }, amount: 67 }],
  },
  {
    id: 3,
    amount: 95,
    status: "APPROUVE",
    note: "En attente versement",
    createdAt: day(2),
    sender: { name: "Demo Expéditeur", email: "expediteur@umbrella.tn" },
    items: [{ parcel: { id: 6, code: "UMB-DEP-001" }, amount: 95 }],
  },
];

export function mockSignIn(email: string, password: string) {
  const user = MOCK_USERS.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password,
  );
  if (!user) throw new Error("Identifiants invalides (mode démo)");
  const { password: _p, isActive, ...safe } = user;
  void _p;
  void isActive;
  return {
    accessToken: `mock-access-${user.id}`,
    refreshToken: `mock-refresh-${user.id}`,
    portal:
      user.role === "SUPER_ADMIN"
        ? "/super-admin"
        : user.role === "ADMIN"
          ? "/admin"
          : user.role === "EXPEDITEUR"
            ? "/expediteur"
            : user.role === "LIVREUR"
              ? "/livreur"
              : "/client",
    user: {
      id: safe.id,
      name: safe.name,
      email: safe.email,
      role: safe.role,
      phone: safe.phone,
    },
  };
}

export function mockStatusCounts(role: AppRole, userId: number): StatusCard[] {
  let list = MOCK_PARCELS;
  if (role === "EXPEDITEUR") list = list.filter((p) => p.senderId === userId);
  if (role === "LIVREUR") list = list.filter((p) => p.driverId === userId);
  if (role === "CLIENT") {
    const phone = MOCK_USERS.find((u) => u.id === userId)?.phone;
    list = list.filter((p) => p.phone === phone);
  }
  const map = new Map<string, number>();
  for (const p of list) map.set(p.status, (map.get(p.status) ?? 0) + 1);
  return STATUS_ORDER.map((key) => ({
    key,
    label: STATUS_META[key].label,
    tone: "custom",
    count: map.get(key) ?? 0,
  }));
}

export function mockAnalytics(role?: AppRole, userId?: number) {
  let list = [...MOCK_PARCELS];
  if (role === "EXPEDITEUR" && userId) {
    list = list.filter((p) => p.senderId === userId);
  }

  const total = list.length;
  const external = list.filter((p) => p.mode === "EXTERNAL").length;
  const internal = total - external;
  const delivered = list.filter((p) =>
    ["LIVRES", "LIVRES_PAYES"].includes(p.status),
  ).length;
  const awaiting = list.filter((p) => p.status === "EN_ATTENTE").length;
  const inProgress = list.filter((p) =>
    ["EN_COURS", "AU_DEPOT", "A_ENLEVER", "ENLEVES"].includes(p.status),
  ).length;
  const returns = list.filter((p) => p.status.startsWith("RETOUR")).length;
  const exchanges = list.filter((p) => p.status === "ECHANGES").length;
  const revenue = list.reduce((s, p) => s + p.price, 0);
  const encaisse = list
    .filter((p) => ["LIVRES", "LIVRES_PAYES"].includes(p.status))
    .reduce((s, p) => s + p.price, 0);
  const retoursMontant = list
    .filter((p) => p.status.startsWith("RETOUR"))
    .reduce((s, p) => s + p.price, 0);

  const payments =
    role === "EXPEDITEUR"
      ? MOCK_PAYMENTS.filter(
          (p) => p.sender?.email === "expediteur@umbrella.tn",
        )
      : MOCK_PAYMENTS;

  const enDemande = payments
    .filter((p) => p.status === "EN_DEMANDE")
    .reduce((s, p) => s + p.amount, 0);
  const aVerser = payments
    .filter((p) => p.status === "APPROUVE")
    .reduce((s, p) => s + p.amount, 0);
  const verse = payments
    .filter((p) => p.status === "PAYE")
    .reduce((s, p) => s + p.amount, 0);
  const retoursFrais = Math.round(returns * 7 * 100) / 100;
  const disponible = Math.max(0, encaisse - enDemande - aVerser - verse);

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().slice(0, 10);
    const dayParcels = list.filter((p) => p.createdAt.startsWith(key));
    const fallbackTotal =
      role === "EXPEDITEUR" ? (i % 3 === 0 ? 1 : 0) : i % 3 === 0 ? 2 : 1;
    return {
      date: key,
      label: key.slice(5),
      total: dayParcels.length || fallbackTotal,
      delivered: Math.min(
        1,
        dayParcels.filter((p) =>
          ["LIVRES", "LIVRES_PAYES"].includes(p.status),
        ).length,
      ),
      external:
        dayParcels.filter((p) => p.mode === "EXTERNAL").length ||
        (i % 2 === 0 ? 1 : 0),
      internal:
        dayParcels.filter((p) => p.mode === "INTERNAL").length ||
        (i % 2 === 1 ? 1 : 0),
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
    soldes: {
      disponible,
      enDemande,
      aVerser,
      verse,
      encaisse,
      retoursMontant,
      retoursFrais,
    },
    last7Days,
  };
}

export function mockHandle(
  method: string,
  path: string,
  body?: unknown,
  userId?: number,
  role?: AppRole,
): unknown | null {
  const clean = path.split("?")[0];

  if (method === "GET" && clean === "/parcels") {
    let list = [...MOCK_PARCELS];
    if (role === "EXPEDITEUR" && userId)
      list = list.filter((p) => p.senderId === userId);
    if (role === "LIVREUR" && userId)
      list = list.filter((p) => p.driverId === userId);
    if (role === "CLIENT" && userId) {
      const phone = MOCK_USERS.find((u) => u.id === userId)?.phone;
      list = list.filter((p) => p.phone === phone);
    }
    return list;
  }

  if (method === "GET" && clean.startsWith("/parcels/track/")) {
    const code = decodeURIComponent(clean.replace("/parcels/track/", ""));
    const p = MOCK_PARCELS.find((x) => x.code === code);
    if (!p) throw new Error("Parcel not found");
    const name = p.recipientName;
    return {
      code: p.code,
      status: p.status,
      recipientName: `${name[0]}${"*".repeat(5)}`,
      city: p.city,
      governorate: p.governorate,
      updatedAt: p.createdAt,
      timeline: p.timeline ?? [{ at: p.createdAt, label: "Colis créé" }],
    };
  }

  if (method === "GET" && /^\/parcels\/\d+$/.test(clean)) {
    const id = Number(clean.split("/")[2]);
    return MOCK_PARCELS.find((p) => p.id === id) ?? null;
  }

  if (method === "GET" && clean === "/tickets") return MOCK_TICKETS;
  if (method === "GET" && clean === "/payments") return MOCK_PAYMENTS;
  if (method === "GET" && clean === "/zones") return MOCK_ZONES;
  if (method === "GET" && clean === "/users") return MOCK_USERS.map(({ password: _pw, ...u }) => {
    void _pw;
    return u;
  });
  if (method === "GET" && clean === "/users/livreurs")
    return MOCK_USERS.filter((u) => u.role === "LIVREUR").map(
      ({ password: _pw, ...u }) => {
        void _pw;
        return { id: u.id, name: u.name, email: u.email };
      },
    );

  if (method === "GET" && clean === "/dashboard/status-counts" && role && userId)
    return mockStatusCounts(role, userId);

  if (method === "GET" && clean === "/dashboard/analytics")
    return mockAnalytics(role, userId);

  if (method === "POST" && clean === "/parcels") {
    const dto = body as Record<string, unknown>;
    const created: MockParcel = {
      id: MOCK_PARCELS.length + 1,
      code: `UMB-NEW-${Date.now().toString().slice(-6)}`,
      recipientName: String(dto.recipientName ?? "Nouveau"),
      phone: String(dto.phone ?? ""),
      governorate: String(dto.governorate ?? ""),
      city: String(dto.city ?? ""),
      address: String(dto.address ?? ""),
      price: Number(dto.price ?? 0),
      notes: dto.notes ? String(dto.notes) : null,
      designation: dto.designation ? String(dto.designation) : null,
      status: "EN_ATTENTE",
      mode: (dto.mode as "EXTERNAL" | "INTERNAL") ?? "EXTERNAL",
      bordereauUrl: null,
      createdAt: new Date().toISOString(),
      senderId: userId ?? 3,
      tryProduct: Boolean(dto.tryProduct ?? dto.allowOpen),
      liabilityAcceptedAt: dto.liabilityAcceptedAt
        ? String(dto.liabilityAcceptedAt)
        : null,
    };
    MOCK_PARCELS.unshift(created);
    return created;
  }

  if (method === "POST" && clean === "/tickets") {
    const dto = body as Record<string, unknown>;
    const t: MockTicket = {
      id: MOCK_TICKETS.length + 1,
      title: String(dto.title ?? "Ticket"),
      description: dto.description ? String(dto.description) : null,
      status: "EN_COURS",
      createdAt: new Date().toISOString(),
    };
    MOCK_TICKETS.unshift(t);
    return t;
  }

  if (method === "POST" && (clean === "/zones" || clean === "/users" || clean === "/payments")) {
    return { ok: true, mock: true };
  }

  if (method === "PATCH" && /^\/parcels\/\d+\/status$/.test(clean)) {
    const id = Number(clean.split("/")[2]);
    const parcel = MOCK_PARCELS.find((p) => p.id === id);
    if (!parcel) throw new Error("Parcel not found");
    if (role === "LIVREUR" && userId && parcel.driverId !== userId) {
      throw new Error("Forbidden");
    }
    const dto = (body ?? {}) as Record<string, unknown>;
    const nextStatus = String(dto.status ?? parcel.status);
    const comment = dto.comment ? String(dto.comment) : null;
    parcel.status = nextStatus;
    const label =
      comment != null && comment.length > 0
        ? `${nextStatus.replace(/_/g, " ")} — ${comment}`
        : `Statut → ${nextStatus.replace(/_/g, " ")}`;
    parcel.timeline = [
      ...(parcel.timeline ?? []),
      { at: new Date().toISOString(), label },
    ];
    return parcel;
  }

  if (method === "PATCH" && /^\/parcels\/\d+\/assign$/.test(clean)) {
    const id = Number(clean.split("/")[2]);
    const parcel = MOCK_PARCELS.find((p) => p.id === id);
    if (!parcel) throw new Error("Parcel not found");
    const dto = (body ?? {}) as Record<string, unknown>;
    const driverId = Number(dto.driverId);
    const driver = MOCK_USERS.find((u) => u.id === driverId);
    parcel.driverId = driverId;
    parcel.driver = driver
      ? { id: driver.id, name: driver.name }
      : parcel.driver;
    parcel.status = "A_ENLEVER";
    return parcel;
  }

  if (method === "PATCH" || method === "DELETE") {
    return { ok: true, mock: true };
  }

  if (method === "POST" && clean === "/parcels/sync-external") {
    return { checked: MOCK_PARCELS.filter((p) => p.mode === "EXTERNAL").length, updated: 1 };
  }

  return null;
}
