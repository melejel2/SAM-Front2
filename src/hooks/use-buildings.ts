import { useState } from 'react';
import apiRequest from '@/api/api';
import { useAuth } from '@/contexts/auth';
import useToast from '@/hooks/use-toast';

interface Building {
  id: number;
  name: string;
  projectLevel: number;
  subContractorLevel: number;
}

export interface BuildingSheet {
  id: number;
  name: string;
  hasVo: boolean;
  isActive: boolean;
}

const useBuildings = () => {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [buildingSheets, setBuildingSheets] = useState<BuildingSheet[]>([]);
  const [loading, setLoading] = useState(false);
  const [sheetsLoading, setSheetsLoading] = useState(false);
  const { getToken } = useAuth();
  const { toaster } = useToast();

  const getBuildingsByProject = async (projectId: number) => {
    setLoading(true);
    try {
      const data = await apiRequest<Building[]>({
        endpoint: `Building/GetBuildingsList?projectId=${projectId}`,
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

  const getBuildingSheets = async (buildingId: number) => {
    setSheetsLoading(true);
    try {
      const data = await apiRequest<BuildingSheet[]>({
        endpoint: `Building/GetBuildingSheets/${buildingId}`,
        method: 'GET',
        token: getToken() ?? '',
      });
      
      if (Array.isArray(data)) {
        setBuildingSheets(data);
        return data;
      } else {
        console.error('Unexpected response format for building sheets', data);
        setBuildingSheets([]);
        return [];
      }
    } catch (error) {
      console.error('API Error getting building sheets:', error);
      toaster.error('Failed to load building sheets');
      setBuildingSheets([]);
      return [];
    } finally {
      setSheetsLoading(false);
    }
  };

  return {
    buildings,
    buildingSheets,
    loading,
    sheetsLoading,
    getBuildingsByProject,
    getBuildingSheets,
  };
};

export default useBuildings;
