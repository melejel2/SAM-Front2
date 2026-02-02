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
        <div className={`${showChat ? 'w-1/2 border-r border-base-200' : 'w-full'} overflow-y-auto transition-all duration-300`}>
          <div className="max-w-6xl mx-auto p-4 space-y-4">
            {/* View Toggle: Risks vs Clauses */}
            {result.clauses && result.clauses.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveView('risks')}
                  className={`btn btn-xs gap-1 ${activeView === 'risks' ? 'btn-primary' : 'btn-ghost'}`}
                >
                  Risk Findings ({filteredRisks.length})
                </button>
                <button
                  onClick={() => setActiveView('clauses')}
                  className={`btn btn-xs gap-1 ${activeView === 'clauses' ? 'btn-primary' : 'btn-ghost'}`}
                >
                  <Icon icon={fileTextIcon} className="size-3.5" />
                  Clauses ({result.clauses.length})
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
            )}

            {activeView === 'risks' ? (
              /* Risks View */
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-4">
                {/* Left: Summary + Recommendations */}
                <div className="space-y-4">
                  {result.summary && (
                    <div className="rounded-lg border border-base-200 bg-base-100 p-4 shadow-sm">
                      <h3 className="text-sm font-semibold mb-2">Summary</h3>
                      <p className="text-sm text-base-content/70 leading-relaxed">{result.summary}</p>
                    </div>
                  )}

                  {result.recommendations.length > 0 && (
                    <div className="rounded-lg border border-base-200 bg-base-100 p-4 shadow-sm">
                      <h3 className="text-sm font-semibold mb-2">Recommendations</h3>
                      <ul className="space-y-2">
                        {result.recommendations.map((rec, i) => (
                          <li key={i} className="flex gap-2 text-sm">
                            <span className="text-primary mt-0.5 flex-shrink-0">
                              <Icon icon={checkCircleIcon} className="size-4" />
                            </span>
                            <span className="text-base-content/70">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Right: Risks */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">
                      Risk Findings
                      <span className="ml-2 text-xs font-normal text-base-content/50">
                        {filteredRisks.length} item{filteredRisks.length === 1 ? '' : 's'}
                      </span>
                    </h3>
                  </div>

                  {filteredRisks.length === 0 ? (
                    <div className="rounded-lg border border-base-200 bg-base-100 p-8 text-center">
                      <Icon icon={checkCircleIcon} className="size-8 text-success/50 mx-auto" />
                      <p className="mt-2 text-sm text-base-content/50">No risks found at this level</p>
                    </div>
                  ) : (
                    filteredRisks.map((risk, i) => {
                      const desc = risk.riskDescriptionEn || risk.riskDescription || '';
                      const rec = risk.recommendationEn || risk.recommendation || '';
                      const { clientText, subText } = extractPerspectiveText(rec, null);
                      const showClient = !perspective || perspective === 'client';
                      const showSub = !perspective || perspective === 'subcontractor';

                      return (
                        <div key={i} className="rounded-lg border border-base-200 bg-base-100 p-3 shadow-sm">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span
                                className="badge badge-sm border-0 text-white"
                                style={{ backgroundColor: RISK_LEVEL_COLORS[risk.level] || '#6b7280' }}
                              >
                                {risk.level}
                              </span>
                              <span className="text-xs text-base-content/60 font-medium">
                                {risk.categoryEn || risk.category}
                              </span>
                            </div>
                            {risk.score !== undefined && (
                              <span className="text-[10px] text-base-content/40">Score: {risk.score}</span>
                            )}
                          </div>
                          {desc && <p className="text-sm mt-2 text-base-content/80">{desc}</p>}
                          {risk.matchedText && (
                            <div className="mt-2 rounded-md bg-base-200/60 px-2 py-1 text-xs italic text-base-content/60">
                              &quot;{risk.matchedText}&quot;
                            </div>
                          )}
                          {rec && (clientText || subText) ? (
                            <div className="mt-2 space-y-1.5">
                              {showClient && clientText && (
                                <div className="flex gap-2 text-xs">
                                  <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-medium flex-shrink-0 h-fit">Client</span>
                                  <span className="text-base-content/70">{clientText}</span>
                                </div>
                              )}
                              {showSub && subText && (
                                <div className="flex gap-2 text-xs">
                                  <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 font-medium flex-shrink-0 h-fit">Subcontractor</span>
                                  <span className="text-base-content/70">{subText}</span>
                                </div>
                              )}
                            </div>
                          ) : rec ? (
                            <p className="mt-2 text-xs text-base-content/70">{rec}</p>
                          ) : null}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ) : (
              /* Clauses View */
              <div className="space-y-2">
                {result.clauses?.map((clause) => {
                  const isExpanded = expandedClauses.has(clause.clauseOrder);
                  const riskCount = clause.riskAssessments?.length || 0;
                  const maxRiskLevel = clause.riskAssessments?.reduce((max, r) => {
                    const levels = ['Low', 'Medium', 'High', 'Critical'];
                    return levels.indexOf(r.level) > levels.indexOf(max) ? r.level : max;
                  }, 'Low') || 'Low';

                  return (
                    <div key={clause.clauseOrder} className="rounded-lg border border-base-200 bg-base-100 shadow-sm overflow-hidden">
                      <button
                        onClick={() => toggleClause(clause.clauseOrder)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-base-200/30 transition-colors"
                      >
                        <Icon
                          icon={chevronRightIcon}
                          className={`size-4 text-base-content/40 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-base-content/70">
                              {clause.clauseNumber || `Clause ${clause.clauseOrder}`}
                            </span>
                            {clause.clauseTitle && (
                              <span className="text-xs text-base-content/50 truncate">{clause.clauseTitle}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {riskCount > 0 && (
                            <span
                              className="badge badge-xs border-0 text-white"
                              style={{ backgroundColor: RISK_LEVEL_COLORS[maxRiskLevel] }}
                            >
                              {riskCount} risk{riskCount > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="border-t border-base-200 px-3 py-3 space-y-3">
                          {/* Clause Content */}
                          {clause.clauseContent && (
                            <div className="text-sm text-base-content/70 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                              {clause.clauseContent}
                            </div>
                          )}

                          {/* Clause Risks */}
                          {clause.riskAssessments && clause.riskAssessments.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="text-[11px] font-semibold uppercase tracking-wide text-base-content/50">
                                Risks in this clause
                              </h4>
                              {clause.riskAssessments.map((risk, ri) => (
                                <div key={ri} className="rounded-md bg-base-200/40 p-2.5">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className="badge badge-xs border-0 text-white"
                                      style={{ backgroundColor: RISK_LEVEL_COLORS[risk.level] || '#6b7280' }}
                                    >
                                      {risk.level}
                                    </span>
                                    <span className="text-xs text-base-content/60">
                                      {risk.categoryEn || risk.category}
                                    </span>
                                  </div>
                                  {(risk.riskDescriptionEn || risk.riskDescription) && (
                                    <p className="text-xs mt-1.5 text-base-content/70">
                                      {risk.riskDescriptionEn || risk.riskDescription}
                                    </p>
                                  )}
                                  {(risk.recommendationEn || risk.recommendation) && (
                                    <p className="text-xs mt-1 text-primary/80">
                                      {risk.recommendationEn || risk.recommendation}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {(!result.clauses || result.clauses.length === 0) && (
                  <div className="rounded-lg border border-base-200 bg-base-100 p-8 text-center">
                    <Icon icon={fileTextIcon} className="size-8 text-base-content/30 mx-auto" />
                    <p className="mt-2 text-sm text-base-content/50">No clauses available for this scan</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right panel: AI Chat */}
        {showChat && (
          <div className="w-1/2 min-h-0 flex flex-col">
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
              topRisks={result.topRisks.map(r => ({
                category: r.categoryEn || r.category,
                level: r.level,
                riskDescription: r.riskDescriptionEn || r.riskDescription,
                clauseRef: r.matchedText,
              }))}
              clauseNumbers={clauseNumbers}
            />
          </div>
        )}
      </div>
    </div>
  );
});

ScanResultsView.displayName = 'ScanResultsView';
export default ScanResultsView;
