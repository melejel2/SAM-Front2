import { memo, useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';
import type { DocumentScanResult } from '@/types/contract-analysis';
import { getHealthStatus } from '@/types/contract-analysis';
import { usePerspective, getPerspectiveField, filterByPerspective } from './perspective-context';
import { saveScanResult } from '@/api/services/contract-analysis-api';
import ContractAiChat, { type ContractAiChatHandle } from './ContractAiChat';
import ClauseDocumentView, { type ClauseDocumentViewHandle } from './ClauseDocumentView';
import ClauseListView from './ClauseListView';
import RiskFindingsView from './RiskFindingsView';

import uploadCloudIcon from '@iconify/icons-lucide/upload-cloud';
import checkCircleIcon from '@iconify/icons-lucide/check-circle';
import chevronDownIcon from '@iconify/icons-lucide/chevron-down';
import xIcon from '@iconify/icons-lucide/x';
import saveIcon from '@iconify/icons-lucide/save';
import messageSquareIcon from '@iconify/icons-lucide/message-square';
import fileTextIcon from '@iconify/icons-lucide/file-text';

// Score Ring (same as contract-details)
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

// Stat Card
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
      onClick ? 'border-base-200 bg-base-100 hover:bg-base-200/40 hover:border-base-300 cursor-pointer' : 'border-base-200 bg-base-100'
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
  return <button type="button" className="text-left w-full" onClick={onClick}>{content}</button>;
};

// Category Progress
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

const RISK_LEVEL_COLORS: Record<string, string> = {
  Critical: '#4a1d1d',
  High: '#b91c1c',
  Medium: '#a16207',
  Low: '#6b7280',
};

interface ScanResultsViewProps {
  result: DocumentScanResult;
  onScanAnother: () => void;
  onSaved?: (id: number) => void;
}

