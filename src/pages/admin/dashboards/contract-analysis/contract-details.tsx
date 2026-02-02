import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { Loader } from '@/components/Loader';
import { useTopbarContent } from '@/contexts/topbar-content';
import useToast from '@/hooks/use-toast';
import {
  getContractHealthReport,
  getContractClauses,
  analyzeContract,
} from '@/api/services/contract-analysis-api';
import type {
  ContractHealthReport,
  ContractClause,
} from '@/types/contract-analysis';
import {
  getHealthStatus,
} from '@/types/contract-analysis';
import ContractAiChat, { type ContractAiChatHandle } from './ContractAiChat';
import ContractDocumentViewer, { type ContractDocumentViewerHandle } from './ContractDocumentViewer';

// Icons
import arrowLeftIcon from '@iconify/icons-lucide/arrow-left';
import refreshCwIcon from '@iconify/icons-lucide/refresh-cw';
import checkCircleIcon from '@iconify/icons-lucide/check-circle';
import messageSquareIcon from '@iconify/icons-lucide/message-square';
import xIcon from '@iconify/icons-lucide/x';
import trendingUpIcon from '@iconify/icons-lucide/trending-up';
import trendingDownIcon from '@iconify/icons-lucide/trending-down';
import chevronDownIcon from '@iconify/icons-lucide/chevron-down';

const clampValue = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const SUMMARY_STORAGE_KEY = 'sam.contractAnalysis.summaryCollapsed.contract';
const RISK_LEVEL_COLORS: Record<'Critical' | 'High' | 'Medium' | 'Low', string> = {
  Critical: '#4a1d1d',
  High: '#b91c1c',
  Medium: '#a16207',
  Low: '#6b7280',
};
const getStoredSummaryState = (fallback: boolean) => {
  if (typeof window === 'undefined') return fallback;
  const stored = window.localStorage.getItem(SUMMARY_STORAGE_KEY);
  if (stored === null) return fallback;
  return stored === 'true';
};

// Score Ring Component
const ScoreRing = ({ score, size = 120 }: { score: number; size?: number }) => {
  const status = getHealthStatus(score);
  const strokeWidth = size > 100 ? 10 : 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const isCompact = size <= 90;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-base-200" />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={status.color} strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`${isCompact ? 'text-2xl' : 'text-3xl'} font-bold tabular-nums`}>{Math.round(score)}</span>
        <span
          className={`mt-0.5 ${isCompact ? 'text-[10px] px-1' : 'text-xs px-1.5'} py-0.5 rounded-full font-medium`}
          style={{ backgroundColor: status.color + '15', color: status.color }}
        >
          {status.label}
        </span>
      </div>
    </div>
  );
};

// Compact Stat Card
const StatCard = ({
  label,
  value,
  color,
  icon,
  onClick,
}: {
  label: string;
  value: number;
  color: string;
  icon?: React.ReactNode;
  onClick?: () => void;
}) => {
  const content = (
    <div className={`flex items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 shadow-sm transition-colors ${
      onClick ? 'border-base-200 bg-base-100 hover:bg-base-200/40 hover:border-base-300' : 'border-base-200 bg-base-100'
    }`}>
      <div className="flex items-center gap-2 min-w-0">
        {icon && (
          <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-semibold" style={{ backgroundColor: color + '20', color }}>
            {icon}
          </div>
        )}
        <span className="text-[11px] uppercase tracking-wide text-base-content/50 truncate">{label}</span>
      </div>
      <span className="text-sm font-semibold tabular-nums" style={{ color }}>{value}</span>
    </div>
  );

  if (!onClick) return content;

  return (
    <button type="button" className="text-left w-full" onClick={onClick}>
      {content}
    </button>
  );
};

// Compact Category Progress
const CategoryProgress = ({ label, score }: { label: string; score: number }) => {
  const status = getHealthStatus(score);
  return (
    <div className="flex items-center gap-2 min-w-0">
      <span className="text-[11px] sm:text-xs w-20 sm:w-28 truncate text-base-content/70">{label}</span>
      <div className="flex-1 h-1.5 sm:h-2 bg-base-200 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${score}%`, backgroundColor: status.color }} />
      </div>
      <span className="text-[11px] sm:text-xs font-semibold w-7 text-right" style={{ color: status.color }}>{Math.round(score)}</span>
    </div>
  );
};

