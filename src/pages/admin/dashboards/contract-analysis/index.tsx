import { useEffect, useState, useCallback, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { Spreadsheet } from '@/components/Spreadsheet';
import type { SpreadsheetColumn } from '@/components/Spreadsheet';
import { useTopbarContent } from '@/contexts/topbar-content';
import useToast from '@/hooks/use-toast';
import {
  getTemplatesWithAnalysisStatus,
  getContractsWithAnalysisStatus,
  analyzeTemplate,
  analyzeContract,
  analyzeAllTemplates,
  scanDocument,
} from '@/api/services/contract-analysis-api';
import type {
  TemplateAnalysisSummary,
  ContractAnalysisSummary,
  DocumentScanResult,
} from '@/types/contract-analysis';
import { getHealthStatus, RiskLevelColors } from '@/types/contract-analysis';

// Icons
import arrowLeftIcon from '@iconify/icons-lucide/arrow-left';
import fileTextIcon from '@iconify/icons-lucide/file-text';
import fileCheckIcon from '@iconify/icons-lucide/file-check';
import scanIcon from '@iconify/icons-lucide/scan';
import eyeIcon from '@iconify/icons-lucide/eye';
import refreshCwIcon from '@iconify/icons-lucide/refresh-cw';
import playIcon from '@iconify/icons-lucide/play';
import uploadCloudIcon from '@iconify/icons-lucide/upload-cloud';
import infoIcon from '@iconify/icons-lucide/info';

type TabType = 'templates' | 'contracts';

// How It Works Modal Component
const HowItWorksModal = memo(({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-7xl w-[95vw] max-h-[90vh] p-0">
        {/* Header */}
        <div className="sticky top-0 bg-base-100 border-b border-base-200 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h3 className="font-bold text-xl">How Contract Analysis Works</h3>
            <p className="text-sm text-base-content/60 mt-1">
              AI-powered contract risk assessment based on academic research
            </p>
          </div>
          <button
            className="btn btn-sm btn-circle btn-ghost"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-8 overflow-y-auto">
          {/* Introduction */}
          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <Icon icon={fileTextIcon} className="size-6 text-primary" />
              </div>
              <div>
                <h4 className="font-bold text-lg text-primary mb-2">Research-Based Classification</h4>
                <p className="text-base-content/80">
                  This system implements the <strong>"Toxic Clauses"</strong> classification framework from
                  Moon et al. (2022), a peer-reviewed study that identified 7 categories of problematic
                  clauses in construction contracts. The system has been adapted for French construction
                  contracts and local regulatory requirements.
                </p>
              </div>
            </div>
          </div>

          {/* How It Works - Step by Step */}
          <div>
            <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-primary text-primary-content flex items-center justify-center text-sm">1</span>
              How It Works
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-base-200/50 rounded-xl p-5 border border-base-300">
                <div className="w-10 h-10 rounded-lg bg-info/20 flex items-center justify-center mb-3">
                  <Icon icon={uploadCloudIcon} className="size-5 text-info" />
                </div>
                <h5 className="font-semibold mb-2">Upload & Parse</h5>
                <p className="text-sm text-base-content/70">
                  The system extracts text from your contract documents (Word/PDF) and identifies
                  individual clauses using natural language processing.
                </p>
              </div>
              <div className="bg-base-200/50 rounded-xl p-5 border border-base-300">
                <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center mb-3">
                  <Icon icon={scanIcon} className="size-5 text-warning" />
                </div>
                <h5 className="font-semibold mb-2">Analyze & Classify</h5>
                <p className="text-sm text-base-content/70">
                  Each clause is analyzed against a library of risk patterns across 7 categories.
                  The system identifies potentially problematic language and assigns risk levels.
                </p>
              </div>
              <div className="bg-base-200/50 rounded-xl p-5 border border-base-300">
                <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center mb-3">
                  <Icon icon={fileCheckIcon} className="size-5 text-success" />
                </div>
                <h5 className="font-semibold mb-2">Report & Recommend</h5>
                <p className="text-sm text-base-content/70">
                  Get a comprehensive health score, detailed risk breakdown by category, and
                  specific recommendations for improving contract terms.
                </p>
              </div>
            </div>
          </div>

          {/* Two-Tier System */}
          <div>
            <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-primary text-primary-content flex items-center justify-center text-sm">2</span>
              Two-Tier Analysis System
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-primary/5 border-2 border-primary/30 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <span className="badge badge-primary">Tier 1</span>
                  <h5 className="font-bold">Template Analysis</h5>
                </div>
                <p className="text-sm text-base-content/80 mb-4">
                  Analyze your standard contract templates to establish a <strong>risk baseline</strong>.
                  This identifies inherent risks in your standard terms before any specific project begins.
                </p>
                <ul className="text-sm space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                    Identifies risky standard clauses
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                    Establishes baseline scores per category
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                    Provides template improvement recommendations
                  </li>
                </ul>
              </div>
              <div className="bg-secondary/5 border-2 border-secondary/30 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <span className="badge badge-secondary">Tier 2</span>
                  <h5 className="font-bold">Contract Analysis</h5>
                </div>
                <p className="text-sm text-base-content/80 mb-4">
                  Analyze specific contracts to identify <strong>deviations from the template</strong>.
                  This shows what additional risks have been introduced or mitigated in negotiations.
                </p>
                <ul className="text-sm space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                    Compares against template baseline
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                    Detects new risks from modifications
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                    Shows delta score (improvement/degradation)
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* 7 Risk Categories */}
          <div>
            <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-primary text-primary-content flex items-center justify-center text-sm">3</span>
              7 Risk Categories (Moon et al., 2022)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="bg-base-200/50 rounded-lg p-4 border-l-4 border-error">
                <h5 className="font-semibold text-error mb-1">Payment</h5>
                <p className="text-xs text-base-content/70">
                  Payment schedules, retention terms, late payment penalties, price adjustments,
                  and unfavorable payment conditions
                </p>
              </div>
              <div className="bg-base-200/50 rounded-lg p-4 border-l-4 border-warning">
                <h5 className="font-semibold text-warning mb-1">Role & Responsibility</h5>
                <p className="text-xs text-base-content/70">
                  Unclear scope definitions, ambiguous obligations, excessive liability transfer,
                  and responsibility misalignment
                </p>
              </div>
              <div className="bg-base-200/50 rounded-lg p-4 border-l-4 border-info">
                <h5 className="font-semibold text-info mb-1">Safety & Insurance</h5>
                <p className="text-xs text-base-content/70">
                  Insurance requirements, liability caps, indemnification clauses, HSE obligations,
                  and warranty terms
                </p>
              </div>
              <div className="bg-base-200/50 rounded-lg p-4 border-l-4 border-success">
                <h5 className="font-semibold text-success mb-1">Timeline & Penalties</h5>
                <p className="text-xs text-base-content/70">
                  Unrealistic deadlines, excessive delay penalties, milestone requirements,
                  and schedule acceleration clauses
                </p>
              </div>
              <div className="bg-base-200/50 rounded-lg p-4 border-l-4 border-primary">
                <h5 className="font-semibold text-primary mb-1">Procedures & Claims</h5>
                <p className="text-xs text-base-content/70">
                  Claims procedures, dispute resolution mechanisms, notification requirements,
                  and change order processes
                </p>
              </div>
              <div className="bg-base-200/50 rounded-lg p-4 border-l-4 border-secondary">
                <h5 className="font-semibold text-secondary mb-1">Definitions</h5>
                <p className="text-xs text-base-content/70">
                  Ambiguous terminology, missing definitions, vague scope descriptions,
                  and undefined technical terms
                </p>
              </div>
              <div className="bg-base-200/50 rounded-lg p-4 border-l-4 border-accent">
                <h5 className="font-semibold text-accent mb-1">References</h5>
                <p className="text-xs text-base-content/70">
                  Missing referenced documents, outdated standards, unclear document hierarchy,
                  and incomplete specifications
                </p>
              </div>
            </div>
          </div>

          {/* Risk Levels & Health Score */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-primary text-primary-content flex items-center justify-center text-sm">4</span>
                Risk Levels
              </h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: '#7f1d1d10' }}>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#7f1d1d' }}>
                    <span className="text-white font-bold">!</span>
                  </div>
                  <div>
                    <h5 className="font-semibold" style={{ color: '#7f1d1d' }}>Critical</h5>
                    <p className="text-xs text-base-content/70">Immediate attention required. Major financial or legal exposure.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-error/10">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-error">
                    <span className="text-white font-bold">!</span>
                  </div>
                  <div>
                    <h5 className="font-semibold text-error">High</h5>
                    <p className="text-xs text-base-content/70">Significant risk. Should be negotiated before signing.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-warning/10">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-warning">
                    <span className="text-white font-bold">-</span>
                  </div>
                  <div>
                    <h5 className="font-semibold text-warning">Medium</h5>
                    <p className="text-xs text-base-content/70">Moderate concern. Review and consider mitigation.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-success/10">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-success">
                    <span className="text-white font-bold">✓</span>
                  </div>
                  <div>
                    <h5 className="font-semibold text-success">Low</h5>
                    <p className="text-xs text-base-content/70">Minor issue. Standard industry practice or minor improvement possible.</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-primary text-primary-content flex items-center justify-center text-sm">5</span>
                Health Score
              </h4>
              <p className="text-sm text-base-content/80 mb-4">
                Each contract receives an overall health score from 0-100 based on the severity
                and quantity of identified risks. Higher scores indicate safer contracts.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-8 rounded flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: '#22c55e' }}>
                    80-100
                  </div>
                  <div>
                    <span className="font-semibold text-success">Good</span>
                    <span className="text-xs text-base-content/60 ml-2">Low risk, proceed with confidence</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-8 rounded flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: '#f59e0b' }}>
                    60-79
                  </div>
                  <div>
                    <span className="font-semibold text-warning">Moderate</span>
                    <span className="text-xs text-base-content/60 ml-2">Some concerns, review recommended</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-8 rounded flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: '#ef4444' }}>
                    40-59
                  </div>
                  <div>
                    <span className="font-semibold text-error">Concerning</span>
                    <span className="text-xs text-base-content/60 ml-2">Multiple issues, negotiation needed</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-8 rounded flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: '#7f1d1d' }}>
                    0-39
                  </div>
                  <div>
                    <span className="font-semibold" style={{ color: '#7f1d1d' }}>Critical</span>
                    <span className="text-xs text-base-content/60 ml-2">High risk, significant revision required</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Reference */}
          <div className="bg-base-200 rounded-xl p-4 border border-base-300">
            <p className="text-xs text-base-content/60">
              <strong>Academic Reference:</strong> Moon, S., Chi, S., & Im, S. B. (2022).
              "Automated Detection of Contractual Risk Clauses from Construction Specifications
              Using Bidirectional Encoder Representations from Transformers (BERT)."
              Journal of Construction Engineering and Management, 148(1), 04021175.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-base-100 border-t border-base-200 px-6 py-4 flex justify-end">
          <button className="btn btn-primary" onClick={onClose}>
            Got it, let's analyze!
          </button>
        </div>
      </div>
    </div>
  );
});
HowItWorksModal.displayName = 'HowItWorksModal';

