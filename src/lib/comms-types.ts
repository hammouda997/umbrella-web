import type { AppRole } from "@/lib/roles";

export type CommsPerson = {
  id: number;
  name: string;
  email: string;
  role: AppRole;
  phone?: string | null;
};

export type ChatMessage = {
  id: number;
  body: string;
  createdAt: string;
  senderId: number;
  sender?: CommsPerson;
  conversationId?: number;
};

export type ConversationSummary = {
  id: number;
  parcelId?: number | null;
  parcel?: { id: number; code: string | null } | null;
  peer: CommsPerson | null;
  lastMessage: ChatMessage | null;
  lastMessageAt?: string | null;
  unread: number;
  updatedAt: string;
};

export type CallSession = {
  id: number;
  conversationId: number;
  callerId: number;
  calleeId: number;
  status: "RINGING" | "ACTIVE" | "ENDED" | "MISSED" | "REJECTED";
  startedAt?: string | null;
  endedAt?: string | null;
  caller?: CommsPerson;
  callee?: CommsPerson;
};

export type TurnCredentials = {
  iceServers: RTCIceServer[];
  ttl: number;
};
