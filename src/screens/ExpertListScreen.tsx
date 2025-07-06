import React, { useEffect, useState } from 'react';
import { View, FlatList, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { tailwind } from '../utils/tailwind';
import { getConnectedExperts } from '../services/api';
import { Expert } from '../types';

export default function ExpertListScreen() {
  const [experts, setExperts] = useState<Expert[]>([]);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    const fetchExperts = async () => {
      try {
        const data = await getConnectedExperts();
        setExperts(data);
      } catch (error) {
        console.error('Failed to fetch experts', error);
      }
    };
    fetchExperts();
  }, []);

  const renderItem = ({ item }: { item: Expert }) => (
    <TouchableOpacity
      style={tailwind('bg-white p-4 mb-2 border border-gray-300')}
      onPress={() => navigation.navigate('VideoCall', { expertId: item.id })}
    >
      <Text style={tailwind('text-base font-bold text-gray-800 font-roboto')}>
        {item.name}
      </Text>
      <Text style={tailwind('text-sm text-gray-600 font-roboto')}>
        {item.status === 'online' ? 'Available' : 'Offline'}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={tailwind('bg-gray-100 flex-1 p-4')}>
      <FlatList
        data={experts}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
      />
    </View>
  );
}