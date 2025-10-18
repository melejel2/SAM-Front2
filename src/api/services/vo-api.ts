import apiRequest from '@/api/api';
import { ContractDatasetStatus, CreateSubcontractorVoRequest } from '@/types/variation-order';

/**
 * VO API Service - Handles all VO-related API calls
 * Integrates with existing SAMBACK VoDataSet endpoints
 * 
 * CONTRACT VO CREATION: Complete API integration for contract-specific VO creation wizard
 * Updated: January 2025 - Added proper contract VO creation support
 */

// Contract VO Creation Types
export interface VoDatasetBoqDetailsVM {
  Id: number;
  VoNumber: string;
  Date: string;
  Status: string;
  Type: string;
  ContractId: number;
  ContractsDatasetId: number;
  ProjectId: number;
  SubcontractorId: number;
  ContractNumber: string;
  ProjectName: string;
  SubcontractorName: string;
  TradeName: string;
  BuildingId?: number;
  SubTrade: string;
  Remark: string;
  Amount: number;
  Buildings: VoDataSetBuildingsVM[];
}

export interface VoDataSetBuildingsVM {
  Id: number;
  BuildingName: string;
  ReplaceAllItems: boolean;
  ContractVoes: ContractVoVM[];
}

export interface ContractVoVM {
  Id: number;
  No: string;
  Key: string;
  Unite: string;
  Qte: number;
  Pu: number;
  CostCode?: any;
  CostCodeId?: number | null;
  Boqtype: string;
  BoqSheetId: number;
  SheetName: string;
  Level: number;
  OrderVo: number;
  TotalPrice: number;
}

export interface ContractContext {
  id: number;
  contractNumber: string;
  projectId: number;
  projectName: string;
  subcontractorId: number;
  subcontractorName: string;
  currencyId: number;
  currencySymbol: string;
  tradeName?: string;
  buildings: ContractBuilding[];
}

export interface ContractBuilding {
  id: number;
  name: string;
  buildingName: string;
}

export interface VOGenerationRequest {
  contractId: number;
}

export interface ImportContractVoRequest {
  ContractDataSetId: number;
  excelFile: File;
}

export interface BuildingsVOs {
    buildingId: number;
    name: string;
    voLevel: number;
    vo: string;
}

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
 * @param status Contract dataset status or 'All' for all statuses
 * @param token Authentication token
 */
