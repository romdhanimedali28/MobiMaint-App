export interface CallState {
    isConnecting: boolean;
    isConnected: boolean;
    isCallActive: boolean;
    startTime: number | null;
    duration: number;
    micEnabled: boolean;
    cameraEnabled: boolean;
    connectionState: RTCPeerConnectionState | null;
  }
  
  export interface CallParams {
    callId: string;
    recipientId: string;
    userId: string;
    isCaller: boolean;
  }
  
  export interface SocketEvents {
    'join-call': { callId: string; userId: string };
    'offer': { callId: string; offer: RTCSessionDescriptionInit; to: string };
    'answer': { callId: string; answer: RTCSessionDescriptionInit; to: string };
    'ice-candidate': { callId: string; candidate: RTCIceCandidateInit; to: string };
    'end-call': { callId: string; to: string };
    'user-joined': { userId: string; socketId: string; totalUsers: number };
    'user-left': { userId: string; callId: string };
    'call-ended': { from: string; callId: string };
  }