const ScanResultsView = memo(({ result, onScanAnother, onSaved }: ScanResultsViewProps) => {
  const { perspective } = usePerspective();
  const [summaryCollapsed, setSummaryCollapsed] = useState(false);
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<number | undefined>(result.savedDocumentId);
  const [activeView, setActiveView] = useState<'risks' | 'clauses' | 'document'>('risks');
  const [highlightedClauses, setHighlightedClauses] = useState<string[]>([]);
  const chatRef = useRef<ContractAiChatHandle>(null);
  const clauseViewRef = useRef<ClauseDocumentViewHandle>(null);
  const pendingHighlightRef = useRef<string[] | null>(null);
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingChatMessageRef = useRef<string | null>(null);

  // Perspective-aware values
  const pScore = getPerspectiveField(result, 'overallScore', perspective);
  const pCritical = getPerspectiveField(result, 'criticalCount', perspective);
  const pHigh = getPerspectiveField(result, 'highCount', perspective);
  const pMedium = getPerspectiveField(result, 'mediumCount', perspective);
  const pLow = getPerspectiveField(result, 'lowCount', perspective);

  const pCategoryScores = perspective === 'client' && result.clientCategoryScores
    ? result.clientCategoryScores
    : perspective === 'subcontractor' && result.subcontractorCategoryScores
      ? result.subcontractorCategoryScores
      : result.categoryScores;

  const overallStatus = getHealthStatus(pScore);

  const riskPills = useMemo(() =>
    [
      { count: pCritical, label: 'Critical', color: '#4a1d1d' },
      { count: pHigh, label: 'High', color: '#b91c1c' },
      { count: pMedium, label: 'Med', color: '#a16207' },
      { count: pLow, label: 'Low', color: '#6b7280' },
    ].filter(pill => pill.count > 0),
    [pCritical, pHigh, pMedium, pLow]
  );

  const perspectiveRisks = useMemo(() => (
    filterByPerspective(result.topRisks || [], perspective)
  ), [result.topRisks, perspective]);

  const filteredRisks = useMemo(() => {
    if (!selectedRiskLevel) return perspectiveRisks;
    return perspectiveRisks.filter(r => r.level === selectedRiskLevel);
  }, [perspectiveRisks, selectedRiskLevel]);

  const handleRiskLevelClick = useCallback((level: string) => {
    setSelectedRiskLevel(prev => prev === level ? null : level);
    setActiveView('risks');
  }, []);

  const handleSave = useCallback(async () => {
    if (saving || savedId) return;
    setSaving(true);
    try {
      const { id } = await saveScanResult(result);
      setSavedId(id);
      onSaved?.(id);
    } catch (err) {
      console.error('Failed to save scan result:', err);
    } finally {
      setSaving(false);
    }
  }, [result, saving, savedId, onSaved]);

  const clauseNumbers = useMemo(() =>
    result.clauses?.map(c => c.clauseNumber || `Clause ${c.clauseOrder}`).filter(Boolean) as string[] || [],
    [result.clauses]
  );

  const handleClauseClick = useCallback((clauseNumber: string) => {
    const prompt = `Analyze the risks in ${clauseNumber}`;
    if (!showChat) {
      pendingChatMessageRef.current = prompt;
      setShowChat(true);
      return;
    }
    chatRef.current?.sendMessage(prompt);
  }, [showChat]);

  useEffect(() => {
    if (showChat && pendingChatMessageRef.current && chatRef.current) {
      chatRef.current.sendMessage(pendingChatMessageRef.current);
      pendingChatMessageRef.current = null;
    }
  }, [showChat]);

  const performHighlight = useCallback((clauseRefs: string[]) => {
    setHighlightedClauses(clauseRefs);
    if (clauseRefs[0]) {
      clauseViewRef.current?.scrollToClause(clauseRefs[0]);
    }
    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current);
    }
    highlightTimeoutRef.current = setTimeout(() => {
      setHighlightedClauses([]);
    }, 8000);
  }, []);

  const requestHighlight = useCallback((clauseRefs: string[]) => {
    if (!clauseRefs.length) return;
    pendingHighlightRef.current = clauseRefs;
    setActiveView('document');
  }, []);

  useEffect(() => {
    if (activeView !== 'document' || !pendingHighlightRef.current) return;
    const refs = pendingHighlightRef.current;
    pendingHighlightRef.current = null;
    performHighlight(refs);
  }, [activeView, performHighlight]);

  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="h-full flex flex-col overflow-hidden bg-base-100">
      {/* Summary Bar */}
      <div className="flex-shrink-0 border-b border-base-200 bg-base-100/80 backdrop-blur">
        <div className="flex items-center justify-between gap-3 px-3 py-1.5">
          <div className="flex items-center gap-3 min-w-0">
            <span className="hidden md:inline text-[11px] font-semibold uppercase tracking-[0.2em] text-base-content/40">
              {result.fileName || 'Scanned Document'}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold tabular-nums">{Math.round(pScore)}</span>
              <span className="badge badge-sm font-medium" style={{ backgroundColor: overallStatus.color + '15', color: overallStatus.color }}>
                {overallStatus.label}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {riskPills.length > 0 ? (
                riskPills.map(pill => (
                  <span key={pill.label} className="badge badge-sm border-0 text-white" style={{ backgroundColor: pill.color }}>
                    {pill.count} {pill.label}
                  </span>
                ))
              ) : (
                <span className="badge badge-sm badge-outline text-base-content/50">No risks</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={saving || !!savedId}
              className={`btn btn-ghost btn-xs gap-1 ${savedId ? 'text-success' : ''}`}
              title={savedId ? 'Saved to library' : 'Save to library'}
            >
              <Icon icon={savedId ? checkCircleIcon : saveIcon} className="size-3.5" />
              <span className="hidden sm:inline text-xs">{savedId ? 'Saved' : saving ? 'Saving...' : 'Save'}</span>
            </button>
            {/* Chat Toggle */}
            <button
              onClick={() => setShowChat(prev => !prev)}
              className={`btn btn-ghost btn-xs gap-1 ${showChat ? 'btn-active' : ''}`}
            >
              <Icon icon={messageSquareIcon} className="size-3.5" />
              <span className="hidden sm:inline text-xs">AI Chat</span>
            </button>
            {/* Scan Another */}
            <button onClick={onScanAnother} className="btn btn-ghost btn-xs gap-1">
              <Icon icon={uploadCloudIcon} className="size-3.5" />
              <span className="hidden sm:inline text-xs">Scan Another</span>
            </button>
            {/* Collapse */}
            <button onClick={() => setSummaryCollapsed(prev => !prev)} className="btn btn-ghost btn-xs gap-1">
              <span className="hidden sm:inline text-xs">{summaryCollapsed ? 'Show' : 'Hide'}</span>
              <Icon icon={chevronDownIcon} className={`size-3.5 transition-transform ${summaryCollapsed ? '' : 'rotate-180'}`} />
            </button>
          </div>
        </div>

        <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${summaryCollapsed ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100'}`}>
          <div className="overflow-hidden">
            <div className="px-3 pb-3 space-y-2">
              <div className="grid gap-2 lg:grid-cols-[150px_minmax(0,1fr)] items-stretch">
                {/* Score Ring */}
                <div className="card bg-base-100 border border-base-200 shadow-sm h-full">
                  <div className="card-body items-center p-2 gap-2 h-full">
                    <div className="flex-1 flex items-center justify-center">
                      <ScoreRing score={pScore} size={72} />
                    </div>
                    <p className="text-[10px] text-base-content/60 leading-tight text-center">Based on {result.totalClauses} clauses</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="space-y-2 min-w-0 h-full flex flex-col">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <StatCard label="Critical" value={pCritical} color="#4a1d1d" icon={<span>!</span>} onClick={() => handleRiskLevelClick('Critical')} />
                    <StatCard label="High" value={pHigh} color="#b91c1c" icon={<span>!</span>} onClick={() => handleRiskLevelClick('High')} />
                    <StatCard label="Medium" value={pMedium} color="#a16207" icon={<span>-</span>} onClick={() => handleRiskLevelClick('Medium')} />
                    <StatCard label="Low" value={pLow} color="#6b7280" icon={<Icon icon={checkCircleIcon} className="size-3.5" />} onClick={() => handleRiskLevelClick('Low')} />
                  </div>

                  {/* Category Scores */}
                  <div className="rounded-lg border border-base-200 bg-base-100 px-2.5 py-2 shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-[11px] font-semibold uppercase tracking-wide text-base-content/60">Risk Categories</h3>
                      <span className="text-[10px] text-base-content/40">by area</span>
                    </div>
                    <div className="grid grid-cols-2 xl:grid-cols-3 gap-x-3 gap-y-1.5">
                      <CategoryProgress label="Payment" score={pCategoryScores.payment} />
                      <CategoryProgress label="Responsibility" score={pCategoryScores.roleResponsibility} />
                      <CategoryProgress label="Safety" score={pCategoryScores.safety} />
                      <CategoryProgress label="Timeline" score={pCategoryScores.temporal} />
                      <CategoryProgress label="Procedures" score={pCategoryScores.procedure} />
                      <CategoryProgress label="Definitions" score={pCategoryScores.definition} />
                      <CategoryProgress label="References" score={pCategoryScores.reference} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area - Split view when chat is open */}
      <div className="flex-1 min-h-0 flex">
        {/* Left panel: Analysis content */}
        <div className={`${showChat ? 'w-1/2 border-r border-base-200' : 'w-full'} min-h-0 flex flex-col transition-all duration-300`}>
          <div className="flex items-center gap-2 px-4 py-2 border-b border-base-200 bg-base-100/80 backdrop-blur flex-wrap">
            <button
              onClick={() => setActiveView('risks')}
              className={`btn btn-xs gap-1 ${activeView === 'risks' ? 'btn-primary' : 'btn-ghost'}`}
            >
              Risk Findings ({filteredRisks.length})
            </button>
            <button
              onClick={() => setActiveView('clauses')}
              className={`btn btn-xs gap-1 ${activeView === 'clauses' ? 'btn-primary' : 'btn-ghost'}`}
              disabled={!result.clauses || result.clauses.length === 0}
            >
              <Icon icon={fileTextIcon} className="size-3.5" />
              Clauses ({result.clauses?.length || 0})
            </button>
            <button
              onClick={() => setActiveView('document')}
              className={`btn btn-xs gap-1 ${activeView === 'document' ? 'btn-primary' : 'btn-ghost'}`}
              disabled={!result.clauses || result.clauses.length === 0}
            >
              Document
            </button>
            {selectedRiskLevel && (
              <>
                <span className="text-xs text-base-content/50">|</span>
                <span className="badge badge-sm border-0 text-white" style={{ backgroundColor: RISK_LEVEL_COLORS[selectedRiskLevel] }}>
                  {selectedRiskLevel}
                </span>
                <button className="btn btn-ghost btn-xs btn-circle" onClick={() => setSelectedRiskLevel(null)}>
                  <Icon icon={xIcon} className="size-3" />
                </button>
              </>
            )}
          </div>

          <div className="flex-1 min-h-0">
            <div className={`${activeView === 'risks' ? 'h-full overflow-y-auto p-4' : 'hidden'}`}>
              <RiskFindingsView
                summary={result.summary}
                recommendations={result.recommendations}
                risks={filteredRisks}
              />
            </div>
            <div className={`${activeView === 'clauses' ? 'h-full overflow-y-auto p-4' : 'hidden'}`}>
              <ClauseListView
                clauses={result.clauses || []}
                onAskAi={handleClauseClick}
              />
            </div>
            <div className={`${activeView === 'document' ? 'h-full flex flex-col p-4' : 'hidden'}`}>
              <ClauseDocumentView
                ref={clauseViewRef}
                clauses={result.clauses || []}
                highlightedClauses={highlightedClauses}
                onClauseClick={handleClauseClick}
              />
            </div>
          </div>
        </div>

        {/* Right panel: AI Chat */}
        {showChat && (
          <div className="w-1/2 min-h-0 flex flex-col bg-base-100/90 backdrop-blur-sm shadow-lg">
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
                templateName={result.fileName || 'Scanned Document'}
                scanMode
                uploadedDocumentId={savedId}
                overallScore={pScore}
                criticalCount={pCritical}
                highCount={pHigh}
                mediumCount={pMedium}
                lowCount={pLow}
                totalClauses={result.totalClauses}
                categoryScores={pCategoryScores}
                topRisks={perspectiveRisks.map(r => ({
                  category: r.categoryEn || r.category,
                  level: r.level,
                  riskDescription: r.riskDescriptionEn || r.riskDescription,
                  clauseRef: r.matchedText,
                  matchedText: r.matchedText,
                }))}
                clauseNumbers={clauseNumbers}
                onClauseReferenceClick={(cn) => requestHighlight([cn])}
                onReferencedClauses={requestHighlight}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

ScanResultsView.displayName = 'ScanResultsView';
export default ScanResultsView;
