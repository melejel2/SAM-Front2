import { ACTIVE_API_URL } from '../api';
import type {
  TemplateAnalysisSummary,
  ContractAnalysisSummary,
  TemplateRiskProfile,
  ContractHealthReport,
  ContractClause,
  AnalysisResult,
  AnalysisJob,
  DocumentScanResult,
  UploadedDocumentSummary,
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
 * Get list of all contracts with their analysis status
 */
export async function getContractsWithAnalysisStatus(): Promise<ContractAnalysisSummary[]> {
  const token = getAuthToken();
  const response = await fetch(`${ACTIVE_API_URL}ContractAnalysis/contracts`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse<ContractAnalysisSummary[]>(response);
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
 * Start async analysis for a template (returns job info)
 */
export async function startTemplateAnalysisJob(templateId: number): Promise<AnalysisJob> {
  const token = getAuthToken();
  const response = await fetch(
    `${ACTIVE_API_URL}ContractAnalysis/templates/${templateId}/analyze-async`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return handleResponse<AnalysisJob>(response);
}

/**
 * Start async analysis for a contract (returns job info)
 */
export async function startContractAnalysisJob(contractDatasetId: number): Promise<AnalysisJob> {
  const token = getAuthToken();
  const response = await fetch(
    `${ACTIVE_API_URL}ContractAnalysis/contracts/${contractDatasetId}/analyze-async`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return handleResponse<AnalysisJob>(response);
}

/**
 * Get analysis job status
 */
export async function getAnalysisJob(jobId: string): Promise<AnalysisJob> {
  const token = getAuthToken();
  const response = await fetch(
    `${ACTIVE_API_URL}ContractAnalysis/analysis-jobs/${jobId}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return handleResponse<AnalysisJob>(response);
}

/**
 * Get active analysis jobs by type
 */
export async function getActiveAnalysisJobs(jobType: 'Template' | 'Contract'): Promise<AnalysisJob[]> {
  const token = getAuthToken();
  const response = await fetch(
    `${ACTIVE_API_URL}ContractAnalysis/analysis-jobs/active?jobType=${jobType}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return handleResponse<AnalysisJob[]>(response);
}

/**
 * Cancel an analysis job
 */
export async function cancelAnalysisJob(jobId: string): Promise<AnalysisJob> {
  const token = getAuthToken();
  const response = await fetch(
    `${ACTIVE_API_URL}ContractAnalysis/analysis-jobs/${jobId}/cancel`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return handleResponse<AnalysisJob>(response);
}

/**
 * Get active analysis job by target (optional helper)
 */
export async function getActiveAnalysisJob(jobType: 'Template' | 'Contract', targetId: number): Promise<AnalysisJob | null> {
  const token = getAuthToken();
  const response = await fetch(
    `${ACTIVE_API_URL}ContractAnalysis/analysis-jobs/by-target?jobType=${jobType}&targetId=${targetId}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  if (response.status === 404) return null;
  return handleResponse<AnalysisJob>(response);
}

/**
 * Poll an analysis job until it completes
 */
export async function waitForAnalysisJob(
  jobId: string,
  options?: { intervalMs?: number; timeoutMs?: number; signal?: AbortSignal }
): Promise<AnalysisJob> {
  const intervalMs = options?.intervalMs ?? 3000;
  const timeoutMs = options?.timeoutMs ?? 15 * 60 * 1000;
  const startedAt = Date.now();

  while (true) {
    if (options?.signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    const job = await getAnalysisJob(jobId);
    if (job.status === 'Succeeded' || job.status === 'Failed' || job.status === 'Canceled') {
      return job;
    }

    if (Date.now() - startedAt > timeoutMs) {
      throw new Error('Analysis job timed out');
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
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
 * Get contract template document in SFDT format for Document Editor
 */
export async function getTemplateSfdt(templateId: number): Promise<string> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Missing authentication token');
  }

  const response = await fetch(
    `${ACTIVE_API_URL}Templates/GetTemplateSfdt/${templateId}?isVo=false`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `HTTP error! status: ${response.status}`);
  }

  const rawText = await response.text();
  try {
    const json = JSON.parse(rawText);
    if (json && typeof json === 'object' && 'success' in json && !json.success) {
      throw new Error((json as any).message || 'Failed to load template document');
    }
    return JSON.stringify(json);
  } catch {
    return rawText;
  }
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

// ============================================
// UPLOADED DOCUMENTS API
// ============================================

/**
 * Save a scan result to the database
 */
export async function saveScanResult(result: DocumentScanResult): Promise<{ id: number }> {
  const token = getAuthToken();
  const response = await fetch(`${ACTIVE_API_URL}ContractAnalysis/scan/save`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fileName: result.fileName || 'Scanned Document',
      overallScore: result.overallScore,
      totalClauses: result.totalClauses,
      criticalCount: result.criticalCount,
      highCount: result.highCount,
      mediumCount: result.mediumCount,
      lowCount: result.lowCount,
      categoryScores: result.categoryScores,
      summary: result.summary,
      recommendations: result.recommendations,
      topRisks: result.topRisks,
      clauses: result.clauses,
      clientOverallScore: result.clientOverallScore,
      clientCriticalCount: result.clientCriticalCount,
      clientHighCount: result.clientHighCount,
      clientMediumCount: result.clientMediumCount,
      clientLowCount: result.clientLowCount,
      subcontractorOverallScore: result.subcontractorOverallScore,
      subcontractorCriticalCount: result.subcontractorCriticalCount,
      subcontractorHighCount: result.subcontractorHighCount,
      subcontractorMediumCount: result.subcontractorMediumCount,
      subcontractorLowCount: result.subcontractorLowCount,
    }),
  });
  return handleResponse<{ id: number }>(response);
}

/**
 * Get all uploaded documents
 */
export async function getUploadedDocuments(): Promise<UploadedDocumentSummary[]> {
  const token = getAuthToken();
  const response = await fetch(`${ACTIVE_API_URL}ContractAnalysis/uploaded-documents`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse<UploadedDocumentSummary[]>(response);
}

/**
 * Get an uploaded document with full details
 */
export async function getUploadedDocument(id: number): Promise<DocumentScanResult> {
  const token = getAuthToken();
  const response = await fetch(`${ACTIVE_API_URL}ContractAnalysis/uploaded-documents/${id}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse<DocumentScanResult>(response);
}

/**
 * Get clauses for an uploaded document
 */
export async function getUploadedDocumentClauses(id: number): Promise<ContractClause[]> {
  const token = getAuthToken();
  const response = await fetch(
    `${ACTIVE_API_URL}ContractAnalysis/uploaded-documents/${id}/clauses`,
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
 * Delete an uploaded document
 */
export async function deleteUploadedDocument(id: number): Promise<void> {
  const token = getAuthToken();
  const response = await fetch(`${ACTIVE_API_URL}ContractAnalysis/uploaded-documents/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  await handleResponse<void>(response);
}

/**
 * Send a chat message about a scanned document (in-memory)
 */
export async function sendScanChatMessage(
  message: string,
  context: ContractContext,
  sessionId?: string,
  signal?: AbortSignal
): Promise<ContractChatResponse> {
  const token = getAuthToken();
  const response = await fetch(`${ACTIVE_API_URL}ContractAnalysis/scan/chat`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      sessionId,
      context,
    }),
    signal,
  });
  return handleResponse<ContractChatResponse>(response);
}

/**
 * Send a chat message about a saved uploaded document
 */
export async function sendUploadedDocumentChatMessage(
  documentId: number,
  message: string,
  context: ContractContext,
  sessionId?: string,
  signal?: AbortSignal
): Promise<ContractChatResponse> {
  const token = getAuthToken();
  const response = await fetch(
    `${ACTIVE_API_URL}ContractAnalysis/uploaded-documents/${documentId}/chat`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        sessionId,
        context,
      }),
      signal,
    }
  );
  return handleResponse<ContractChatResponse>(response);
}

// ============================================
// CHAT API
// ============================================

/**
 * Chat request interface
 */
export interface ContractChatRequest {
  message: string;
  templateId?: number;
  contractId?: number;
  sessionId?: string;
  isNewSession?: boolean;
}

/**
 * Chat response interface
 */
export interface ContractChatResponse {
  success: boolean;
  response: string;
  sessionId?: string;
  error?: string;
  suggestions?: string[];
  referencedClauses?: string[];
}

/**
 * Contract context for chat
 */
export interface ContractContext {
  templateName?: string;
  templateId?: number;
  contractId?: number;
  overallScore?: number;
  criticalCount?: number;
  highCount?: number;
  mediumCount?: number;
  lowCount?: number;
  totalClauses?: number;
  categoryScores?: {
    payment: number;
    roleResponsibility: number;
    safety: number;
    temporal: number;
    procedure: number;
    definition: number;
    reference: number;
  };
  topRisks?: Array<{
    category: string;
    level: string;
    description: string;
    recommendation?: string;
    clauseRef?: string;
    matchedText?: string;
  }>;
  clauseNumbers?: string[];
  perspective?: 'client' | 'subcontractor';
}

/**
 * Send a chat message about a template
 */
export async function sendTemplateChatMessage(
  templateId: number,
  message: string,
  context: ContractContext,
  sessionId?: string,
  signal?: AbortSignal
): Promise<ContractChatResponse> {
  const token = getAuthToken();
  const response = await fetch(
    `${ACTIVE_API_URL}ContractAnalysis/templates/${templateId}/chat`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        templateId,
        sessionId,
        context,
      }),
      signal,
    }
  );
  return handleResponse<ContractChatResponse>(response);
}

/**
 * Send a chat message about a contract
 */
export async function sendContractChatMessage(
  contractId: number,
  message: string,
  context: ContractContext,
  sessionId?: string,
  signal?: AbortSignal
): Promise<ContractChatResponse> {
  const token = getAuthToken();
  const response = await fetch(
    `${ACTIVE_API_URL}ContractAnalysis/contracts/${contractId}/chat`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        contractId,
        sessionId,
        context,
      }),
      signal,
    }
  );
  return handleResponse<ContractChatResponse>(response);
}
