// src/PermissionService.ts
import {  request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { Platform, Alert } from 'react-native';

class PermissionService {
  async requestCameraAndMicrophonePermissions(): Promise<boolean> {
    try {
      const cameraPermission = Platform.OS === 'android'
        ? PERMISSIONS.ANDROID.CAMERA
        : PERMISSIONS.IOS.CAMERA;
      const microphonePermission = Platform.OS === 'android'
        ? PERMISSIONS.ANDROID.RECORD_AUDIO
        : PERMISSIONS.IOS.MICROPHONE;

      const cameraResult = await request(cameraPermission);
      const microphoneResult = await request(microphonePermission);

      if (cameraResult === RESULTS.GRANTED && microphoneResult === RESULTS.GRANTED) {
        return true;
      } else {
        Alert.alert(
          'Permissions Required',
          'Camera and microphone permissions are needed for video calls.',
          [{ text: 'OK' }]
        );
        return false;
      }
    } catch (error) {
      return false;
    }
  }
}

export default new PermissionService();