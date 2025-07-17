import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL_Base } from '../utils/const';
import { Technician, Expert ,WorkOrder } from '../types';
import {MAXIMO_API_URL}  from '../utils/const';
const API_URL = API_URL_Base;

export const login = async (username: string, password: string) => {
  try {
    const response = await axios.post(`${API_URL}/login`, { username, password });
    return response.data; // Returns { userId, role, message }
  } catch (error) {
    console.error('Login error:', error);
    throw new Error('Login failed');
  }
};

export const getTechnicians = async (): Promise<Technician[]> => {
  const backendUrl = await AsyncStorage.getItem('backendUrl');
  if (!backendUrl) throw new Error('Backend URL not set');
  // Mock API response
  return [
    { id: 1, name: 'John Doe', specialty: 'HVAC' },
    { id: 2, name: 'Jane Smith', specialty: 'Electrical' },
  ];
};

export const getConnectedExperts = async (): Promise<Expert[]> => {
  const backendUrl = await AsyncStorage.getItem('backendUrl');
  if (!backendUrl) throw new Error('Backend URL not set');

  try {
    const response = await axios.get(`${API_URL}/api/experts`);
    // Map server response to Expert interface
    const experts: Expert[] = response.data.experts.map((expert: any) => ({
      id: expert.username, // Use username as id to match userId/recipientId
      name: expert.username,
      status: expert.status as 'online' | 'offline',
      role: 'Expert' as const,
      avatar: undefined, // Server doesn't provide avatar
    }));
    return experts;
  } catch (error) {
    console.error('Error fetching experts from API:', error);
    // Fallback to mock data
    return [
      { id: 'user2', name: 'user2', status: 'online', role: 'Expert' },
      { id: 'user3', name: 'user3', status: 'online', role: 'Expert' },
    ];
  }
};



export const getWorkOrders = async (): Promise<WorkOrder[]> => {
  try {
    const response = await axios.get(`${MAXIMO_API_URL}?lean=1&oslc.select=*&oslc.pageSize=10`, {
      headers: {
        Cookie: '6d6972d6c01751c78a34bc82c12382fc=5c3fdd36cfcd7ca0d8319bff8687d529; JSESSIONIDUI=00008SLc2M424WdpeUWStGzZsr-:b15b3d21-8f18-4f31-8800-758c07818111',
        apikey: 'br6f7ujn7kaijrqs6mu3hicfg7htf8u8g1313p8',
        Accept: '*/*',
      },
    });
    
    // Maximo API typically returns work orders in a 'member' array
    const workOrders: WorkOrder[] = response.data.member.map((wo: any) => ({
      wonum: wo.wonum,
      description: wo.description,
      status: wo.status,
      status_description: wo.status_description,
      assetnum: wo.assetnum,
      location: wo.location,
      reportdate: wo.reportdate,
      wopriority: wo.wopriority,
      workorderid: wo.workorderid,
      woclass: wo.woclass,
      woclass_description: wo.woclass_description,
      actstart: wo.actstart,
      actfinish: wo.actfinish,
      changedate: wo.changedate,
      changeby: wo.changeby,
      statusdate: wo.statusdate,
      siteid: wo.siteid,
      orgid: wo.orgid,
      parent: wo.parent,
      taskid: wo.taskid,
      istask: wo.istask,
      template: wo.template,
      downtime: wo.downtime,
      estlabcost: wo.estlabcost,
      actlabcost: wo.actlabcost,
      estmatcost: wo.estmatcost,
      actmatcost: wo.actmatcost,
      esttoolcost: wo.esttoolcost,
      acttoolcost: wo.acttoolcost,
      estservcost: wo.estservcost,
      actservcost: wo.actservcost,
      estlabhrs: wo.estlabhrs,
      actlabhrs: wo.actlabhrs,
      estdur: wo.estdur,
      glaccount: wo.glacount,
      firstapprstatus: wo.firstapprstatus,
      milestone: wo.milestone,
      haschildren: wo.haschildren,
      flowcontrolled: wo.flowcontrolled,
      disabled: wo.disabled,
      interruptible: wo.interruptible,
      _rowstamp: wo._rowstamp,
      href: wo.href,
      reportedby: wo.reportedby,
  owner: wo.owner,
  supervisor: wo.supervisor,
  phone: wo.phone,
  worktype: wo.worktype,
  schedstart: wo.schedstart,
  schedfinish: wo.schedfinish,
  targcompdate: wo.targcompdate,
    }));
    
    console.log('Fetched work orders:', workOrders); // Debug log
    return workOrders;
  } catch (error: any) {
    console.error('Error fetching work orders from Maximo API:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    throw new Error('Failed to fetch work orders');
  }
};

// Alternative minimal interface if you want to keep it simple
export interface WorkOrderMinimal {
  wonum: string;
  description: string;
  status: string;
  status_description?: string;
  assetnum?: string;
  location?: string;
  reportdate?: string;
  wopriority?: number;
  workorderid: number;
  woclass?: string;
  woclass_description?: string;
  actstart?: string;
  actfinish?: string;
  changedate?: string;
  siteid?: string;
  orgid?: string;
  istask?: boolean;
  downtime?: boolean;
}