// Score Badge Component
const ScoreBadge = memo(({ score }: { score?: number }) => {
  if (score === undefined) return <span className="text-base-content/50">-</span>;
  const status = getHealthStatus(score);
  return (
    <span
      className="px-2 py-0.5 rounded text-xs font-semibold"
      style={{ backgroundColor: status.color + '20', color: status.color }}
    >
      {Math.round(score)}
    </span>
  );
});
ScoreBadge.displayName = 'ScoreBadge';

// Risk Count Badge
const RiskCountBadge = memo(({ count, level }: { count?: number; level: 'critical' | 'high' }) => {
  if (!count) return <span className="text-base-content/50">0</span>;
  const color = level === 'critical' ? '#7f1d1d' : '#ef4444';
  return (
    <span
      className="px-2 py-0.5 rounded text-xs font-semibold text-white"
      style={{ backgroundColor: color }}
    >
      {count}
    </span>
  );
});
RiskCountBadge.displayName = 'RiskCountBadge';

// Document Scanner Modal
const DocumentScannerModal = memo(({
  isOpen,
  onClose,
  onScanComplete,
}: {
  isOpen: boolean;
  onClose: () => void;
  onScanComplete: (result: DocumentScanResult) => void;
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const { toaster } = useToast();

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.docx') && !file.name.endsWith('.doc')) {
      toaster.error('Unsupported format. Please use a Word file (.docx)');
      return;
    }

    setIsScanning(true);
    try {
      const result = await scanDocument(file);
      onScanComplete(result);
      toaster.success('Analysis complete');
      onClose();
    } catch (error: any) {
      toaster.error(error.message || 'Error during analysis');
    } finally {
      setIsScanning(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <button
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
          onClick={onClose}
        >
          ✕
        </button>
        <h3 className="font-bold text-lg mb-4">Scan Document</h3>
        <p className="text-sm text-base-content/60 mb-4">
          Upload a Word document to analyze for risk clauses
        </p>
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive ? 'border-primary bg-primary/5' : 'border-base-300'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
        >
          {isScanning ? (
            <div className="flex flex-col items-center gap-2">
              <span className="loading loading-spinner loading-lg text-primary"></span>
              <p className="text-sm text-base-content/70">Analyzing...</p>
            </div>
          ) : (
            <>
              <Icon icon={uploadCloudIcon} className="size-12 text-base-content/30 mx-auto" />
              <p className="mt-2 text-sm text-base-content/70">
                Drag a Word file here or
              </p>
              <label className="btn btn-primary btn-sm mt-2">
                Browse
                <input
                  type="file"
                  className="hidden"
                  accept=".doc,.docx"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFile(e.target.files[0]);
                    }
                  }}
                />
              </label>
              <p className="text-xs text-base-content/50 mt-2">
                Supported formats: .docx, .doc
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
});
DocumentScannerModal.displayName = 'DocumentScannerModal';

// Scan Result Modal
const ScanResultModal = memo(({
  result,
  onClose,
}: {
  result: DocumentScanResult | null;
  onClose: () => void;
}) => {
  if (!result) return null;

  const status = getHealthStatus(result.overallScore);

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-3xl">
        <button
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
          onClick={onClose}
        >
          ✕
        </button>
        <h3 className="font-bold text-lg mb-4">Analysis Results</h3>

        <div className="flex items-center gap-6 mb-6">
          <div className="flex flex-col items-center">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white"
              style={{ backgroundColor: status.color }}
            >
              {Math.round(result.overallScore)}
            </div>
            <span className="text-sm mt-1">{status.label}</span>
          </div>
          <div className="flex-1">
            <p className="text-base-content/80">{result.summary}</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <span className="text-2xl font-bold text-error">{result.criticalCount}</span>
            <p className="text-xs text-base-content/60">Critical</p>
          </div>
          <div className="text-center">
            <span className="text-2xl font-bold text-warning">{result.highCount}</span>
            <p className="text-xs text-base-content/60">High</p>
          </div>
          <div className="text-center">
            <span className="text-2xl font-bold text-info">{result.mediumCount}</span>
            <p className="text-xs text-base-content/60">Medium</p>
          </div>
          <div className="text-center">
            <span className="text-2xl font-bold text-success">{result.lowCount}</span>
            <p className="text-xs text-base-content/60">Low</p>
          </div>
        </div>

        {result.recommendations.length > 0 && (
          <div className="mb-4">
            <h4 className="font-semibold mb-2">Recommendations</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-base-content/80">
              {result.recommendations.map((rec, i) => (
                <li key={i}>{rec}</li>
              ))}
            </ul>
          </div>
        )}

        {result.topRisks.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2">Top Risks</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {result.topRisks.slice(0, 5).map((risk, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg border border-base-300 bg-base-200/50"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="px-2 py-0.5 rounded text-xs font-semibold text-white"
                      style={{ backgroundColor: RiskLevelColors[risk.level as keyof typeof RiskLevelColors] || '#6b7280' }}
                    >
                      {risk.level}
                    </span>
                    <span className="text-xs text-base-content/60">
                      {risk.category}
                    </span>
                  </div>
                  <p className="text-sm">{risk.riskDescription}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="modal-action">
          <button className="btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
});
ScanResultModal.displayName = 'ScanResultModal';

// Main Component
const ContractAnalysisDashboard = memo(() => {
  const navigate = useNavigate();
  const { setLeftContent, setCenterContent, setRightContent, clearContent } = useTopbarContent();
  const { toaster } = useToast();

  const [activeTab, setActiveTab] = useState<TabType>('templates');
  const [templates, setTemplates] = useState<TemplateAnalysisSummary[]>([]);
  const [contracts, setContracts] = useState<ContractAnalysisSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [analyzingId, setAnalyzingId] = useState<number | null>(null);
  const [isAnalyzingAll, setIsAnalyzingAll] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);
  const [scanResult, setScanResult] = useState<DocumentScanResult | null>(null);
  const [showHowItWorksModal, setShowHowItWorksModal] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'templates') {
        const data = await getTemplatesWithAnalysisStatus();
        setTemplates(data);
      } else {
        const data = await getContractsWithAnalysisStatus();
        setContracts(data);
      }
    } catch (error: any) {
      toaster.error(error.message || 'Error loading data');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, toaster]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleBackToDashboard = useCallback(() => {
    navigate('/dashboard');
  }, [navigate]);

  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
  }, []);

  // Topbar setup
  useEffect(() => {
    setLeftContent(
      <div className="flex items-center gap-3">
        <button
          onClick={handleBackToDashboard}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-base-200 hover:bg-base-300 transition-colors"
          title="Back to Dashboard"
        >
          <Icon icon={arrowLeftIcon} className="size-5" />
        </button>
        <span className="font-semibold text-lg">Contract Analysis</span>
      </div>
    );

    setCenterContent(
      <div className="flex items-center gap-2">
        <button
          className={`btn btn-sm transition-all duration-200 hover:shadow-md ${
            activeTab === 'templates'
              ? 'btn-primary'
              : 'btn-ghost border border-base-300 hover:border-primary/50'
          }`}
          onClick={() => handleTabChange('templates')}
        >
          <Icon icon={fileTextIcon} className="size-4" />
          <span>Templates ({templates.length})</span>
        </button>

        <button
          className={`btn btn-sm transition-all duration-200 hover:shadow-md ${
            activeTab === 'contracts'
              ? 'btn-primary'
              : 'btn-ghost border border-base-300 hover:border-primary/50'
          }`}
          onClick={() => handleTabChange('contracts')}
        >
          <Icon icon={fileCheckIcon} className="size-4" />
          <span>Contracts ({contracts.length})</span>
        </button>
      </div>
    );

    setRightContent(
      <button
        onClick={() => setShowHowItWorksModal(true)}
        className="btn btn-sm btn-ghost"
        title="How it works"
      >
        <Icon icon={infoIcon} className="size-5" />
      </button>
    );

    return () => {
      clearContent();
    };
  }, [activeTab, templates.length, contracts.length, handleBackToDashboard, handleTabChange, setLeftContent, setCenterContent, setRightContent, clearContent]);

  // Template actions
  const handleAnalyzeTemplate = useCallback(async (templateId: number) => {
    setAnalyzingId(templateId);
    try {
      const result = await analyzeTemplate(templateId);
      if (result.success) {
        toaster.success('Analysis completed');
        loadData();
      } else {
        toaster.error(result.errorMessage || 'Error during analysis');
      }
    } catch (error: any) {
      toaster.error(error.message || 'Error during analysis');
    } finally {
      setAnalyzingId(null);
    }
  }, [loadData, toaster]);

  const handleAnalyzeAllTemplates = useCallback(async () => {
    setIsAnalyzingAll(true);
    try {
      await analyzeAllTemplates();
      toaster.success('All templates analyzed');
      loadData();
    } catch (error: any) {
      toaster.error(error.message || 'Error during analysis');
    } finally {
      setIsAnalyzingAll(false);
    }
  }, [loadData, toaster]);

  const handleViewTemplateDetails = useCallback((templateId: number) => {
    navigate(`/dashboard/contract-analysis/template/${templateId}`);
  }, [navigate]);

  // Contract actions
  const handleAnalyzeContract = useCallback(async (contractId: number) => {
    setAnalyzingId(contractId);
    try {
      const result = await analyzeContract(contractId);
      if (result.success) {
        toaster.success('Analysis completed');
        loadData();
      } else {
        toaster.error(result.errorMessage || 'Error during analysis');
      }
    } catch (error: any) {
      toaster.error(error.message || 'Error during analysis');
    } finally {
      setAnalyzingId(null);
    }
  }, [loadData, toaster]);

  const handleViewContractDetails = useCallback((contractId: number) => {
    navigate(`/dashboard/contract-analysis/contract/${contractId}`);
  }, [navigate]);

  // Template columns
  const templateColumns = useMemo((): SpreadsheetColumn<TemplateAnalysisSummary>[] => [
    {
      key: 'templateName',
      label: 'Template Name',
      width: 250,
      align: 'left',
      editable: false,
      sortable: true,
      filterable: true,
    },
    {
      key: 'templateType',
      label: 'Type',
      width: 120,
      align: 'center',
      editable: false,
      sortable: true,
      filterable: true,
    },
    {
      key: 'overallScore',
      label: 'Score',
      width: 100,
      align: 'center',
      editable: false,
      sortable: true,
      render: (value) => <ScoreBadge score={value} />,
    },
    {
      key: 'criticalRiskCount',
      label: 'Critical',
      width: 80,
      align: 'center',
      editable: false,
      sortable: true,
      render: (value) => <RiskCountBadge count={value} level="critical" />,
    },
    {
      key: 'highRiskCount',
      label: 'High',
      width: 80,
      align: 'center',
      editable: false,
      sortable: true,
      render: (value) => <RiskCountBadge count={value} level="high" />,
    },
    {
      key: 'isAnalyzed',
      label: 'Status',
      width: 100,
      align: 'center',
      editable: false,
      sortable: true,
      render: (value) => (
        <span className={`badge badge-sm ${value ? 'badge-success' : 'badge-ghost'}`}>
          {value ? 'Analyzed' : 'Pending'}
        </span>
      ),
    },
    {
      key: 'lastAnalyzedAt',
      label: 'Last Analyzed',
      width: 130,
      align: 'center',
      editable: false,
      sortable: true,
      formatter: (value) => value ? new Date(value).toLocaleDateString() : '-',
    },
  ], []);

  // Contract columns
  const contractColumns = useMemo((): SpreadsheetColumn<ContractAnalysisSummary>[] => [
    {
      key: 'contractNumber',
      label: 'Contract #',
      width: 130,
      align: 'left',
      editable: false,
      sortable: true,
      filterable: true,
    },
    {
      key: 'projectName',
      label: 'Project',
      width: 180,
      align: 'left',
      editable: false,
      sortable: true,
      filterable: true,
    },
    {
      key: 'subcontractorName',
      label: 'Subcontractor',
      width: 180,
      align: 'left',
      editable: false,
      sortable: true,
      filterable: true,
    },
    {
      key: 'overallScore',
      label: 'Score',
      width: 100,
      align: 'center',
      editable: false,
      sortable: true,
      render: (value) => <ScoreBadge score={value} />,
    },
    {
      key: 'criticalRiskCount',
      label: 'Critical',
      width: 80,
      align: 'center',
      editable: false,
      sortable: true,
      render: (value) => <RiskCountBadge count={value} level="critical" />,
    },
    {
      key: 'highRiskCount',
      label: 'High',
      width: 80,
      align: 'center',
      editable: false,
      sortable: true,
      render: (value) => <RiskCountBadge count={value} level="high" />,
    },
    {
      key: 'isAnalyzed',
      label: 'Status',
      width: 100,
      align: 'center',
      editable: false,
      sortable: true,
      render: (value) => (
        <span className={`badge badge-sm ${value ? 'badge-success' : 'badge-ghost'}`}>
          {value ? 'Analyzed' : 'Pending'}
        </span>
      ),
    },
    {
      key: 'lastAnalyzedAt',
      label: 'Last Analyzed',
      width: 130,
      align: 'center',
      editable: false,
      sortable: true,
      formatter: (value) => value ? new Date(value).toLocaleDateString() : '-',
    },
  ], []);

  // Render actions for templates
  const renderTemplateActions = useCallback((row: TemplateAnalysisSummary) => (
    <div className="flex items-center gap-1">
      {row.isAnalyzed && (
        <button
          className="btn btn-ghost btn-xs text-info hover:bg-info/20"
          onClick={(e) => {
            e.stopPropagation();
            handleViewTemplateDetails(row.contractTemplateId);
          }}
          title="View Details"
        >
          <Icon icon={eyeIcon} className="w-4 h-4" />
        </button>
      )}
      <button
        className="btn btn-ghost btn-xs text-primary hover:bg-primary/20"
        onClick={(e) => {
          e.stopPropagation();
          handleAnalyzeTemplate(row.contractTemplateId);
        }}
        disabled={analyzingId === row.contractTemplateId}
        title={row.isAnalyzed ? 'Re-analyze' : 'Analyze'}
      >
        {analyzingId === row.contractTemplateId ? (
          <span className="loading loading-spinner loading-xs"></span>
        ) : (
          <Icon icon={row.isAnalyzed ? refreshCwIcon : playIcon} className="w-4 h-4" />
        )}
      </button>
    </div>
  ), [analyzingId, handleAnalyzeTemplate, handleViewTemplateDetails]);

  // Render actions for contracts
  const renderContractActions = useCallback((row: ContractAnalysisSummary) => (
    <div className="flex items-center gap-1">
      {row.isAnalyzed && (
        <button
          className="btn btn-ghost btn-xs text-info hover:bg-info/20"
          onClick={(e) => {
            e.stopPropagation();
            handleViewContractDetails(row.contractDatasetId);
          }}
          title="View Details"
        >
          <Icon icon={eyeIcon} className="w-4 h-4" />
        </button>
      )}
      <button
        className="btn btn-ghost btn-xs text-primary hover:bg-primary/20"
        onClick={(e) => {
          e.stopPropagation();
          handleAnalyzeContract(row.contractDatasetId);
        }}
        disabled={analyzingId === row.contractDatasetId}
        title={row.isAnalyzed ? 'Re-analyze' : 'Analyze'}
      >
        {analyzingId === row.contractDatasetId ? (
          <span className="loading loading-spinner loading-xs"></span>
        ) : (
          <Icon icon={row.isAnalyzed ? refreshCwIcon : playIcon} className="w-4 h-4" />
        )}
      </button>
    </div>
  ), [analyzingId, handleAnalyzeContract, handleViewContractDetails]);

  // Toolbar
  const toolbar = useMemo(() => (
    <div className="flex items-center justify-end gap-2 w-full px-4 py-2">
      <button
        className="btn btn-sm btn-outline"
        onClick={() => setShowScanModal(true)}
      >
        <Icon icon={scanIcon} className="size-4" />
        Scan Document
      </button>
      {activeTab === 'templates' && (
        <button
          className="btn btn-sm btn-primary"
          onClick={handleAnalyzeAllTemplates}
          disabled={isAnalyzingAll}
        >
          {isAnalyzingAll ? (
            <span className="loading loading-spinner loading-xs"></span>
          ) : (
            <Icon icon={playIcon} className="size-4" />
          )}
          Analyze All
        </button>
      )}
    </div>
  ), [activeTab, handleAnalyzeAllTemplates, isAnalyzingAll]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 min-h-0">
        {activeTab === 'templates' ? (
          <Spreadsheet<TemplateAnalysisSummary>
            data={templates}
            columns={templateColumns}
            mode="view"
            loading={isLoading}
            emptyMessage="No templates found"
            persistKey="contract-analysis-templates"
            rowHeight={40}
            actionsRender={renderTemplateActions}
            actionsColumnWidth={100}
            onRowDoubleClick={(row) => row.isAnalyzed && handleViewTemplateDetails(row.contractTemplateId)}
            getRowId={(row) => row.contractTemplateId}
            toolbar={toolbar}
            allowKeyboardNavigation
            allowColumnResize
            allowSorting
            allowFilters
          />
        ) : (
          <Spreadsheet<ContractAnalysisSummary>
            data={contracts}
            columns={contractColumns}
            mode="view"
            loading={isLoading}
            emptyMessage="No contracts found"
            persistKey="contract-analysis-contracts"
            rowHeight={40}
            actionsRender={renderContractActions}
            actionsColumnWidth={100}
            onRowDoubleClick={(row) => row.isAnalyzed && handleViewContractDetails(row.contractDatasetId)}
            getRowId={(row) => row.contractDatasetId}
            toolbar={toolbar}
            allowKeyboardNavigation
            allowColumnResize
            allowSorting
            allowFilters
          />
        )}
      </div>

      <DocumentScannerModal
        isOpen={showScanModal}
        onClose={() => setShowScanModal(false)}
        onScanComplete={setScanResult}
      />

      <ScanResultModal
        result={scanResult}
        onClose={() => setScanResult(null)}
      />

      <HowItWorksModal
        isOpen={showHowItWorksModal}
        onClose={() => setShowHowItWorksModal(false)}
      />
    </div>
  );
});

ContractAnalysisDashboard.displayName = 'ContractAnalysisDashboard';

export default ContractAnalysisDashboard;
