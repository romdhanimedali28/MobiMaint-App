import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { checkCameraAndMicPermissions, requestCameraAndMicPermissions } from '../services/permissions';
import uuid from 'react-native-uuid';
type Props = NativeStackScreenProps<RootStackParamList, 'ExpertList'>;

interface Expert {
  id: string;
  name: string;
  status: 'online' | 'offline';
  specialization: string;
  avatar?: string;
}

const experts: Expert[] = [
  {
    id: 'user1',
    name: 'User 1',
    status: 'online',
    specialization: 'Caller',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150',
  },
  {
    id: 'user2',
    name: 'User 2',
    status: 'online',
    specialization: 'Recipient',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
  },
];

export default function ExpertListScreen({ navigation, route }: Props) {
  const { userId, isCaller, callId, recipientId } = route.params; // Require params
  const [permissionsGranted, setPermissionsGranted] = useState(false);

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    const granted = await checkCameraAndMicPermissions();
    setPermissionsGranted(granted);
  };

  const startCall = async (expert: Expert) => {
    if (expert.status === 'offline') {
      Alert.alert('Expert Unavailable', `${expert.name} is currently offline. Please try again later.`);
      return;
    }

    if (expert.id !== recipientId) {
      Alert.alert('Error', `You can only call ${recipientId}`);
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

    // Ensure callId is a string (fallback if undefined, though should not happen)
    const validCallId = callId || uuid.v4();

    navigation.navigate('VideoCall', {
      callId: validCallId,
      recipientId,
      userId,
      isCaller,
    });
  };

  const renderExpert = ({ item }: { item: Expert }) => (
    <TouchableOpacity
      style={[styles.expertItem, item.status === 'offline' && styles.disabledItem]}
      onPress={() => startCall(item)}
      disabled={item.status === 'offline' || item.id !== recipientId}
    >
      <View style={styles.expertInfo}>
        <Image
          source={{ uri: item.avatar || 'https://via.placeholder.com/60' }}
          style={styles.avatar}
        />
        <View style={styles.expertDetails}>
          <Text style={styles.expertName}>{item.name}</Text>
          <Text style={styles.expertSpecialization}>{item.specialization}</Text>
          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, { backgroundColor: item.status === 'online' ? '#4CAF50' : '#FF5722' }]} />
            <Text style={[styles.expertStatus, { color: item.status === 'online' ? '#4CAF50' : '#FF5722' }]}>
              {item.status === 'online' ? 'Available' : 'Offline'}
            </Text>
          </View>
        </View>
      </View>
      <TouchableOpacity
        style={[styles.callButton, item.status === 'offline' || item.id !== recipientId ? styles.disabledButton : {}]}
        onPress={() => startCall(item)}
        disabled={item.status === 'offline' || item.id !== recipientId}
      >
        <Text style={styles.callButtonText}>📹</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  // Display callId for caller to share with recipient
  const callIdDisplay = isCaller ? (
    <View style={styles.callIdContainer}>
      <Text style={styles.callIdText}>Call ID: {callId}</Text>
      <Text style={styles.callIdInstruction}>Share this Call ID with {recipientId}</Text>
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
      {callIdDisplay}
      <FlatList
        data={[...onlineExperts, ...offlineExperts]}
        renderItem={renderExpert}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
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
  callIdText: {
    fontSize: 14,
    color: '#1976D2',
  },
  callIdInstruction: {
    fontSize: 12,
    color: '#1976D2',
    marginTop: 5,
  },
});