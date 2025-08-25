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

// Enhanced WEBRTC configuration with multiple TURN servers
export const WEBRTC_CONFIG = {
  iceServers: [
    // Google STUN servers
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },

    
    { urls: 'turn:speed.cloudflare.com:50000',
      username: 'f06e89a6870819f7334046349af683f75946d7e9ffd5ffc1b3bdb3e288f42e9799cc4beacec107d0240ecb7f3dfa036f213c3aec6acd2b25a4459b7f6e1c66ea', 
      credential: 'aba9b169546eb6dcc7bfb1cdf34544cf95b5161d602e3b5fa7c8342b2e9802fb' },
    // {
    //   urls: 'turn:openrelay.metered.ca:80',
    //   username: 'openrelayproject',
    //   credential: 'openrelayproject'
    // },
    // {
    //   urls: 'turn:openrelay.metered.ca:443',
    //   username: 'openrelayproject',
    //   credential: 'openrelayproject'
    // },
    // {
    //   urls: 'turn:openrelay.metered.ca:443?transport=tcp',
    //   username: 'openrelayproject',
    //   credential: 'openrelayproject'
    // },
    
    // // Alternative TURN servers for better connectivity
    // {
    //   urls: 'turn:a.relay.metered.ca:80',
    //   username: 'a1f9c5ce691b0ef52cbbf8c6',
    //   credential: 'sPNCDHRaO1LzfpGm'
    // },
    // {
    //   urls: 'turn:a.relay.metered.ca:80?transport=tcp',
    //   username: 'a1f9c5ce691b0ef52cbbf8c6',
    //   credential: 'sPNCDHRaO1LzfpGm'
    // },
    // {
    //   urls: 'turn:a.relay.metered.ca:443',
    //   username: 'a1f9c5ce691b0ef52cbbf8c6',
    //   credential: 'sPNCDHRaO1LzfpGm'
    // },
    // {
    //   urls: 'turn:a.relay.metered.ca:443?transport=tcp',
    //   username: 'a1f9c5ce691b0ef52cbbf8c6',
    //   credential: 'sPNCDHRaO1LzfpGm'
    // },
    
   
  ],
  iceCandidatePoolSize: 10,
  iceTransportPolicy: 'all' as const, // Explicitly use literal type
  bundlePolicy: 'balanced' as const, // Explicitly use literal type
  rtcpMuxPolicy: 'require' as const, // Explicitly use literal type
  sdpSemantics: 'unified-plan' as const, // Explicitly use literal type
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
  
  constructor() {
    this.initializePeerConnection();
  }

  private initializePeerConnection() {
    try {
      this.peerConnection = new RTCPeerConnection(WEBRTC_CONFIG);
      console.log('PeerConnection created with config:', WEBRTC_CONFIG);

      // Type assertion to bypass missing TypeScript definitions
      const pc = this.peerConnection as any;

      // Connection state change handler
      pc.onconnectionstatechange = () => {
        const state = this.peerConnection?.connectionState;
        console.log('Connection state changed:', state);
        
        if (state === 'connected') {
          console.log('WebRTC connection established successfully');
          this.clearTimeouts();
        } else if (state === 'failed' || state === 'closed') {
          console.log('WebRTC connection failed or closed');
          this.handleConnectionFailure();
        }
      };

      // ICE connection state change handler
      pc.oniceconnectionstatechange = () => {
        const state = this.peerConnection?.iceConnectionState;
        console.log('ICE connection state changed:', state);
        
        if (state === 'connected' || state === 'completed') {
          console.log('ICE connection established');
          this.clearTimeouts();
        } else if (state === 'failed' || state === 'disconnected') {
          console.log('ICE connection failed or disconnected');
          this.handleConnectionFailure();
        }
      };

      // ICE gathering state change handler
      pc.onicegatheringstatechange = () => {
        const state = this.peerConnection?.iceGatheringState;
        console.log('ICE gathering state changed:', state);
        
        if (state === 'complete') {
          console.log('ICE gathering completed');
          this.clearTimeouts();
        }
      };

      // Set connection timeout
      this.connectionTimeout = setTimeout(() => {
        console.log('Connection timeout reached');
        this.handleConnectionFailure();
      }, 30000); // 30 seconds timeout

    } catch (error) {
      console.error('Error initializing peer connection:', error);
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
    console.log('Handling connection failure, attempting to restart ICE');
    if (this.peerConnection) {
      try {
        // Restart ICE to try different candidates
        (this.peerConnection as any).restartIce();
      } catch (error) {
        console.error('Error restarting ICE:', error);
      }
    }
  }

  async getLocalStream(constraints: MediaConstraints = DEFAULT_MEDIA_CONSTRAINTS): Promise<MediaStream> {
    try {
      console.log('Requesting local media stream with constraints:', constraints);
      const stream = await mediaDevices.getUserMedia(constraints);
      this.localStream = stream;
      console.log('Local stream obtained successfully');

      if (this.peerConnection) {
        // Add tracks to peer connection
        stream.getTracks().forEach((track, index) => {
          console.log(`Adding track ${index}:`, track.kind);
          this.peerConnection!.addTrack(track, stream);
        });
      }

      return stream;
    } catch (error) {
      console.error('Error getting local stream:', error);
      throw error;
    }
  }

  setRemoteStreamHandler(callback: (stream: MediaStream) => void) {
    if (this.peerConnection) {
      // Type assertion to bypass missing TypeScript definition for ontrack
      (this.peerConnection as any).ontrack = (event: { streams: MediaStream[] }) => {
        console.log('Remote stream received:', event.streams.length);
        if (event.streams[0]) {
          this.remoteStream = event.streams[0];
          callback(event.streams[0]);
        }
      };
    }
  }

  setIceCandidateHandler(callback: (candidate: RTCIceCandidate) => void) {
    if (this.peerConnection) {
      // Type assertion to bypass missing TypeScript definition for onicecandidate
      (this.peerConnection as any).onicecandidate = (event: { candidate: RTCIceCandidate | null }) => {
        if (event.candidate) {
          console.log('ICE candidate generated:', event.candidate.candidate);
          callback(event.candidate);
        } else {
          console.log('ICE candidate gathering completed');
        }
      };
    }
  }

  async createOffer(): Promise<RTCSessionDescription> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    this.isOfferer = true;
    console.log('Creating offer...');

    try {
      const offer = await this.peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });

      console.log('Offer created successfully');
      await this.peerConnection.setLocalDescription(offer);
      console.log('Local description set successfully');
      
      return offer;
    } catch (error) {
      console.error('Error creating offer:', error);
      throw error;
    }
  }

  async createAnswer(offer: RTCSessionDescription): Promise<RTCSessionDescription> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    this.isOfferer = false;
    console.log('Creating answer for offer...');

    try {
      await this.peerConnection.setRemoteDescription(offer);
      console.log('Remote description set successfully');
      
      const answer = await this.peerConnection.createAnswer();
      console.log('Answer created successfully');
      
      await this.peerConnection.setLocalDescription(answer);
      console.log('Local description set successfully');
      
      return answer;
    } catch (error) {
      console.error('Error creating answer:', error);
      throw error;
    }
  }

  async setRemoteDescription(description: RTCSessionDescription): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    console.log('Setting remote description...');
    try {
      await this.peerConnection.setRemoteDescription(description);
      console.log('Remote description set successfully');
    } catch (error) {
      console.error('Error setting remote description:', error);
      throw error;
    }
  }

  async addIceCandidate(candidate: RTCIceCandidate): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    console.log('Adding ICE candidate:', candidate.candidate);
    try {
      await this.peerConnection.addIceCandidate(candidate);
      console.log('ICE candidate added successfully');
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
      // Don't throw error for ICE candidate failures, they're common
    }
  }

  toggleAudio(): boolean {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        console.log('Audio toggled:', audioTrack.enabled);
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
        console.log('Video toggled:', videoTrack.enabled);
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
          console.log('Camera switched successfully');
        } catch (error) {
          console.error('Error switching camera:', error);
        }
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

  cleanup(): void {
    console.log('Cleaning up WebRTC manager...');
    
    this.clearTimeouts();
    
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        track.stop();
        console.log('Stopped track:', track.kind);
      });
      this.localStream = null;
    }

    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach(track => {
        track.stop();
        console.log('Stopped remote track:', track.kind);
      });
      this.remoteStream = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
      console.log('Peer connection closed');
    }
  }

  // Additional debugging methods
  logConnectionStats(): void {
    if (this.peerConnection) {
      console.log('Connection Stats:');
      console.log('- Connection State:', this.peerConnection.connectionState);
      console.log('- ICE Connection State:', this.peerConnection.iceConnectionState);
      console.log('- ICE Gathering State:', this.peerConnection.iceGatheringState);
      console.log('- Signaling State:', this.peerConnection.signalingState);
    }
  }
}

