import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { WorkOrder } from '../types';
import { getWorkOrdersPaginated } from '../services/api';
import MapIcon from '../components/icons/map';
import LocationIcon from '../components/icons/location';

type RootTabParamList = {
  AI: undefined;
  Home: undefined;
  Profile: undefined;
  Login: undefined;
  WorkOrderDetails: { workOrder: WorkOrder };
};

type Props = BottomTabScreenProps<RootTabParamList, 'Home'>;

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [currentBatch, setCurrentBatch] = useState(1); // Track which batch we're on
  const [, setTotalLoaded] = useState(0);

  // Calculate how many items to load in the next batch
  const getNextBatchSize = (batchNumber: number): number => {
    return Math.pow(2, batchNumber - 1) * 10; // 10, 20, 40, 80, etc.
  };

  const fetchWorkOrders = React.useCallback(async (isRefresh: boolean = false) => {
    if (isRefresh) {
      setRefreshing(true);
      setCurrentBatch(1);
      setTotalLoaded(0);
      setHasMoreData(true);
    } else {
      setLoading(true);
    }

    try {
      const batchSize = getNextBatchSize(1); // Start with 10
      const orders = await getWorkOrdersPaginated(0, batchSize);
      
      setWorkOrders(orders);
      setTotalLoaded(orders.length);
      setCurrentBatch(1);
      
      // If we got less than requested, no more data available
      if (orders.length < batchSize) {
        setHasMoreData(false);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load work orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadMoreWorkOrders = async () => {
    if (loadingMore || !hasMoreData) return;

    setLoadingMore(true);

    try {
      const nextBatch = currentBatch + 1;
      const batchSize = getNextBatchSize(nextBatch);
      const currentLength = workOrders.length; // Use actual array length
      const newOrders = await getWorkOrdersPaginated(currentLength, batchSize);
      
      if (newOrders.length === 0) {
        setHasMoreData(false);
      } else {
        const existingIds = new Set(workOrders.map(wo => wo.workorderid));
        const uniqueNewOrders = newOrders.filter(wo => !existingIds.has(wo.workorderid));
        
        if (uniqueNewOrders.length === 0) {
          setHasMoreData(false);
        } else {
          setWorkOrders(prevOrders => [...prevOrders, ...uniqueNewOrders]);
          setTotalLoaded(prev => prev + uniqueNewOrders.length);
          setCurrentBatch(nextBatch);
          
          
          // If we got less than requested, no more data available
          if (newOrders.length < batchSize) {
            setHasMoreData(false);
          }
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load more work orders');
    } finally {
      setLoadingMore(false);
    }
  };

  const onRefresh = async () => {
    await fetchWorkOrders(true);
  };

  const handleEndReached = () => {
    if (!loadingMore && hasMoreData) {
      loadMoreWorkOrders();
    }
  };

  useEffect(() => {
    fetchWorkOrders();
  }, [fetchWorkOrders]);

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
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
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
        <Text style={styles.workOrderInfo}>
          {item.wonum}-{item.worktype}
        </Text>
        <Text style={styles.description} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.divider} />
        <View style={styles.footerRow}>
          <View style={styles.dateContainer}>
            <MapIcon color="#1800ad" size={20} />
            <Text style={styles.siteId}>
              {item.siteid || 'N/A'}
            </Text>
          </View>
          <View style={styles.locationButton}>
            <LocationIcon color="#1800ad" size={20} />
            <Text style={styles.locationButtonText}>
              {item.location || 'N/A'}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#1800ad" />
        <Text style={styles.loadingMoreText}>Loading more...</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.workOrdersTitle}>Work Orders</Text>
        <Text style={styles.loadedCount}>
          Loaded: {workOrders.length} items
        </Text>
      </View>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1800ad" />
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
              colors={['#1800ad']}
              tintColor="#1800ad"
            />
          }
          showsVerticalScrollIndicator={false}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.1}
          ListFooterComponent={renderFooter}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  workOrdersTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1E3A8A',
  },
  loadedCount: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6c757d',
    marginTop: 10,
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
    paddingHorizontal: 16,
    paddingBottom: 80, 
    marginTop: 10,
  },
  workOrderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    position: 'relative',
    overflow: 'hidden',
    borderLeftWidth: 6,
    borderLeftColor: '#1800ad',
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    marginBottom: 8,
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
  workOrderInfo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 8,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#e9ecef',
    marginVertical: 8,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  siteId: {
    fontSize: 14,
    color: '#495057',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationButtonText: {
    color: '#495057',
    fontSize: 14,
    fontWeight: '600',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingMoreText: {
    marginTop: 10,
    fontSize: 14,
    color: '#6c757d',
  },
});

export default HomeScreen;