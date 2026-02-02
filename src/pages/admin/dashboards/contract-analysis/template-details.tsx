import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { Loader } from '@/components/Loader';
import { useTopbarContent } from '@/contexts/topbar-content';
import useToast from '@/hooks/use-toast';
import {
  getTemplateProfile,
  getTemplateClauses,
  analyzeTemplate,
} from '@/api/services/contract-analysis-api';
import type {
  TemplateRiskProfile,
  ContractClause,
} from '@/types/contract-analysis';
import {
  getHealthStatus,
} from '@/types/contract-analysis';
import ContractAiChat, { type ContractAiChatHandle } from './ContractAiChat';
import ClauseDocumentView, { type ClauseDocumentViewHandle } from './ClauseDocumentView';

// Icons
import arrowLeftIcon from '@iconify/icons-lucide/arrow-left';
import refreshCwIcon from '@iconify/icons-lucide/refresh-cw';
import checkCircleIcon from '@iconify/icons-lucide/check-circle';
import messageSquareIcon from '@iconify/icons-lucide/message-square';
import xIcon from '@iconify/icons-lucide/x';
import chevronDownIcon from '@iconify/icons-lucide/chevron-down';

const clampValue = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const SUMMARY_STORAGE_KEY = 'sam.contractAnalysis.summaryCollapsed.template';
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

