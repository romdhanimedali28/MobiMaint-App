import React, { createContext, useState, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface BackendContextType {
  backendUrl: string;
  setBackendUrl: (url: string) => Promise<void>;
}

const BackendContext = createContext<BackendContextType | undefined>(undefined);

export const BackendProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [backendUrl, setBackendUrlState] = useState('');

  const setBackendUrl = async (url: string) => {
    setBackendUrlState(url);
    await AsyncStorage.setItem('backendUrl', url);
  };

  return (
    <BackendContext.Provider value={{ backendUrl, setBackendUrl }}>
      {children}
    </BackendContext.Provider>
  );
};

export const useBackend = () => {
  const context = useContext(BackendContext);
  if (!context) throw new Error('useBackend must be used within a BackendProvider');
  return context;
};