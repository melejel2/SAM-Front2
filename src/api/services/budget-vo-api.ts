import apiRequest from '@/api/api';
import { VOServiceResult } from '@/types/variation-order';

/**
 * Budget BOQ VO API Service
 * Handles Budget-level VOs that modify project BOQs (NOT subcontractor-specific)
 * Uses api/Vo/* endpoints (different from Contract Dataset VOs which use api/VoDataSet/*)
 */

// Request types for Budget BOQ VOs
export interface BudgetVOUploadRequest {
  projectId: number;
  buildingId: number;
  sheetId: number;
  voLevel?: number;
  isFromBudgetBoq?: boolean;
  excelFile?: File;
}

export interface SaveBudgetVORequest {
  buildingId: number;
  voLevel: number;
  voSheets: {
    id: number;
    sheetName: string | null;
    voItems: {
      id: number;
      level: number;
      orderVo: number;
      no: string | null;
      key: string | null;
      unite: string | null;
      qte: number;
      pu: number;
      costCode: string | null;
      costCodeId: number | null;
    }[];
  }[];
}

export interface ClearBudgetVORequest {
  scope: 'Sheet' | 'Building';
  projectId: number;
  buildingId?: number | null;
  sheetId?: number | null;
}

// Response types
export interface BudgetVOItem {
  id: number;
  level: number;
  orderVo: number;
  no: string | null;
  key: string | null;
  unite: string | null;
  qte: number;
  pu: number;
  costCode: string | null;
  costCodeId: number | null;
}

export interface BudgetVOSheet {
  id: number;
  sheetName: string | null;
  voItems: BudgetVOItem[];
}

export interface BudgetVO {
  buildingId: number;
  voLevel: number;
  voSheets: BudgetVOSheet[];
}

/**
 * Get Budget BOQ VOs by building and level
 * @param buildingId Building ID
 * @param level Optional VO level
 * @param token Authentication token
 */
export const getBudgetVosByBuilding = async (
  buildingId: number, 
  level: number | null = null, 
  token: string
): Promise<BudgetVO[]> => {
  try {
    const endpoint = level !== null 
      ? `Vo/GetVoByBuilding?buildingId=${buildingId}&level=${level}`
      : `Vo/GetVoByBuilding?buildingId=${buildingId}`;

    const response = await apiRequest({
      endpoint,
      method: 'GET',
      token
    });

    return response || [];
  } catch (error) {
    console.error('Get Budget VOs by building API Error:', error);
    throw error;
  }
};

/**
 * Upload Budget BOQ VO from Excel file
 * @param request Upload request data
 * @param token Authentication token
 */
export const uploadBudgetVo = async (
  request: BudgetVOUploadRequest, 
  token: string
): Promise<VOServiceResult> => {
  try {
    const formData = new FormData();
    formData.append('ProjectId', request.projectId.toString());
    formData.append('BuildingId', request.buildingId.toString());
    formData.append('SheetId', request.sheetId.toString());
    formData.append('VoLevel', (request.voLevel || 1).toString());
    formData.append('IsFromBudgetBoq', (request.isFromBudgetBoq || false).toString());
    
    if (request.excelFile) {
      formData.append('excelFile', request.excelFile);
    }

    const response = await apiRequest({
      endpoint: 'Vo/UploadVo',
      method: 'POST',
      token,
      body: formData
    });

    // Handle backend Result format
    if (response && typeof response === 'object') {
      if ('isSuccess' in response) {
        return {
          isSuccess: response.isSuccess,
          data: response.data || null,
          error: response.isSuccess ? undefined : { message: response.error?.message || 'Upload failed' }
        };
      }
    }

    return { isSuccess: true, data: response };
  } catch (error) {
    console.error('Upload Budget VO API Error:', error);
    return {
      isSuccess: false,
      error: { message: error instanceof Error ? error.message : 'Failed to upload Budget VO' }
    };
  }
};

/**
 * Save Budget BOQ VO data
 * @param request Save request data
 * @param token Authentication token
 */
export const saveBudgetVo = async (
  request: SaveBudgetVORequest[], 
  token: string
): Promise<VOServiceResult> => {
  try {
    const response = await apiRequest({
      endpoint: 'Vo/SaveVo',
      method: 'POST',
      token,
      body: request as any // Cast to satisfy TypeScript requirements
    });

    // Handle backend Result format
    if (response && typeof response === 'object') {
      if ('isSuccess' in response) {
        return {
          isSuccess: response.isSuccess,
          data: response.data || null,
          error: response.isSuccess ? undefined : { message: response.error?.message || 'Save failed' }
        };
      }
    }

    return { isSuccess: true, data: response };
  } catch (error) {
    console.error('Save Budget VO API Error:', error);
    return {
      isSuccess: false,
      error: { message: error instanceof Error ? error.message : 'Failed to save Budget VO' }
    };
  }
};

/**
 * Clear Budget BOQ VO items
 * @param request Clear request data
 * @param token Authentication token
 */
export const clearBudgetVo = async (
  request: ClearBudgetVORequest, 
  token: string
): Promise<VOServiceResult> => {
  try {
    const response = await apiRequest({
      endpoint: 'Vo/ClearVo',
      method: 'POST',
      token,
      body: request as any // Cast to satisfy TypeScript requirements
    });

    // Handle backend Result format
    if (response && typeof response === 'object') {
      if ('isSuccess' in response) {
        return {
          isSuccess: response.isSuccess,
          data: response.data || null,
          error: response.isSuccess ? undefined : { message: response.error?.message || 'Clear failed' }
        };
      }
    }

    return { isSuccess: true, data: response };
  } catch (error) {
    console.error('Clear Budget VO API Error:', error);
    return {
      isSuccess: false,
      error: { message: error instanceof Error ? error.message : 'Failed to clear Budget VO' }
    };
  }
};