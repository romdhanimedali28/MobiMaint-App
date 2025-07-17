import React, { useEffect, useRef, useCallback } from 'react';
import { View, Text, Image, Button, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import io from 'socket.io-client';

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
        console.log(`Socket connected for user ${userId}`);
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
                socket.current.emit('call-response', { callId, from: userId, to: from, accepted: true });
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
              text: 'Cancel',
              onPress: () => socket.current.emit('call-response', { callId, from: userId, to: from, accepted: false }),
            },
          ],
          { cancelable: false }
        );
      });

      socket.current.on('error', ({ message }) => {
        console.error('Socket error:', message);
        Alert.alert('Error', message);
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

  const handleNavigateToExpertList = () => {
    navigation.navigate('ExpertList', { userId, role });
  };

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: 'https://img.freepik.com/free-icon/user_318-159711.jpg' }}
        style={styles.icon}
      />
      <Text style={styles.title}>Expert Dashboard</Text>
      <Text style={styles.subtitle}>Welcome, {userId} ({role})</Text>
      <Button
        title="Go to Expert List (Test)"
        color="#1976D2"
        onPress={handleNavigateToExpertList}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  icon: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
});