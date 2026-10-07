"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { CallSession, TurnCredentials } from "@/lib/comms-types";
import { useCommsSocket } from "@/lib/use-comms-socket";
import { CallOverlay } from "@/components/CallOverlay";

type CallPhase = "idle" | "outgoing" | "incoming" | "active";

type CallContextValue = {
  phase: CallPhase;
  call: CallSession | null;
  muted: boolean;
  startCall: (conversationId: number) => Promise<void>;
  acceptCall: () => Promise<void>;
  rejectCall: () => Promise<void>;
  hangup: () => Promise<void>;
  toggleMute: () => void;
};

const CallContext = createContext<CallContextValue | null>(null);

export function useCall() {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error("useCall requires CallProvider");
  return ctx;
}

export function CallProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [phase, setPhase] = useState<CallPhase>("idle");
  const [call, setCall] = useState<CallSession | null>(null);
  const [muted, setMuted] = useState(false);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const pendingOfferRef = useRef<RTCSessionDescriptionInit | null>(null);
  const iceQueueRef = useRef<RTCIceCandidateInit[]>([]);
  const peerUserIdRef = useRef<number | null>(null);
  const callIdRef = useRef<number | null>(null);

  const cleanupMedia = useCallback(() => {
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    pendingOfferRef.current = null;
    iceQueueRef.current = [];
    peerUserIdRef.current = null;
    callIdRef.current = null;
    setMuted(false);
  }, []);

  const emitRef = useRef<(event: string, payload: unknown) => void>(() => undefined);

  const ensurePc = useCallback(async (iceServers: RTCIceServer[]) => {
    if (pcRef.current) return pcRef.current;
    const pc = new RTCPeerConnection({ iceServers });
    pcRef.current = pc;
    pc.ontrack = (ev) => {
      const el = remoteAudioRef.current;
      if (el) {
        el.srcObject = ev.streams[0] ?? null;
        void el.play().catch(() => undefined);
      }
    };
    pc.onicecandidate = (ev) => {
      const peerId = peerUserIdRef.current;
      const callId = callIdRef.current;
      if (!peerId || callId == null) return;
      emitRef.current("call:ice", {
        callId,
        toUserId: peerId,
        candidate: ev.candidate ? ev.candidate.toJSON() : null,
      });
    };
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    localStreamRef.current = stream;
    for (const track of stream.getAudioTracks()) {
      pc.addTrack(track, stream);
    }
    return pc;
  }, []);

  const hangup = useCallback(async () => {
    const active = call;
    const peerId = peerUserIdRef.current;
    if (active && session) {
      try {
        await apiFetch(`/calls/${active.id}`, {
          method: "PATCH",
          token: session.accessToken,
          body: JSON.stringify({ status: "ENDED" }),
        });
      } catch {
        /* ignore */
      }
      if (peerId) {
        emitRef.current("call:hangup", { callId: active.id, toUserId: peerId });
      }
    }
    cleanupMedia();
    setCall(null);
    setPhase("idle");
  }, [call, cleanupMedia, session]);

  const { emit } = useCommsSocket({
    onCallRing: (incoming) => {
      if (!session || incoming.calleeId !== session.user.id) return;
      if (phase !== "idle") return;
      setCall(incoming);
      setPhase("incoming");
      peerUserIdRef.current = incoming.callerId;
    },
    onCallOffer: async (payload) => {
      pendingOfferRef.current = payload.sdp;
      if (phase === "active" || phase === "incoming") {
        /* answer applied on accept */
      }
    },
    onCallAnswer: async (payload) => {
      const pc = pcRef.current;
      if (!pc) return;
      await pc.setRemoteDescription(payload.sdp);
      for (const c of iceQueueRef.current) {
        if (c) await pc.addIceCandidate(c).catch(() => undefined);
      }
      iceQueueRef.current = [];
      setPhase("active");
      if (call && session) {
        void apiFetch(`/calls/${call.id}`, {
          method: "PATCH",
          token: session.accessToken,
          body: JSON.stringify({ status: "ACTIVE" }),
        });
      }
    },
    onCallIce: async (payload) => {
      const pc = pcRef.current;
      if (!pc || !pc.remoteDescription) {
        if (payload.candidate) iceQueueRef.current.push(payload.candidate);
        return;
      }
      if (payload.candidate) {
        await pc.addIceCandidate(payload.candidate).catch(() => undefined);
      }
    },
    onCallHangup: () => {
      cleanupMedia();
      setCall(null);
      setPhase("idle");
    },
    onCallReject: () => {
      cleanupMedia();
      setCall(null);
      setPhase("idle");
    },
    onCallStatus: (updated) => {
      setCall(updated);
      if (
        updated.status === "ENDED" ||
        updated.status === "REJECTED" ||
        updated.status === "MISSED"
      ) {
        cleanupMedia();
        setPhase("idle");
        setCall(null);
      } else if (updated.status === "ACTIVE") {
        setPhase("active");
      }
    },
  });

  useEffect(() => {
    emitRef.current = emit;
  }, [emit]);

  const startCall = useCallback(
    async (conversationId: number) => {
      if (!session || phase !== "idle") return;
      const created = await apiFetch<CallSession>("/calls", {
        method: "POST",
        token: session.accessToken,
        body: JSON.stringify({ conversationId }),
      });
      setCall(created);
      setPhase("outgoing");
      peerUserIdRef.current = created.calleeId;
      callIdRef.current = created.id;

      const turn = await apiFetch<TurnCredentials>("/calls/turn-credentials", {
        token: session.accessToken,
      });
      const pc = await ensurePc(turn.iceServers);
      const offer = await pc.createOffer({ offerToReceiveAudio: true });
      await pc.setLocalDescription(offer);
      emit("call:offer", {
        callId: created.id,
        toUserId: created.calleeId,
        sdp: offer,
      });
    },
    [emit, ensurePc, phase, session],
  );

  const acceptCall = useCallback(async () => {
    if (!session || !call || phase !== "incoming") return;
    peerUserIdRef.current = call.callerId;
    callIdRef.current = call.id;
    const turn = await apiFetch<TurnCredentials>("/calls/turn-credentials", {
      token: session.accessToken,
    });
    const pc = await ensurePc(turn.iceServers);
    const offer = pendingOfferRef.current;
    if (offer) {
      await pc.setRemoteDescription(offer);
      pendingOfferRef.current = null;
    }
    for (const c of iceQueueRef.current) {
      if (c) await pc.addIceCandidate(c).catch(() => undefined);
    }
    iceQueueRef.current = [];
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    emit("call:answer", {
      callId: call.id,
      toUserId: call.callerId,
      sdp: answer,
    });
    await apiFetch(`/calls/${call.id}`, {
      method: "PATCH",
      token: session.accessToken,
      body: JSON.stringify({ status: "ACTIVE" }),
    });
    setPhase("active");
  }, [call, emit, ensurePc, phase, session]);

  const rejectCall = useCallback(async () => {
    if (!session || !call) return;
    const peerId = call.callerId;
    try {
      await apiFetch(`/calls/${call.id}`, {
        method: "PATCH",
        token: session.accessToken,
        body: JSON.stringify({ status: "REJECTED" }),
      });
    } catch {
      /* ignore */
    }
    emit("call:reject", { callId: call.id, toUserId: peerId });
    cleanupMedia();
    setCall(null);
    setPhase("idle");
  }, [call, cleanupMedia, emit, session]);

  const toggleMute = useCallback(() => {
    const tracks = localStreamRef.current?.getAudioTracks() ?? [];
    const next = !muted;
    for (const t of tracks) t.enabled = !next;
    setMuted(next);
  }, [muted]);

  const value = useMemo(
    () => ({
      phase,
      call,
      muted,
      startCall,
      acceptCall,
      rejectCall,
      hangup,
      toggleMute,
    }),
    [phase, call, muted, startCall, acceptCall, rejectCall, hangup, toggleMute],
  );

  const peer =
    call && session
      ? call.callerId === session.user.id
        ? call.callee
        : call.caller
      : null;

  return (
    <CallContext.Provider value={value}>
      {children}
      <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />
      <CallOverlay
        phase={phase}
        peer={peer}
        muted={muted}
        onAccept={() => void acceptCall()}
        onReject={() => void rejectCall()}
        onHangup={() => void hangup()}
        onToggleMute={toggleMute}
      />
    </CallContext.Provider>
  );
}
