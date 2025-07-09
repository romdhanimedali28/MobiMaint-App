export const generateCallId = (): string => {
    return `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };
  
  export const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  export const validateUserId = (userId: string): boolean => {
    return userId.trim().length > 0 && userId.trim().length <= 50;
  };
  
  export const validateCallId = (callId: string): boolean => {
    return callId.trim().length > 0 && callId.trim().length <= 100;
  };