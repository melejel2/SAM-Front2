import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/auth';
import useToast from '@/hooks/use-toast';

// Building interface
export interface Building {
  id: number;
  name: string;
  buildingName?: string;
}

// Building Sheet interface 
export interface BuildingSheet {
  id: number;
  name: string;
  nameFr?: string;
  isActive?: boolean;
  costCode?: string;
}

// API Response interfaces
export interface BuildingsApiResponse {
  success: boolean;
  data?: Building[];
  message?: string;
  error?: string;
}

export interface BuildingSheetsApiResponse {
  success: boolean;
  data?: BuildingSheet[];
  message?: string;
  error?: string;
}

const useBuildings = () => {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [buildingSheets, setBuildingSheets] = useState<BuildingSheet[]>([]);
  const [loading, setLoading] = useState(false);
  const [sheetsLoading, setSheetsLoading] = useState(false);
  const { getToken } = useAuth();
  const { toaster } = useToast();

  const getBuildingsByProject = useCallback(async (projectId: number): Promise<Building[]> => {
    setLoading(true);
    try {
      // TODO: Implement actual API call when backend endpoint is ready
      console.log(`🏢 Mock: Getting buildings for project ID: ${projectId}`);
      
      // Mock data for now
      const mockBuildings: Building[] = [
        { id: 1, name: 'Building A', buildingName: 'Building A' },
        { id: 2, name: 'Building B', buildingName: 'Building B' },
        { id: 3, name: 'Building C', buildingName: 'Building C' }
      ];
      
      setBuildings(mockBuildings);
      return mockBuildings;
    } catch (error) {
      console.error('API Error getting buildings:', error);
      toaster.error('Failed to load buildings');
      setBuildings([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  const getBuildingSheets = useCallback(async (buildingId: number): Promise<BuildingSheet[]> => {
    setSheetsLoading(true);
    try {
      console.log(`🔍 Fetching sheets for building ID: ${buildingId}`);
      
      const token = getToken();
      if (!token) {
        throw new Error('Authentication token not available');
      }

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/Building/GetBuildingSheets/${buildingId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const apiResponse: BuildingSheetsApiResponse = await response.json();
      
      if (apiResponse.success && apiResponse.data) {
        setBuildingSheets(apiResponse.data);
        return apiResponse.data;
      } else {
        throw new Error(apiResponse.message || 'Failed to fetch building sheets');
      }
    } catch (error) {
      console.error('🚨 API Error getting building sheets:', error);
      toaster.error('Failed to load building sheets');
      setBuildingSheets([]);
      return [];
    } finally {
      setSheetsLoading(false);
    }
  }, [getToken]);

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
