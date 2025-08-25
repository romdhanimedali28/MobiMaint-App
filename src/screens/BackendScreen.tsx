import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from 'react-native';
import Logo from '../components/Logo'; // Converted SVG component
import { RootStackParamList } from '../types';
import { useBackend } from '../context/BackendContext';
import { tailwind } from '../utils/tailwind';
import { API_URL_Base } from '../utils/const';

export default function BackendScreen() {
  const [url, setUrl] = useState(API_URL_Base);
  const { setBackendUrl } = useBackend();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleSubmit = async () => {
    try {
      await setBackendUrl(url);
      navigation.navigate('Login');
    } catch (error) {
      Alert.alert('Error', 'Failed to set backend URL');
      console.error('Error setting backend URL:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Logo width={120} height={120} style={styles.logo} />
      <Text style={styles.title}>SmarTech-TN</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={tailwind(
            'border border-gray-300 p-3 rounded-lg bg-white text-base text-black'
          )}
          placeholder="http://192.168.1.112:3000"
          value={url}
          onChangeText={setUrl}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
      <TouchableOpacity
        style={styles.button}
        onPress={handleSubmit}
        disabled={!url}
      >
        <Text style={styles.buttonText}>Connect</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logo: {
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginBottom: 30,
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#1800ad',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});