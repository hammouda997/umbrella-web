export type SavedAddress = {
  id: string;
  label: string;
  contact: string;
  phone: string;
  line: string;
  city: string;
  governorate: string;
  locality: string;
  lat?: number | null;
  lng?: number | null;
  updatedAt: number;
};

const KEY = "umbrella.address-book.v1";

const SEED: SavedAddress[] = [
  {
    id: "seed-1",
    label: "Entrepôt principal",
    contact: "Demo Expéditeur",
    phone: "21000000",
    line: "Zone industrielle Charguia",
    city: "Ariana Ville",
    governorate: "Ariana",
    locality: "",
    updatedAt: Date.now(),
  },
  {
    id: "seed-2",
    label: "Point relais client VIP",
    contact: "Amira Trabelsi",
    phone: "98765432",
    line: "Avenue Habib Bourguiba",
    city: "Ezzahra",
    governorate: "Ben_Arous",
    locality: "",
    updatedAt: Date.now(),
  },
];

export function loadAddressBook(): SavedAddress[] {
  if (typeof window === "undefined") return SEED;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      localStorage.setItem(KEY, JSON.stringify(SEED));
      return SEED;
    }
    const parsed = JSON.parse(raw) as SavedAddress[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : SEED;
  } catch {
    return SEED;
  }
}

export function saveAddressBook(list: SavedAddress[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

export function upsertAddress(entry: Omit<SavedAddress, "updatedAt"> & { updatedAt?: number }) {
  const list = loadAddressBook().filter((a) => a.id !== entry.id);
  const next = [{ ...entry, updatedAt: entry.updatedAt ?? Date.now() }, ...list];
  saveAddressBook(next);
  return next;
}

export function removeAddress(id: string) {
  const next = loadAddressBook().filter((a) => a.id !== id);
  saveAddressBook(next);
  return next;
}
