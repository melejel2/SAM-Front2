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
  startTemplateAnalysisJob,
  startContractAnalysisJob,
  waitForAnalysisJob,
  getActiveAnalysisJobs,
  cancelAnalysisJob,
  analyzeAllTemplates,
  scanDocument,
  getUploadedDocuments,
  getUploadedDocument,
  deleteUploadedDocument,
} from '@/api/services/contract-analysis-api';
import type {
  TemplateAnalysisSummary,
  ContractAnalysisSummary,
  DocumentScanResult,
  AnalysisJob,
} from '@/types/contract-analysis';
import { getHealthStatus, RiskLevelColors } from '@/types/contract-analysis';

import { usePerspective, extractPerspectiveText, getPerspectiveField, filterByPerspective } from './perspective-context';
import type { AnalysisPerspective } from '@/types/contract-analysis';
import ScanResultsView from './ScanResultsView';

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
import buildingIcon from '@iconify/icons-lucide/building';
import hardHatIcon from '@iconify/icons-lucide/hard-hat';
import repeatIcon from '@iconify/icons-lucide/repeat';
import xIcon from '@iconify/icons-lucide/x';

type TabType = 'scan' | 'contracts' | 'templates';

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
      <div className="modal-box max-w-[1400px] w-[98vw] h-[97vh] max-h-[97vh] overflow-y-auto p-6">
        <button className="btn btn-sm btn-circle btn-ghost absolute right-3 top-3" onClick={onClose}>✕</button>

        <h3 className="text-xl font-semibold mb-0.5">Contract Risk Analysis</h3>
        <p className="text-sm text-base-content/60 mb-4">AI-powered clause classification based on peer-reviewed academic research</p>

        {/* Top Row: Problem + Pipeline side by side */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-4">
          {/* The Problem */}
          <div className="p-4 bg-error/5 border border-error/20 rounded-lg">
            <h4 className="text-sm font-semibold mb-2">The Problem</h4>
            <p className="text-sm text-base-content/70 leading-relaxed mb-2">
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
          <div className="p-4 bg-base-200/30 rounded-lg">
            <h4 className="text-sm font-semibold mb-3">How It Works</h4>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <div className="flex flex-col items-center text-center min-w-[80px]">
                <div className="w-10 h-10 rounded-full bg-base-300 flex items-center justify-center mb-1.5 text-base-content/70 text-base">1</div>
                <span className="text-xs font-medium">Upload</span>
                <span className="text-[10px] text-base-content/50">.docx file</span>
              </div>
              <span className="text-base-content/30 text-lg">→</span>
              <div className="flex flex-col items-center text-center min-w-[80px]">
                <div className="w-10 h-10 rounded-full bg-base-300 flex items-center justify-center mb-1.5 text-base-content/70 text-base">2</div>
                <span className="text-xs font-medium">Extract</span>
                <span className="text-[10px] text-base-content/50">Parse clauses</span>
              </div>
              <span className="text-base-content/30 text-lg">→</span>
              <div className="flex flex-col items-center text-center min-w-[80px]">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center mb-1.5 text-white font-bold text-base">AI</div>
                <span className="text-xs font-medium text-primary">Analyze</span>
                <span className="text-[10px] text-base-content/50">LLM Classification</span>
              </div>
              <span className="text-base-content/30 text-lg">→</span>
              <div className="flex flex-col items-center text-center min-w-[80px]">
                <div className="w-10 h-10 rounded-full bg-base-300 flex items-center justify-center mb-1.5 text-base-content/70 text-base">4</div>
                <span className="text-xs font-medium">Detect</span>
                <span className="text-[10px] text-base-content/50">7 risk categories</span>
              </div>
              <span className="text-base-content/30 text-lg">→</span>
              <div className="flex flex-col items-center text-center min-w-[80px]">
                <div className="w-10 h-10 rounded-full bg-base-300 flex items-center justify-center mb-1.5 text-base-content/70 text-base">5</div>
                <span className="text-xs font-medium">Report</span>
                <span className="text-[10px] text-base-content/50">Score & recommendations</span>
              </div>
            </div>
          </div>
        </div>

        {/* Research Foundation - compact with stats in one row */}
        <div className="mb-4 p-4 bg-base-200/40 rounded-lg">
          <div className="flex items-start justify-between mb-2">
            <h4 className="text-sm font-semibold">Research Foundation</h4>
            <span className="text-xs text-base-content/40">Moon, Chi & Im (2022)</span>
          </div>
          <div className="flex gap-4 items-start">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-base-content/70 leading-relaxed mb-2">
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
            <div className="flex gap-2 flex-shrink-0">
              <div className="p-3 bg-base-100 rounded-lg text-center min-w-[80px]">
                <div className="text-2xl font-bold text-success">93.4%</div>
                <div className="text-[10px] text-base-content/50 mt-0.5">AI F1 Score</div>
              </div>
              <div className="p-3 bg-base-100 rounded-lg text-center min-w-[80px]">
                <div className="text-2xl font-bold text-error">42.6%</div>
                <div className="text-[10px] text-base-content/50 mt-0.5">Regex F1 Score</div>
              </div>
              <div className="p-3 bg-base-100 rounded-lg text-center min-w-[80px]">
                <div className="text-2xl font-bold text-primary">2.2x</div>
                <div className="text-[10px] text-base-content/50 mt-0.5">Better Accuracy</div>
              </div>
            </div>
          </div>
        </div>

        {/* Risk Categories - 7 across compact */}
        <div className="mb-4">
          <h4 className="text-sm font-semibold mb-1.5">7 Risk Categories (Table 2, Moon et al.)</h4>
          <p className="text-xs text-base-content/60 mb-3">
            Based on literature review of 11 studies spanning 1990-2022, these categories are most vulnerable to disputes:
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-2">
            <div className="flex flex-col items-center text-center p-3 rounded-lg border border-base-300 bg-base-100">
              <span className="w-3 h-3 rounded-full bg-error mb-1.5"></span>
              <div className="text-xs font-medium">Payment</div>
              <div className="text-[10px] text-base-content/50 mt-0.5">Compensation, retention, payment terms</div>
            </div>
            <div className="flex flex-col items-center text-center p-3 rounded-lg border border-base-300 bg-base-100">
              <span className="w-3 h-3 rounded-full bg-warning mb-1.5"></span>
              <div className="text-xs font-medium">Temporal</div>
              <div className="text-[10px] text-base-content/50 mt-0.5">Deadlines, delays, schedule constraints</div>
            </div>
            <div className="flex flex-col items-center text-center p-3 rounded-lg border border-base-300 bg-base-100">
              <span className="w-3 h-3 rounded-full bg-info mb-1.5"></span>
              <div className="text-xs font-medium">Procedure</div>
              <div className="text-[10px] text-base-content/50 mt-0.5">Methods, steps, notification requirements</div>
            </div>
            <div className="flex flex-col items-center text-center p-3 rounded-lg border border-base-300 bg-base-100">
              <span className="w-3 h-3 rounded-full bg-success mb-1.5"></span>
              <div className="text-xs font-medium">Safety</div>
              <div className="text-[10px] text-base-content/50 mt-0.5">HSE, insurance, liability clauses</div>
            </div>
            <div className="flex flex-col items-center text-center p-3 rounded-lg border border-base-300 bg-base-100">
              <span className="w-3 h-3 rounded-full bg-primary mb-1.5"></span>
              <div className="text-xs font-medium">Role</div>
              <div className="text-[10px] text-base-content/50 mt-0.5">Scope definition, coordination duties</div>
            </div>
            <div className="flex flex-col items-center text-center p-3 rounded-lg border border-base-300 bg-base-100">
              <span className="w-3 h-3 rounded-full bg-secondary mb-1.5"></span>
              <div className="text-xs font-medium">Definition</div>
              <div className="text-[10px] text-base-content/50 mt-0.5">Ambiguous terms, undefined scope</div>
            </div>
            <div className="flex flex-col items-center text-center p-3 rounded-lg border border-base-300 bg-base-100">
              <span className="w-3 h-3 rounded-full bg-accent mb-1.5"></span>
              <div className="text-xs font-medium">Reference</div>
              <div className="text-[10px] text-base-content/50 mt-0.5">External documents, standards, regulations</div>
            </div>
          </div>
        </div>

        {/* Bottom Row: Two-Tier Approach + Risk Levels side by side */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-4">
          {/* Two-Tier Approach */}
          <div>
            <h4 className="text-sm font-semibold mb-2">Two-Tier Analysis Approach</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 border-2 border-primary/20 rounded-lg bg-primary/5">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">1</span>
                  <span className="text-sm font-semibold">Template Analysis</span>
                </div>
                <p className="text-xs text-base-content/60">
                  AI analyzes your standard contract templates to establish a risk baseline.
                  Identifies inherent risks before project-specific modifications.
                </p>
              </div>
              <div className="p-3 border-2 border-secondary/20 rounded-lg bg-secondary/5">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-6 h-6 rounded-full bg-secondary text-white flex items-center justify-center text-xs font-bold">2</span>
                  <span className="text-sm font-semibold">Contract Analysis</span>
                </div>
                <p className="text-xs text-base-content/60">
                  AI analyzes signed contracts and compares against templates to detect
                  deviations, new risks, and modified clauses.
                </p>
              </div>
            </div>
          </div>

          {/* Risk Levels & Scoring */}
          <div>
            <h4 className="text-sm font-semibold mb-2">Risk Levels & Health Scoring</h4>
            <div className="p-3 bg-base-200/30 rounded-lg">
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 rounded text-xs font-semibold text-white" style={{ backgroundColor: '#7f1d1d' }}>Critical</span>
                  <span className="text-xs text-base-content/60">Immediate action</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 rounded text-xs font-semibold bg-error text-white">High</span>
                  <span className="text-xs text-base-content/60">Address before signing</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 rounded text-xs font-semibold bg-warning text-white">Medium</span>
                  <span className="text-xs text-base-content/60">Worth negotiating</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 rounded text-xs font-semibold bg-success text-white">Low</span>
                  <span className="text-xs text-base-content/60">Document only</span>
                </div>
              </div>
              <div className="text-xs text-base-content/60 border-t border-base-300 pt-2">
                <strong>Health Score (0-100):</strong>{' '}
                <span className="text-success font-medium">≥80</span> Low risk |{' '}
                <span className="text-warning font-medium">60-79</span> Moderate |{' '}
                <span className="text-error font-medium">40-59</span> Concerning |{' '}
                <span className="font-medium" style={{ color: '#7f1d1d' }}>&lt;40</span> Critical
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-base-200 flex items-center justify-between">
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
const RiskCountBadge = memo(({ count, level }: { count?: number; level: 'critical' | 'high' | 'medium' | 'low' }) => {
  if (!count) return <span className="text-base-content/50">0</span>;
  const colors: Record<typeof level, string> = {
    critical: '#7f1d1d',
    high: '#ef4444',
    medium: '#f59e0b',
    low: '#6b7280',
  };
  return (
    <span
      className="px-2 py-0.5 rounded text-xs font-semibold text-white"
      style={{ backgroundColor: colors[level] }}
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
      if (!result.success) {
        toaster.error(result.errorMessage || 'Analysis failed. Please check the file format.');
        return;
      }
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


// Perspective Selection Modal
const PerspectiveSelectionModal = memo(({
  isOpen,
  onSelect,
}: {
  isOpen: boolean;
  onSelect: (p: AnalysisPerspective) => void;
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-lg">
        <h3 className="text-lg font-semibold mb-1">Who are you in this contract?</h3>
        <p className="text-sm text-base-content/60 mb-5">
          Select your role to see risks and recommendations relevant to your position.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => onSelect('client')}
            className="flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-base-300 bg-base-100 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all group"
          >
            <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Icon icon={buildingIcon} className="size-7 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-center">
              <div className="font-semibold text-base">Client / Employer</div>
              <p className="text-xs text-base-content/50 mt-1">Main contractor managing subcontracts</p>
            </div>
          </button>
          <button
            onClick={() => onSelect('subcontractor')}
            className="flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-base-300 bg-base-100 hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-all group"
          >
            <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Icon icon={hardHatIcon} className="size-7 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="text-center">
              <div className="font-semibold text-base">Subcontractor</div>
              <p className="text-xs text-base-content/50 mt-1">Reviewing contract terms before signing</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
});
PerspectiveSelectionModal.displayName = 'PerspectiveSelectionModal';

// Perspective Badge (shown in topbar)
const PerspectiveBadge = memo(({
  perspective,
  onSwitch,
}: {
  perspective: AnalysisPerspective;
  onSwitch: () => void;
}) => {
  const isClient = perspective === 'client';
  return (
    <button
      onClick={onSwitch}
      className={`btn btn-sm gap-1.5 ${
        isClient
          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50'
          : 'bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:hover:bg-amber-900/50'
      } border-0`}
      title="Switch perspective"
    >
      <Icon icon={isClient ? buildingIcon : hardHatIcon} className="size-4" />
      <span className="text-xs font-medium">{isClient ? 'Client' : 'Subcontractor'}</span>
      <Icon icon={repeatIcon} className="size-3 opacity-50" />
    </button>
  );
});
PerspectiveBadge.displayName = 'PerspectiveBadge';

// Main Component
const ContractAnalysisDashboard = memo(() => {
  const navigate = useNavigate();
  const { setAllContent, clearContent } = useTopbarContent();
  const { toaster } = useToast();
  const { perspective, setPerspective, clearPerspective } = usePerspective();
  const [showPerspectiveModal, setShowPerspectiveModal] = useState(false);

  const [activeTab, setActiveTab] = useState<TabType>(() => (sessionStorage.getItem("contract-analysis-tab") as TabType) || 'scan');
  const [templates, setTemplates] = useState<TemplateAnalysisSummary[]>([]);
  const [contracts, setContracts] = useState<ContractAnalysisSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [analyzingId, setAnalyzingId] = useState<number | null>(null);
  const [isAnalyzingAll, setIsAnalyzingAll] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);
  const [scanResult, setScanResult] = useState<DocumentScanResult | null>(null);
  const [showHowItWorksModal, setShowHowItWorksModal] = useState(false);
  const [navigatingId, setNavigatingId] = useState<number | null>(null);
  const [uploadedDocs, setUploadedDocs] = useState<import('@/types/contract-analysis').UploadedDocumentSummary[]>([]);
  const [loadingUploadedDocs, setLoadingUploadedDocs] = useState(false);
  const [analysisJobs, setAnalysisJobs] = useState<Record<string, AnalysisJob>>({});

  // Show perspective selection if not set
  useEffect(() => {
    if (!perspective) {
      setShowPerspectiveModal(true);
    }
  }, [perspective]);

  useEffect(() => { sessionStorage.setItem("contract-analysis-tab", activeTab); }, [activeTab]);

  const loadUploadedDocs = useCallback(async () => {
    setLoadingUploadedDocs(true);
    try {
      const data = await getUploadedDocuments();
      setUploadedDocs(data);
    } catch {
      // Silently fail - uploaded docs list is optional
    } finally {
      setLoadingUploadedDocs(false);
    }
  }, []);

  const getJobKey = useCallback((jobType: 'Template' | 'Contract', targetId: number) => {
    return `${jobType}:${targetId}`;
  }, []);

  const loadActiveJobs = useCallback(async (jobType: 'Template' | 'Contract') => {
    try {
      const jobs = await getActiveAnalysisJobs(jobType);
      setAnalysisJobs((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((key) => {
          if (key.startsWith(`${jobType}:`)) delete next[key];
        });
        jobs.forEach((job) => {
          const key = getJobKey(jobType, job.targetId);
          next[key] = job;
        });
        return next;
      });
    } catch {
      // Ignore polling errors
    }
  }, [getJobKey]);

  const loadData = useCallback(async () => {
    if (activeTab === 'scan') {
      setIsLoading(false);
      loadUploadedDocs();
      return;
    }
    setIsLoading(true);
    try {
      if (activeTab === 'templates') {
        const data = await getTemplatesWithAnalysisStatus();
        setTemplates(data);
        loadActiveJobs('Template');
      } else {
        const data = await getContractsWithAnalysisStatus();
        setContracts(data);
        loadActiveJobs('Contract');
      }
    } catch (error: any) {
      toaster.error(error.message || 'Error loading data');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, toaster, loadUploadedDocs, loadActiveJobs]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const jobType = activeTab === 'templates' ? 'Template' : activeTab === 'contracts' ? 'Contract' : null;
    if (!jobType) return;

    loadActiveJobs(jobType);
    const interval = setInterval(() => {
      loadActiveJobs(jobType);
    }, 5000);

    return () => clearInterval(interval);
  }, [activeTab, loadActiveJobs]);

  const handleBackToDashboard = useCallback(() => {
    navigate('/dashboard');
  }, [navigate]);

  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
  }, []);

  // Topbar setup
  useEffect(() => {
    const leftContent = (
      <div className="flex items-center gap-3">
        <button
          onClick={handleBackToDashboard}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-base-200 hover:bg-base-300 transition-colors"
          title="Back to Dashboard"
        >
          <Icon icon={arrowLeftIcon} className="size-5" />
        </button>
      </div>
    );

    const centerContent = (
      <div className="flex items-center gap-2">
        <button
          className={`btn btn-sm transition-all duration-200 hover:shadow-md ${
            activeTab === 'scan'
              ? 'btn-primary'
              : 'btn-ghost border border-base-300 hover:border-primary/50'
          }`}
          onClick={() => handleTabChange('scan')}
        >
          <Icon icon={uploadCloudIcon} className="size-4" />
          <span>Scan Document</span>
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
      </div>
    );

    const rightContent = (
      <div className="flex items-center gap-2">
        {perspective && (
          <PerspectiveBadge
            perspective={perspective}
            onSwitch={() => setShowPerspectiveModal(true)}
          />
        )}
        <button
          onClick={() => setShowHowItWorksModal(true)}
          className="btn btn-sm btn-ghost"
          title="How it works"
        >
          <Icon icon={infoIcon} className="size-5" />
        </button>
      </div>
    );

    setAllContent(leftContent, centerContent, rightContent);

    return () => {
      clearContent();
    };
  }, [activeTab, templates.length, contracts.length, handleBackToDashboard, handleTabChange, setAllContent, clearContent, perspective]);

  // Template actions
  const handleAnalyzeTemplate = useCallback(async (templateId: number) => {
    setAnalyzingId(templateId);
    try {
      const job = await startTemplateAnalysisJob(templateId);
      const key = getJobKey('Template', templateId);
      setAnalysisJobs((prev) => ({ ...prev, [key]: job }));
      toaster.info('Analysis started');

      const finalJob = await waitForAnalysisJob(job.id);
      if (finalJob.status === 'Succeeded') {
        toaster.success('Analysis completed');
        loadData();
      } else if (finalJob.status === 'Canceled') {
        toaster.info('Analysis canceled');
      } else {
        toaster.error(finalJob.errorMessage || 'Error during analysis');
      }
      setAnalysisJobs((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    } catch (error: any) {
      toaster.error(error.message || 'Error during analysis');
    } finally {
      setAnalyzingId(null);
    }
  }, [loadData, toaster, getJobKey]);

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
    setNavigatingId(templateId);
    navigate(`/dashboard/contract-analysis/template/${templateId}`);
  }, [navigate]);

  // Contract actions
  const handleAnalyzeContract = useCallback(async (contractId: number) => {
    setAnalyzingId(contractId);
    try {
      const job = await startContractAnalysisJob(contractId);
      const key = getJobKey('Contract', contractId);
      setAnalysisJobs((prev) => ({ ...prev, [key]: job }));
      toaster.info('Analysis started');

      const finalJob = await waitForAnalysisJob(job.id);
      if (finalJob.status === 'Succeeded') {
        toaster.success('Analysis completed');
        loadData();
      } else if (finalJob.status === 'Canceled') {
        toaster.info('Analysis canceled');
      } else {
        toaster.error(finalJob.errorMessage || 'Error during analysis');
      }
      setAnalysisJobs((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    } catch (error: any) {
      toaster.error(error.message || 'Error during analysis');
    } finally {
      setAnalyzingId(null);
    }
  }, [loadData, toaster, getJobKey]);

  const handleViewContractDetails = useCallback((contractId: number) => {
    setNavigatingId(contractId);
    navigate(`/dashboard/contract-analysis/contract/${contractId}`);
  }, [navigate]);

  const handleCancelAnalysis = useCallback(async (jobType: 'Template' | 'Contract', targetId: number) => {
    const key = getJobKey(jobType, targetId);
    const job = analysisJobs[key];
    if (!job) return;

    try {
      await cancelAnalysisJob(job.id);
      toaster.success('Analysis canceled');
      setAnalysisJobs((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      if (analyzingId === targetId) {
        setAnalyzingId(null);
      }
    } catch (error: any) {
      toaster.error(error.message || 'Failed to cancel analysis');
    }
  }, [analysisJobs, getJobKey, toaster, analyzingId]);

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
      render: (_value, row) => <ScoreBadge score={row ? getPerspectiveField(row, 'overallScore', perspective) : _value} />,
    },
    {
      key: 'criticalRiskCount',
      label: 'Critical',
      width: 80,
      align: 'center',
      editable: false,
      sortable: true,
      render: (_value, row) => <RiskCountBadge count={row ? getPerspectiveField(row, 'criticalRiskCount', perspective) : _value} level="critical" />,
    },
    {
      key: 'highRiskCount',
      label: 'High',
      width: 80,
      align: 'center',
      editable: false,
      sortable: true,
      render: (_value, row) => <RiskCountBadge count={row ? getPerspectiveField(row, 'highRiskCount', perspective) : _value} level="high" />,
    },
    {
      key: 'mediumRiskCount',
      label: 'Medium',
      width: 80,
      align: 'center',
      editable: false,
      sortable: true,
      render: (_value, row) => <RiskCountBadge count={row ? getPerspectiveField(row, 'mediumRiskCount', perspective) : _value} level="medium" />,
    },
    {
      key: 'lowRiskCount',
      label: 'Low',
      width: 80,
      align: 'center',
      editable: false,
      sortable: true,
      render: (_value, row) => <RiskCountBadge count={row ? getPerspectiveField(row, 'lowRiskCount', perspective) : _value} level="low" />,
    },
    {
      key: 'isAnalyzed',
      label: 'Status',
      width: 100,
      align: 'center',
      editable: false,
      sortable: true,
      render: (value, row) => {
        const hasJob = row ? !!analysisJobs[getJobKey('Template', row.contractTemplateId)] : false;
        if (hasJob) {
          return <span className="badge badge-sm badge-warning">Analyzing</span>;
        }
        return (
          <span className={`badge badge-sm ${value ? 'badge-success' : 'badge-ghost'}`}>
            {value ? 'Analyzed' : 'Pending'}
          </span>
        );
      },
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
  ], [perspective, analysisJobs, getJobKey]);

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
      render: (_value, row) => <ScoreBadge score={row ? getPerspectiveField(row, 'overallScore', perspective) : _value} />,
    },
    {
      key: 'criticalRiskCount',
      label: 'Critical',
      width: 80,
      align: 'center',
      editable: false,
      sortable: true,
      render: (_value, row) => <RiskCountBadge count={row ? getPerspectiveField(row, 'criticalRiskCount', perspective) : _value} level="critical" />,
    },
    {
      key: 'highRiskCount',
      label: 'High',
      width: 80,
      align: 'center',
      editable: false,
      sortable: true,
      render: (_value, row) => <RiskCountBadge count={row ? getPerspectiveField(row, 'highRiskCount', perspective) : _value} level="high" />,
    },
    {
      key: 'mediumRiskCount',
      label: 'Medium',
      width: 80,
      align: 'center',
      editable: false,
      sortable: true,
      render: (_value, row) => <RiskCountBadge count={row ? getPerspectiveField(row, 'mediumRiskCount', perspective) : _value} level="medium" />,
    },
    {
      key: 'lowRiskCount',
      label: 'Low',
      width: 80,
      align: 'center',
      editable: false,
      sortable: true,
      render: (_value, row) => <RiskCountBadge count={row ? getPerspectiveField(row, 'lowRiskCount', perspective) : _value} level="low" />,
    },
    {
      key: 'isAnalyzed',
      label: 'Status',
      width: 100,
      align: 'center',
      editable: false,
      sortable: true,
      render: (value, row) => {
        const hasJob = row ? !!analysisJobs[getJobKey('Contract', row.contractDatasetId)] : false;
        if (hasJob) {
          return <span className="badge badge-sm badge-warning">Analyzing</span>;
        }
        return (
          <span className={`badge badge-sm ${value ? 'badge-success' : 'badge-ghost'}`}>
            {value ? 'Analyzed' : 'Pending'}
          </span>
        );
      },
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
  ], [perspective, analysisJobs, getJobKey]);

  // Render actions for templates
  const renderTemplateActions = useCallback((row: TemplateAnalysisSummary) => (
    <div className="flex items-center gap-1">
      {analysisJobs[getJobKey('Template', row.contractTemplateId)] && (
        <span className="badge badge-xs badge-warning">Analyzing</span>
      )}
      {analysisJobs[getJobKey('Template', row.contractTemplateId)] && (
        <button
          className="btn btn-ghost btn-xs text-error hover:bg-error/10"
          onClick={(e) => {
            e.stopPropagation();
            handleCancelAnalysis('Template', row.contractTemplateId);
          }}
          title="Stop analysis"
        >
          <Icon icon={xIcon} className="w-4 h-4" />
        </button>
      )}
      {row.isAnalyzed && (
        <button
          className="btn btn-ghost btn-xs text-info hover:bg-info/20"
          onClick={(e) => {
            e.stopPropagation();
            handleViewTemplateDetails(row.contractTemplateId);
          }}
          disabled={navigatingId === row.contractTemplateId}
          title="View Details"
        >
          {navigatingId === row.contractTemplateId ? (
            <span className="loading loading-spinner loading-xs"></span>
          ) : (
            <Icon icon={eyeIcon} className="w-4 h-4" />
          )}
        </button>
      )}
      <button
        className="btn btn-ghost btn-xs text-primary hover:bg-primary/20"
        onClick={(e) => {
          e.stopPropagation();
          handleAnalyzeTemplate(row.contractTemplateId);
        }}
        disabled={analyzingId === row.contractTemplateId || !!analysisJobs[getJobKey('Template', row.contractTemplateId)]}
        title={analysisJobs[getJobKey('Template', row.contractTemplateId)] ? 'Analysis in progress' : row.isAnalyzed ? 'Re-analyze' : 'Analyze'}
      >
        {analyzingId === row.contractTemplateId || !!analysisJobs[getJobKey('Template', row.contractTemplateId)] ? (
          <span className="loading loading-spinner loading-xs"></span>
        ) : (
          <Icon icon={row.isAnalyzed ? refreshCwIcon : playIcon} className="w-4 h-4" />
        )}
      </button>
    </div>
  ), [analyzingId, navigatingId, handleAnalyzeTemplate, handleViewTemplateDetails, analysisJobs, getJobKey, handleCancelAnalysis]);

  // Render actions for contracts
  const renderContractActions = useCallback((row: ContractAnalysisSummary) => (
    <div className="flex items-center gap-1">
      {analysisJobs[getJobKey('Contract', row.contractDatasetId)] && (
        <span className="badge badge-xs badge-warning">Analyzing</span>
      )}
      {analysisJobs[getJobKey('Contract', row.contractDatasetId)] && (
        <button
          className="btn btn-ghost btn-xs text-error hover:bg-error/10"
          onClick={(e) => {
            e.stopPropagation();
            handleCancelAnalysis('Contract', row.contractDatasetId);
          }}
          title="Stop analysis"
        >
          <Icon icon={xIcon} className="w-4 h-4" />
        </button>
      )}
      {row.isAnalyzed && (
        <button
          className="btn btn-ghost btn-xs text-info hover:bg-info/20"
          onClick={(e) => {
            e.stopPropagation();
            handleViewContractDetails(row.contractDatasetId);
          }}
          disabled={navigatingId === row.contractDatasetId}
          title="View Details"
        >
          {navigatingId === row.contractDatasetId ? (
            <span className="loading loading-spinner loading-xs"></span>
          ) : (
            <Icon icon={eyeIcon} className="w-4 h-4" />
          )}
        </button>
      )}
      <button
        className="btn btn-ghost btn-xs text-primary hover:bg-primary/20"
        onClick={(e) => {
          e.stopPropagation();
          handleAnalyzeContract(row.contractDatasetId);
        }}
        disabled={analyzingId === row.contractDatasetId || !!analysisJobs[getJobKey('Contract', row.contractDatasetId)]}
        title={analysisJobs[getJobKey('Contract', row.contractDatasetId)] ? 'Analysis in progress' : row.isAnalyzed ? 'Re-analyze' : 'Analyze'}
      >
        {analyzingId === row.contractDatasetId || !!analysisJobs[getJobKey('Contract', row.contractDatasetId)] ? (
          <span className="loading loading-spinner loading-xs"></span>
        ) : (
          <Icon icon={row.isAnalyzed ? refreshCwIcon : playIcon} className="w-4 h-4" />
        )}
      </button>
    </div>
  ), [analyzingId, navigatingId, handleAnalyzeContract, handleViewContractDetails, analysisJobs, getJobKey, handleCancelAnalysis]);

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

  const [dragActive, setDragActive] = useState(false);

  const handleScanFile = useCallback(async (file: File) => {
    if (!file.name.endsWith('.docx') && !file.name.endsWith('.doc')) {
      toaster.error('Unsupported format. Please use a Word file (.docx)');
      return;
    }
    setAnalyzingId(-1);
    try {
      const result = await scanDocument(file);
      if (!result.success) {
        toaster.error(result.errorMessage || 'Analysis failed. Please check the file format.');
        return;
      }
      setScanResult(result);
      toaster.success('Analysis complete');
    } catch (error: any) {
      toaster.error(error.message || 'Error during analysis');
    } finally {
      setAnalyzingId(null);
    }
  }, [toaster]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 min-h-0">
        {activeTab === 'scan' ? (
          scanResult ? (
            <ScanResultsView
              result={scanResult}
              onScanAnother={() => setScanResult(null)}
              onSaved={() => loadUploadedDocs()}
            />
          ) : (
          <div className="h-full overflow-y-auto">
          <div className="flex flex-col items-center justify-center p-6 min-h-[60vh]">
            <div
              className={`w-full max-w-5xl border-2 border-dashed rounded-3xl py-32 px-16 text-center bg-base-100 shadow-sm
                transition-all duration-300 ease-out
                ${analyzingId === -1
                  ? 'border-primary bg-primary/5 scale-[0.98]'
                  : dragActive
                    ? 'border-primary bg-primary/5 scale-[1.02] shadow-lg shadow-primary/10'
                    : 'border-base-300 hover:border-primary/30'
                }`}
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleScanFile(e.dataTransfer.files[0]);
                }
              }}
            >
              {analyzingId === -1 ? (
                <div className="flex flex-col items-center gap-6">
                  {/* Animated document with scan line */}
                  <div className="relative w-48 h-64">
                    {/* Document shadow */}
                    <div className="absolute inset-0 translate-x-2 translate-y-2 rounded-lg bg-primary/10 animate-pulse" />
                    {/* Document body */}
                    <div className="relative w-full h-full rounded-lg bg-base-100 border-2 border-primary/30 shadow-lg overflow-hidden">
                      {/* Document corner fold */}
                      <div className="absolute top-0 right-0 w-8 h-8">
                        <div className="absolute top-0 right-0 w-0 h-0 border-l-[32px] border-l-transparent border-t-[32px] border-t-primary/10" />
                      </div>
                      {/* Fake text lines */}
                      <div className="p-5 space-y-3 pt-6">
                        <div className="h-2 bg-base-300/60 rounded-full w-3/4" />
                        <div className="h-2 bg-base-300/60 rounded-full w-full" />
                        <div className="h-2 bg-base-300/60 rounded-full w-5/6" />
                        <div className="h-2 bg-base-300/60 rounded-full w-2/3" />
                        <div className="h-2 bg-transparent rounded-full w-full" />
                        <div className="h-2 bg-base-300/60 rounded-full w-full" />
                        <div className="h-2 bg-base-300/60 rounded-full w-4/5" />
                        <div className="h-2 bg-base-300/60 rounded-full w-full" />
                        <div className="h-2 bg-base-300/60 rounded-full w-1/2" />
                        <div className="h-2 bg-transparent rounded-full w-full" />
                        <div className="h-2 bg-base-300/60 rounded-full w-5/6" />
                        <div className="h-2 bg-base-300/60 rounded-full w-full" />
                        <div className="h-2 bg-base-300/60 rounded-full w-3/4" />
                      </div>
                      {/* Scanning beam */}
                      <div
                        className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-80"
                        style={{ animation: 'scanBeam 2s ease-in-out infinite' }}
                      />
                      {/* Glow behind beam */}
                      <div
                        className="absolute left-0 right-0 h-8 bg-gradient-to-b from-primary/15 to-transparent"
                        style={{ animation: 'scanBeam 2s ease-in-out infinite' }}
                      />
                    </div>
                    {/* Floating risk badges */}
                    <div className="absolute -right-6 top-8 px-2 py-1 rounded bg-error/90 text-white text-[10px] font-bold shadow-md"
                      style={{ animation: 'badgePop 2s ease-in-out infinite 0.5s', opacity: 0 }}>
                      Critical
                    </div>
                    <div className="absolute -left-4 top-24 px-2 py-1 rounded bg-warning/90 text-white text-[10px] font-bold shadow-md"
                      style={{ animation: 'badgePop 2s ease-in-out infinite 1.2s', opacity: 0 }}>
                      Medium
                    </div>
                    <div className="absolute -right-3 bottom-16 px-2 py-1 rounded bg-success/90 text-white text-[10px] font-bold shadow-md"
                      style={{ animation: 'badgePop 2s ease-in-out infinite 1.8s', opacity: 0 }}>
                      Low
                    </div>
                  </div>

                  {/* Status text */}
                  <div className="text-center space-y-2">
                    <p className="text-xl font-semibold text-base-content/80">Analyzing your document</p>
                    <p className="text-sm text-base-content/50">Scanning clauses for risks across 7 categories</p>
                    {/* Animated dots */}
                    <div className="flex items-center justify-center gap-1.5 pt-2">
                      <span className="w-2 h-2 rounded-full bg-primary" style={{ animation: 'dotBounce 1.4s ease-in-out infinite' }} />
                      <span className="w-2 h-2 rounded-full bg-primary" style={{ animation: 'dotBounce 1.4s ease-in-out infinite 0.2s' }} />
                      <span className="w-2 h-2 rounded-full bg-primary" style={{ animation: 'dotBounce 1.4s ease-in-out infinite 0.4s' }} />
                    </div>
                  </div>

                  {/* Inline keyframes */}
                  <style>{`
                    @keyframes scanBeam {
                      0%, 100% { top: 8%; }
                      50% { top: 85%; }
                    }
                    @keyframes badgePop {
                      0%, 100% { opacity: 0; transform: scale(0.7) translateY(4px); }
                      15%, 85% { opacity: 1; transform: scale(1) translateY(0); }
                    }
                    @keyframes dotBounce {
                      0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
                      40% { transform: scale(1); opacity: 1; }
                    }
                  `}</style>
                </div>
              ) : (
                <>
                  <div className={`transition-transform duration-300 ${dragActive ? '-translate-y-2 scale-110' : ''}`}>
                    <Icon icon={uploadCloudIcon} className={`size-20 mx-auto transition-colors duration-300 ${dragActive ? 'text-primary/60' : 'text-base-content/15'}`} />
                  </div>
                  <h3 className="mt-5 text-2xl font-semibold text-base-content">
                    {dragActive ? 'Release to analyze' : 'Drop your contract or document here'}
                  </h3>
                  <p className="mt-2 text-base-content/50 max-w-md mx-auto">
                    Upload a Word document to analyze for risk clauses and get instant recommendations
                  </p>
                  <div className="mt-8 flex items-center justify-center gap-3">
                    <div className="h-px w-12 bg-base-300"></div>
                    <span className="text-xs text-base-content/40 uppercase tracking-wider">or</span>
                    <div className="h-px w-12 bg-base-300"></div>
                  </div>
                  <label className="btn btn-primary btn-md mt-4 transition-transform duration-200 hover:scale-105 active:scale-95">
                    <Icon icon={scanIcon} className="size-4" />
                    Browse Files
                    <input
                      type="file"
                      className="hidden"
                      accept=".doc,.docx"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleScanFile(e.target.files[0]);
                        }
                      }}
                    />
                  </label>
                  <p className="text-xs text-base-content/35 mt-4">Supported formats: .docx, .doc</p>
                </>
              )}
            </div>
          </div>

          {/* Saved Documents List */}
          {uploadedDocs.length > 0 && (
            <div className="max-w-5xl mx-auto w-full px-6 pb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-base-content/70">Saved Scans</h3>
                <span className="text-xs text-base-content/40">{uploadedDocs.length} document{uploadedDocs.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="space-y-2">
                {uploadedDocs.map(doc => {
                  const status = getHealthStatus(doc.overallScore);
                  return (
                    <div
                      key={doc.id}
                      className="flex items-center gap-3 rounded-lg border border-base-200 bg-base-100 px-3 py-2.5 shadow-sm hover:bg-base-200/30 cursor-pointer transition-colors group"
                      onClick={async () => {
                        try {
                          const fullDoc = await getUploadedDocument(doc.id);
                          setScanResult(fullDoc);
                        } catch (err: any) {
                          toaster.error(err.message || 'Error loading document');
                        }
                      }}
                    >
                      <Icon icon={fileTextIcon} className="size-5 text-base-content/30 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{doc.fileName}</p>
                        <p className="text-[11px] text-base-content/40">
                          {new Date(doc.uploadedAt).toLocaleDateString()} &middot; {doc.totalClauses} clauses
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-sm font-semibold tabular-nums" style={{ color: status.color }}>
                          {Math.round(doc.overallScore)}
                        </span>
                        <span className="badge badge-xs font-medium" style={{ backgroundColor: status.color + '15', color: status.color }}>
                          {status.label}
                        </span>
                        {doc.criticalRiskCount > 0 && (
                          <span className="badge badge-xs border-0 text-white" style={{ backgroundColor: '#4a1d1d' }}>
                            {doc.criticalRiskCount}C
                          </span>
                        )}
                        {doc.highRiskCount > 0 && (
                          <span className="badge badge-xs border-0 text-white" style={{ backgroundColor: '#b91c1c' }}>
                            {doc.highRiskCount}H
                          </span>
                        )}
                      </div>
                      <button
                        className="btn btn-ghost btn-xs opacity-0 group-hover:opacity-100 transition-opacity text-error"
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (!confirm('Delete this saved scan?')) return;
                          try {
                            await deleteUploadedDocument(doc.id);
                            setUploadedDocs(prev => prev.filter(d => d.id !== doc.id));
                            toaster.success('Document deleted');
                          } catch (err: any) {
                            toaster.error(err.message || 'Error deleting document');
                          }
                        }}
                      >
                        <Icon icon={xIcon} className="size-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          </div>
          )
        ) : activeTab === 'templates' ? (
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

      <HowItWorksModal
        isOpen={showHowItWorksModal}
        onClose={() => setShowHowItWorksModal(false)}
      />

      <PerspectiveSelectionModal
        isOpen={showPerspectiveModal}
        onSelect={(p) => {
          setPerspective(p);
          setShowPerspectiveModal(false);
        }}
      />
    </div>
  );
});

ContractAnalysisDashboard.displayName = 'ContractAnalysisDashboard';

export default ContractAnalysisDashboard;
