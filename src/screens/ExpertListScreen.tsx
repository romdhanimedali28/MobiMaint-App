import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, Modal, TextInput, Button, Alert, RefreshControl } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { checkCameraAndMicPermissions, requestCameraAndMicPermissions } from '../services/permissions';
import { getConnectedExperts } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import io from 'socket.io-client';
import axios from 'axios';
import { API_URL_Base} from '../utils/const';
type Props = NativeStackScreenProps<RootStackParamList, 'ExpertList'>;

interface Expert {
  id: string;
  name: string;
  status: 'online' | 'offline';
  role: 'Expert';
  avatar?: string;
}

export default function ExpertListScreen({ navigation, route }: Props) {
  const { userId, role } = route.params;
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [experts, setExperts] = useState<Expert[]>([]);
  const [callId, setCallId] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [callingExpert, setCallingExpert] = useState<string | null>(null);
  const socket = useRef<any>(null);

  const setupSocket = useCallback(async () => {
    const backendUrl = await AsyncStorage.getItem('backendUrl');
    if (backendUrl) {
      socket.current = io(backendUrl, { transports: ['websocket'] });
      socket.current.on('connect', () => {
        console.log(`Socket connected for user ${userId}`);
        socket.current.emit('register', { userId });
      });

      socket.current.on('call-response', ({ callId, from, accepted }) => {
        if (accepted) {
          setShowCallModal(false); // Close modal on acceptance
          navigation.navigate('VideoCall', {
            callId,
            recipientId: from,
            userId,
            role,
            isCaller: true,
          });
        } else {
          setShowCallModal(false); // Close modal on rejection
          Alert.alert('Call Rejected', `${from} has rejected the call.`);
        }
      });

      socket.current.on('error', ({ message }) => {
        console.error('Socket error:', message);
        setShowCallModal(false);
        Alert.alert('Error', message);
      });
    } else {
      console.error('Backend URL not set');
      Alert.alert('Error', 'Backend URL not configured');
    }
  }, [userId, role, navigation]);

  useEffect(() => {
    checkPermissions();
    setupSocket();

    return () => {
      if (socket.current) {
        socket.current.disconnect();
      }
    };
  }, [setupSocket]);

  useFocusEffect(
    useCallback(() => {
      fetchExperts();
    }, [])
  );

  const checkPermissions = async () => {
    const granted = await checkCameraAndMicPermissions();
    setPermissionsGranted(granted);
  };

  const fetchExperts = async () => {
    setLoading(true);
    try {
      const fetchedExperts = await getConnectedExperts();
      setExperts(fetchedExperts);
    } catch (error) {
      console.error('Error fetching experts:', error);
      Alert.alert('Error', 'Failed to load experts');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const fetchedExperts = await getConnectedExperts();
      setExperts(fetchedExperts);
    } catch (error) {
      console.error('Error refreshing experts:', error);
      Alert.alert('Error', 'Failed to refresh experts');
    } finally {
      setRefreshing(false);
    }
  }, []);

  const startCall = async (expert: Expert) => {
    if (expert.status === 'offline') {
      Alert.alert('Expert Unavailable', `${expert.name} is currently offline. Please try again later.`);
      return;
    }

    if (!permissionsGranted) {
      const granted = await requestCameraAndMicPermissions();
      if (!granted) {
        Alert.alert('Permissions Required', 'Camera and microphone permissions are required for video calling.');
        return;
      }
      setPermissionsGranted(true);
    }

    let validCallId = callId;
    if (role === 'Technician') {
      try {
        const backendUrl = await AsyncStorage.getItem('backendUrl');
        if (!backendUrl) throw new Error('Backend URL not set');
        const response = await axios.post(`${API_URL_Base}/api/create-call`, { userId });
        validCallId = response.data.callId;
        setCallId(validCallId);
        setCallingExpert(expert.name);
        setShowCallModal(true);
        socket.current.emit('call-request', { callId: validCallId, from: userId, to: expert.id });
      } catch (error) {
        console.error('Error creating call:', error);
        setShowCallModal(false);
        Alert.alert('Error', 'Failed to create call');
      }
    } else if (!callId) {
      Alert.alert('Error', 'Please enter a Call ID');
      return;
    } else {
      navigation.navigate('VideoCall', {
        callId: validCallId,
        recipientId: expert.id,
        userId,
        role,
        isCaller: false,
      });
    }
  };

  const renderExpert = ({ item }: { item: Expert }) => (
    <TouchableOpacity
      style={[styles.expertItem, item.status === 'offline' && styles.disabledItem]}
      onPress={() => startCall(item)}
      disabled={item.status === 'offline'}
    >
      <View style={styles.expertInfo}>
        <Image
          source={{ uri: item.avatar || 'https://via.placeholder.com/60' }}
          style={styles.avatar}
        />
        <View style={styles.expertDetails}>
          <Text style={styles.expertName}>{item.name}</Text>
          <Text style={styles.expertSpecialization}>{item.role}</Text>
          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, { backgroundColor: item.status === 'online' ? '#4CAF50' : '#FF5722' }]} />
            <Text style={[styles.expertStatus, { color: item.status === 'online' ? '#4CAF50' : '#FF5722' }]}>
              {item.status === 'online' ? 'Available' : 'Offline'}
            </Text>
          </View>
        </View>
      </View>
      <TouchableOpacity
        style={[styles.callButton, item.status === 'offline' ? styles.disabledButton : {}]}
        onPress={() => startCall(item)}
        disabled={item.status === 'offline'}
      >
        <Text style={styles.callButtonText}>📹</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const callIdInput = role === 'Expert' ? (
    <View style={styles.callIdContainer}>
      <TextInput
        style={styles.callIdInput}
        placeholder="Enter Call ID"
        value={callId}
        onChangeText={setCallId}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  ) : null;

  const onlineExperts = experts.filter(expert => expert.status === 'online');
  const offlineExperts = experts.filter(expert => expert.status === 'offline');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image
          source={{ uri: 'https://img.freepik.com/free-vector/bird-colorful-logo-gradient-vector_343694-1365.jpg?semt=ais_hybrid&w=740' }}
          style={styles.logo}
        />
        <Text style={styles.title}>Expert Support</Text>
        <Text style={styles.subtitle}>Connect with maintenance experts</Text>
      </View>
      <Text style={styles.expertName}>{userId}</Text>
      {callIdInput}
      {loading ? (
        <Text style={styles.loadingText}>Loading experts...</Text>
      ) : experts.length === 0 ? (
        <Text style={styles.loadingText}>No experts available</Text>
      ) : (
        <FlatList
          data={[...onlineExperts, ...offlineExperts]}
          renderItem={renderExpert}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#1976D2']} // Android
              tintColor="#1976D2" // iOS
              title="Pull to refresh" // iOS
              titleColor="#1976D2" // iOS
            />
          }
        />
      )}
      <Modal
        visible={showCallModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCallModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>Call Request Sent</Text>
            <Text style={styles.modalSubText}>Waiting for {callingExpert} to respond...</Text>
            <Button
              title="Cancel"
              color="#FF0000"
              onPress={() => {
                setShowCallModal(false);
                socket.current.emit('call-response', { callId, from: userId, to: callingExpert, accepted: false });
              }}
            />
          </View>
        </View>
      </Modal>
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Permissions: {permissionsGranted ? '✅ Granted' : '❌ Not Granted'}
        </Text>
        {!permissionsGranted && (
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={() => requestCameraAndMicPermissions().then(setPermissionsGranted)}
          >
            <Text style={styles.permissionButtonText}>Grant Permissions</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    backgroundColor: '#1976D2',
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 10,
    borderRadius: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#BBDEFB',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  expertItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  disabledItem: {
    backgroundColor: '#F5F5F5',
    opacity: 0.6,
  },
  expertInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  expertDetails: {
    flex: 1,
  },
  expertName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 4,
  },
  expertSpecialization: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  expertStatus: {
    fontSize: 12,
    fontWeight: '500',
  },
  callButton: {
    backgroundColor: '#4CAF50',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  callButtonText: {
    fontSize: 20,
  },
  footer: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  permissionButton: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  callIdContainer: {
    padding: 10,
    backgroundColor: '#E0F7FA',
    borderRadius: 5,
    margin: 20,
  },
  callIdInput: {
    borderWidth: 1,
    borderColor: '#1976D2',
    borderRadius: 5,
    padding: 10,
    color: '#000',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    width: '80%',
  },
  modalText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalSubText: {
    fontSize: 16,
    marginBottom: 20,
  },
});