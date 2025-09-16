import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL_Base } from '../utils/const';
import { Technician, Expert, WorkOrder } from '../types';

const API_URL = API_URL_Base;

// Create axios instance with SSL configuration
const maximoAxios = axios.create({
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  }
});

// Add request interceptor for debugging
maximoAxios.interceptors.request.use(
  (config) => {
   
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
maximoAxios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const login = async (username: string, password: string) => {
  try {
    const response = await axios.post(`${API_URL}/login`, { username, password });
    return response.data; // Returns { userId, role, message }
  } catch (error) {
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
    // Fallback to mock data
    return [
      { id: 'user2', name: 'user2', status: 'online', role: 'Expert' },
      { id: 'user3', name: 'user3', status: 'online', role: 'Expert' },
    ];
  }
};

export const getWorkOrders = async (): Promise<WorkOrder[]> => {
  try {
    
    const response = await maximoAxios.get(
      `${process.env.MAXIMO_API_URL}?oslc.where=status%3D%22INPRG%22&lean=1&oslc.select=*&oslc.pageSize=10`,
      {
      headers: {
        'Cookie': process.env.MAXIMO_API_COOKIE,
        'apikey': process.env.MAXIMO_API_KEY,
        'Accept': '*/*',
        'Cache-Control': 'no-cache',
      },
      }
    );
    
    // Check if response has the expected structure
    if (!response.data || !response.data.member) {
      throw new Error('Invalid response structure from Maximo API');
    }
    
    // Maximo API typically returns work orders in a 'member' array
    const workOrders: WorkOrder[] = response.data.member.map((wo: any) => ({
      wonum: wo.wonum,
      description: wo.description || '',
      status: wo.status,
      location: wo.location,
      status_description: wo.status_description,
      assetnum: wo.assetnum,
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
    
  
    return workOrders;
    
  } catch (error: any) {

    
    // Provide more specific error messages
    if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
      throw new Error('Network connection failed. Please check your internet connection and SSL certificate.');
    } else if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please check your API key and session cookies.');
    } else if (error.response?.status === 403) {
      throw new Error('Access forbidden. Please check your permissions.');
    } else if (error.response?.status === 404) {
      throw new Error('API endpoint not found. Please verify the URL.');
    } else if (error.code === 'CERT_HAS_EXPIRED' || error.message.includes('certificate')) {
      throw new Error('SSL certificate has expired. Please contact your system administrator.');
    } else {
      throw new Error(`Failed to fetch work orders: ${error.message}`);
    }
  }
};

export const getWorkOrdersPaginated = async (skip: number = 0, limit: number = 10): Promise<WorkOrder[]> => {
  try {
    
    // For offset-based pagination, we need to fetch all data up to skip + limit
    // and then slice the results to get only the new items
    const totalNeeded = skip + limit;
    
    
    const response = await maximoAxios.get(`${process.env.MAXIMO_API_URL}`, {
      params: {
        'oslc.where': 'status="INPRG"',
        'lean': 1,
        'oslc.select': '*',
        'oslc.pageSize': totalNeeded, 
      },
      headers: {
         'Cookie': process.env.MAXIMO_API_COOKIE,
        'apikey': process.env.MAXIMO_API_KEY,
        'Accept': '*/*',
        'Cache-Control': 'no-cache',
      },
    });
    
    // Check if response has the expected structure
    if (!response.data || !response.data.member) {
      throw new Error('Invalid response structure from Maximo API');
    }
    
    // Map all work orders first
    const allWorkOrders: WorkOrder[] = response.data.member.map((wo: any) => ({
      wonum: wo.wonum,
      description: wo.description || '',
      status: wo.status,
      location: wo.location,
      status_description: wo.status_description,
      assetnum: wo.assetnum,
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
    
    // Slice the results to get only the requested range
    const requestedWorkOrders = allWorkOrders.slice(skip, skip + limit);
    
    
    return requestedWorkOrders;
    
  } catch (error: any) {

    
    // Provide more specific error messages
    if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
      throw new Error('Network connection failed. Please check your internet connection and SSL certificate.');
    } else if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please check your API key and session cookies.');
    } else if (error.response?.status === 403) {
      throw new Error('Access forbidden. Please check your permissions.');
    } else if (error.response?.status === 404) {
      throw new Error('API endpoint not found. Please verify the URL.');
    } else if (error.code === 'CERT_HAS_EXPIRED' || error.message.includes('certificate')) {
      throw new Error('SSL certificate has expired. Please contact your system administrator.');
    } else {
      throw new Error(`Failed to fetch work orders: ${error.message}`);
    }
  }
};