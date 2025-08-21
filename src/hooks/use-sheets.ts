import { useState } from 'react';
import apiRequest from '@/api/api';
import { useAuth } from '@/contexts/auth';
import useToast from '@/hooks/use-toast';

interface Sheet {
  id: number;
  name: string;
  code?: string;
  projectId: number;
}

const useSheets = () => {
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [loading, setLoading] = useState(false);
  const { getToken } = useAuth();
  const { toaster } = useToast();

  const getSheetsByProject = async (projectId: number) => {
    setLoading(true);
    try {
      const data = await apiRequest<Sheet[]>({
        endpoint: `Sheets/GetSheetsByProject/${projectId}`,
        method: 'GET',
        token: getToken() ?? '',
      });
      
      if (Array.isArray(data)) {
        setSheets(data);
        return data;
      } else {
        console.error('Unexpected response format for sheets', data);
        setSheets([]);
        return [];
      }
    } catch (error) {
      console.error('API Error getting sheets:', error);
      toaster.error('Failed to load sheets');
      setSheets([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    sheets,
    loading,
    getSheetsByProject,
  };
};

export default useSheets;
