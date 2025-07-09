import { RTCSessionDescription, RTCIceCandidate } from 'react-native-webrtc';

// Define RTCPeerConnectionState manually since it's not exported by react-native-webrtc
export type RTCPeerConnectionState = 'new' | 'connecting' | 'connected' | 'disconnected' | 'failed' | 'closed';

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
  'offer': { callId: string; offer: RTCSessionDescription; to: string };
  'answer': { callId: string; answer: RTCSessionDescription; to: string };
  'ice-candidate': { callId: string; candidate: RTCIceCandidate; to: string };
  'end-call': { callId: string; to: string };
  'user-joined': { userId: string; socketId: string; totalUsers: number };
  'user-left': { userId: string; callId: string };
  'call-ended': { from: string; callId: string };
}

export interface Technician {
  id: number;
  name: string;
  specialty: string;
}

export interface Expert {
  id: number;
  name: string;
  status: 'online' | 'offline';
}


export type RootStackParamList = {
  Backend: undefined;
  Login: undefined;
  ExpertList: { userId: string; isCaller: boolean; callId: string; recipientId: string };
  VideoCall: { callId: string; userId: string; recipientId: string; isCaller: boolean };
};