import React, { useState } from 'react';
import { View, TextInput, Button, Text, Image, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { tailwind } from '../utils/tailwind';
import { login } from '../services/api';
import uuid from 'react-native-uuid';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [callId, setCallId] = useState(''); // Add callId input
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleLogin = async () => {
    try {
      // Authenticate user
      await login(username, password);

      // Validate username
      if (!['user1', 'user2'].includes(username)) {
        Alert.alert('Error', 'Username must be "user1" or "user2"');
        return;
      }

      const isCaller = username === 'user1';
      const recipientId = username === 'user1' ? 'user2' : 'user1';
      const generatedCallId = isCaller ? uuid.v4() : callId; // Caller generates, callee uses input

      if (!isCaller && !callId) {
        Alert.alert('Error', 'Please enter a Call ID');
        return;
      }

      // Navigate to ExpertList with parameters
      navigation.navigate('ExpertList', {
        userId: username,
        isCaller,
        callId: generatedCallId,
        recipientId,
      });
    } catch (error) {
      console.error('Login failed', error);
      Alert.alert('Login Failed', 'Invalid username or password');
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: 'https://img.freepik.com/free-vector/bird-colorful-logo-gradient-vector_343694-1365.jpg?semt=ais_hybrid&w=740' }}
        style={styles.logo}
      />
      <Text style={styles.title}>Welcome Back</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={tailwind('border border-gray-300 p-3 rounded-lg bg-white text-base mb-4 text-black')}
          placeholder="Username (user1 or user2)"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TextInput
          style={tailwind('border border-gray-300 p-3 rounded-lg bg-white text-base mb-4 text-black')}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TextInput
          style={tailwind('border border-gray-300 p-3 rounded-lg bg-white text-base mb-4 text-black')}
          placeholder="Call ID (required for user2)"
          value={callId}
          onChangeText={setCallId}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
      <Button
        title="Login"
        color="#1976D2"
        onPress={handleLogin}
        disabled={!username || !password || (!callId && username === 'user2')}
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
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginBottom: 30,
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
});