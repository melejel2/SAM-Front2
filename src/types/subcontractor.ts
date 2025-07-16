// Subcontractor Types matching the backend API

export interface Subcontractor {
  id: number;
  name: string | null;
  siegeSocial: string | null;
  commerceRegistrar: string | null;
  commerceNumber: string | null;
  taxNumber: string | null;
  representedBy: string | null;
  qualityRepresentive: string | null;
  subcontractorTel: string | null;
}

export interface SubcontractorFormData {
  name: string;
  siegeSocial: string;
  commerceRegistrar: string;
  commerceNumber: string;
  taxNumber: string;
  representedBy: string;
  qualityRepresentive: string;
  subcontractorTel: string;
}

export type SubcontractorCreateRequest = SubcontractorFormData;

export interface SubcontractorUpdateRequest extends SubcontractorFormData {
  id: number;
}

export interface SubcontractorApiResponse {
  isSuccess: boolean;
  success?: boolean; // For backward compatibility
  message?: string;
  data?: Subcontractor;
  status?: number;
}

export interface SubcontractorApiError {
  isSuccess: false;
  success: false;
  message: string;
  status?: number;
}

// Form field configuration for the subcontractor form
export interface SubcontractorFormField {
  name: keyof SubcontractorFormData;
  label: string;
  type: 'text' | 'email' | 'select';
  required: boolean;
  options?: string[];
}

// Display columns for the subcontractor table
export type SubcontractorTableColumns = {
  [K in keyof Omit<Subcontractor, 'id'>]: string;
};