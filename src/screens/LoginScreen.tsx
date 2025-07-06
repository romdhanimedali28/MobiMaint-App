import React, { useState } from 'react';
import { View, TextInput, Button, Text } from 'react-native';
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
      await login(username, password);
      navigation.navigate('TechnicianList');
    } catch (error) {
      console.error('Login failed', error);
    }
  };

  return (
    <View style={tailwind('bg-gray-100 flex-1 p-4')}>
      <Text style={tailwind('text-lg font-bold text-gray-800 mb-4')}>
        Login
      </Text>
      <TextInput
        style={tailwind('border border-gray-300 p-2 mb-4 bg-white font-roboto')}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={tailwind('border border-gray-300 p-2 mb-4 bg-white font-roboto')}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button
        title="Login"
        color="#1565C0"
        onPress={handleLogin}
      />
    </View>
  );
}