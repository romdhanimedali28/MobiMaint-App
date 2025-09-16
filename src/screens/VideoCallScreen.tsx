import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Alert, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { RTCView, MediaStream } from 'react-native-webrtc';
import io from 'socket.io-client';
import { RootStackParamList } from '../types';
import { WebRTCManager, SOCKET_CONFIG } from '../services/webrtc';
import { useBackend } from '../context/BackendContext';

// Import your icons
import MicIcon from '../../assets/icons/mic.svg';
import MicOffIcon from '../../assets/icons/mic-off.svg';
import VideoIcon from '../components/icons/video';
import VideoOffIcon from '../../assets/icons/video-off.svg';
import PhoneIcon from '../../assets/icons/phone.svg';
import CameraFlipIcon from '../../assets/icons/camera-flip.svg';

type Props = NativeStackScreenProps<RootStackParamList, 'VideoCall'>;

export default function VideoCallScreen({ route, navigation }: Props) {
  const { callId, recipientId, userId, role, isCaller } = route.params;
  const { backendUrl } = useBackend();

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('Initializing...');
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [connectionFailed, setConnectionFailed] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  const webrtcManager = useRef<WebRTCManager | null>(null);
  const socketRef = useRef<any>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const offerSent = useRef(false);
  const answerSent = useRef(false);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isCleaningUp = useRef(false);

  // Test TURN server connectivity (kept as requested)
  const testTurnConnectivity = useCallback(async (): Promise<{ success: boolean; details: string }> => {
    return new Promise((resolve) => {
      try {
        const testPC = new (window as any).RTCPeerConnection({
          iceServers: [
            { urls: 'stun:webrtc-medali.japaneast.cloudapp.azure.com:3478' },
            {
              urls: [
                'turn:webrtc-medali.japaneast.cloudapp.azure.com:3478?transport=udp',
                'turn:webrtc-medali.japaneast.cloudapp.azure.com:3478?transport=tcp',
              ],
              username: 'medaliwebrtc',
              credential: 'MAR+27290+F+WEBRTC#',
            },
          ],
        });

        let candidateTypes: string[] = [];
        let resolved = false;

        testPC.onicecandidate = (event: any) => {
          if (event.candidate) {
            const candidate = event.candidate.candidate;
            if (candidate.includes('typ host')) candidateTypes.push('host');
            if (candidate.includes('typ srflx')) candidateTypes.push('srflx');
            if (candidate.includes('typ relay')) candidateTypes.push('relay');
            if (candidate.includes('typ relay') && !resolved) {
              resolved = true;
              resolve({ success: true, details: `TURN server working. Candidate types: ${candidateTypes.join(', ')}` });
              testPC.close();
            }
          } else if (!resolved) {
            resolved = true;
            const success = candidateTypes.length > 0;
            const message = success
              ? `ICE gathering complete. Types found: ${candidateTypes.join(', ')}`
              : 'No ICE candidates generated';
            resolve({ success, details: message });
            testPC.close();
          }
        };

        testPC.createOffer().then((offer: any) => {
          return testPC.setLocalDescription(offer);
        }).catch((error: any) => {
          if (!resolved) {
            resolved = true;
            resolve({ success: false, details: `Error: ${error.message}` });
            testPC.close();
          }
        });

        setTimeout(() => {
          if (!resolved) {
            resolved = true;
            const message = candidateTypes.length > 0
              ? `Timeout but found candidates: ${candidateTypes.join(', ')}`
              : 'Timeout with no candidates';
            resolve({ success: candidateTypes.includes('relay'), details: message });
            testPC.close();
          }
        }, 10000);
      } catch (error) {
        resolve({ success: false, details: `Test failed: ${error}` });
      }
    });
  }, []);

  const requestPermissions = useCallback(async () => {
    try {
      const permissions = Platform.select({
        android: [PERMISSIONS.ANDROID.CAMERA, PERMISSIONS.ANDROID.RECORD_AUDIO],
        ios: [PERMISSIONS.IOS.CAMERA, PERMISSIONS.IOS.MICROPHONE],
      });

      for (const permission of permissions || []) {
        const result = await check(permission);
        if (result !== RESULTS.GRANTED) {
          const requestResult = await request(permission);
          if (requestResult !== RESULTS.GRANTED) {
            Alert.alert(
              'Permission Required',
              'Camera and microphone permissions are required for video calling.',
              [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
            return false;
          }
        }
      }
      return true;
    } catch (error) {
      return false;
    }
  }, [navigation]);

  const initializeLocalStream = useCallback(async () => {
    try {
      if (!webrtcManager.current) {
        return null;
      }
      setConnectionStatus('Accessing camera and microphone...');
      const stream = await webrtcManager.current.getLocalStream();
      setLocalStream(stream);
      localStreamRef.current = stream;
      setConnectionStatus('Media stream ready');
      return stream;
    } catch (error) {
      setConnectionStatus('Failed to access media devices');
      Alert.alert('Error', 'Could not access camera and microphone');
      return null;
    }
  }, []);

  const endCall = useCallback(() => {
    setConnectionStatus('Ending call...');
    if (socketRef.current) {
      socketRef.current.emit('end-call', { callId, to: recipientId });
    }
    if (webrtcManager.current) {
      webrtcManager.current.cleanup();
    }
    setLocalStream(null);
    setRemoteStream(null);
    setIsCallActive(false);
    setIsConnecting(false);
    navigation.goBack();
  }, [callId, recipientId, navigation]);

  const initializeSocket = useCallback(() => {
    if (!backendUrl) {
      Alert.alert('Error', 'Backend URL not configured');
      navigation.goBack();
      return null;
    }

    setConnectionStatus(role === 'Technician' ? 'Connecting to server...' : 'Expert connecting...');
    const socket = io(backendUrl, {
      ...SOCKET_CONFIG,
      query: { userId, callId },
    });

    socket.on('connect', () => {
      setConnectionStatus(role === 'Technician' ? 'Connected to server' : 'Expert connected');
      socket.emit('join-call', { callId, userId, role });
      setTimeout(() => {
        if (isConnecting) {
          setConnectionStatus('Establishing connection...');
        }
      }, 10000);
    });

    socket.on('user-joined', async (data) => {
      if (data.userId !== userId && isCaller && !offerSent.current) {
        offerSent.current = true;
        setConnectionStatus('Other user joined, creating offer...');
        try {
          if (!webrtcManager.current) {
            setConnectionStatus('WebRTC manager not initialized');
            return;
          }
          const offer = await webrtcManager.current.createOffer();
          socket.emit('offer', { callId, offer, to: data.userId });
          setConnectionStatus('Offer sent, waiting for answer...');
        } catch (error) {
          setConnectionStatus('Failed to create offer');
        }
      } else if (data.userId !== userId && !isCaller) {
        setConnectionStatus('Waiting for offer from caller...');
      }
    });

    socket.on('offer', async (data) => {
      if (data.from !== userId && !isCaller && !answerSent.current) {
        answerSent.current = true;
        try {
          setConnectionStatus('Received offer, creating answer...');
          if (!webrtcManager.current) {
            setConnectionStatus('WebRTC manager not initialized');
            return;
          }
          const answer = await webrtcManager.current.createAnswer(data.offer);
          socket.emit('answer', { callId, answer, to: data.from });
          setConnectionStatus('Answer sent, establishing connection...');
        } catch (error) {
          setConnectionStatus('Failed to handle offer');
        }
      }
    });

    socket.on('answer', async (data) => {
      if (data.from !== userId && isCaller) {
        try {
          setConnectionStatus('Received answer, establishing connection...');
          if (webrtcManager.current) {
            await webrtcManager.current.setRemoteDescription(data.answer);
            setConnectionStatus('Waiting for remote video...');
          } else {
            setConnectionStatus('WebRTC manager not initialized');
          }
        } catch (error) {
          setConnectionStatus('Failed to handle answer');
        }
      }
    });

    socket.on('ice-candidate', async (data) => {
      if (data.candidate && data.from !== userId) {
        try {
          if (webrtcManager.current) {
            await webrtcManager.current.addIceCandidate(data.candidate);
          }
        } catch (error) {
          // Handle ICE candidate error silently
        }
      }
    });

    socket.on('camera-switched', (data) => {
      if (data.from !== userId) {
        // Handle remote camera switch if needed
      }
    });

    socket.on('call-ended', () => {
      endCall();
    });

    socket.on('connect_error', () => {
      setConnectionStatus('Connection failed');
      Alert.alert('Connection Error', 'Failed to connect to signaling server');
      endCall();
    });

    socket.on('disconnect', () => {
      setConnectionStatus('Disconnected from server');
    });

    socket.on('error', () => {
      setConnectionStatus('Socket error occurred');
    });

    return socket;
  }, [callId, userId, role, isCaller, backendUrl, navigation, endCall, isConnecting]);

  const setupWebRTC = useCallback(() => {
    if (!webrtcManager.current) {
      return;
    }

    webrtcManager.current.setRemoteStreamHandler((remoteStream) => {
      setRemoteStream(remoteStream);
      setIsCallActive(true);
      setIsConnecting(false);
      setConnectionStatus('Video call active');
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }
    });

    webrtcManager.current.setIceCandidateHandler((candidate) => {
      if (socketRef.current) {
        socketRef.current.emit('ice-candidate', {
          callId,
          candidate,
          to: recipientId,
        });
      }
    });

    webrtcManager.current.setConnectionEstablishedHandler(() => {
      setIsCallActive(true);
      setIsConnecting(false);
      setConnectionStatus('Video call active');
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }
    });

    const checkConnectionState = () => {
      if (webrtcManager.current && !isCleaningUp.current) {
        const connectionState = webrtcManager.current.getConnectionState();
        const iceState = webrtcManager.current.getIceConnectionState();
        if (connectionState === 'connected' && iceState === 'connected') {
          setIsCallActive(true);
          setIsConnecting(false);
          setConnectionStatus('Video call active');
          if (connectionTimeoutRef.current) {
            clearTimeout(connectionTimeoutRef.current);
            connectionTimeoutRef.current = null;
          }
        }
      }
    };

    const stateCheckInterval = setInterval(checkConnectionState, 2000);
    setTimeout(() => {
      clearInterval(stateCheckInterval);
    }, 60000);
  }, [callId, recipientId, isCleaningUp]);

  const toggleMic = useCallback(() => {
    if (webrtcManager.current) {
      const enabled = webrtcManager.current.toggleAudio();
      setMicEnabled(enabled);
    }
  }, []);

  const toggleCamera = useCallback(() => {
    if (webrtcManager.current) {
      const enabled = webrtcManager.current.toggleVideo();
      setCameraEnabled(enabled);
    }
  }, []);

  const switchCamera = useCallback(async () => {
    try {
      if (webrtcManager.current) {
        await webrtcManager.current.switchCamera();
        if (socketRef.current) {
          socketRef.current.emit('camera-switched', {
            callId,
            from: userId,
            to: recipientId,
          });
        }
      }
    } catch (error) {
      // Handle camera switch error silently
    }
  }, [callId, userId, recipientId]);

  useEffect(() => {
    if (isInitializing || isCleaningUp.current) {
      return;
    }

    setIsInitializing(true);

    const initialize = async () => {
      try {
        if (!webrtcManager.current) {
          webrtcManager.current = new WebRTCManager();
        }

        const hasPermissions = await requestPermissions();
        if (!hasPermissions) {
          setIsInitializing(false);
          return;
        }

        await testTurnConnectivity();

        const stream = await initializeLocalStream();
        if (!stream) {
          setIsInitializing(false);
          return;
        }

        setupWebRTC();
        socketRef.current = initializeSocket();

        connectionTimeoutRef.current = setTimeout(async () => {
          if (isConnecting && !isCallActive && !isCleaningUp.current) {
            setConnectionFailed(true);
            setIsConnecting(false);
            setConnectionStatus('Connection timeout');
          }
        }, 45000);
      } catch (error) {
        setConnectionStatus('Initialization failed');
        Alert.alert('Initialization Error', 'Failed to initialize video call. Please try again.');
      } finally {
        setIsInitializing(false);
      }
    };

    initialize();

    return () => {
      isCleaningUp.current = true;
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      if (webrtcManager.current) {
        webrtcManager.current.cleanup();
        webrtcManager.current = null;
      }
    };
  }, []);

  return (
    <View style={styles.container}>
      {isConnecting && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.statusText}>{connectionStatus}</Text>
        </View>
      )}
      
      {isCallActive && (
        <>
          <View style={styles.videoContainer}>
            {remoteStream && (
              <RTCView streamURL={remoteStream.toURL()} style={styles.remoteVideo} objectFit="cover" />
            )}
            {localStream && (
              <RTCView streamURL={localStream.toURL()} style={styles.localVideo} objectFit="cover" />
            )}
          </View>
          
          <View style={styles.controlsContainer}>
            <TouchableOpacity 
              style={[styles.controlButton, !micEnabled && styles.disabledButton]} 
              onPress={toggleMic}
            >
              {micEnabled ? (
                <MicIcon color="white" height={24} width={24} />
              ) : (
                <MicOffIcon color="white" height={24} width={24} />
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.controlButton, !cameraEnabled && styles.disabledButton]} 
              onPress={toggleCamera}
            >
              {cameraEnabled ? (
                <VideoIcon color="white"size={24} />
              ) : (
                <VideoOffIcon color="white" height={24} width={24} />
              )}
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.controlButton} onPress={switchCamera}>
              <CameraFlipIcon color="white" height={24} width={24} />
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.controlButton, styles.endCallButton]} onPress={endCall}>
              <PhoneIcon color="white" height={24} width={24} />
            </TouchableOpacity>
          </View>
        </>
      )}
      
      {connectionFailed && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Connection Failed</Text>
          <Text style={styles.errorSubText}>Please check your network and try again.</Text>
          <TouchableOpacity style={[styles.controlButton, styles.endCallButton]} onPress={endCall}>
            <Text style={styles.controlButtonText}>Back</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  videoContainer: {
    flex: 1,
    position: 'relative',
  },
  remoteVideo: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  localVideo: {
    position: 'absolute',
    top: 40,
    right: 20,
    width: 120,
    height: 160,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  controlButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  disabledButton: {
    backgroundColor: 'rgba(220, 53, 69, 0.8)',
    borderColor: 'rgba(220, 53, 69, 1)',
  },
  endCallButton: {
    backgroundColor: 'rgba(220, 53, 69, 0.9)',
    borderColor: '#dc3545',
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  statusText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 20,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    paddingHorizontal: 20,
  },
  errorText: {
    color: '#F44336',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorSubText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
});