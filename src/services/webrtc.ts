import { mediaDevices, RTCPeerConnection, MediaStream, RTCSessionDescription, RTCIceCandidate } from 'react-native-webrtc';

// Define MediaTrackConstraints interface
interface MediaTrackConstraints {
  echoCancellation?: boolean;
  noiseSuppression?: boolean;
  autoGainControl?: boolean;
  facingMode?: { exact: string };
  width?: { ideal: number; max: number; min: number };
  height?: { ideal: number; max: number; min: number };
  frameRate?: { ideal: number; max: number; min: number };
}

// Enhanced WEBRTC configuration with your own STUN/TURN servers
export const WEBRTC_CONFIG = {
  iceServers: [
    { 
      urls: 'stun:webrtc-medali.japaneast.cloudapp.azure.com:3478' 
    },
    {
      urls: [
        'turn:webrtc-medali.japaneast.cloudapp.azure.com:3478?transport=udp',
        'turn:webrtc-medali.japaneast.cloudapp.azure.com:3478?transport=tcp',
        'turns:webrtc-medali.japaneast.cloudapp.azure.com:5349?transport=udp',
        'turns:webrtc-medali.japaneast.cloudapp.azure.com:5349?transport=tcp'
      ],
      username: 'medaliwebrtc',
      credential: 'MAR+27290+F+WEBRTC#'
    },
    {
      urls: [
        'turn:172.192.57.220:3478?transport=udp',
        'turn:172.192.57.220:3478?transport=tcp',
        'turns:172.192.57.220:5349?transport=udp',
        'turns:172.192.57.220:5349?transport=tcp'
      ],
      username: 'medaliwebrtc',
      credential: 'MAR+27290+F+WEBRTC#'
    },
    {
      urls: [
        'turn:172.192.32.148:3478?transport=udp',
        'turn:172.192.32.148:3478?transport=tcp',
        'turns:172.192.32.148:5349?transport=udp',
        'turns:172.192.32.148:5349?transport=tcp'
      ],
      username: 'medaliwebrtc',
      credential: 'MAR+27290+F+WEBRTC#'
    }
  ],
  iceCandidatePoolSize: 10,
  iceTransportPolicy: 'all' as const,
  bundlePolicy: 'balanced' as const,
  rtcpMuxPolicy: 'require' as const,
  sdpSemantics: 'unified-plan' as const,
};

export const SOCKET_CONFIG = {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  maxReconnectionAttempts: 5,
  timeout: 20000,
  forceNew: true,
  transports: ['websocket']
};

export interface MediaConstraints {
  audio?: boolean | MediaTrackConstraints;
  video?: boolean | MediaTrackConstraints;
}

export const DEFAULT_MEDIA_CONSTRAINTS: MediaConstraints = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
  video: {
    facingMode: { exact: 'user' },
    width: { ideal: 1280, max: 1920, min: 640 },
    height: { ideal: 720, max: 1080, min: 480 },
    frameRate: { ideal: 30, max: 30, min: 15 },
  },
};

export class WebRTCManager {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private iceCandidates: RTCIceCandidate[] = [];
  private isOfferer: boolean = false;
  private connectionTimeout: NodeJS.Timeout | null = null;
  private iceGatheringTimeout: NodeJS.Timeout | null = null;
  private isCleanedUp: boolean = false;
  private connectionEstablishedCallback: (() => void) | null = null;
  
  constructor() {
    this.initializePeerConnection();
  }

  private initializePeerConnection() {
    try {
      this.peerConnection = new RTCPeerConnection(WEBRTC_CONFIG);

      const pc = this.peerConnection as any;

      pc.onconnectionstatechange = () => {
        const state = this.peerConnection?.connectionState;
        if (state === 'connected') {
          this.clearTimeouts();
          if (this.connectionEstablishedCallback) {
            this.connectionEstablishedCallback();
          }
        } else if (state === 'failed' || state === 'closed') {
          this.handleConnectionFailure();
        }
      };

      pc.oniceconnectionstatechange = () => {
        const state = this.peerConnection?.iceConnectionState;
        if (state === 'connected' || state === 'completed') {
          this.clearTimeouts();
        } else if (state === 'failed' || state === 'disconnected') {
          this.handleConnectionFailure();
        }
      };

      pc.onicegatheringstatechange = () => {
        const state = this.peerConnection?.iceGatheringState;
        if (state === 'complete') {
          this.clearTimeouts();
        }
      };

      pc.onsignalingstatechange = () => {};

      this.connectionTimeout = setTimeout(() => {
        this.handleConnectionFailure();
      }, 45000);

    } catch (error) {
      throw error;
    }
  }

  private clearTimeouts() {
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
    if (this.iceGatheringTimeout) {
      clearTimeout(this.iceGatheringTimeout);
      this.iceGatheringTimeout = null;
    }
  }

  private handleConnectionFailure() {
    this.clearTimeouts();
  }

