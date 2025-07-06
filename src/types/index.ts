export interface Technician {
    id: number;
    name: string;
    specialty: string;
  }
  
  export interface Expert {
    id: number;
    name: string;
    status: 'online' | 'offline';
  }

  export type RootStackParamList = {
    Backend: undefined;
    Login: undefined;
    TechnicianList: undefined;
    ExpertList: undefined;
    VideoCall: { expertId: number };
  };