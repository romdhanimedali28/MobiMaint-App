import React, { useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import io from 'socket.io-client';
import Logo from '../components/Logo'; // Adjust path as needed

type Props = {
  route: {
    params: {
      userId: string;
      role: 'Technician' | 'Expert';
    };
  };
};

export default function ExpertHomeScreen({ route }: Props) {
  const { userId, role } = route.params;
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const socket = useRef<any>(null);

  const setupSocket = useCallback(async () => {
    const backendUrl = await AsyncStorage.getItem('backendUrl');
    if (backendUrl) {
      socket.current = io(backendUrl, { transports: ['websocket'] });
      
      socket.current.on('connect', () => {
        socket.current.emit('register', { userId });
      });

      socket.current.on('call-request', ({ callId, from }) => {
        Alert.alert(
          'Incoming Video Call',
          `Call from ${from}`,
          [
            {
              text: 'Accept',
              onPress: () => {
                socket.current.emit('call-response', { 
                  callId, 
                  from: userId, 
                  to: from, 
                  accepted: true 
                });
                navigation.navigate('VideoCall', {
                  userId,
                  role,
                  callId,
                  recipientId: from,
                  isCaller: false,
                });
              },
            },
            {
              text: 'Decline',
              style: 'cancel',
              onPress: () => socket.current.emit('call-response', { 
                callId, 
                from: userId, 
                to: from, 
                accepted: false 
              }),
            },
          ],
          { cancelable: false }
        );
      });

      socket.current.on('error', ({ message }) => {
        Alert.alert('Connection Error', message);
      });
    }
  }, [userId, role, navigation]);

  useEffect(() => {
    setupSocket();
    return () => {
      if (socket.current) {
        socket.current.disconnect();
      }
    };
  }, [setupSocket]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Logo width={120} height={120} style={styles.logo} />
        
        <Text style={styles.title}>Expert Dashboard</Text>
        
        <Text style={styles.welcomeText}>
          Welcome, {userId}
        </Text>
        
        <View style={styles.statusContainer}>
          <View style={styles.statusIndicator} />
          <Text style={styles.statusText}>
            Waiting for incoming calls from technicians
          </Text>
        </View>
        
        <Text style={styles.instructionText}>
          You will receive a notification when a technician requests assistance
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  logo: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 15,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 18,
    color: '#495057',
    marginBottom: 40,
    textAlign: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#28a745',
    marginRight: 12,
  },
  statusText: {
    fontSize: 16,
    color: '#6c757d',
    fontWeight: '500',
  },
  instructionText: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 20,
    opacity: 0.8,
  },
});