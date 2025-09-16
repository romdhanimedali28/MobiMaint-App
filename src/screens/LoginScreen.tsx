import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { tailwind } from '../utils/tailwind';
import { login } from '../services/api';
import Logo from '../components/Logo';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Hide the app bar (navigation bar) including back button
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false, // Remove the entire app bar
    });
  }, [navigation]);

  const handleLogin = async () => {
    try {
      // Authenticate user
      const { userId, role } = await login(username, password);

      // Navigate based on role
      if (role === 'Technician') {
        navigation.navigate('Main')
      } else if (role === 'Expert') {
        navigation.navigate('ExpertHome', { userId, role });
      }
    } catch (error) {
      console.error('Login failed', error);
      Alert.alert('Login Failed', 'Invalid username or password');
    }
  };

  return (
    <View style={styles.container}>
      <Logo width={120} height={120} style={styles.logo} />
      <Text style={styles.title}>Welcome</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={tailwind('border border-gray-300 p-3 rounded-lg bg-white text-base mb-4 text-black')}
          placeholder="Username"
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
      </View>
      <TouchableOpacity
        style={styles.button}
        onPress={handleLogin}
        disabled={!username || !password}
      >
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Match BackendScreen background
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logo: {
    marginBottom: 20,
  },
  title: {
    fontSize: 26, // Match BackendScreen
    fontWeight: 'bold',
    color: '#1E3A8A', // Match BackendScreen title color
    marginBottom: 30,
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 24, // Match BackendScreen spacing
  },
  button: {
    backgroundColor: '#1800ad', // Match BackendScreen button color
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8, // Match BackendScreen button radius
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});