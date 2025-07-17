import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, WorkOrder } from '../types';
import { getWorkOrders } from '../services/api';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const HomeScreen: React.FC<Props> = ({ navigation,  }) => {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWorkOrders = async () => {
    setLoading(true);
    try {
      const orders = await getWorkOrders();
      setWorkOrders(orders);
    } catch (error) {
      console.error('Error fetching work orders:', error);
      Alert.alert('Error', 'Failed to load work orders');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const orders = await getWorkOrders();
      setWorkOrders(orders);
    } catch (error) {
      console.error('Error refreshing work orders:', error);
      Alert.alert('Error', 'Failed to refresh work orders');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWorkOrders();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'CLOSE':
      case 'CLOSED':
        return '#F44336'; // Red
      case 'COMP':
        return '#4CAF50'; // Green
      case 'INPRG':
        return '#FF9800'; // Orange
      case 'APPR':
        return '#2196F3'; // Blue
      case 'WAPPR':
        return '#9C27B0'; // Purple
      case 'WSCH':
        return '#607D8B'; // Blue Grey
      case 'WMATL':
        return '#795548'; // Brown
      case 'WPCOND':
        return '#FF5722'; // Deep Orange
      case 'CAN':
        return '#424242'; // Dark Grey
      case 'HISTEDIT':
        return '#3F51B5'; // Indigo
      default:
        return '#FF9800'; // Default Orange
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 5) return '#4CAF50'; // Green - Low priority
    if (priority >= 3) return '#FF9800'; // Orange - Medium priority
    return '#F44336'; // Red - High priority
  };



  const navigateToDetails = (workOrder: WorkOrder) => {
    navigation.navigate('WorkOrderDetails', { workOrder });
  };

  const renderWorkOrder = ({ item }: { item: WorkOrder }) => (
    <TouchableOpacity
      style={styles.workOrderCard}
      onPress={() => navigateToDetails(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.titleContainer}>
          <Text style={styles.workOrderNumber}>{item.wonum}</Text>
          <View style={styles.badgeContainer}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
              <Text style={styles.statusText}>{item.status}</Text>
            </View>
            {item.wopriority && (
              <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.wopriority) }]}>
                <Text style={styles.priorityText}>P{item.wopriority}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <Text style={styles.description} numberOfLines={2}>
        {item.description}
      </Text>

      <View style={styles.summaryContainer}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Asset</Text>
            <Text style={styles.summaryValue}>{item.assetnum || 'N/A'}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Location</Text>
            <Text style={styles.summaryValue}>{item.location || 'N/A'}</Text>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Reported By</Text>
            <Text style={styles.summaryValue}>{item.reportedby || 'N/A'}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Owner</Text>
            <Text style={styles.summaryValue}>{item.owner || 'N/A'}</Text>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Work Type</Text>
            <Text style={styles.summaryValue}>{item.worktype || 'N/A'}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Phone</Text>
            <Text style={styles.summaryValue}>{item.phone || 'N/A'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.workOrderId}>ID: {item.workorderid}</Text>
        <Text style={styles.tapHint}>Tap for details →</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading work orders...</Text>
        </View>
      ) : workOrders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No work orders available</Text>
          <Text style={styles.emptySubtext}>Pull down to refresh</Text>
        </View>
      ) : (
        <FlatList
          data={workOrders}
          renderItem={renderWorkOrder}
          keyExtractor={(item) => item.workorderid.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#007AFF']}
              tintColor="#007AFF"
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#212529',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6c757d',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#6c757d',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#adb5bd',
    textAlign: 'center',
    marginTop: 8,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 30,
  },
  workOrderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  cardHeader: {
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  workOrderNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
    flex: 1,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 16,
    color: '#495057',
    marginBottom: 16,
    lineHeight: 22,
  },
  summaryContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryItem: {
    flex: 1,
    marginHorizontal: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '500',
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 14,
    color: '#212529',
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  workOrderId: {
    fontSize: 12,
    color: '#6c757d',
    fontFamily: 'monospace',
  },
  tapHint: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
});

export default HomeScreen;