import React from 'react';
import { View, Text, Button } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { tailwind } from '../utils/tailwind';

type Props = NativeStackScreenProps<RootStackParamList, 'VideoCall'>;

export default function VideoCallScreen({ route }: Props) {
  const { expertId } = route.params;

  const startVideoCall = () => {
    console.log(`Starting video call with expert ID: ${expertId}`);
    // Implement video call logic (e.g., Agora, Twilio)
  };

  return (
    <View style={tailwind('bg-gray-100 flex-1 p-4 items-center justify-center')}>
      <Text style={tailwind('text-lg font-bold text-gray-800 mb-4 font-roboto')}>
        Video Call with Expert ID: {expertId}
      </Text>
      <Button
        title="Start Video Call"
        color="#1565C0"
        onPress={startVideoCall}
      />
    </View>
  );
}