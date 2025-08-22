import apiRequest from '@/api/api';
import { ContractDatasetStatus, CreateSubcontractorVoRequest } from '@/types/variation-order';

/**
 * VO API Service - Handles all VO-related API calls
 * Integrates with existing SAMBACK VoDataSet endpoints
 * 
 * FIXED: Updated to use existing SaveVoDataset endpoint instead of non-existent CreateSubcontractorVO
 * The createSubcontractorVO function now transforms simple VO data into the VoDatasetBoqDetailsVM format
 * expected by the backend's SaveVoDataset endpoint.
 */

// Response types
interface VoApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

interface VoApiError {
  success: false;
  error: string;
  message?: string;
}

/**
 * Create a simple subcontractor VO using the existing SaveVoDataset endpoint
 * @param request VO creation data
 * @param token Authentication token
 */
export const createSubcontractorVO = async (
  request: CreateSubcontractorVoRequest, 
  token: string
): Promise<VoApiResponse | VoApiError> => {
  try {
    // Transform the simple request into the VoDatasetBoqDetailsVM format expected by SaveVoDataset
    const voDatasetPayload = {
      Id: 0, // 0 for new VO
      VoNumber: request.VoNumber,
      Date: request.Date,
      Status: 'Editable', // Default status for new VOs
      Type: request.Type,
      ContractId: null, // Will be set by backend based on ContractsDatasetId
      ContractsDatasetId: request.ContractDatasetId,
      ProjectId: request.ProjectId,
      SubcontractorId: request.SubcontractorId,
      ContractNumber: '', // Will be populated by backend
      ProjectName: '', // Will be populated by backend
      SubcontractorName: '', // Will be populated by backend
      TradeName: '', // Will be populated by backend
      BuildingId: request.BuildingId,
      SubTrade: request.Description,
      Remark: request.Reason || '',
      Buildings: [
        {
          Id: request.BuildingId,
          BuildingName: '', // Will be populated by backend
          ReplaceAllItems: false,
          ContractVoes: [
            {
              Id: 0, // 0 for new item
              No: '1',
              Key: request.Description,
              Unite: 'LS', // Lump sum for simple VO
              Qte: 1,
              Pu: request.Amount,
              CostCode: null,
              CostCodeId: null,
              Boqtype: 'VO',
              BoqSheetId: 0,
              SheetName: 'VO Items',
              Level: 0,
              OrderVo: 1,
              TotalPrice: request.Amount
            }
          ]
        }
      ]
    };

    const response = await apiRequest({
      endpoint: 'VoDataSet/SaveVoDataset',
      method: 'POST',
      token,
      body: voDatasetPayload
    });

    if (response && typeof response === 'object') {
      // Handle success response
      if ('success' in response && response.success) {
        return response as VoApiResponse;
      }
      
      // Handle error response  
      if ('success' in response && !response.success) {
        return response as VoApiError;
      }
      
      // Handle backend Result format
      if ('isSuccess' in response) {
        if (response.isSuccess) {
          return { success: true, message: 'VO created successfully' };
        } else {
          return { 
            success: false, 
            error: (response as any).error?.message || (response as any).message || 'VO creation failed',
            message: (response as any).error?.message || (response as any).message
          };
        }
      }
    }
    
    // Default success for any other valid response
    return { success: true, message: 'VO created successfully', data: response };
  } catch (error) {
    console.error('Create VO API Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create VO',
      message: 'An error occurred while creating the VO'
    };
  }
};

/**
 * Get VO datasets list by status
 * @param status Contract dataset status
 * @param token Authentication token
 */
export const getVoDatasetsList = async (status: ContractDatasetStatus, token: string) => {
  try {
    const response = await apiRequest({
      endpoint: `VoDataSet/GetVoDatasetsList/${status}`,
      method: 'GET',
      token
    });

    return response;
  } catch (error) {
    console.error('Get VO datasets API Error:', error);
    throw error;
  }
};

/**
 * Get VO dataset with BOQ details
 * @param id VO dataset ID
 * @param token Authentication token
 */
