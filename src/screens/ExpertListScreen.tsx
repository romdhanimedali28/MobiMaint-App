import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Modal, Button, Alert, RefreshControl } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { checkCameraAndMicPermissions, requestCameraAndMicPermissions } from '../services/permissions';
import { getConnectedExperts } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import io from 'socket.io-client';
import axios from 'axios';
import VideoIcon from '../components/icons/video';
import Logo from '../components/Logo';

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
        socket.current.emit('register', { userId });
      });

      socket.current.on('call-response', ({ callId, from, accepted }) => {
        if (accepted) {
          setShowCallModal(false);
          navigation.navigate('VideoCall', {
            callId,
            recipientId: from,
            userId,
            role,
            isCaller: true,
          });
        } else {
          setShowCallModal(false);
          Alert.alert('Call Declined', `${from} has declined the call.`);
        }
      });

      socket.current.on('error', ({ message }) => {
        setShowCallModal(false);
        Alert.alert('Connection Error', message);
      });
    } else {
      Alert.alert('Configuration Error', 'Backend URL not configured');
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

    try {
      const backendUrl = await AsyncStorage.getItem('backendUrl');
      if (!backendUrl) throw new Error('Backend URL not set');

      const response = await axios.post(`${backendUrl}/api/create-call`, { userId });
      const validCallId = response.data.callId;
      
      setCallId(validCallId);
      setCallingExpert(expert.name);
      setShowCallModal(true);
      
      socket.current.emit('call-request', { 
        callId: validCallId, 
        from: userId, 
        to: expert.id 
      });
    } catch (error) {
      setShowCallModal(false);
      Alert.alert('Error', 'Failed to create call');
    }
  };

  const renderExpert = ({ item }: { item: Expert }) => (
    <TouchableOpacity
      style={[styles.expertItem, item.status === 'offline' && styles.disabledItem]}
      onPress={() => startCall(item)}
      disabled={item.status === 'offline'}
    >
      <View style={styles.expertInfo}>
       
        <View style={styles.expertDetails}>
          <Text style={styles.expertName}>{item.name}</Text>
          <Text style={styles.expertRole}>{item.role}</Text>
          <View style={styles.statusContainer}>
            <View 
              style={[
                styles.statusDot, 
                { backgroundColor: item.status === 'online' ? '#28a745' : '#dc3545' }
              ]} 
            />
            <Text 
              style={[
                styles.expertStatus, 
                { color: item.status === 'online' ? '#28a745' : '#dc3545' }
              ]}
            >
              {item.status === 'online' ? 'Available' : 'Offline'}
            </Text>
          </View>
        </View>
      </View>
      
      <TouchableOpacity
        style={[
          styles.callButton, 
          item.status === 'offline' ? styles.disabledButton : styles.activeButton
        ]}
        onPress={() => startCall(item)}
        disabled={item.status === 'offline'}
      >
        <VideoIcon color="white" size={24} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const onlineExperts = experts.filter(expert => expert.status === 'online');
  const offlineExperts = experts.filter(expert => expert.status === 'offline');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Logo width={80} height={80} style={styles.logo} />
        <Text style={styles.title}>Expert Support</Text>
        <Text style={styles.subtitle}>Connect with available experts</Text>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>Loading experts...</Text>
        </View>
      ) : experts.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No experts available</Text>
          <Text style={styles.emptySubText}>Pull to refresh</Text>
        </View>
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
              colors={['#6c757d']}
              tintColor="#6c757d"
              title="Pull to refresh"
              titleColor="#6c757d"
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
            <Text style={styles.modalTitle}>Calling...</Text>
            <Text style={styles.modalText}>
              Waiting for {callingExpert} to respond
            </Text>
            <View style={styles.modalButtonContainer}>
              <Button
                title="Cancel Call"
                color="#dc3545"
                onPress={() => {
                  setShowCallModal(false);
                  socket.current.emit('call-response', { 
                    callId, 
                    from: userId, 
                    to: callingExpert, 
                    accepted: false 
                  });
                }}
              />
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Permissions: {permissionsGranted ? '✅ Camera & Microphone Access Granted' : '❌ Permissions Required'}
        </Text>
        {!permissionsGranted && (
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={() => requestCameraAndMicPermissions().then(setPermissionsGranted)}
          >
            <Text style={styles.permissionButtonText}>Grant Camera & Microphone Access</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingTop: 40,
    paddingBottom: 25,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logo: {
    marginBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#6c757d',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#495057',
    fontWeight: '500',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#6c757d',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  expertItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  disabledItem: {
    backgroundColor: '#f8f9fa',
    opacity: 0.7,
  },
  expertInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginLeft: 10,
    marginTop: 8,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  expertDetails: {
    flex: 1,
  },
  expertName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  expertRole: {
    fontSize: 14,
    color: '#6c757d',
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
    marginRight: 8,
  },
  expertStatus: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  callButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 15,
  },
  activeButton: {
    backgroundColor: '#28a745',
    shadowColor: '#28a745',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  disabledButton: {
    backgroundColor: '#6c757d',
  },
  footer: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  footerText: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 8,
    textAlign: 'center',
  },
  permissionButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    shadowColor: '#007bff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  permissionButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    padding: 30,
    borderRadius: 15,
    alignItems: 'center',
    width: '85%',
    maxWidth: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 10,
  },
  modalText: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  modalButtonContainer: {
    width: '100%',
  },
});