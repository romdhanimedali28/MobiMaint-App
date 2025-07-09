// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   StyleSheet,
//   Alert,
// } from 'react-native';
// import { NativeStackScreenProps } from '@react-navigation/native-stack';
// import { RootStackParamList } from '../types/index';
// import uuid from 'react-native-uuid';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

// const HomeScreen: React.FC<Props> = ({ navigation }) => {
//   const [userId, setUserId] = useState<string>('');

//   useEffect(() => {
//     initializeUserId();
//   }, []);

//   const initializeUserId = async () => {
//     try {
//       // Check if user ID already exists
//       let storedUserId = await AsyncStorage.getItem('userId');
      
//       if (!storedUserId) {
//         // Generate new user ID
//         storedUserId = `user_${uuid.v4()}`;
//         await AsyncStorage.setItem('userId', storedUserId);
//       }
      
//       setUserId(storedUserId);
//     } catch (error) {
//       console.error('Error initializing user ID:', error);
//       // Fallback to temporary ID
//       setUserId(`user_${Date.now()}`);
//     }
//   };

//   const navigateToCallManager = () => {
//     if (!userId) {
//       Alert.alert('Error', 'User ID not initialized');
//       return;
//     }
//     // navigation.navigate('CallManager', { userId });
//   };

//   const resetUserId = async () => {
//     try {
//       await AsyncStorage.removeItem('userId');
//       await initializeUserId();
//       Alert.alert('Success', 'User ID has been reset');
//     } catch (error) {
//       console.error('Error resetting user ID:', error);
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>MobiMaint Video Call</Text>
      
//       <View style={styles.userSection}>
//         <Text style={styles.userLabel}>Your User ID:</Text>
//         <Text style={styles.userId}>{userId}</Text>
//       </View>

//       <View style={styles.buttonContainer}>
//         <TouchableOpacity 
//           style={styles.primaryButton} 
//           onPress={navigateToCallManager}
//         >
//           <Text style={styles.buttonText}>Start Video Call</Text>
//         </TouchableOpacity>

//         <TouchableOpacity 
//           style={styles.secondaryButton} 
//           onPress={resetUserId}
//         >
//           <Text style={styles.secondaryButtonText}>Reset User ID</Text>
//         </TouchableOpacity>
//       </View>

//       <View style={styles.infoSection}>
//         <Text style={styles.infoTitle}>How to use:</Text>
//         <Text style={styles.infoText}>
//           1. Share your User ID with the person you want to call
//         </Text>
//         <Text style={styles.infoText}>
//           2. Enter their User ID to start a call
//         </Text>
//         <Text style={styles.infoText}>
//           3. Or ask them to join your call using the Call ID
//         </Text>
//       </View>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 20,
//     backgroundColor: '#f5f5f5',
//     justifyContent: 'center',
//   },
//   title: {
//     fontSize: 28,
//     fontWeight: 'bold',
//     textAlign: 'center',
//     marginBottom: 40,
//     color: '#333',
//   },
//   userSection: {
//     backgroundColor: 'white',
//     padding: 20,
//     borderRadius: 10,
//     marginBottom: 30,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 3.84,
//     elevation: 5,
//   },
//   userLabel: {
//     fontSize: 16,
//     color: '#666',
//     marginBottom: 10,
//   },
//   userId: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#007AFF',
//     fontFamily: 'monospace',
//     backgroundColor: '#f0f0f0',
//     padding: 10,
//     borderRadius: 5,
//   },
//   buttonContainer: {
//     marginBottom: 30,
//   },
//   primaryButton: {
//     backgroundColor: '#007AFF',
//     padding: 18,
//     borderRadius: 10,
//     alignItems: 'center',
//     marginBottom: 15,
//   },
//   secondaryButton: {
//     backgroundColor: 'transparent',
//     borderWidth: 1,
//     borderColor: '#007AFF',
//     padding: 18,
//     borderRadius: 10,
//     alignItems: 'center',
//   },
//   buttonText: {
//     color: 'white',
//     fontSize: 18,
//     fontWeight: 'bold',
//   },
//   secondaryButtonText: {
//     color: '#007AFF',
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
//   infoSection: {
//     backgroundColor: 'white',
//     padding: 20,
//     borderRadius: 10,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 3.84,
//     elevation: 5,
//   },
//   infoTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     marginBottom: 15,
//     color: '#333',
//   },
//   infoText: {
//     fontSize: 16,
//     color: '#666',
//     marginBottom: 8,
//     lineHeight: 22,
//   },
// });

// export default HomeScreen;