export const getVoDatasetWithBoqs = async (id: number, token: string) => {
  try {
    const response = await apiRequest({
      endpoint: `VoDataSet/GetVoDatasetWithBoqs/${id}`,
      method: 'GET',
      token
    });

    return response;
  } catch (error) {
    console.error('Get VO dataset with BOQs API Error:', error);
    throw error;
  }
};

/**
 * Save VO dataset
 * @param model VO dataset BOQ details
 * @param token Authentication token
 */
export const saveVoDataset = async (model: any, token: string) => {
  try {
    const response = await apiRequest({
      endpoint: 'VoDataSet/SaveVoDataset',
      method: 'POST',
      token,
      body: model
    });

    return response;
  } catch (error) {
    console.error('Save VO dataset API Error:', error);
    throw error;
  }
};

/**
 * Create a new VO dataset using proper DTO structure (alternative to createSubcontractorVO)
 * @param voData VO creation data
 * @param token Authentication token
 */
export const createVoDataset = async (voData: {
  voNumber: string;
  description: string;
  reason?: string;
  amount: number;
  type: string;
  contractDatasetId: number;
  subcontractorId: number;
  projectId: number;
  buildingId: number;
  date: string;
}, token: string): Promise<VoApiResponse | VoApiError> => {
  try {
    // Create proper VoDatasetBoqDetailsVM structure
    const voDatasetPayload = {
      Id: 0, // 0 for new VO
      VoNumber: voData.voNumber,
      Date: voData.date,
      Status: 'Editable', // Default status for new VOs
      Type: voData.type,
      ContractId: null, // Will be set by backend based on ContractsDatasetId
      ContractsDatasetId: voData.contractDatasetId,
      ProjectId: voData.projectId,
      SubcontractorId: voData.subcontractorId,
      ContractNumber: '', // Will be populated by backend
      ProjectName: '', // Will be populated by backend
      SubcontractorName: '', // Will be populated by backend
      TradeName: '', // Will be populated by backend
      BuildingId: voData.buildingId,
      SubTrade: voData.description,
      Remark: voData.reason || '',
      Buildings: [
        {
          Id: voData.buildingId,
          BuildingName: '', // Will be populated by backend
          ReplaceAllItems: false,
          ContractVoes: [
            {
              Id: 0, // 0 for new item
              No: '1',
              Key: voData.description,
              Unite: 'LS', // Lump sum for simple VO
              Qte: 1,
              Pu: voData.amount,
              CostCode: null,
              CostCodeId: null,
              Boqtype: 'VO',
              BoqSheetId: 0,
              SheetName: 'VO Items',
              Level: 0,
              OrderVo: 1,
              TotalPrice: voData.amount
            }
          ]
        }
      ]
    };

    const response = await saveVoDataset(voDatasetPayload, token);

    // Handle response consistently
    if (response && typeof response === 'object') {
      if ('success' in response) {
        return response.success ? 
          { success: true, message: 'VO created successfully', data: response } : 
          { success: false, error: response.error || 'VO creation failed', message: response.message };
      }
      
      if ('isSuccess' in response) {
        return response.isSuccess ? 
          { success: true, message: 'VO created successfully', data: response } : 
          { success: false, error: response.error?.message || 'VO creation failed', message: response.error?.message };
      }
    }
    
    return { success: true, message: 'VO created successfully', data: response };
  } catch (error) {
    console.error('Create VO dataset API Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create VO',
      message: 'An error occurred while creating the VO'
    };
  }
};

/**
 * Generate live preview of VO
 * @param model VO dataset model
 * @param token Authentication token
 */
export const livePreviewVO = async (model: any, token: string): Promise<Blob> => {
  try {
    const response = await apiRequest({
      endpoint: 'VoDataSet/LivePreviewVO',
      method: 'POST',
      token,
      body: model,
      responseType: 'blob'
    });

    return response as Blob;
  } catch (error) {
    console.error('Live preview VO API Error:', error);
    throw error;
  }
};

// Export types for use in components
export type { VoApiResponse, VoApiError };
