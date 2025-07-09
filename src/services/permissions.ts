import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { Platform, Alert } from 'react-native';

export const checkCameraAndMicPermissions = async (): Promise<boolean> => {
  try {
    const permissions = Platform.select({
      android: [PERMISSIONS.ANDROID.CAMERA, PERMISSIONS.ANDROID.RECORD_AUDIO],
      ios: [PERMISSIONS.IOS.CAMERA, PERMISSIONS.IOS.MICROPHONE],
    });

    if (!permissions) return false;

    for (const permission of permissions) {
      const result = await check(permission);
      if (result !== RESULTS.GRANTED) {
        return false;
      }
    }
    return true;
  } catch (error) {
    console.error('Error checking permissions:', error);
    return false;
  }
};

export const requestCameraAndMicPermissions = async (): Promise<boolean> => {
  try {
    const permissions = Platform.select({
      android: [PERMISSIONS.ANDROID.CAMERA, PERMISSIONS.ANDROID.RECORD_AUDIO],
      ios: [PERMISSIONS.IOS.CAMERA, PERMISSIONS.IOS.MICROPHONE],
    });

    if (!permissions) return false;

    for (const permission of permissions) {
      const result = await check(permission);
      if (result !== RESULTS.GRANTED) {
        const requestResult = await request(permission);
        if (requestResult !== RESULTS.GRANTED) {
          Alert.alert(
            'Permission Required',
            'Camera and microphone permissions are required for video calling.',
            [{ text: 'OK' }]
          );
          return false;
        }
      }
    }
    return true;
  } catch (error) {
    console.error('Error requesting permissions:', error);
    return false;
  }
};