export const getVoDatasetsList = async (status: ContractDatasetStatus | 'All', token: string) => {
  try {
    // Handle "All" parameter that backend now supports (commit e7d30b0)
    const statusParam = status === 'All' ? 'All' : status.toString();
    
    const response = await apiRequest({
      endpoint: `VoDataSet/GetVoDatasetsList/${statusParam}`,
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

/**
 * Preview VO dataset (saved)
 * @param voDataSetId VO dataset ID
 * @param token Authentication token
 */
export const previewVoDataSet = async (voDataSetId: number, token: string): Promise<Blob> => {
  try {
    const response = await apiRequest({
      endpoint: `VoDataSet/PreviewVoDataSet?VoDataSetId=${voDataSetId}`,
      method: 'GET',
      token,
      responseType: 'blob'
    });

    return response as Blob;
  } catch (error) {
    console.error('Preview VO dataset API Error:', error);
    throw error;
  }
};

/**
 * Copy VO project to VO dataset
 * @param buildingId Building ID
 * @param voLevel VO level
 * @param contractDataSetId Contract dataset ID
 * @param token Authentication token
 */
export const copyVoProjectToVoDataSet = async (
  buildingId: number, 
  voLevel: number, 
  contractDataSetId: number, 
  token: string
) => {
  try {
    const queryParams = new URLSearchParams({
      buildingId: buildingId.toString(),
      voLevel: voLevel.toString(),
      contractDataSetId: contractDataSetId.toString()
    });

    const response = await apiRequest({
      endpoint: `VoDataSet/CopyVoProjectToVoDataSet?${queryParams.toString()}`,
      method: 'GET',
      token
    });

    return response;
  } catch (error) {
    console.error('Copy VO project to dataset API Error:', error);
    throw error;
  }
};

/**
 * Upload contract VO from Excel file
 * @param contractDataSetId Contract dataset ID
 * @param excelFile Excel file
 * @param token Authentication token
 */
export const uploadContractVo = async (
  contractDataSetId: number, 
  excelFile: File, 
  token: string
) => {
  try {
    const formData = new FormData();
    formData.append('ContractDataSetId', contractDataSetId.toString());
    formData.append('excelFile', excelFile);

    const response = await apiRequest({
      endpoint: 'VoDataSet/UploadContractVo',
      method: 'POST',
      token,
      body: formData
    });

    return response;
  } catch (error) {
    console.error('Upload contract VO API Error:', error);
    throw error;
  }
};

/**
 * Generate VO dataset
 * @param id VO dataset ID
 * @param token Authentication token
 */
export const generateVoDataSet = async (id: number, token: string): Promise<VoApiResponse | VoApiError> => {
  try {
    const response = await apiRequest({
      endpoint: `VoDataSet/GenerateVoDataSet/${id}`,
      method: 'POST',
      token
    });

    if (response && typeof response === 'object') {
      if ('success' in response) {
        return response.success ? 
          { success: true, message: 'VO dataset generated successfully', data: response } : 
          { success: false, error: response.error || 'Generation failed', message: response.message };
      }
      
      if ('isSuccess' in response) {
        return response.isSuccess ? 
          { success: true, message: 'VO dataset generated successfully', data: response } : 
          { success: false, error: response.error?.message || 'Generation failed', message: response.error?.message };
      }
    }
    
    return { success: true, message: 'VO dataset generated successfully', data: response };
  } catch (error) {
    console.error('Generate VO dataset API Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate VO dataset',
      message: 'An error occurred while generating the VO dataset'
    };
  }
};

/**
 * Clear VO contract items
 * @param voDataSetId VO dataset ID
 * @param token Authentication token
 */
export const clearVoContractItems = async (voDataSetId: number, token: string): Promise<VoApiResponse | VoApiError> => {
  try {
    const response = await apiRequest({
      endpoint: 'VoDataSet/ClearVoContracItems',
      method: 'POST',
      token,
      body: { VoDataSetId: voDataSetId }
    });

    if (response && typeof response === 'object') {
      if ('success' in response) {
        return response.success ? 
          { success: true, message: 'VO contract items cleared successfully', data: response } : 
          { success: false, error: response.error || 'Clear operation failed', message: response.message };
      }
      
      if ('isSuccess' in response) {
        return response.isSuccess ? 
          { success: true, message: 'VO contract items cleared successfully', data: response } : 
          { success: false, error: response.error?.message || 'Clear operation failed', message: response.error?.message };
      }
    }
    
    return { success: true, message: 'VO contract items cleared successfully', data: response };
  } catch (error) {
    console.error('Clear VO contract items API Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to clear VO contract items',
      message: 'An error occurred while clearing VO contract items'
    };
  }
};

/**
 * Delete editable VO dataset
 * @param id VO dataset ID
 * @param token Authentication token
 */
export const deleteVoDataSet = async (id: number, token: string): Promise<VoApiResponse | VoApiError> => {
  try {
    const response = await apiRequest({
      endpoint: `VoDataSet/DeleteVoDataSet/${id}`,
      method: 'DELETE',
      token
    });

    if (response && typeof response === 'object') {
      if ('success' in response) {
        return response.success ? 
          { success: true, message: 'VO dataset deleted successfully', data: response } : 
          { success: false, error: response.error || 'Delete operation failed', message: response.message };
      }
      
      if ('isSuccess' in response) {
        return response.isSuccess ? 
          { success: true, message: 'VO dataset deleted successfully', data: response } : 
          { success: false, error: response.error?.message || 'Delete operation failed', message: response.error?.message };
      }
    }
    
    return { success: true, message: 'VO dataset deleted successfully', data: response };
  } catch (error) {
    console.error('Delete VO dataset API Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete VO dataset',
      message: 'An error occurred while deleting the VO dataset'
    };
  }
};

// ===== CONTRACT VO CREATION APIS =====

/**
 * Get contract context data for VO creation
 * @param contractId Contract dataset ID
 * @param token Authentication token
 */
export const getContractForVO = async (contractId: number, token: string): Promise<VoApiResponse<ContractContext> | VoApiError> => {
  try {
    console.log("🌐 Making API request for contract VO data:", {
      endpoint: `ContractsDatasets/GetSubcontractorData/${contractId}`,
      contractId,
      hasToken: !!token,
      tokenPreview: token ? `${token.substring(0, 20)}...` : 'No token'
    });

    const response = await apiRequest({
      endpoint: `ContractsDatasets/GetSubcontractorData/${contractId}`,
      method: 'GET',
      token
    });

    console.log("📥 Raw API response:", response);

    // The API returns the data directly, not wrapped in a success/data structure
    if (response && response.id) {
      // Transform backend data to contract context
      // Check multiple possible field names for project and subcontractor
      // The backend includes related entities but doesn't map names to the DTO
      const projectName = response.projectName || 
                          response.project?.name || 
                          response.project?.acronym ||
                          response.projectTitle || 
                          `Project ${response.projectId}`;
                          
      const subcontractorName = response.subcontractorName || 
                                response.subContractor?.name || 
                                response.subcontractor?.name || 
                                response.contractorName || 
                                `Subcontractor ${response.subContractorId || response.subcontractorId}`;
      
      // Get currency symbol from related entity or response
      const currencySymbol = response.currencySymbol || 
                             response.currency?.symbol || 
                             response.currency?.name ||
                             'MAD';
      
      const contractContext: ContractContext = {
        id: response.id,
        contractNumber: response.contractNumber || `Contract-${contractId}`,
        projectId: response.projectId,
        projectName: projectName,
        subcontractorId: response.subContractorId || response.subcontractorId,
        subcontractorName: subcontractorName,
        currencyId: response.currencyId,
        currencySymbol: currencySymbol,
        tradeName: response.subTrade || response.trade || response.tradeName || '',
        buildings: (response.buildings || []).map((building: any) => ({
          id: building.id,
          name: building.buildingName || building.name || `Building ${building.id}`,
          buildingName: building.buildingName || building.name || `Building ${building.id}`
        }))
      };
      
      return {
        success: true,
        data: contractContext,
        message: 'Contract context loaded successfully'
      };
    }
    
    return {
      success: false,
      error: 'Failed to load contract context',
      message: 'Contract data not found or invalid response format'
    };
  } catch (error) {
    console.error('Get contract for VO API Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load contract context',
      message: 'An error occurred while loading contract information'
    };
  }
};

/**
 * Get contract buildings for VO creation
 * @param contractId Contract dataset ID
 * @param token Authentication token
 */
export const getContractBuildings = async (contractId: number, token: string): Promise<VoApiResponse<ContractBuilding[]> | VoApiError> => {
  try {
    const contractResponse = await getContractForVO(contractId, token);
    
    if (contractResponse.success && contractResponse.data) {
      return {
        success: true,
        data: contractResponse.data.buildings,
        message: 'Contract buildings loaded successfully'
      };
    }
    
    return {
      success: false,
      error: (contractResponse as VoApiError).error || 'Failed to load contract buildings',
      message: contractResponse.message || 'Unable to retrieve building information'
    };
  } catch (error) {
    console.error('Get contract buildings API Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load contract buildings',
      message: 'An error occurred while loading building information'
    };
  }
};

/**
 * Get contract BOQ items for selected building (for Step 4)
 * @param contractId Contract dataset ID
 * @param buildingId Building ID
 * @param token Authentication token
 */
export const getContractBOQItems = async (contractId: number, buildingId: number, token: string): Promise<VoApiResponse<any[]> | VoApiError> => {
  try {
    const response = await apiRequest({
      endpoint: `ContractsDatasets/GetSubcontractorData/${contractId}`,
      method: 'GET',
      token
    });

    if (response && response.success && response.data) {
      const data = response.data;
      
      // Find the specific building's BOQ items
      const building = (data.buildings || []).find((b: any) => b.id === buildingId);
      
      if (building && building.contractBOQs) {
        return {
          success: true,
          data: building.contractBOQs,
          message: 'BOQ items loaded successfully'
        };
      }
      
      return {
        success: true,
        data: [],
        message: 'No BOQ items found for this building'
      };
    }
    
    return {
      success: false,
      error: 'Failed to load BOQ items',
      message: 'Contract data not found or invalid response format'
    };
  } catch (error) {
    console.error('Get contract BOQ items API Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load BOQ items',
      message: 'An error occurred while loading BOQ items'
    };
  }
};

/**
 * Generate VO number (auto-generation)
 * @param contractId Contract dataset ID
 * @param token Authentication token
 */
export const generateVONumber = async (contractId: number, token: string): Promise<VoApiResponse<string> | VoApiError> => {
  try {
    // For now, generate locally. In future, this could be a backend endpoint
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const time = date.getTime().toString().slice(-4);
    const voNumber = `VO-C${contractId}-${year}${month}${day}-${time}`;
    
    return {
      success: true,
      data: voNumber,
      message: 'VO number generated successfully'
    };
  } catch (error) {
    console.error('Generate VO number API Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate VO number',
      message: 'An error occurred while generating VO number'
    };
  }
};

/**
 * Create contract VO using proper VoDatasetBoqDetailsVM structure
 * @param voData VO dataset creation data
 * @param token Authentication token
 */
export const createContractVO = async (voData: VoDatasetBoqDetailsVM, token: string): Promise<VoApiResponse | VoApiError> => {
  try {
    const response = await apiRequest({
      endpoint: 'VoDataSet/SaveVoDataset',
      method: 'POST',
      token,
      body: voData as any // Cast to satisfy TypeScript requirements
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
          return { success: true, message: 'Contract VO created successfully' };
        } else {
          return { 
            success: false, 
            error: (response as any).error?.message || (response as any).message || 'Contract VO creation failed',
            message: (response as any).error?.message || (response as any).message
          };
        }
      }
    }
    
    // Default success for any other valid response
    return { success: true, message: 'Contract VO created successfully', data: response };
  } catch (error) {
    console.error('Create contract VO API Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create contract VO',
      message: 'An error occurred while creating the contract VO'
    };
  }
};

/**
 * Get VOs for a specific contract (for contract details page)
 * @param contractId Contract dataset ID
 * @param token Authentication token
 */
export const getContractVOs = async (contractId: number, token: string): Promise<VoApiResponse<any[]> | VoApiError> => {
  try {
    const status = 'All';
    const queryParams = new URLSearchParams({
        status: status,
        contractDataSetId: contractId.toString()
    });

    const response = await apiRequest({
      endpoint: `VoDataSet/GetVoDatasetsList?${queryParams.toString()}`,
      method: 'GET',
      token
    });

    if (response && Array.isArray(response)) {
      return {
        success: true,
        data: response,
        message: `Found ${response.length} VOs for this contract`
      };
    }

    if (response && response.success && Array.isArray(response.data)) {
        return response;
    }
    
    if (response && !response.success) {
        return response;
    }

    return {
      success: true,
      data: [],
      message: 'No VOs found for this contract'
    };
  } catch (error) {
    console.error('Get contract VOs API Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load contract VOs',
      message: 'An error occurred while loading contract VOs'
    };
  }
};

/**
 * Transform UI form data to backend VoDatasetBoqDetailsVM format
 * @param formData UI form data from wizard
 * @param contractContext Contract context information
 */
export const transformFormDataToVoDataset = (formData: any, contractContext: ContractContext): VoDatasetBoqDetailsVM => {
  // Group line items by building
  const buildingGroups: { [buildingId: number]: any[] } = {};
  
  formData.lineItems.forEach((item: any) => {
    const targetBuildingId = item.buildingId || formData.selectedBuildingIds[0]; // Use first selected if not specified
    
    if (!buildingGroups[targetBuildingId]) {
      buildingGroups[targetBuildingId] = [];
    }
    
    buildingGroups[targetBuildingId].push({
      Id: 0, // New item
      No: item.no,
      Key: item.description,
      Unite: item.unit,
      Qte: item.quantity,
      Pu: item.unitPrice,
      CostCode: item.costCode,
      CostCodeId: null,
      Boqtype: 'VO',
      BoqSheetId: 0,
      SheetName: 'VO Items',
      Level: 0,
      OrderVo: buildingGroups[targetBuildingId].length + 1,
      TotalPrice: item.quantity * item.unitPrice
    });
  });
  
  // Create buildings array
  const buildings: VoDataSetBuildingsVM[] = formData.selectedBuildingIds.map((buildingId: number) => {
    const building = contractContext.buildings.find(b => b.id === buildingId);
    
    return {
      Id: buildingId,
      BuildingName: building?.name || `Building ${buildingId}`,
      ReplaceAllItems: false, // Never replace for additions
      ContractVoes: buildingGroups[buildingId] || []
    };
  });
  
  // Calculate total amount
  const totalAmount = formData.lineItems.reduce((sum: number, item: any) => 
    sum + (item.quantity * item.unitPrice), 0
  );
  
  return {
    Id: 0, // New VO
    VoNumber: formData.voNumber,
    Date: formData.voDate,
    Status: formData.status || 'Editable',
    Type: formData.voType,
    ContractId: formData.voContractId,
    ContractsDatasetId: contractContext.id,
    ProjectId: contractContext.projectId,
    SubcontractorId: contractContext.subcontractorId,
    ContractNumber: contractContext.contractNumber,
    ProjectName: contractContext.projectName,
    SubcontractorName: contractContext.subcontractorName,
    TradeName: contractContext.tradeName || '',
    BuildingId: formData.selectedBuildingIds[0], // Primary building
    SubTrade: formData.description,
    Remark: formData.reason || '',
    Amount: totalAmount,
    Buildings: buildings
  };
};

/**
 * Get available VOs for a project
 * @param projectId Project ID
 * @param token Authentication token
 */
export const getVosBuildings = async (projectId: number, token: string): Promise<VoApiResponse<BuildingsVOs[]> | VoApiError> => {
  try {
    const response = await apiRequest({
      endpoint: `Building/GetVosBuildings?projectId=${projectId}`,
      method: 'GET',
      token
    });

    // The backend returns data directly, so we wrap it
    if (response && Array.isArray(response)) {
      return {
        success: true,
        data: response,
        message: `Found ${response.length} VOs for this project`
      };
    }

    // Handle cases where it might be pre-wrapped
    if (response && response.success && Array.isArray(response.data)) {
        return response;
    }
    
    if (response && !response.success) {
        return response;
    }

    // Default empty success response
    return {
      success: true,
      data: [],
      message: 'No VOs found for this project'
    };
  } catch (error) {
    console.error('Get VOs Buildings API Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load VOs for buildings',
      message: 'An error occurred while loading VOs for buildings'
    };
  }
};

/**
 * Get VO Contracts by type
 * @param token Authentication token
 */
export const getVoContracts = async (token: string) => {
  try {
    const response = await apiRequest({
      endpoint: 'Templates/GetVOContracts?type=0',
      method: 'GET',
      token
    });
    return response;
  } catch (error) {
    console.error('Get VO Contracts API Error:', error);
    throw error;
  }
};

// Export types for use in components
export type { 
  VoApiResponse, 
  VoApiError
};
