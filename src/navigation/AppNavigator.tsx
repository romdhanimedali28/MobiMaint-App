import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BackendScreen from '../screens/BackendScreen';
import LoginScreen from '../screens/LoginScreen';
import ExpertListScreen from '../screens/ExpertListScreen';
import VideoCallScreen from '../screens/VideoCallScreen';
import { RootStackParamList } from '../types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="Backend">
      <Stack.Screen 
        name="Backend" 
        component={BackendScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="Login" 
        component={LoginScreen} 
        options={{ title: 'Login' }} 
      />
      <Stack.Screen 
        name="ExpertList" 
        component={ExpertListScreen} 
        options={{ title: 'Connected Experts' }} 
      />
      <Stack.Screen
        name="VideoCall"
        component={VideoCallScreen}
        options={{
          title: 'Video Call',
          headerShown: false, // Hide header during video call
          gestureEnabled: false, // Prevent swipe back during call
        }}
      />
    </Stack.Navigator>
  );
}