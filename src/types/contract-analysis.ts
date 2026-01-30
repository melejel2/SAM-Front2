/**
 * Contract Analysis Types
 * Based on Moon et al. (2022) "Toxic Clauses" classification
 */

// Risk categories (7 types from Moon et al.)
export enum RiskCategory {
  Payment = 'Payment',
  RoleResponsibility = 'RoleResponsibility',
  Safety = 'Safety',
  Temporal = 'Temporal',
  Procedure = 'Procedure',
  Definition = 'Definition',
  Reference = 'Reference',
}

// Risk level
export enum RiskLevel {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
  Critical = 'Critical',
}

// English labels for risk categories
export const RiskCategoryLabels: Record<RiskCategory, string> = {
  [RiskCategory.Payment]: 'Payment Risk',
  [RiskCategory.RoleResponsibility]: 'Role & Responsibility',
  [RiskCategory.Safety]: 'Safety & Insurance',
  [RiskCategory.Temporal]: 'Timeline & Penalties',
  [RiskCategory.Procedure]: 'Procedures & Claims',
  [RiskCategory.Definition]: 'Definitions & Ambiguities',
  [RiskCategory.Reference]: 'Reference Documents',
};

// Colors for risk levels
export const RiskLevelColors: Record<RiskLevel, string> = {
  [RiskLevel.Low]: '#6b7280', // gray
  [RiskLevel.Medium]: '#a16207', // muted amber
  [RiskLevel.High]: '#b91c1c', // muted red
  [RiskLevel.Critical]: '#4a1d1d', // dark muted red
};

// Category scores
export interface CategoryScores {
  payment: number;
  roleResponsibility: number;
  safety: number;
  temporal: number;
  procedure: number;
  definition: number;
  reference: number;
}

// Risk assessment for a clause
export interface RiskAssessment {
  id: number;
  category: string;
  categoryFr: string;
  categoryEn: string;
  level: string;
  levelFr: string;
  score: number;
  riskDescription?: string;
  riskDescriptionEn?: string;
  recommendation?: string;
  recommendationEn?: string;
  matchedText?: string;
}

// Contract clause with risk assessments
export interface ContractClause {
  id: number;
  clauseNumber?: string;
  clauseTitle?: string;
  clauseContent?: string;
  clauseOrder: number;
  riskAssessments: RiskAssessment[];
}

// Template risk profile
export interface TemplateRiskProfile {
  id: number;
  contractTemplateId: number;
  templateName?: string;
  overallScore: number;
  totalClauses: number;
  criticalRiskCount: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
  categoryScores: CategoryScores;
  summary?: string;
  topRecommendations: string[];
  generatedAt: string;
  analysisVersion?: string;
}

// Contract health report
export interface ContractHealthReport {
  id: number;
  contractDatasetId: number;
  contractNumber?: string;
  projectName?: string;
  subcontractorName?: string;
  overallScore: number;
  templateBaselineScore: number;
  deltaFromTemplate: number;
  modificationsDetected: number;
  newRisksIntroduced: number;
  risksMitigated: number;
  totalClauses: number;
  criticalRiskCount: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
  categoryScores: CategoryScores;
  summary?: string;
  recommendations: string[];
  generatedAt: string;
  analysisVersion?: string;
}

// Template analysis summary (for list view)
export interface TemplateAnalysisSummary {
  contractTemplateId: number;
  templateName?: string;
  templateType?: string;
  overallScore?: number;
  criticalRiskCount?: number;
  highRiskCount?: number;
  isAnalyzed: boolean;
  lastAnalyzedAt?: string;
}

// Contract analysis summary (for list view)
export interface ContractAnalysisSummary {
  contractDatasetId: number;
  contractNumber?: string;
  projectName?: string;
  subcontractorName?: string;
  status?: string;
  overallScore?: number;
  criticalRiskCount?: number;
  highRiskCount?: number;
  isAnalyzed: boolean;
  lastAnalyzedAt?: string;
}

// Analysis result from API
export interface AnalysisResult {
  success: boolean;
  errorMessage?: string;
  templateProfile?: TemplateRiskProfile;
  healthReport?: ContractHealthReport;
  clauses: ContractClause[];
  topRisks: RiskAssessment[];
}

// Document scan result (for direct upload)
export interface DocumentScanResult {
  success: boolean;
  errorMessage?: string;
  overallScore: number;
  totalClauses: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  categoryScores: CategoryScores;
  summary?: string;
  recommendations: string[];
  topRisks: RiskAssessment[];
}

// Helper function to get health status label
export function getHealthStatus(score: number): {
  label: string;
  color: string;
} {
  if (score >= 80) {
    return { label: 'Good', color: '#374151' };
  } else if (score >= 60) {
    return { label: 'Moderate', color: '#a16207' };
  } else if (score >= 40) {
    return { label: 'Concerning', color: '#b91c1c' };
  } else {
    return { label: 'Critical', color: '#4a1d1d' };
  }
}

// Helper function to get risk level from string
export function getRiskLevel(level: string): RiskLevel {
  switch (level.toLowerCase()) {
    case 'critical':
      return RiskLevel.Critical;
    case 'high':
      return RiskLevel.High;
    case 'medium':
      return RiskLevel.Medium;
    default:
      return RiskLevel.Low;
  }
}