// Main Component
export default function ContractDetailsPage() {
  const { contractId } = useParams<{ contractId: string }>();
  const navigate = useNavigate();
  const { setAllContent, clearContent } = useTopbarContent();
  const { toaster } = useToast();

  const [report, setReport] = useState<ContractHealthReport | null>(null);
  const [clauses, setClauses] = useState<ContractClause[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [summaryCollapsed, setSummaryCollapsed] = useState(() => getStoredSummaryState(true));
  const [isNarrowScreen, setIsNarrowScreen] = useState(false);
  const [isDesktopScreen, setIsDesktopScreen] = useState(false);
  const [splitPercent, setSplitPercent] = useState(50);
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);
  const [riskDialogOpen, setRiskDialogOpen] = useState(false);
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<'Critical' | 'High' | 'Medium' | 'Low' | null>(null);
  const pdfViewerRef = useRef<ContractDocumentViewerHandle>(null);
  const chatRef = useRef<ContractAiChatHandle>(null);
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const splitContainerRef = useRef<HTMLDivElement>(null);
  const riskDialogRef = useRef<HTMLDialogElement>(null);

  const loadData = useCallback(async () => {
    if (!contractId) return;
    try {
      const [reportData, clausesData] = await Promise.all([
        getContractHealthReport(parseInt(contractId)),
        getContractClauses(parseInt(contractId)),
      ]);
      setReport(reportData);
      setClauses(clausesData);
    } catch (error: any) {
      toaster.error(error.message || 'Error loading data');
    } finally {
      setIsLoading(false);
    }
  }, [contractId, toaster]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const handleChange = () => {
      setIsNarrowScreen(mediaQuery.matches);
      if (mediaQuery.matches) {
        setSummaryCollapsed(true);
      }
    };

    handleChange();
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(SUMMARY_STORAGE_KEY, String(summaryCollapsed));
  }, [summaryCollapsed]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    const handleChange = () => setIsDesktopScreen(mediaQuery.matches);
    handleChange();
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      mediaQuery.addListener(handleChange);
    }
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  const handleReanalyze = useCallback(async () => {
    if (!contractId) return;
    setIsReanalyzing(true);
    try {
      const result = await analyzeContract(parseInt(contractId));
      if (result.success) {
        toaster.success('Analysis complete');
        loadData();
      } else {
        toaster.error(result.errorMessage || 'Error');
      }
    } catch (error: any) {
      toaster.error(error.message || 'Error');
    } finally {
      setIsReanalyzing(false);
    }
  }, [contractId, loadData, toaster]);

  const handleBack = useCallback(() => {
    navigate('/dashboard/contract-analysis');
  }, [navigate]);

  const handleToggleSummary = useCallback(() => {
    if (isNarrowScreen) return;
    setSummaryCollapsed(prev => !prev);
  }, [isNarrowScreen]);

  const openRiskDialog = useCallback((level: 'Critical' | 'High' | 'Medium' | 'Low') => {
    setSelectedRiskLevel(level);
    setRiskDialogOpen(true);
  }, []);

  const handleSplitterMouseDown = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    setIsDraggingSplit(true);
  }, []);

  useEffect(() => {
    if (!isDraggingSplit) return;

    const handleMove = (event: MouseEvent) => {
      if (!splitContainerRef.current) return;
      const rect = splitContainerRef.current.getBoundingClientRect();
      const percent = ((event.clientX - rect.left) / rect.width) * 100;
      setSplitPercent(clampValue(percent, 30, 70));
    };

    const handleUp = () => setIsDraggingSplit(false);

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDraggingSplit]);

  useEffect(() => {
    const dialog = riskDialogRef.current;
    if (!dialog) return;
    if (riskDialogOpen && !dialog.open) {
      dialog.showModal();
    }
    if (!riskDialogOpen && dialog.open) {
      dialog.close();
    }
  }, [riskDialogOpen]);

  // Clause numbers for chat linking
  const clauseNumbers = useMemo(() => {
    return clauses.map(c => c.clauseNumber || `Clause ${c.clauseOrder}`);
  }, [clauses]);

  // Highlight clauses in document viewer — search for the actual problematic text when available
  const highlightClause = useCallback((clauseRefs: string[]) => {
    console.log('[ContractDetails] highlightClause called with:', clauseRefs, 'ref available:', !!pdfViewerRef.current);
    pdfViewerRef.current?.clearHighlights();

    if (clauseRefs[0]) {
      // Find the best matchedText for this clause to highlight the problematic phrase
      let searchText = clauseRefs[0];
      const key = clauseRefs[0].toLowerCase().trim();
      const levelPriority: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };
      for (const clause of clauses) {
        const cn = (clause.clauseNumber || `Clause ${clause.clauseOrder}`).toLowerCase().trim();
        if (cn === key) {
          const bestRisk = [...clause.riskAssessments]
            .sort((a, b) => (levelPriority[a.level] ?? 9) - (levelPriority[b.level] ?? 9))
            .find(r => r.matchedText);
          if (bestRisk?.matchedText) {
            // Syncfusion search only works within a single paragraph — use the first line only
            const firstLine = bestRisk.matchedText.split(/[\r\n]+/)[0].trim();
            searchText = firstLine.length > 100 ? firstLine.slice(0, 100) : firstLine;
          }
          break;
        }
      }
      console.log('[ContractDetails] Searching for text:', searchText.slice(0, 80));
      pdfViewerRef.current?.searchAndScrollTo(searchText);
    }

    clearTimeout(highlightTimeoutRef.current);
    highlightTimeoutRef.current = setTimeout(() => {
      pdfViewerRef.current?.clearHighlights();
    }, 8000);
  }, [clauses]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => clearTimeout(highlightTimeoutRef.current);
  }, []);

  const riskItems = useMemo(() => {
    return clauses.flatMap((clause) =>
      clause.riskAssessments.map((risk) => ({
        level: risk.level,
        category: risk.categoryEn || risk.category || 'General',
        description: risk.riskDescriptionEn || risk.riskDescription || '',
        recommendation: risk.recommendationEn || risk.recommendation || '',
        matchedText: risk.matchedText || '',
        clauseLabel: clause.clauseNumber || `Clause ${clause.clauseOrder}`,
      }))
    );
  }, [clauses]);

  const filteredRiskItems = useMemo(() => {
    if (!selectedRiskLevel) return [];
    return riskItems.filter((risk) => risk.level === selectedRiskLevel);
  }, [riskItems, selectedRiskLevel]);

  // Topbar setup
  useEffect(() => {
    const leftContent = (
      <div className="flex items-center gap-3">
        <button onClick={handleBack} className="w-8 h-8 flex items-center justify-center rounded-full bg-base-200 hover:bg-base-300 transition-colors">
          <Icon icon={arrowLeftIcon} className="size-5" />
        </button>
      </div>
    );

    const centerContent = report?.contractNumber ? (
      <div className="flex items-center gap-2">
        <span className="font-semibold">{report.contractNumber}</span>
        {report.projectName && <span className="text-sm text-base-content/50">— {report.projectName}</span>}
      </div>
    ) : null;

    const rightContent = (
      <div className="flex items-center gap-1.5">
        <button
          className="btn btn-sm btn-circle btn-ghost hover:bg-base-200 tooltip tooltip-bottom"
          onClick={handleReanalyze}
          disabled={isReanalyzing}
          title={isReanalyzing ? "Re-analyzing..." : "Re-analyze"}
          aria-label="Re-analyze"
          data-tip={isReanalyzing ? "Re-analyzing..." : "Re-analyze"}
        >
          {isReanalyzing ? (
            <span className="loading loading-spinner loading-xs"></span>
          ) : (
            <Icon icon={refreshCwIcon} className="size-4" />
          )}
        </button>
        <div className="w-px h-5 bg-base-300"></div>
        <button
          className={`btn btn-sm btn-circle tooltip tooltip-bottom ${isChatOpen ? 'btn-primary' : 'btn-ghost hover:bg-base-200'}`}
          onClick={() => setIsChatOpen(!isChatOpen)}
          title={isChatOpen ? 'Hide AI Chat' : 'Show AI Chat'}
          aria-label={isChatOpen ? 'Hide AI Chat' : 'Show AI Chat'}
          data-tip={isChatOpen ? 'Hide AI Chat' : 'Show AI Chat'}
        >
          <Icon icon={messageSquareIcon} className="size-4" />
        </button>
      </div>
    );

    setAllContent(leftContent, centerContent, rightContent);
    return () => clearContent();
  }, [handleBack, handleReanalyze, isReanalyzing, report?.contractNumber, report?.projectName, isChatOpen, setAllContent, clearContent]);

  if (isLoading) return <Loader />;

  if (!report) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-base-content/60 mb-4">Contract report not found</p>
          <button className="btn btn-primary" onClick={handleBack}>Back</button>
        </div>
      </div>
    );
  }

  const overallStatus = getHealthStatus(report.overallScore);
  const riskPills = [
    { count: report.criticalRiskCount, label: 'Critical', color: '#4a1d1d' },
    { count: report.highRiskCount, label: 'High', color: '#b91c1c' },
    { count: report.mediumRiskCount, label: 'Med', color: '#a16207' },
    { count: report.lowRiskCount, label: 'Low', color: '#6b7280' },
  ].filter(pill => pill.count > 0);
  const isSplitActive = isChatOpen && isDesktopScreen;
  const leftPaneStyle = isSplitActive ? { flex: `0 0 ${splitPercent}%` } : { flex: '1 1 0%' };
  const rightPaneStyle = { flex: `0 0 ${100 - splitPercent}%` };

  return (
    <div ref={splitContainerRef} className="h-full overflow-hidden flex bg-base-100">
      <div className="min-w-0 min-h-0 flex flex-col" style={leftPaneStyle}>
        {/* Collapsible Summary Bar */}
        <div className="flex-shrink-0 border-b border-base-200 bg-base-100/80 backdrop-blur">
          <div className="flex items-center justify-between gap-3 px-3 py-1.5">
            <div className="flex items-center gap-3 min-w-0">
              <span className="hidden md:inline text-[11px] font-semibold uppercase tracking-[0.2em] text-base-content/40">Summary</span>
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold tabular-nums">{Math.round(report.overallScore)}</span>
                <span className="badge badge-sm font-medium" style={{ backgroundColor: overallStatus.color + '15', color: overallStatus.color }}>
                  {overallStatus.label}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {riskPills.length > 0 ? (
                  riskPills.map((pill) => (
                    <span key={pill.label} className="badge badge-sm border-0 text-white" style={{ backgroundColor: pill.color }}>
                      {pill.count} {pill.label}
                    </span>
                  ))
                ) : (
                  <span className="badge badge-sm badge-outline text-base-content/50">No risks</span>
                )}
              </div>
              <div className="hidden md:flex items-center gap-2 min-w-[120px]">
                <div className="h-1 w-20 bg-base-200 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-[width] duration-300" style={{ width: `${report.overallScore}%`, backgroundColor: overallStatus.color }} />
                </div>
                <span className="text-[11px] text-base-content/50">Overall</span>
              </div>
              {report.subcontractorName && (
                <span className="hidden xl:inline text-xs text-base-content/50 truncate max-w-[220px]">
                  {report.subcontractorName}
                </span>
              )}
            </div>
            <button
              onClick={handleToggleSummary}
              className="btn btn-ghost btn-xs gap-1"
              aria-expanded={!summaryCollapsed}
              aria-controls="contract-summary-panel"
              disabled={isNarrowScreen}
            >
              <span className="hidden sm:inline text-xs">{summaryCollapsed ? 'Show details' : 'Hide details'}</span>
              <Icon icon={chevronDownIcon} className={`size-3.5 transition-transform ${summaryCollapsed ? '' : 'rotate-180'}`} />
            </button>
          </div>

        <div
          id="contract-summary-panel"
          className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${summaryCollapsed ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100'}`}
        >
          <div className="overflow-hidden">
            <div className="px-3 pb-3 space-y-2">
              {/* Contract Info */}
              {(report.subcontractorName || report.projectName) && (
                <div className="flex flex-wrap items-center gap-2 rounded-lg bg-base-200/40 px-2.5 py-1.5 text-[11px] text-base-content/60">
                  {report.subcontractorName && (
                    <div className="flex items-center gap-1.5">
                      <span className="uppercase text-[10px] tracking-wide">Subcontractor</span>
                      <span className="font-semibold text-base-content">{report.subcontractorName}</span>
                    </div>
                  )}
                  {report.projectName && (
                    <div className="flex items-center gap-1.5">
                      <span className="uppercase text-[10px] tracking-wide">Project</span>
                      <span className="font-semibold text-base-content">{report.projectName}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="grid gap-2 lg:grid-cols-[150px_minmax(0,1fr)] items-stretch">
                {/* Score Ring */}
                <div className="card bg-base-100 border border-base-200 shadow-sm h-full">
                  <div className="card-body items-center p-2 gap-2 h-full">
                    <div className="flex-1 flex items-center justify-center">
                      <ScoreRing score={report.overallScore} size={72} />
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-[10px] text-base-content/60 leading-tight">Based on {report.totalClauses} clauses</p>
                      {report.deltaFromTemplate !== 0 && (
                        <div className={`flex items-center justify-center gap-1 text-[10px] ${report.deltaFromTemplate > 0 ? 'text-error' : 'text-success'}`}>
                          <Icon icon={report.deltaFromTemplate > 0 ? trendingDownIcon : trendingUpIcon} className="size-3" />
                          <span>{report.deltaFromTemplate > 0 ? '-' : '+'}{Math.abs(report.deltaFromTemplate)} vs template</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="space-y-2 min-w-0 h-full flex flex-col">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <StatCard label="Critical" value={report.criticalRiskCount} color="#4a1d1d" icon={<span>!</span>} onClick={() => openRiskDialog('Critical')} />
                    <StatCard label="High" value={report.highRiskCount} color="#b91c1c" icon={<span>!</span>} onClick={() => openRiskDialog('High')} />
                    <StatCard label="Medium" value={report.mediumRiskCount} color="#a16207" icon={<span>-</span>} onClick={() => openRiskDialog('Medium')} />
                    <StatCard label="Low" value={report.lowRiskCount} color="#6b7280" icon={<Icon icon={checkCircleIcon} className="size-3.5" />} onClick={() => openRiskDialog('Low')} />
                  </div>

                  {(report.modificationsDetected > 0 || report.newRisksIntroduced > 0 || report.risksMitigated > 0) && (
                    <div className="flex flex-wrap items-center gap-1.5 rounded-lg bg-base-100 border border-base-200 px-2.5 py-1.5 text-[10px]">
                      {report.modificationsDetected > 0 && (
                        <span className="badge badge-outline text-[10px]">Modifications {report.modificationsDetected}</span>
                      )}
                      {report.newRisksIntroduced > 0 && (
                        <span className="badge badge-error badge-outline text-[10px]">New Risks +{report.newRisksIntroduced}</span>
                      )}
                      {report.risksMitigated > 0 && (
                        <span className="badge badge-success badge-outline text-[10px]">Mitigated -{report.risksMitigated}</span>
                      )}
                    </div>
                  )}

                  <div className="rounded-lg border border-base-200 bg-base-100 px-2.5 py-2 shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-[11px] font-semibold uppercase tracking-wide text-base-content/60">Risk Categories</h3>
                      <span className="text-[10px] text-base-content/40">by area</span>
                    </div>
                    <div className="grid grid-cols-2 xl:grid-cols-3 gap-x-3 gap-y-1.5">
                      <CategoryProgress label="Payment" score={report.categoryScores.payment} />
                      <CategoryProgress label="Responsibility" score={report.categoryScores.roleResponsibility} />
                      <CategoryProgress label="Safety" score={report.categoryScores.safety} />
                      <CategoryProgress label="Timeline" score={report.categoryScores.temporal} />
                      <CategoryProgress label="Procedures" score={report.categoryScores.procedure} />
                      <CategoryProgress label="Definitions" score={report.categoryScores.definition} />
                      <CategoryProgress label="References" score={report.categoryScores.reference} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

        {/* Contract PDF */}
        <div className="flex-1 min-h-0 min-w-0 overflow-auto bg-base-100">
          <ContractDocumentViewer
            ref={pdfViewerRef}
            contractDatasetId={parseInt(contractId || '0')}
          />
        </div>
      </div>

      {isSplitActive && (
        <div
          className="hidden lg:flex w-2 items-center justify-center cursor-col-resize bg-base-200/50 hover:bg-base-200 transition-colors"
          onMouseDown={handleSplitterMouseDown}
          onDoubleClick={() => setSplitPercent(50)}
          role="separator"
          aria-orientation="vertical"
          aria-valuenow={Math.round(splitPercent)}
          aria-valuemin={30}
          aria-valuemax={70}
        >
          <div className="h-10 w-0.5 rounded-full bg-base-300" />
        </div>
      )}

      {/* RIGHT: AI Chat (desktop) */}
      {isChatOpen && (
        <div className="hidden lg:flex flex-col min-w-[320px] bg-base-100/90 backdrop-blur-sm shadow-lg" style={rightPaneStyle}>
          <div className="flex items-center justify-between px-4 py-2 border-b border-base-200/70">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-base-content/50">
              <span className="w-2 h-2 rounded-full bg-success"></span>
              AI Assistant
            </div>
            <span className="text-[10px] text-base-content/40">Contextual</span>
          </div>
          <div className="flex-1 min-h-0 p-3">
            <ContractAiChat
              ref={chatRef}
              templateName={report.contractNumber || 'Contract'}
              contractId={parseInt(contractId || '0')}
              overallScore={report.overallScore}
              criticalCount={report.criticalRiskCount}
              highCount={report.highRiskCount}
              mediumCount={report.mediumRiskCount}
              lowCount={report.lowRiskCount}
              totalClauses={report.totalClauses}
              categoryScores={report.categoryScores}
              topRisks={clauses
                .flatMap(c => c.riskAssessments.map(r => ({
                  ...r,
                  clauseRef: c.clauseNumber || `Clause ${c.clauseOrder}`,
                })))
                .filter(r => r.level === 'Critical' || r.level === 'High')
                .slice(0, 5)}
              clauseNumbers={clauseNumbers}
              onClauseReferenceClick={(cn) => highlightClause([cn])}
              onReferencedClauses={(refs) => highlightClause(refs)}
            />
          </div>
        </div>
      )}

      <dialog
        ref={riskDialogRef}
        className="modal"
        onClose={() => setRiskDialogOpen(false)}
      >
        <div className="modal-box w-11/12 max-w-4xl p-0 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-base-200">
            <div>
              <h3 className="font-semibold text-sm">
                {selectedRiskLevel ? `${selectedRiskLevel} Risks` : 'Risks'}
              </h3>
              <p className="text-xs text-base-content/50">
                {filteredRiskItems.length} item{filteredRiskItems.length === 1 ? '' : 's'}
              </p>
            </div>
            <form method="dialog">
              <button
                className="btn btn-sm btn-circle btn-ghost"
                aria-label="Close"
                onClick={() => setRiskDialogOpen(false)}
              >
                <Icon icon={xIcon} className="size-4" />
              </button>
            </form>
          </div>
          <div className="max-h-[70vh] overflow-y-auto p-4 space-y-3">
            {filteredRiskItems.length === 0 ? (
              <div className="text-sm text-base-content/60">No risks at this level.</div>
            ) : (
              filteredRiskItems.map((risk, index) => (
                <div key={`${risk.clauseLabel}-${index}`} className="rounded-lg border border-base-200 bg-base-100 p-3 shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="badge badge-sm border-0 text-white"
                      style={{ backgroundColor: RISK_LEVEL_COLORS[risk.level as keyof typeof RISK_LEVEL_COLORS] }}
                    >
                      {risk.level}
                    </span>
                    <span className="text-xs text-base-content/50">{risk.clauseLabel}</span>
                  </div>
                  <div className="mt-2 text-sm font-medium text-base-content">{risk.category}</div>
                  {risk.description && (
                    <p className="text-xs text-base-content/70 mt-1 leading-relaxed">{risk.description}</p>
                  )}
                  {risk.matchedText && (
                    <div className="mt-2 rounded-md bg-base-200/60 px-2 py-1 text-xs italic text-base-content/60">
                      "{risk.matchedText}"
                    </div>
                  )}
                  {risk.recommendation && (
                    <div className="mt-2 text-xs text-base-content/70">
                      <span className="font-semibold text-base-content/60">Recommendation:</span> {risk.recommendation}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button onClick={() => setRiskDialogOpen(false)}>close</button>
        </form>
      </dialog>

      {/* Mobile Chat Overlay */}
      {isChatOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsChatOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-[400px] bg-base-100 shadow-xl flex flex-col">
            <div className="flex items-center justify-between p-3 border-b border-base-200">
              <span className="font-semibold text-sm">AI Chat Assistant</span>
              <button className="btn btn-sm btn-ghost btn-circle" onClick={() => setIsChatOpen(false)}>
                <Icon icon={xIcon} className="size-5" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden p-3">
              <ContractAiChat
                templateName={report.contractNumber || 'Contract'}
                contractId={parseInt(contractId || '0')}
                overallScore={report.overallScore}
                criticalCount={report.criticalRiskCount}
                highCount={report.highRiskCount}
                mediumCount={report.mediumRiskCount}
                lowCount={report.lowRiskCount}
                totalClauses={report.totalClauses}
                categoryScores={report.categoryScores}
                topRisks={clauses
                  .flatMap(c => c.riskAssessments)
                  .filter(r => r.level === 'Critical' || r.level === 'High')
                  .slice(0, 5)}
                clauseNumbers={clauseNumbers}
                onClauseReferenceClick={(cn) => highlightClause([cn])}
                onReferencedClauses={(refs) => highlightClause(refs)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