// interface TurnCredentials {
//   urls: string;
//   username: string;
//   credential: string;
// }

// export const getTurnServerCredentials = async (): Promise<TurnCredentials> => {
//   return {
//     urls: 'turn:openrelay.metered.ca:80',
//     username: 'openrelayproject',
//     credential: 'openrelayproject'
//   };
// };

// Test connectivity to TURN servers
export const testTurnConnectivity = async (): Promise<boolean> => {
  try {
    const testPC = new RTCPeerConnection(WEBRTC_CONFIG);
    console.log("test PCcccccccc",testPC);
    
    return new Promise((resolve) => {
      let hasConnected = false;
      
      (testPC as any).oniceconnectionstatechange = () => {
        console.log("coonect ",testPC.iceConnectionState );
        
        if (testPC.iceConnectionState === 'connected' || testPC.iceConnectionState === 'completed') {
          hasConnected = true;
          resolve(true);
        } else if (testPC.iceConnectionState === 'failed') {
          resolve(false);
        }
      };
      console.log("66666666666666",hasConnected);
      
      // Create a test offer
      testPC.createOffer([]).then(offer => {
        testPC.setLocalDescription(offer);
      });
      
      // Timeout after 10 seconds
      setTimeout(() => {
        if (!hasConnected) {
          resolve(false);
        }
        testPC.close();
      }, 20000);
    });
  } catch (error) {
    console.error('Error testing TURN connectivity:', error);
    return false;
  }
};