import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import VideoIcon from '../components/icons/video'; // Import your VideoIcon component

type Props = NativeStackScreenProps<RootStackParamList, 'WorkOrderDetails'>;

const WorkOrderDetailsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { workOrder } = route.params;

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
        return '#1800ad'; // Changed to new blue
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

  const getPriorityColor = (priority?: number) => {
    if (priority === undefined) return '#FF9800';
    if (priority >= 5) return '#4CAF50'; // Green - Low priority
    if (priority >= 3) return '#FF9800'; // Orange - Medium priority
    return '#F44336'; // Red - High priority
  };

  const getStatusDescription = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'WAPPR':
        return 'Waiting for approval';
      case 'APPR':
        return 'Approved and ready to begin';
      case 'WSCH':
        return 'Waiting to be scheduled';
      case 'WMATL':
        return 'Waiting for materials';
      case 'WPCOND':
        return 'Waiting for suitable conditions';
      case 'INPRG':
        return 'Work in progress';
      case 'COMP':
        return 'Physical work completed';
      case 'CLOSE':
        return 'Work order closed';
      case 'CAN':
        return 'Work order canceled';
      case 'HISTEDIT':
        return 'Edited in history';
      default:
        return 'Unknown status';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleCallExpert = () => {
    navigation.navigate('ExpertList', { userId: 'user1', role: 'Technician' });
  };

  // eslint-disable-next-line react/no-unstable-nested-components
  const DetailRow = ({ label, value, icon }: { label: string; value?: string; icon?: string }) => (
    <View style={styles.detailRow}>
      <View style={styles.detailLabelContainer}>
        {icon && <Text style={styles.detailIcon}>{icon}</Text>}
        <Text style={styles.detailLabel}>{label}</Text>
      </View>
      <Text style={styles.detailValue}>{value ?? 'N/A'}</Text>
    </View>
  );

  // eslint-disable-next-line react/no-unstable-nested-components
  const SectionCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.titleHeader}>
        <Text style={styles.pageTitle}>Work Order Details</Text>
      </View>
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.mainCard}>
          <View style={styles.mainHeader}>
            <Text style={styles.woNumber}>{workOrder.wonum}</Text>
            <View style={styles.badgeContainer}>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(workOrder.status) }]}>
                <Text style={styles.statusText}>{workOrder.status}</Text>
              </View>
              {workOrder.wopriority !== undefined && (
                <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(workOrder.wopriority) }]}>
                  <Text style={styles.priorityText}>P{workOrder.wopriority}</Text>
                </View>
              )}
            </View>
          </View>
          <Text style={styles.description}>{workOrder.description}</Text>
          <View style={styles.statusDescriptionContainer}>
            <Text style={styles.statusDescription}>{getStatusDescription(workOrder.status)}</Text>
          </View>
        </View>

        <SectionCard title="Basic Information">
          <DetailRow label="Asset Number" value={workOrder.assetnum} icon="🏭" />
          <DetailRow label="Location" value={workOrder.location} icon="📍" />
          <DetailRow label="Work Type" value={workOrder.worktype} icon="🔧" />
          <DetailRow label="Work Class" value={workOrder.woclass} icon="📋" />
          <DetailRow label="Site ID" value={workOrder.siteid} icon="🏢" />
        </SectionCard>

        <SectionCard title="Personnel">
          <DetailRow label="Reported By" value={workOrder.reportedby} icon="👤" />
          <DetailRow label="Owner" value={workOrder.owner} icon="👑" />
          <DetailRow label="Supervisor" value={workOrder.supervisor} icon="👨‍💼" />
          <DetailRow label="Phone" value={workOrder.phone} icon="📞" />
        </SectionCard>

        <SectionCard title="Timeline">
          <DetailRow label="Reported Date" value={formatDate(workOrder.reportdate)} icon="📅" />
          <DetailRow label="Status Date" value={formatDate(workOrder.statusdate)} icon="⏱️" />
          {workOrder.actstart && (
            <DetailRow label="Started" value={formatDate(workOrder.actstart)} icon="▶️" />
          )}
          {workOrder.actfinish && (
            <DetailRow label="Finished" value={formatDate(workOrder.actfinish)} icon="✅" />
          )}
        </SectionCard>

        <SectionCard title="Work Order Details">
          <DetailRow label="Work Order ID" value={workOrder.workorderid?.toString()} icon="🆔" />
          <DetailRow label="Priority Level" value={workOrder.wopriority?.toString()} icon="⚡" />
          <DetailRow label="Downtime Required" value={workOrder.downtime ? 'Yes' : 'No'} icon="⏸️" />
          <DetailRow label="Is Task" value={workOrder.istask ? 'Yes' : 'No'} icon="✔️" />
          <DetailRow label="Template" value={workOrder.template ? 'Yes' : 'No'} icon="📋" />
        </SectionCard>

        <SectionCard title="Cost Information">
          <DetailRow label="Est. Labor Cost" value={workOrder.estlabcost ? `$${workOrder.estlabcost.toFixed(2)}` : undefined} icon="💰" />
          <DetailRow label="Act. Labor Cost" value={workOrder.actlabcost ? `$${workOrder.actlabcost.toFixed(2)}` : undefined} icon="💳" />
          <DetailRow label="Est. Material Cost" value={workOrder.estmatcost ? `$${workOrder.estmatcost.toFixed(2)}` : undefined} icon="📦" />
          <DetailRow label="Act. Material Cost" value={workOrder.actmatcost ? `$${workOrder.actmatcost.toFixed(2)}` : undefined} icon="📦" />
          <DetailRow label="GL Account" value={workOrder.glaccount} icon="🏦" />
        </SectionCard>

        <SectionCard title="System Information">
          <DetailRow label="Parent Order" value={workOrder.parent} icon="🔗" />
          <DetailRow label="Changed By" value={workOrder.changeby} icon="👤" />
          <DetailRow label="Change Date" value={formatDate(workOrder.changedate)} icon="📅" />
          <DetailRow label="Flow Controlled" value={workOrder.flowcontrolled ? 'Yes' : 'No'} icon="🔄" />
          <DetailRow label="Has Children" value={workOrder.haschildren ? 'Yes' : 'No'} icon="👶" />
        </SectionCard>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={handleCallExpert}>
        <VideoIcon color="white" size={24} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  titleHeader: {
    backgroundColor: '#fff',
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 3,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#212529',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  scrollContainer: {
    flex: 1,
  },
  mainCard: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderLeftWidth: 4,
    borderLeftColor: '#1800ad', // Changed to new blue
  },
  mainHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  woNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1800ad', // Changed to new blue
    flex: 1,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  priorityText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 16,
    color: '#495057',
    lineHeight: 24,
    marginBottom: 16,
  },
  statusDescriptionContainer: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#1800ad', // Changed to new blue
  },
  statusDescription: {
    fontSize: 14,
    color: '#6c757d',
    fontStyle: 'italic',
  },
  sectionCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#1800ad', // Changed to new blue
    paddingBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  detailLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#212529',
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
  },
  bottomSpacer: {
    height: 30,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1800ad', // Changed to new blue
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

export default WorkOrderDetailsScreen;