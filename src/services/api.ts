import AsyncStorage from '@react-native-async-storage/async-storage';
import { Technician, Expert } from '../types';

export const login = async (username: string, password: string): Promise<void> => {
  const backendUrl = await AsyncStorage.getItem('backendUrl');
  if (!backendUrl) throw new Error('Backend URL not set');
  // Mock API call
  console.log(`Logging in to ${backendUrl} with username: ${username}`);
  console.log(`Logging in to ${backendUrl} with username: ${password}`);
};

export const getTechnicians = async (): Promise<Technician[]> => {
  const backendUrl = await AsyncStorage.getItem('backendUrl');
  if (!backendUrl) throw new Error('Backend URL not set');
  // Mock API response
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