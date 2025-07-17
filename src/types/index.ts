export type Technician = {
  id: number;
  name: string;
  specialty: string;
};

export type Expert = {
  id: string;
  name: string;
  status: 'online' | 'offline';
  role: 'Expert';
  avatar?: string;
};

export type RootStackParamList = {
  Backend: undefined;
  Login: undefined;
  Home: { userId: string; role: 'Technician' | 'Expert' };
  WorkOrderDetails: { workOrder: WorkOrder };
  ExpertList: { userId: string; role: 'Technician' | 'Expert' };
  ExpertHome: { userId: string; role: 'Technician' | 'Expert' };
  VideoCall: { userId: string; role: 'Technician' | 'Expert'; callId: string; recipientId: string; isCaller: boolean };
};

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
  'register': { userId: string };
  'call-request': { callId: string; from: string; to: string };
  'call-response': { callId: string; from: string; to: string; accepted: boolean };
  'join-call': { callId: string; userId: string; role: 'Technician' | 'Expert' };
  'offer': { callId: string; offer: RTCSessionDescription; to: string };
  'answer': { callId: string; answer: RTCSessionDescription; to: string };
  'ice-candidate': { callId: string; candidate: RTCIceCandidate; to: string };
  'end-call': { callId: string; to: string };
  'user-joined': { userId: string; role: 'Technician' | 'Expert'; socketId: string; totalUsers: number };
  'user-left': { userId: string; callId: string };
  'call-ended': { from: string; callId: string };
  'annotation': { id: string; text: string; x: number; y: number; from: string; objectId?: string; callId: string };
  'existing-annotations': { annotations: { id: string; text: string; x: number; y: number; from: string; objectId?: string }[] };
}



export interface WorkOrder {
  // Required fields
  wonum: string;
  description: string;
  status: string;
  workorderid: number;
  
  // Optional fields that might be present
  wopriority?: number;
  phone?: string;
  reportedby?: string;
  statusdate?: string;
  siteid?: string;
  woclass?: string;
  woclass_description?: string;
  supervisor?: string;
  actstart?: string;
  owner?: string;
  worktype?: string;
  location?: string;
  actfinish?: string;
  assetnum?: string;
  reportdate?: string;
  changedate?: string;
  changeby?: string;
  orgid?: string;
  parent?: string;
  taskid?: number;
  istask?: boolean;
  template?: boolean;
  downtime?: boolean;
  estlabcost?: number;
  actlabcost?: number;
  estmatcost?: number;
  actmatcost?: number;
  esttoolcost?: number;
  acttoolcost?: number;
  estservcost?: number;
  actservcost?: number;
  estlabhrs?: number;
  actlabhrs?: number;
  estdur?: number;
  glaccount?: string;
  firstapprstatus?: string;
  milestone?: boolean;
  haschildren?: boolean;
  flowcontrolled?: boolean;
  disabled?: boolean;
  interruptible?: boolean;
  status_description?: string;
  _rowstamp?: string;
  href?: string;
}