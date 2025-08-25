import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Alert, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { RTCView, MediaStream } from 'react-native-webrtc';
import io from 'socket.io-client';
import { RootStackParamList } from '../types';
import { WebRTCManager, SOCKET_CONFIG, testTurnConnectivity } from '../services/webrtc';
import { useBackend } from '../context/BackendContext';

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
  const [debugInfo, setDebugInfo] = useState<string>('');
  
  const webrtcManager = useRef(new WebRTCManager());
  const socketRef = useRef<any>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const offerSent = useRef(false);
  const answerSent = useRef(false);

  
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
      console.error('Error requesting permissions:', error);
      return false;
    }
  }, [navigation]);

  const initializeLocalStream = useCallback(async () => {
    try {
      setConnectionStatus('Accessing camera and microphone...');
      const stream = await webrtcManager.current.getLocalStream();
      console.log('Local stream initialized:', !!stream);
      setLocalStream(stream);
      localStreamRef.current = stream;
      setConnectionStatus('Media stream ready');
      return stream;
    } catch (error) {
      console.error('Error initializing local stream:', error);
      setConnectionStatus('Failed to access media devices');
      Alert.alert('Error', 'Could not access camera and microphone');
      return null;
    }
  }, []);

  const endCall = useCallback(() => {
    console.log('Ending call');
    setConnectionStatus('Ending call...');
    // webrtcManager.current.cleanup();
    if (socketRef.current) {
      socketRef.current.emit('end-call', { callId, to: recipientId });
      // socketRef.current.disconnect();
    }
    setLocalStream(null);
    setRemoteStream(null);
    setIsCallActive(false);
    setIsConnecting(false);
    navigation.goBack();
  }, [callId, recipientId, navigation]);

  const updateDebugInfo = useCallback(() => {
    const stats = webrtcManager.current;
    const info = `
Connection: ${stats.getConnectionState()}
ICE: ${stats.getIceConnectionState()}
User: ${userId} (${role})
Is Caller: ${isCaller}
Call ID: ${callId}
    `.trim();
    setDebugInfo(info);
  }, [userId, role, isCaller, callId]);

  const initializeSocket = useCallback(() => {
    console.log("init soocket");

    if (!backendUrl) {
      console.error('Backend URL not configured');
      Alert.alert('Error', 'Backend URL not configured');
      navigation.goBack();
      return null;
    }
    console.log("init soocket backend url yyyyyyyyyy" ,backendUrl);

    setConnectionStatus('Connecting to signaling server...');
    const socket = io(backendUrl, {
      ...SOCKET_CONFIG,
      query: { userId, callId },
    });

    socket.on('connect', () => {
      console.log('Socket connected for user:', userId);
      setConnectionStatus('Connected to signaling server');
      socket.emit('join-call', { callId, userId, role });
    });

    socket.on('user-joined', async (data) => {
      console.log('User joined:', data);
      setConnectionStatus('User joined, creating offer...');
      
      if (data.userId !== userId && isCaller && !offerSent.current) {
        offerSent.current = true;
        try {
          const offer = await webrtcManager.current.createOffer();
          console.log('Sending offer to:', data.userId);
          socket.emit('offer', { callId, offer, to: data.userId });
          setConnectionStatus('Offer sent, waiting for answer...');
        } catch (error) {
          console.error('Error creating offer:', error);
          setConnectionStatus('Failed to create offer');
        }
      }
    });

    socket.on('offer', async (data) => {
      if (data.from !== userId && !isCaller && !answerSent.current) {
        answerSent.current = true;
        try {
          console.log('Received offer from:', data.from);
          setConnectionStatus('Received offer, creating answer...');
          const answer = await webrtcManager.current.createAnswer(data.offer);
          socket.emit('answer', { callId, answer, to: data.from });
          setConnectionStatus('Answer sent, establishing connection...');
        } catch (error) {
          console.error('Error handling offer:', error);
          setConnectionStatus('Failed to handle offer');
        }
      }
    });

    socket.on('answer', async (data) => {
      if (data.from !== userId && isCaller) {
        try {
          console.log('Received answer from:', data.from);
          setConnectionStatus('Received answer, establishing connection...');
          await webrtcManager.current.setRemoteDescription(data.answer);
          setConnectionStatus('Waiting for connection...');
        } catch (error) {
          console.error('Error handling answer:', error);
          setConnectionStatus('Failed to handle answer');
        }
      }
    });

    socket.on('ice-candidate', async (data) => {
      if (data.candidate && data.from !== userId) {
        try {
          console.log('Received ICE candidate from:', data.from);
          await webrtcManager.current.addIceCandidate(data.candidate);
        } catch (error) {
          console.error('Error adding ICE candidate:', error);
        }
      }
    });

    socket.on('call-ended', () => {
      console.log('Call ended by remote user');
      endCall();
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setConnectionStatus('Connection failed');
      Alert.alert('Connection Error', 'Failed to connect to signaling server');
      endCall();
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnectionStatus('Disconnected from server');
    });

    return socket;
  }, [callId, userId, role, isCaller, backendUrl, navigation, endCall]);

  const setupWebRTC = useCallback(() => {
    console.log("setup webrtc");
    
    webrtcManager.current.setRemoteStreamHandler((remoteStream) => {
      console.log('Remote stream received:', !!remoteStream);
      setRemoteStream(remoteStream);
      setIsCallActive(true);
      setIsConnecting(false);
      setConnectionStatus('Connected! Video call active');
    });

    webrtcManager.current.setIceCandidateHandler((candidate) => {
      if (socketRef.current) {
        console.log('Sending ICE candidate to:', recipientId);
        socketRef.current.emit('ice-candidate', {
          callId,
          candidate,
          to: recipientId,
        });
      }
    });
  }, [callId, recipientId]);

  const toggleMic = useCallback(() => {
    const enabled = webrtcManager.current.toggleAudio();
    setMicEnabled(enabled);
    console.log('Microphone toggled:', enabled);
  }, []);

  const toggleCamera = useCallback(() => {
    const enabled = webrtcManager.current.toggleVideo();
    setCameraEnabled(enabled);
    console.log('Camera toggled:', enabled);
  }, []);

  const switchCamera = useCallback(async () => {
    await webrtcManager.current.switchCamera();
    console.log('Camera switched');
  }, []);

  const testConnection = useCallback(async () => {
    console.log("Testing TURN connectivity 33333333333333");

    setConnectionStatus('Testing TURN connectivity...');
    const isConnected = await testTurnConnectivity();
    console.log("44444444444444" ,isConnected);

    if (isConnected) {
      console.log("5555 TURN servers accessible");

      setConnectionStatus('TURN servers accessible');
    } else {
      setConnectionStatus('TURN servers not accessible');
      Alert.alert(
        'Connection Issue',
        'TURN servers are not accessible. This may cause connection issues on different networks.'
      );
    }
  }, []);

  useEffect(() => {
    console.log("111111");
    
    const initialize = async () => {
      console.log("222222");

      const hasPermissions = await requestPermissions();
      if (!hasPermissions) return;

      // Test TURN connectivity first
      await testConnection();
console.log("77777777777777777 after test coonection line 272");

      const stream = await initializeLocalStream();
      console.log("8888888888888888888 after init local ",stream);

      if (!stream) return;
      console.log("999999999999999999 areturn strem ");

      setupWebRTC();
      console.log("999999999999999999 wetbupwebrtc ");

      socketRef.current = initializeSocket();
      console.log("100000000000000000000000  areturn init socket ");

    };

    initialize();

    // Update debug info every 3 seconds
    // const debugInterval = setInterval(updateDebugInfo, 3000);

    // return () => {
    //   console.log("colose seeee");
      
    //   clearInterval(debugInterval);
    //   // eslint-disable-next-line react-hooks/exhaustive-deps
    //   const webrtc = webrtcManager.current; // Copy ref value for cleanup
    //   webrtc.cleanup();
    //   if (socketRef.current) {
    //     socketRef.current.disconnect();
    //   }
    //   socketRef.current.on('connect', () => {
    //     console.log(`Socket connected for user ${userId}`);
    //     socketRef.current.emit('register', { userId });
    //   });
    
    // };
  }, [initializeLocalStream, requestPermissions, setupWebRTC, initializeSocket, testConnection, updateDebugInfo, userId]);

  const showDebugInfo = () => {
    Alert.alert('Debug Information', debugInfo);
  };

  return (
    <View style={styles.container}>
      {/* Connection Status */}
      {isConnecting && (
        <View style={styles.statusContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.statusText}>{connectionStatus}</Text>
        </View>
      )}

      {/* Remote Video */}
      {remoteStream ? (
        <RTCView
          streamURL={remoteStream.toURL()}
          style={styles.remoteVideo}
          objectFit="cover"
          mirror={false}
        />
      ) : (
        <View style={styles.remoteVideo}>
          <Text style={styles.statusText}>Waiting for remote video...</Text>
        </View>
      )}

      {/* Local Video */}
      {localStream ? (
        <RTCView
          streamURL={localStream.toURL()}
          style={styles.localVideo}
          objectFit="cover"
          mirror={true}
        />
      ) : (
        <View style={styles.localVideo}>
          <Text style={styles.statusText}>No local video</Text>
        </View>
      )}

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.controlButton, !micEnabled && styles.disabledButton]}
          onPress={toggleMic}
        >
          <Text style={styles.buttonText}>{micEnabled ? '🎤' : '🔇'}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.controlButton, !cameraEnabled && styles.disabledButton]}
          onPress={toggleCamera}
        >
          <Text style={styles.buttonText}>{cameraEnabled ? '📹' : '📷'}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.controlButton}
          onPress={switchCamera}
        >
          <Text style={styles.buttonText}>🔄</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, styles.endCallButton]}
          onPress={endCall}
        >
          <Text style={styles.buttonText}>📞</Text>
        </TouchableOpacity>
      </View>

      {/* Debug Info Button */}
      <TouchableOpacity
        style={styles.debugButton}
        onPress={showDebugInfo}
      >
        <Text style={styles.debugButtonText}>Debug</Text>
      </TouchableOpacity>

      {/* Call Status Indicator */}
      {isCallActive && (
        <View style={styles.callStatusIndicator}>
          <Text style={styles.callStatusText}>• Live</Text>
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
  statusContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    zIndex: 1000,
  },
  statusText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 20,
  },
  remoteVideo: {
    flex: 1,
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
  },
  localVideo: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 120,
    height: 160,
    backgroundColor: '#333',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  controls: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  disabledButton: {
    backgroundColor: 'rgba(255, 0, 0, 0.3)',
    borderColor: '#ff0000',
  },
  endCallButton: {
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    borderColor: '#ff0000',
  },
  buttonText: {
    fontSize: 24,
    color: '#fff',
  },
  debugButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  debugButtonText: {
    color: '#fff',
    fontSize: 12,
  },
  callStatusIndicator: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  callStatusText: {
    color: '#00ff00',
    fontSize: 16,
    fontWeight: 'bold',
  },
});