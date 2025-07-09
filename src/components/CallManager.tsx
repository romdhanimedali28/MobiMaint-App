import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  Platform,
} from 'react-native';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import uuid from 'react-native-uuid';

interface CallManagerProps {
  navigation: any;
  userId: string; // Current user ID
}

const CallManager: React.FC<CallManagerProps> = ({ navigation, userId }) => {
  const [recipientId, setRecipientId] = useState('');
  const [callId, setCallId] = useState('');
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);

  // Check permissions on component mount
  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    try {
      const permissions = Platform.select({
        android: [PERMISSIONS.ANDROID.CAMERA, PERMISSIONS.ANDROID.RECORD_AUDIO],
        ios: [PERMISSIONS.IOS.CAMERA, PERMISSIONS.IOS.MICROPHONE],
      });

      let allGranted = true;
      for (const permission of permissions || []) {
        const result = await check(permission);
        if (result !== RESULTS.GRANTED) {
          allGranted = false;
          break;
        }
      }
      setIsPermissionGranted(allGranted);
    } catch (error) {
      console.error('Error checking permissions:', error);
    }
  };

  const requestPermissions = async () => {
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
              [{ text: 'OK' }]
            );
            return false;
          }
        }
      }
      setIsPermissionGranted(true);
      return true;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  };

  const startCall = async () => {
    if (!recipientId.trim()) {
      Alert.alert('Error', 'Please enter recipient ID');
      return;
    }

    if (!isPermissionGranted) {
      const granted = await requestPermissions();
      if (!granted) return;
    }

    // Generate unique call ID
    const newCallId = uuid.v4() as string;
    
    // Navigate to video call screen
    navigation.navigate('VideoCall', {
      callId: newCallId,
      recipientId: recipientId.trim(),
      userId: userId,
      isCaller: true,
    });
  };

  const joinCall = async () => {
    if (!callId.trim()) {
      Alert.alert('Error', 'Please enter call ID');
      return;
    }

    if (!isPermissionGranted) {
      const granted = await requestPermissions();
      if (!granted) return;
    }

    // Navigate to video call screen
    navigation.navigate('VideoCall', {
      callId: callId.trim(),
      recipientId: '', // Will be determined by the call
      userId: userId,
      isCaller: false,
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Video Call Manager</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Start New Call</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter recipient user ID"
          value={recipientId}
          onChangeText={setRecipientId}
          autoCapitalize="none"
        />
        <TouchableOpacity style={styles.button} onPress={startCall}>
          <Text style={styles.buttonText}>Start Call</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Join Existing Call</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter call ID"
          value={callId}
          onChangeText={setCallId}
          autoCapitalize="none"
        />
        <TouchableOpacity style={styles.button} onPress={joinCall}>
          <Text style={styles.buttonText}>Join Call</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your User ID</Text>
        <Text style={styles.userId}>{userId}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Permissions</Text>
        <Text style={[styles.status, { color: isPermissionGranted ? 'green' : 'red' }]}>
          {isPermissionGranted ? '✓ Granted' : '✗ Not Granted'}
        </Text>
        {!isPermissionGranted && (
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermissions}>
            <Text style={styles.buttonText}>Request Permissions</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  section: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  permissionButton: {
    backgroundColor: '#FF9500',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  userId: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'monospace',
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 5,
  },
  status: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CallManager;