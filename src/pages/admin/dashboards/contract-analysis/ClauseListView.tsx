import { memo, useCallback, useState } from 'react';
import { Icon } from '@iconify/react';
import type { ContractClause } from '@/types/contract-analysis';
import { RiskLevelColors } from '@/types/contract-analysis';
import { filterByPerspective, getRecommendationForPerspective, usePerspective } from './perspective-context';

import chevronRightIcon from '@iconify/icons-lucide/chevron-right';
import messageCircleIcon from '@iconify/icons-lucide/message-circle';

interface ClauseListViewProps {
  clauses: ContractClause[];
  onAskAi?: (clauseNumber: string) => void;
}

const RISK_ORDER = ['Low', 'Medium', 'High', 'Critical'];

const ClauseListView = memo(({ clauses, onAskAi }: ClauseListViewProps) => {
  const { perspective } = usePerspective();
  const [expandedClauses, setExpandedClauses] = useState<Set<number>>(new Set());

  const toggleClause = useCallback((clauseOrder: number) => {
    setExpandedClauses((prev) => {
      const next = new Set(prev);
      if (next.has(clauseOrder)) next.delete(clauseOrder);
      else next.add(clauseOrder);
      return next;
    });
  }, []);

  const handleKeyDown = useCallback((event: React.KeyboardEvent, clauseOrder: number) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleClause(clauseOrder);
    }
  }, [toggleClause]);

  if (!clauses.length) {
    return (
      <div className="rounded-lg border border-base-200 bg-base-100 p-8 text-center">
        <p className="text-sm text-base-content/50">No clauses available</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {clauses.map((clause) => {
        const clauseLabel = clause.clauseNumber || `Clause ${clause.clauseOrder}`;
        const clauseRisks = filterByPerspective(clause.riskAssessments || [], perspective);
        const riskCount = clauseRisks.length;
        const maxRiskLevel = clauseRisks.reduce((max, r) => (
          RISK_ORDER.indexOf(r.level) > RISK_ORDER.indexOf(max) ? r.level : max
        ), 'Low');
        const isExpanded = expandedClauses.has(clause.clauseOrder);

        return (
          <div key={clause.clauseOrder} className="rounded-lg border border-base-200 bg-base-100 shadow-sm overflow-hidden">
            <div
              role="button"
              tabIndex={0}
              onClick={() => toggleClause(clause.clauseOrder)}
              onKeyDown={(event) => handleKeyDown(event, clause.clauseOrder)}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-base-200/30 transition-colors"
            >
              <Icon
                icon={chevronRightIcon}
                className={`size-4 text-base-content/40 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-base-content/70">
                    {clauseLabel}
                  </span>
                  {clause.clauseTitle && (
                    <span className="text-xs text-base-content/50 truncate">{clause.clauseTitle}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {riskCount > 0 && (
                  <span
                    className="badge badge-xs border-0 text-white"
                    style={{ backgroundColor: RiskLevelColors[maxRiskLevel as keyof typeof RiskLevelColors] || '#6b7280' }}
                  >
                    {riskCount} risk{riskCount > 1 ? 's' : ''}
                  </span>
                )}
                {onAskAi && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs gap-1 text-primary hover:bg-primary/10"
                    onClick={(event) => {
                      event.stopPropagation();
                      onAskAi(clauseLabel);
                    }}
                    title="Ask AI about this clause"
                  >
                    <Icon icon={messageCircleIcon} className="size-3.5" />
                    <span className="hidden sm:inline">Ask AI</span>
                  </button>
                )}
              </div>
            </div>

            {isExpanded && (
              <div className="border-t border-base-200 px-3 py-3 space-y-3">
                {clause.clauseContent && (
                  <div className="text-sm text-base-content/70 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {clause.clauseContent}
                  </div>
                )}

                {clauseRisks.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-semibold uppercase tracking-wide text-base-content/50">
                      Risks in this clause
                    </h4>
                    {clauseRisks.map((risk, index) => {
                      const rec = risk.recommendationEn || risk.recommendation;
                      const recText = rec ? getRecommendationForPerspective(rec, perspective) : null;
                      return (
                        <div key={index} className="rounded-md bg-base-200/40 p-2.5">
                          <div className="flex items-center gap-2">
                            <span
                              className="badge badge-xs border-0 text-white"
                              style={{ backgroundColor: RiskLevelColors[risk.level as keyof typeof RiskLevelColors] || '#6b7280' }}
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
                          {recText && (
                            <p className="text-xs mt-1 text-primary/80">
                              {recText}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
});

ClauseListView.displayName = 'ClauseListView';

export default ClauseListView;
