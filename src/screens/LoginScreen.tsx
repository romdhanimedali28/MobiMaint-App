import React, { useState } from 'react';
import { View, TextInput, Button, Text, Image, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { tailwind } from '../utils/tailwind';
import { login } from '../services/api';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleLogin = async () => {
    try {
      // Authenticate user
      const { userId, role } = await login(username, password);

 
      // Navigate based on role
      if (role === 'Technician') {
        navigation.navigate('Home', { userId, role });
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
      </View>
      <Button
        title="Login"
        color="#1976D2"
        onPress={handleLogin}
        disabled={!username || !password}
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