// Risk level filter options
const FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'risky', label: 'With Risks' },
  { value: 'Critical', label: 'Critical' },
  { value: 'High', label: 'High' },
  { value: 'Medium', label: 'Medium' },
  { value: 'Low', label: 'Low' },
];

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
export default function TemplateDetailsPage() {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const { setAllContent, clearContent } = useTopbarContent();
  const { toaster } = useToast();

  const [profile, setProfile] = useState<TemplateRiskProfile | null>(null);
  const [clauses, setClauses] = useState<ContractClause[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [summaryCollapsed, setSummaryCollapsed] = useState(() => getStoredSummaryState(true));
  const [isNarrowScreen, setIsNarrowScreen] = useState(false);
  const [isDesktopScreen, setIsDesktopScreen] = useState(false);
  const [splitPercent, setSplitPercent] = useState(50);
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);
  const [riskDialogOpen, setRiskDialogOpen] = useState(false);
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<'Critical' | 'High' | 'Medium' | 'Low' | null>(null);
  const [highlightedClauses, setHighlightedClauses] = useState<string[]>([]);

  const clauseViewRef = useRef<ClauseDocumentViewHandle>(null);
  const chatRef = useRef<ContractAiChatHandle>(null);
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const splitContainerRef = useRef<HTMLDivElement>(null);
  const riskDialogRef = useRef<HTMLDialogElement>(null);

  const loadData = useCallback(async () => {
    if (!templateId) return;
    try {
      const [profileData, clausesData] = await Promise.all([
        getTemplateProfile(parseInt(templateId)),
        getTemplateClauses(parseInt(templateId)),
      ]);
      setProfile(profileData);
      setClauses(clausesData);
    } catch (error: any) {
      toaster.error(error.message || 'Error loading data');
    } finally {
      setIsLoading(false);
    }
  }, [templateId, toaster]);

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
    if (!templateId) return;
    setIsReanalyzing(true);
    try {
      const result = await analyzeTemplate(parseInt(templateId));
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
  }, [templateId, loadData, toaster]);

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

  // Highlight clauses in clause view
  const highlightClause = useCallback((clauseNumbers: string[]) => {
    setHighlightedClauses(clauseNumbers);

    if (clauseNumbers[0]) {
      clauseViewRef.current?.scrollToClause(clauseNumbers[0]);
    }

    clearTimeout(highlightTimeoutRef.current);
    highlightTimeoutRef.current = setTimeout(() => {
      setHighlightedClauses([]);
    }, 8000);
  }, []);

  // Handle "Ask AI" click from clause view
  const handleClauseClick = useCallback((clauseNumber: string) => {
    chatRef.current?.sendMessage(`Analyze the risks in ${clauseNumber}`);
  }, []);

  useEffect(() => {
    return () => clearTimeout(highlightTimeoutRef.current);
  }, []);

  // Clause numbers for chat linking
  const clauseNumbers = useMemo(() => {
    return clauses.map(c => c.clauseNumber || `Clause ${c.clauseOrder}`);
  }, [clauses]);

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

  // Filter clauses
  const filteredClauses = useMemo(() => {
    return clauses.filter((clause) => {
      if (filterLevel === 'all') return true;
      if (filterLevel === 'risky') return clause.riskAssessments.length > 0;
      return clause.riskAssessments.some((r) => r.level === filterLevel);
    });
  }, [clauses, filterLevel]);

  // Stats
  const totalRisks = useMemo(() => {
    return clauses.reduce((sum, c) => sum + c.riskAssessments.length, 0);
  }, [clauses]);

  const clausesWithRisks = useMemo(() => {
    return clauses.filter((c) => c.riskAssessments.length > 0).length;
  }, [clauses]);

  // Topbar setup
  useEffect(() => {
    const leftContent = (
      <div className="flex items-center gap-3">
        <button onClick={handleBack} className="w-8 h-8 flex items-center justify-center rounded-full bg-base-200 hover:bg-base-300 transition-colors">
          <Icon icon={arrowLeftIcon} className="size-5" />
        </button>
        <span className="font-semibold text-lg">{profile?.templateName || 'Template Analysis'}</span>
      </div>
    );

    const rightContent = (
      <div className="flex items-center gap-2">
        <button
          className="btn btn-sm btn-outline btn-circle tooltip tooltip-bottom"
          onClick={handleReanalyze}
          disabled={isReanalyzing}
          title={isReanalyzing ? "Re-analyzing..." : "Re-analyze"}
          aria-label="Re-analyze"
          data-tip={isReanalyzing ? "Re-analyzing..." : "Re-analyze"}
        >
          {isReanalyzing ? (
            <span className="loading loading-spinner loading-sm"></span>
          ) : (
            <Icon icon={refreshCwIcon} className="size-4" />
          )}
        </button>
        <button
          className={`btn btn-sm btn-circle tooltip tooltip-bottom ${isChatOpen ? 'btn-primary' : 'btn-ghost border border-base-300'}`}
          onClick={() => setIsChatOpen(!isChatOpen)}
          title={isChatOpen ? 'Hide AI Chat' : 'Show AI Chat'}
          aria-label={isChatOpen ? 'Hide AI Chat' : 'Show AI Chat'}
          data-tip={isChatOpen ? 'Hide AI Chat' : 'Show AI Chat'}
        >
          <Icon icon={messageSquareIcon} className="size-4" />
        </button>
      </div>
    );

    setAllContent(leftContent, null, rightContent);
    return () => clearContent();
  }, [handleBack, handleReanalyze, isReanalyzing, profile?.templateName, isChatOpen, setAllContent, clearContent]);

  if (isLoading) return <Loader />;

  if (!profile) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-base-content/60 mb-4">Profile not found</p>
          <button className="btn btn-primary" onClick={handleBack}>Back</button>
        </div>
      </div>
    );
  }

  const overallStatus = getHealthStatus(profile.overallScore);
  const riskPills = [
    { count: profile.criticalRiskCount, label: 'Critical', color: '#4a1d1d' },
    { count: profile.highRiskCount, label: 'High', color: '#b91c1c' },
    { count: profile.mediumRiskCount, label: 'Med', color: '#a16207' },
    { count: profile.lowRiskCount, label: 'Low', color: '#6b7280' },
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
                <span className="text-base font-semibold tabular-nums">{Math.round(profile.overallScore)}</span>
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
                  <div className="h-full rounded-full transition-[width] duration-300" style={{ width: `${profile.overallScore}%`, backgroundColor: overallStatus.color }} />
                </div>
                <span className="text-[11px] text-base-content/50">Overall</span>
              </div>
            </div>
            <button
              onClick={handleToggleSummary}
              className="btn btn-ghost btn-xs gap-1"
              aria-expanded={!summaryCollapsed}
              aria-controls="template-summary-panel"
              disabled={isNarrowScreen}
            >
              <span className="hidden sm:inline text-xs">{summaryCollapsed ? 'Show details' : 'Hide details'}</span>
              <Icon icon={chevronDownIcon} className={`size-3.5 transition-transform ${summaryCollapsed ? '' : 'rotate-180'}`} />
            </button>
          </div>

        <div
          id="template-summary-panel"
          className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${summaryCollapsed ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100'}`}
        >
          <div className="overflow-hidden">
            <div className="px-3 pb-3 space-y-2">
              <div className="grid gap-2 lg:grid-cols-[150px_minmax(0,1fr)] items-stretch">
                {/* Score Ring */}
                <div className="card bg-base-100 border border-base-200 shadow-sm h-full">
                  <div className="card-body items-center p-2 gap-2 h-full">
                    <div className="flex-1 flex items-center justify-center">
                      <ScoreRing score={profile.overallScore} size={72} />
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-[10px] text-base-content/60 leading-tight">Based on {profile.totalClauses} clauses</p>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="space-y-2 min-w-0 h-full flex flex-col">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <StatCard label="Critical" value={profile.criticalRiskCount} color="#4a1d1d" icon={<span>!</span>} onClick={() => openRiskDialog('Critical')} />
                    <StatCard label="High" value={profile.highRiskCount} color="#b91c1c" icon={<span>!</span>} onClick={() => openRiskDialog('High')} />
                    <StatCard label="Medium" value={profile.mediumRiskCount} color="#a16207" icon={<span>-</span>} onClick={() => openRiskDialog('Medium')} />
                    <StatCard label="Low" value={profile.lowRiskCount} color="#6b7280" icon={<Icon icon={checkCircleIcon} className="size-3.5" />} onClick={() => openRiskDialog('Low')} />
                  </div>

                  <div className="rounded-lg border border-base-200 bg-base-100 px-2.5 py-2 shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-[11px] font-semibold uppercase tracking-wide text-base-content/60">Risk Categories</h3>
                      <span className="text-[10px] text-base-content/40">by area</span>
                    </div>
                    <div className="grid grid-cols-2 xl:grid-cols-3 gap-x-3 gap-y-1.5">
                      <CategoryProgress label="Payment" score={profile.categoryScores.payment} />
                      <CategoryProgress label="Responsibility" score={profile.categoryScores.roleResponsibility} />
                      <CategoryProgress label="Safety" score={profile.categoryScores.safety} />
                      <CategoryProgress label="Timeline" score={profile.categoryScores.temporal} />
                      <CategoryProgress label="Procedures" score={profile.categoryScores.procedure} />
                      <CategoryProgress label="Definitions" score={profile.categoryScores.definition} />
                      <CategoryProgress label="References" score={profile.categoryScores.reference} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>

        {/* Clause Document View */}
        <div className="flex-1 min-h-0 min-w-0 overflow-hidden flex flex-col">
          {/* Filter bar */}
          <div className="px-3 py-2 border-b border-base-200 flex items-center justify-between flex-wrap gap-2 flex-shrink-0 bg-base-100/80 backdrop-blur">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-base">Clauses</h3>
              <span className="text-sm text-base-content/60">
                {clausesWithRisks} of {clauses.length} have risks ({totalRisks} total)
              </span>
            </div>
            <div className="join rounded-full bg-base-200/70 p-0.5">
              {FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFilterLevel(opt.value)}
                  aria-pressed={filterLevel === opt.value}
                  className={`btn btn-xs join-item rounded-full ${filterLevel === opt.value ? 'btn-primary' : 'btn-ghost'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Clause document view */}
          <div className="flex-1 min-h-0 p-3">
            <ClauseDocumentView
              ref={clauseViewRef}
              clauses={filteredClauses}
              highlightedClauses={highlightedClauses}
              onClauseClick={handleClauseClick}
            />
          </div>
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
              templateName={profile.templateName}
              templateId={parseInt(templateId || '0')}
              overallScore={profile.overallScore}
              criticalCount={profile.criticalRiskCount}
              highCount={profile.highRiskCount}
              mediumCount={profile.mediumRiskCount}
              lowCount={profile.lowRiskCount}
              totalClauses={profile.totalClauses}
              categoryScores={profile.categoryScores}
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
                templateName={profile.templateName}
                templateId={parseInt(templateId || '0')}
                overallScore={profile.overallScore}
                criticalCount={profile.criticalRiskCount}
                highCount={profile.highRiskCount}
                mediumCount={profile.mediumRiskCount}
                lowCount={profile.lowRiskCount}
                totalClauses={profile.totalClauses}
                categoryScores={profile.categoryScores}
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
