import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { View, TextInput, Button, Text, Image, StyleSheet, Alert } from 'react-native';
import { RootStackParamList } from '../types';
import { useBackend } from '../context/BackendContext';
import { tailwind } from '../utils/tailwind';
import { API_URL_Base } from '../utils/const';

export default function BackendScreen() {
  const [url, setUrl] = useState(API_URL_Base); // Pre-fill for testing
  const { setBackendUrl } = useBackend();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // const isValidUrl = (url: string): boolean => {
  //   const urlPattern = /^https?:\/\/([a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(:\d+)?$/;
  //   return urlPattern.test(url);
  // };

  const handleSubmit = async () => {
    // if (!url) {
    //   Alert.alert('Error', 'Please enter a backend URL');
    //   return;
    // }

    // if (!isValidUrl(url)) {
    //   Alert.alert('Error', 'Please enter a valid URL (e.g., http://192.168.1.112:3000)');
    //   return;
    // }

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
      <Image
        source={{ uri: 'https://img.freepik.com/free-vector/bird-colorful-logo-gradient-vector_343694-1365.jpg?semt=ais_hybrid&w=740' }}
        style={styles.logo}
      />
      <Text style={styles.title}>Configure Backend</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={tailwind('border border-gray-300 p-3 rounded-lg bg-white text-base text-black')}
          placeholder="http://192.168.1.112:3000"
          value={url}
          onChangeText={setUrl}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
      <Button
        title="Connect"
        color="#1976D2"
        onPress={handleSubmit}
        disabled={!url}
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