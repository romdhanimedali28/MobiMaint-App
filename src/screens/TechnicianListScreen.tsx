import React, { useEffect, useState } from 'react';
import { View, FlatList, Text, TouchableOpacity } from 'react-native';
// import { useNavigation } from '@react-navigation/native';
// import { NativeStackNavigationProp } from '@react-navigation/native-stack';
// import { RootStackParamList } from '../types';
import { tailwind } from '../utils/tailwind';
import { getTechnicians } from '../services/api';
import { Technician } from '../types';

export default function TechnicianListScreen() {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  // const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    const fetchTechnicians = async () => {
      try {
        const data = await getTechnicians();
        setTechnicians(data);
      } catch (error) {
        console.error('Failed to fetch technicians', error);
      }
    };
    fetchTechnicians();
  }, []);

  const renderItem = ({ item }: { item: Technician }) => (
    <View style={tailwind('bg-white p-4 mb-2 border border-gray-300')}>
      <Text style={tailwind('text-base font-bold text-gray-800 font-roboto')}>
        {item.name}
      </Text>
      <Text style={tailwind('text-sm text-gray-600 font-roboto')}>
        {item.specialty}
      </Text>
    </View>
  );

  return (
    <View style={tailwind('bg-gray-100 flex-1 p-4')}>
      <FlatList
        data={technicians}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
      />
      <TouchableOpacity
        style={tailwind('bg-blue-600 p-3 rounded mt-4')}
        // onPress={() => navigation.navigate('ExpertList')}
      >
        <Text style={tailwind('text-white text-center font-bold font-roboto')}>
          View Connected Experts
        </Text>
      </TouchableOpacity>
    </View>
  );
}