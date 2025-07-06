import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import BackendScreen from '../screens/BackendScreen';
import LoginScreen from '../screens/LoginScreen';
import TechnicianListScreen from '../screens/TechnicianListScreen';
import ExpertListScreen from '../screens/ExpertListScreen';
import VideoCallScreen from '../screens/VideoCallScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="Backend">
      <Stack.Screen name="Backend" component={BackendScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Login' }} />
      <Stack.Screen name="TechnicianList" component={TechnicianListScreen} options={{ title: 'Technicians' }} />
      <Stack.Screen name="ExpertList" component={ExpertListScreen} options={{ title: 'Connected Experts' }} />
      <Stack.Screen name="VideoCall" component={VideoCallScreen} options={{ title: 'Video Call' }} />
    </Stack.Navigator>
  );
}