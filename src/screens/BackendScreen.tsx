import React, { useState } from 'react';
import { View, TextInput, Button, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useBackend } from '../context/BackendContext';
import { tailwind } from '../utils/tailwind';

export default function BackendScreen() {
  const [url, setUrl] = useState('');
  const { setBackendUrl } = useBackend();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleSubmit = async () => {
    if (url) {
      await setBackendUrl(url);
      navigation.navigate('Login');
    }
  };

  return (
    <View style={tailwind('bg-gray-100 flex-1 p-4')}>
      <Text style={tailwind('text-lg font-bold text-gray-800 mb-4')}>
        Enter Backend URL
      </Text>
      <TextInput
        style={tailwind('border border-gray-300 p-2 mb-4 bg-white font-roboto')}
        placeholder="https://api.example.com"
        value={url}
        onChangeText={setUrl}
      />
      <Button
        title="Connect"
        color="#1565C0"
        onPress={handleSubmit}
      />
    </View>
  );
}