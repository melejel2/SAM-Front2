import { useState } from 'react';
import apiRequest from '@/api/api';
import { useAuth } from '@/contexts/auth';
import useToast from '@/hooks/use-toast';

interface Building {
  id: number;
  name: string;
  code?: string;
  projectId: number;
}

const useBuildings = () => {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(false);
  const { getToken } = useAuth();
  const { toaster } = useToast();

  const getBuildingsByProject = async (projectId: number) => {
    setLoading(true);
    try {
      const data = await apiRequest<Building[]>({
        endpoint: `Building/GetBuildingsByProject/${projectId}`,
        method: 'GET',
        token: getToken() ?? '',
      });
      
      if (Array.isArray(data)) {
        setBuildings(data);
        return data;
      } else {
        console.error('Unexpected response format for buildings', data);
        setBuildings([]);
        return [];
      }
    } catch (error) {
      console.error('API Error getting buildings:', error);
      toaster.error('Failed to load buildings');
      setBuildings([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    buildings,
    loading,
    getBuildingsByProject,
  };
};

export default useBuildings;
