import AsyncStorage from '@react-native-async-storage/async-storage';
import { Technician, Expert } from '../types';

import axios from 'axios';

const API_URL = 'http://192.168.1.112:3000';

export const login = async (username: string, password: string) => {
  try {
    const response = await axios.post(`${API_URL}/login`, { username, password });
    return response.data; // Returns { userId, message }
  } catch (error) {
    throw new Error('Login failed');
  }
};

export const getTechnicians = async (): Promise<Technician[]> => {
  const backendUrl = await AsyncStorage.getItem('backendUrl');
  if (!backendUrl) throw new Error('Backend URL not set');
  // Mock API responsenpm install axios
  return [
    { id: 1, name: 'John Doe', specialty: 'HVAC' },
    { id: 2, name: 'Jane Smith', specialty: 'Electrical' },
  ];
};

export const getConnectedExperts = async (): Promise<Expert[]> => {
  const backendUrl = await AsyncStorage.getItem('backendUrl');
  if (!backendUrl) throw new Error('Backend URL not set');
  // Mock API response
  return [
    { id: 1, name: 'Expert A', status: 'online' },
    { id: 2, name: 'Expert B', status: 'offline' },
  ];
};