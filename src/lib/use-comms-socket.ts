"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { USE_MOCK } from "@/lib/mock-mode";
import { useAuth } from "@/lib/auth-context";
import type { CallSession, ChatMessage } from "@/lib/comms-types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3011";
export const COMMS_CHANNEL = "umbrella-comms";

export type CommsSocketHandlers = {
  onMessageNew?: (payload: {
    conversationId: number;
    message: ChatMessage;
  }) => void;
  onTyping?: (payload: {
    conversationId: number;
    userId: number;
    typing: boolean;
  }) => void;
  onPresence?: (payload: { userId: number; online: boolean }) => void;
  onCallRing?: (call: CallSession) => void;
  onCallStatus?: (call: CallSession) => void;
  onCallOffer?: (payload: {
    callId: number;
    fromUserId: number;
    sdp: RTCSessionDescriptionInit;
  }) => void;
  onCallAnswer?: (payload: {
    callId: number;
    fromUserId: number;
    sdp: RTCSessionDescriptionInit;
  }) => void;
  onCallIce?: (payload: {
    callId: number;
    fromUserId: number;
    candidate: RTCIceCandidateInit | null;
  }) => void;
  onCallHangup?: (payload: { callId: number; fromUserId: number }) => void;
  onCallReject?: (payload: { callId: number; fromUserId: number }) => void;
};

export function useCommsSocket(handlers: CommsSocketHandlers) {
  const { session } = useAuth();
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const emit = useCallback((event: string, payload: unknown) => {
    if (USE_MOCK) {
      try {
        const ch = new BroadcastChannel(COMMS_CHANNEL);
        ch.postMessage({ event, payload, fromUserId: session?.user.id });
        ch.close();
      } catch {
        /* ignore */
      }
      return;
    }
    socketRef.current?.emit(event, payload);
  }, [session?.user.id]);

  useEffect(() => {
    if (!session?.accessToken) {
      setConnected(false);
      return;
    }

    if (USE_MOCK) {
      setConnected(true);
      let channel: BroadcastChannel | null = null;
      try {
        channel = new BroadcastChannel(COMMS_CHANNEL);
        channel.onmessage = (ev: MessageEvent) => {
          const data = ev.data as {
            event: string;
            payload: unknown;
            fromUserId?: number;
          };
          if (data.fromUserId === session.user.id) return;
          const h = handlersRef.current;
          switch (data.event) {
            case "message:new":
              h.onMessageNew?.(data.payload as never);
              break;
            case "typing":
              h.onTyping?.(data.payload as never);
              break;
            case "presence":
              h.onPresence?.(data.payload as never);
              break;
            case "call:ring":
              h.onCallRing?.(data.payload as CallSession);
              break;
            case "call:status":
              h.onCallStatus?.(data.payload as CallSession);
              break;
            case "call:offer":
              h.onCallOffer?.(data.payload as never);
              break;
            case "call:answer":
              h.onCallAnswer?.(data.payload as never);
              break;
            case "call:ice":
              h.onCallIce?.(data.payload as never);
              break;
            case "call:hangup":
              h.onCallHangup?.(data.payload as never);
              break;
            case "call:reject":
              h.onCallReject?.(data.payload as never);
              break;
            default:
              break;
          }
        };
      } catch {
        /* BroadcastChannel unsupported */
      }
      return () => {
        channel?.close();
        setConnected(false);
      };
    }

    const socket = io(`${API_URL}/comms`, {
      auth: { token: session.accessToken },
      transports: ["websocket", "polling"],
      autoConnect: true,
    });
    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("message:new", (p) => handlersRef.current.onMessageNew?.(p));
    socket.on("typing", (p) => handlersRef.current.onTyping?.(p));
    socket.on("presence", (p) => handlersRef.current.onPresence?.(p));
    socket.on("call:ring", (p) => handlersRef.current.onCallRing?.(p));
    socket.on("call:status", (p) => handlersRef.current.onCallStatus?.(p));
    socket.on("call:offer", (p) => handlersRef.current.onCallOffer?.(p));
    socket.on("call:answer", (p) => handlersRef.current.onCallAnswer?.(p));
    socket.on("call:ice", (p) => handlersRef.current.onCallIce?.(p));
    socket.on("call:hangup", (p) => handlersRef.current.onCallHangup?.(p));
    socket.on("call:reject", (p) => handlersRef.current.onCallReject?.(p));

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [session?.accessToken, session?.user.id]);

  return { connected, emit, socket: socketRef };
}