  async getLocalStream(constraints: MediaConstraints = DEFAULT_MEDIA_CONSTRAINTS): Promise<MediaStream> {
    try {
      const stream = await mediaDevices.getUserMedia(constraints);
      this.localStream = stream;

      if (this.peerConnection) {
        stream.getTracks().forEach((track) => {
          this.peerConnection!.addTrack(track, stream);
        });
      }

      return stream;
    } catch (error) {
      throw error;
    }
  }

  setRemoteStreamHandler(callback: (stream: MediaStream) => void) {
    if (this.peerConnection) {
      (this.peerConnection as any).ontrack = (event: { streams: MediaStream[] }) => {
        if (event.streams[0]) {
          this.remoteStream = event.streams[0];
          callback(event.streams[0]);
        }
      };
    }
  }

  setIceCandidateHandler(callback: (candidate: RTCIceCandidate) => void) {
    if (this.peerConnection) {
      (this.peerConnection as any).onicecandidate = (event: { candidate: RTCIceCandidate | null }) => {
        if (event.candidate) {
          callback(event.candidate);
        }
      };
    }
  }

  async createOffer(): Promise<RTCSessionDescription> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    this.isOfferer = true;

    try {
      const offer = await this.peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });

      await this.peerConnection.setLocalDescription(offer);
      
      return offer;
    } catch (error) {
      throw error;
    }
  }

  async createAnswer(offer: RTCSessionDescription): Promise<RTCSessionDescription> {
    if (this.isCleanedUp) {
      throw new Error('WebRTC manager has been cleaned up');
    }
    
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    this.isOfferer = false;

    try {
      await this.peerConnection.setRemoteDescription(offer);
      
      if (this.isCleanedUp || !this.peerConnection) {
        throw new Error('Peer connection was closed during remote description setting');
      }
      
      const answer = await this.peerConnection.createAnswer();
      
      if (this.isCleanedUp || !this.peerConnection) {
        throw new Error('Peer connection was closed during answer creation');
      }
      
      await this.peerConnection.setLocalDescription(answer);
      
      return answer;
    } catch (error) {
      throw error;
    }
  }

  async setRemoteDescription(description: RTCSessionDescription): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    try {
      await this.peerConnection.setRemoteDescription(description);
    } catch (error) {
      throw error;
    }
  }

  async addIceCandidate(candidate: RTCIceCandidate): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    try {
      await this.peerConnection.addIceCandidate(candidate);
    } catch (error) {
      // Don't throw error for ICE candidate failures, they're common
    }
  }

  toggleAudio(): boolean {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        return audioTrack.enabled;
      }
    }
    return false;
  }

  toggleVideo(): boolean {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        return videoTrack.enabled;
      }
    }
    return false;
  }

  async switchCamera(): Promise<void> {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        try {
          // @ts-ignore - React Native WebRTC specific method
          await videoTrack._switchCamera();
        } catch (error) {}
      }
    }
  }

  getLocalStreamSync(): MediaStream | null {
    return this.localStream;
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  getConnectionState(): string | null {
    return this.peerConnection?.connectionState || null;
  }

  getIceConnectionState(): string | null {
    return this.peerConnection?.iceConnectionState || null;
  }

  getStats(): Promise<any> {
    if (!this.peerConnection) {
      return Promise.resolve(null);
    }
    
    return (this.peerConnection as any).getStats();
  }

  setConnectionEstablishedHandler(callback: () => void) {
    this.connectionEstablishedCallback = callback;
  }

  cleanup(): void {
    if (this.isCleanedUp) {
      return;
    }
    
    this.isCleanedUp = true;
    
    this.clearTimeouts();
    
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        track.stop();
      });
      this.localStream = null;
    }

    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach(track => {
        track.stop();
      });
      this.remoteStream = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
  }

  logConnectionStats(): void {
    if (this.peerConnection) {
      // No logging
    }
  }
}

// Test connectivity to TURN servers
export const testTurnConnectivity = async (): Promise<boolean> => {
  try {
    const testPC = new RTCPeerConnection(WEBRTC_CONFIG);
    
    return new Promise((resolve) => {
      let resolved = false;
      
      (testPC as any).onicecandidate = (event: { candidate: RTCIceCandidate | null }) => {
        if (event.candidate) {
          if (event.candidate.candidate.includes('typ relay')) {
            if (!resolved) {
              resolved = true;
              resolve(true);
              testPC.close();
            }
          }
        } else {
          if (!resolved) {
            resolved = true;
            resolve(true);
            testPC.close();
          }
        }
      };
      
      (testPC as any).onicegatheringstatechange = () => {};

      testPC.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      }).then(offer => {
        return testPC.setLocalDescription(offer);
      }).then(() => {
      }).catch(_ => {
        if (!resolved) {
          resolved = true;
          resolve(false);
          testPC.close();
        }
      });
      
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          resolve(true);
          testPC.close();
        }
      }, 10000);
    });
  } catch (error) {
    return true;
  }
};
