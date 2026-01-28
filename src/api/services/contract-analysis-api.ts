import { ACTIVE_API_URL } from '../api';
import type {
  TemplateAnalysisSummary,
  TemplateRiskProfile,
  ContractHealthReport,
  ContractClause,
  AnalysisResult,
  DocumentScanResult,
} from '../../types/contract-analysis';

const getAuthToken = (): string | null => {
  const authData = localStorage.getItem('__SAM_ADMIN_AUTH__');
  if (authData) {
    try {
      const parsed = JSON.parse(authData);
      // Token is stored at user.token in the auth state
      return parsed.user?.token || null;
    } catch {
      return null;
    }
  }
  return null;
};

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    // Don't auto-logout on 401 - let the component handle the error gracefully
    // This prevents logout when the endpoint doesn't exist on server yet
    const errorText = await response.text();
    throw new Error(errorText || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

/**
 * Get list of all templates with their analysis status
 */
export async function getTemplatesWithAnalysisStatus(): Promise<TemplateAnalysisSummary[]> {
  const token = getAuthToken();
  const response = await fetch(`${ACTIVE_API_URL}ContractAnalysis/templates`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse<TemplateAnalysisSummary[]>(response);
}

/**
 * Analyze a contract template (Tier 1)
 */
export async function analyzeTemplate(templateId: number): Promise<AnalysisResult> {
  const token = getAuthToken();
  const response = await fetch(
    `${ACTIVE_API_URL}ContractAnalysis/templates/${templateId}/analyze`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return handleResponse<AnalysisResult>(response);
}

/**
 * Get template risk profile
 */
export async function getTemplateProfile(
  templateId: number
): Promise<TemplateRiskProfile> {
  const token = getAuthToken();
  const response = await fetch(
    `${ACTIVE_API_URL}ContractAnalysis/templates/${templateId}/profile`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return handleResponse<TemplateRiskProfile>(response);
}

/**
 * Get template clauses with risk assessments
 */
export async function getTemplateClauses(
  templateId: number
): Promise<ContractClause[]> {
  const token = getAuthToken();
  const response = await fetch(
    `${ACTIVE_API_URL}ContractAnalysis/templates/${templateId}/clauses`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return handleResponse<ContractClause[]>(response);
}

/**
 * Analyze a contract dataset (Tier 2)
 */
export async function analyzeContract(
  contractDatasetId: number
): Promise<AnalysisResult> {
  const token = getAuthToken();
  const response = await fetch(
    `${ACTIVE_API_URL}ContractAnalysis/contracts/${contractDatasetId}/analyze`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return handleResponse<AnalysisResult>(response);
}

/**
 * Get contract health report
 */
export async function getContractHealthReport(
  contractDatasetId: number
): Promise<ContractHealthReport> {
  const token = getAuthToken();
  const response = await fetch(
    `${ACTIVE_API_URL}ContractAnalysis/contracts/${contractDatasetId}/health-report`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return handleResponse<ContractHealthReport>(response);
}

/**
 * Get contract clauses with risk assessments
 */
export async function getContractClauses(
  contractDatasetId: number
): Promise<ContractClause[]> {
  const token = getAuthToken();
  const response = await fetch(
    `${ACTIVE_API_URL}ContractAnalysis/contracts/${contractDatasetId}/clauses`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return handleResponse<ContractClause[]>(response);
}

/**
 * Scan an uploaded document directly
 */
export async function scanDocument(file: File): Promise<DocumentScanResult> {
  const token = getAuthToken();
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${ACTIVE_API_URL}ContractAnalysis/scan`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  return handleResponse<DocumentScanResult>(response);
}

/**
 * Analyze all templates (batch operation)
 */
export async function analyzeAllTemplates(): Promise<TemplateAnalysisSummary[]> {
  const token = getAuthToken();
  const response = await fetch(
    `${ACTIVE_API_URL}ContractAnalysis/templates/analyze-all`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return handleResponse<TemplateAnalysisSummary[]>(response);
}
