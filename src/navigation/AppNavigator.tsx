import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BackendScreen from '../screens/BackendScreen';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import WorkOrderDetails from '../screens/WorkerOrderDetails';
import ExpertListScreen from '../screens/ExpertListScreen';
import ExpertHomeScreen from '../screens/ExpertHomeScreen';
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
        name="Home" 
        component={HomeScreen} 
        options={{ title: 'Home' }} 
      /> 
      <Stack.Screen 
      name="WorkOrderDetails" 
      component={WorkOrderDetails} 
      options={{ title: 'WorkOrderDetails' }} 
    />
      <Stack.Screen 
        name="ExpertList" 
        component={ExpertListScreen} 
        options={{ title: 'Connected Experts' }} 
      />
      <Stack.Screen 
        name="ExpertHome" 
        component={ExpertHomeScreen} 
        options={{ title: 'Expert Dashboard' }} 
      />
      <Stack.Screen
        name="VideoCall"
        component={VideoCallScreen}
        options={{
          title: 'Video Call',
          headerShown: false,
          gestureEnabled: false,
        }}
      />
    </Stack.Navigator>
  );
}