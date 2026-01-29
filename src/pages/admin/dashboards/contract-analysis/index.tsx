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
      <div className="modal-box max-w-[1400px] w-[98vw] h-[95vh] max-h-[95vh] overflow-y-auto p-8">
        <button className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4" onClick={onClose}>✕</button>

        <h3 className="text-2xl font-semibold mb-1">Contract Risk Analysis</h3>
        <p className="text-sm text-base-content/60 mb-6">AI-powered clause classification based on peer-reviewed academic research</p>

        {/* Top Row: Problem + Pipeline side by side */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
          {/* The Problem */}
          <div className="p-5 bg-error/5 border border-error/20 rounded-lg h-full">
            <h4 className="text-sm font-semibold mb-3">The Problem</h4>
            <p className="text-sm text-base-content/70 leading-relaxed mb-4">
              Construction projects suffer from contractual disputes caused by ambiguity, misunderstanding of requirements,
              and specification errors. According to recent studies, the global average cost and duration of construction
              disputes is <strong className="text-error">$54 million</strong> and <strong className="text-error">13.4 months</strong>.
            </p>
            <p className="text-sm text-base-content/70 leading-relaxed">
              Common causes include unclear scope definitions, ambiguous payment terms, undefined responsibilities, and conflicting
              specifications between contract documents.
            </p>
          </div>

          {/* How It Works - Pipeline */}
          <div className="p-5 bg-base-200/30 rounded-lg h-full">
            <h4 className="text-sm font-semibold mb-4">How It Works</h4>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <div className="flex flex-col items-center text-center min-w-[90px]">
                <div className="w-12 h-12 rounded-full bg-base-300 flex items-center justify-center mb-2 text-base-content/70 text-lg">1</div>
                <span className="text-sm font-medium">Upload</span>
                <span className="text-xs text-base-content/50">.docx file</span>
              </div>
              <span className="text-base-content/30 text-xl">→</span>
              <div className="flex flex-col items-center text-center min-w-[90px]">
                <div className="w-12 h-12 rounded-full bg-base-300 flex items-center justify-center mb-2 text-base-content/70 text-lg">2</div>
                <span className="text-sm font-medium">Extract</span>
                <span className="text-xs text-base-content/50">Parse clauses</span>
              </div>
              <span className="text-base-content/30 text-xl">→</span>
              <div className="flex flex-col items-center text-center min-w-[90px]">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center mb-2 text-white font-bold text-lg">AI</div>
                <span className="text-sm font-medium text-primary">Analyze</span>
                <span className="text-xs text-base-content/50">LLM Classification</span>
              </div>
              <span className="text-base-content/30 text-xl">→</span>
              <div className="flex flex-col items-center text-center min-w-[90px]">
                <div className="w-12 h-12 rounded-full bg-base-300 flex items-center justify-center mb-2 text-base-content/70 text-lg">4</div>
                <span className="text-sm font-medium">Detect</span>
                <span className="text-xs text-base-content/50">7 risk categories</span>
              </div>
              <span className="text-base-content/30 text-xl">→</span>
              <div className="flex flex-col items-center text-center min-w-[90px]">
                <div className="w-12 h-12 rounded-full bg-base-300 flex items-center justify-center mb-2 text-base-content/70 text-lg">5</div>
                <span className="text-sm font-medium">Report</span>
                <span className="text-xs text-base-content/50">Score & recommendations</span>
              </div>
            </div>
          </div>
        </div>

        {/* Research Basis - Full Width with side-by-side stats and description */}
        <div className="mb-6 p-5 bg-base-200/40 rounded-lg">
          <div className="flex items-start justify-between mb-4">
            <h4 className="text-sm font-semibold">Research Foundation</h4>
            <span className="text-xs text-base-content/40">Moon, Chi & Im (2022)</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <p className="text-sm text-base-content/70 leading-relaxed mb-3">
                Our system implements research from Seoul National University, published in <em>Automation in Construction</em>.
                The study analyzed <strong>2,807 clauses</strong> from 56 construction specifications and demonstrated that
                AI-based classification significantly outperforms traditional rule-based methods.
              </p>
              <p className="text-sm text-base-content/70 leading-relaxed">
                The research reviewed 11 prior studies spanning 1990-2022 to identify clause categories most vulnerable to disputes
                in construction contracts. Using Natural Language Processing and machine learning, the system achieves dramatically
                higher accuracy than keyword or regex-based approaches.
              </p>
            </div>
            <div className="grid grid-cols-3 lg:grid-cols-1 gap-3">
              <div className="p-4 bg-base-100 rounded-lg text-center">
                <div className="text-3xl font-bold text-success">93.4%</div>
                <div className="text-xs text-base-content/50 mt-1">AI F1 Score</div>
              </div>
              <div className="p-4 bg-base-100 rounded-lg text-center">
                <div className="text-3xl font-bold text-error">42.6%</div>
                <div className="text-xs text-base-content/50 mt-1">Regex F1 Score</div>
              </div>
              <div className="p-4 bg-base-100 rounded-lg text-center">
                <div className="text-3xl font-bold text-primary">2.2x</div>
                <div className="text-xs text-base-content/50 mt-1">Better Accuracy</div>
              </div>
            </div>
          </div>
        </div>

        {/* Risk Categories - 7 across in a more compact grid */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold mb-2">7 Risk Categories (Table 2, Moon et al.)</h4>
          <p className="text-sm text-base-content/60 mb-4">
            Based on literature review of 11 studies spanning 1990-2022, these categories are most vulnerable to disputes:
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
            <div className="flex flex-col items-center text-center p-4 rounded-lg border border-base-300 bg-base-100">
              <span className="w-4 h-4 rounded-full bg-error mb-2"></span>
              <div className="text-sm font-medium">Payment</div>
              <div className="text-xs text-base-content/50 mt-1">Compensation, retention, payment terms</div>
            </div>
            <div className="flex flex-col items-center text-center p-4 rounded-lg border border-base-300 bg-base-100">
              <span className="w-4 h-4 rounded-full bg-warning mb-2"></span>
              <div className="text-sm font-medium">Temporal</div>
              <div className="text-xs text-base-content/50 mt-1">Deadlines, delays, schedule constraints</div>
            </div>
            <div className="flex flex-col items-center text-center p-4 rounded-lg border border-base-300 bg-base-100">
              <span className="w-4 h-4 rounded-full bg-info mb-2"></span>
              <div className="text-sm font-medium">Procedure</div>
              <div className="text-xs text-base-content/50 mt-1">Methods, steps, notification requirements</div>
            </div>
            <div className="flex flex-col items-center text-center p-4 rounded-lg border border-base-300 bg-base-100">
              <span className="w-4 h-4 rounded-full bg-success mb-2"></span>
              <div className="text-sm font-medium">Safety</div>
              <div className="text-xs text-base-content/50 mt-1">HSE, insurance, liability clauses</div>
            </div>
            <div className="flex flex-col items-center text-center p-4 rounded-lg border border-base-300 bg-base-100">
              <span className="w-4 h-4 rounded-full bg-primary mb-2"></span>
              <div className="text-sm font-medium">Role</div>
              <div className="text-xs text-base-content/50 mt-1">Scope definition, coordination duties</div>
            </div>
            <div className="flex flex-col items-center text-center p-4 rounded-lg border border-base-300 bg-base-100">
              <span className="w-4 h-4 rounded-full bg-secondary mb-2"></span>
              <div className="text-sm font-medium">Definition</div>
              <div className="text-xs text-base-content/50 mt-1">Ambiguous terms, undefined scope</div>
            </div>
            <div className="flex flex-col items-center text-center p-4 rounded-lg border border-base-300 bg-base-100">
              <span className="w-4 h-4 rounded-full bg-accent mb-2"></span>
              <div className="text-sm font-medium">Reference</div>
              <div className="text-xs text-base-content/50 mt-1">External documents, standards, regulations</div>
            </div>
          </div>
        </div>

        {/* Bottom Row: Two-Tier Approach + Risk Levels side by side */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
          {/* Two-Tier Approach */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Two-Tier Analysis Approach</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border-2 border-primary/20 rounded-lg bg-primary/5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">1</span>
                  <span className="font-semibold">Template Analysis</span>
                </div>
                <p className="text-sm text-base-content/60">
                  AI analyzes your standard contract templates to establish a risk baseline.
                  Identifies inherent risks in your template language before any project-specific modifications.
                </p>
              </div>
              <div className="p-4 border-2 border-secondary/20 rounded-lg bg-secondary/5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-7 h-7 rounded-full bg-secondary text-white flex items-center justify-center text-sm font-bold">2</span>
                  <span className="font-semibold">Contract Analysis</span>
                </div>
                <p className="text-sm text-base-content/60">
                  AI analyzes signed contracts and compares against templates to detect
                  deviations, new risks, and modified clauses that may introduce additional exposure.
                </p>
              </div>
            </div>
          </div>

          {/* Risk Levels & Scoring */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Risk Levels & Health Scoring</h4>
            <div className="p-4 bg-base-200/30 rounded-lg h-[calc(100%-28px)]">
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1.5 rounded text-sm font-semibold text-white" style={{ backgroundColor: '#7f1d1d' }}>Critical</span>
                  <span className="text-sm text-base-content/60">Immediate action</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1.5 rounded text-sm font-semibold bg-error text-white">High</span>
                  <span className="text-sm text-base-content/60">Address before signing</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1.5 rounded text-sm font-semibold bg-warning text-white">Medium</span>
                  <span className="text-sm text-base-content/60">Worth negotiating</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1.5 rounded text-sm font-semibold bg-success text-white">Low</span>
                  <span className="text-sm text-base-content/60">Document only</span>
                </div>
              </div>
              <div className="text-sm text-base-content/60 border-t border-base-300 pt-3">
                <strong>Health Score (0-100):</strong><br/>
                <span className="text-success font-medium">≥80</span> Low risk |{' '}
                <span className="text-warning font-medium">60-79</span> Moderate |{' '}
                <span className="text-error font-medium">40-59</span> Concerning |{' '}
                <span className="font-medium" style={{ color: '#7f1d1d' }}>&lt;40</span> Critical
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-base-200 flex items-center justify-between">
          <div className="text-xs text-base-content/50">
            <span>Moon, S., Chi, S., & Im, S. B. (2022). <em>Automation in Construction</em>, 142, 104465.</span>
            <a
              href="https://doi.org/10.1016/j.autcon.2022.104465"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 text-primary hover:underline"
            >
              View Paper
            </a>
          </div>
          <button className="btn btn-primary btn-sm" onClick={onClose}>
            Got it
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

  const [activeTab, setActiveTab] = useState<TabType>(() => (sessionStorage.getItem("contract-analysis-tab") as TabType) || 'templates');
  const [templates, setTemplates] = useState<TemplateAnalysisSummary[]>([]);
  const [contracts, setContracts] = useState<ContractAnalysisSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [analyzingId, setAnalyzingId] = useState<number | null>(null);
  const [isAnalyzingAll, setIsAnalyzingAll] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);
  const [scanResult, setScanResult] = useState<DocumentScanResult | null>(null);
  const [showHowItWorksModal, setShowHowItWorksModal] = useState(false);

  useEffect(() => { sessionStorage.setItem("contract-analysis-tab", activeTab); }, [activeTab]);

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
