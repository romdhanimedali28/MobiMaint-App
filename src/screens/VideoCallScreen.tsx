/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { RTCView, MediaStream,  } from 'react-native-webrtc';
import io from 'socket.io-client';
import { RootStackParamList } from '../types';
import { WebRTCManager, SOCKET_CONFIG } from '../services/webrtc';
import { useBackend } from '../context/BackendContext';

type Props = NativeStackScreenProps<RootStackParamList, 'VideoCall'>;

export default function VideoCallScreen({ route, navigation }: Props) {
  const { callId, recipientId, userId, isCaller } = route.params; // Require params
  const { backendUrl } = useBackend(); // Get backend URL from context
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [, setIsCallActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);

  const webrtcManager = useRef(new WebRTCManager());
  const socketRef = useRef<any>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Request permissions
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
      const stream = await webrtcManager.current.getLocalStream();
      setLocalStream(stream);
      localStreamRef.current = stream;
      return stream;
    } catch (error) {
      Alert.alert('Error', 'Could not access camera and microphone');
      return null;
    }
  }, []);

  const initializeSocket = useCallback(() => {
    if (!backendUrl) {
      Alert.alert('Error', 'Backend URL not configured');
      navigation.goBack();
      return null;
    }

    const socket = io(backendUrl, {
      ...SOCKET_CONFIG,
      query: { userId, callId },
    });

    socket.on('connect', () => {
      console.log('Socket connected');
      socket.emit('join-call', { callId, userId });
    });

    socket.on('user-joined', (data) => {
      if (data.userId !== userId && isCaller) {
        webrtcManager.current.createOffer().then(offer => {
          socket.emit('offer', { callId, offer, to: recipientId });
        });
      }
    });

    socket.on('offer', async (data) => {
      if (data.from !== userId) {
        try {
          const answer = await webrtcManager.current.createAnswer(data.offer);
          socket.emit('answer', { callId, answer, to: data.from });
        } catch (error) {
          console.error('Error handling offer:', error);
        }
      }
    });

    socket.on('answer', async (data) => {
      if (data.from !== userId) {
        try {
          await webrtcManager.current.setRemoteDescription(data.answer);
        } catch (error) {
          console.error('Error handling answer:', error);
        }
      }
    });

    socket.on('ice-candidate', async (data) => {
      if (data.candidate && data.from !== userId) {
        try {
          await webrtcManager.current.addIceCandidate(data.candidate);
        } catch (error) {
          console.error('Error adding ICE candidate:', error);
        }
      }
    });

    socket.on('call-ended', () => {
      endCall();
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      Alert.alert('Connection Error', 'Failed to connect to signaling server');
      endCall();
    });

    return socket;
  }, [callId, userId, recipientId, isCaller, navigation, backendUrl]);

  // Set WebRTC handlers
  const setupWebRTC = useCallback(() => {
    webrtcManager.current.setRemoteStreamHandler((remoteStream) => {
      setRemoteStream(remoteStream);
      setIsCallActive(true);
      setIsConnecting(false);
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
  }, [callId, recipientId]);

  // Toggle microphone
  const toggleMic = useCallback(() => {
    const enabled = webrtcManager.current.toggleAudio();
    setMicEnabled(enabled);
  }, []);

  // Toggle camera
  const toggleCamera = useCallback(() => {
    const enabled = webrtcManager.current.toggleVideo();
    setCameraEnabled(enabled);
  }, []);

  // Switch camera
  const switchCamera = useCallback(async () => {
    await webrtcManager.current.switchCamera();
  }, []);

  // End call
  const endCall = useCallback(() => {
    webrtcManager.current.cleanup();
    if (socketRef.current) {
      socketRef.current.emit('end-call', { callId, to: recipientId });
      socketRef.current.disconnect();
    }
    setLocalStream(null);
    setRemoteStream(null);
    setIsCallActive(false);
    setIsConnecting(false);
    navigation.goBack();
  }, [callId, recipientId, navigation]);

  // Initialize everything
  useEffect(() => {
    const initialize = async () => {
      const hasPermissions = await requestPermissions();
      if (!hasPermissions) return;

      const stream = await initializeLocalStream();
      if (!stream) return;

      setupWebRTC();
      socketRef.current = initializeSocket();
    };

    initialize();

    return () => {
      webrtcManager.current.cleanup();
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [initializeLocalStream, requestPermissions, setupWebRTC, initializeSocket]);

  return (
    <View style={styles.container}>
      {remoteStream && (
        <RTCView
          streamURL={remoteStream.toURL()}
          style={styles.remoteVideo}
          objectFit="cover"
          mirror={false}
        />
      )}
      {localStream && (
        <RTCView
          streamURL={localStream.toURL()}
          style={styles.localVideo}
          objectFit="cover"
          mirror={true}
        />
      )}
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
        <TouchableOpacity style={styles.endCallButton} onPress={endCall}>
          <Text style={styles.buttonText}>📴</Text>
        </TouchableOpacity>
      </View>
      {isConnecting && (
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>
            {isCaller ? 'Calling...' : 'Connecting...'}
          </Text>
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
  remoteVideo: {
    flex: 1,
    backgroundColor: '#333',
  },
  localVideo: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 120,
    height: 160,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: '#333',
  },
  controls: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  controlButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 15,
    borderRadius: 50,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: 'rgba(255, 0, 0, 0.3)',
  },
  endCallButton: {
    backgroundColor: '#ff0000',
    padding: 15,
    borderRadius: 50,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  statusContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  statusText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});