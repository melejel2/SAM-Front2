import { forwardRef, useImperativeHandle, useRef, useCallback, useState, memo } from 'react';
import { Icon } from '@iconify/react';
import type { ContractClause } from '@/types/contract-analysis';
import { RiskLevelColors } from '@/types/contract-analysis';

import alertTriangleIcon from '@iconify/icons-lucide/alert-triangle';
import checkCircleIcon from '@iconify/icons-lucide/check-circle';
import chevronDownIcon from '@iconify/icons-lucide/chevron-down';
import chevronRightIcon from '@iconify/icons-lucide/chevron-right';
import messageCircleIcon from '@iconify/icons-lucide/message-circle';

interface ClauseDocumentViewProps {
  clauses: ContractClause[];
  highlightedClauses: string[];
  onClauseClick: (clauseNumber: string) => void;
}

export interface ClauseDocumentViewHandle {
  scrollToClause: (clauseNumber: string) => void;
}

// Renders CLIENT / SUBCONTRACTOR dual-perspective recommendations
const DualPerspective = ({ text }: { text: string }) => {
  const clientMatch = text.match(/CLIENT:\s*(.*?)(?=\s*SUBCONTRACTOR:|$)/is);
  const subMatch = text.match(/SUBCONTRACTOR:\s*(.*?)$/is);

  if (!clientMatch && !subMatch) {
    return <p className="mt-1 text-xs text-base-content/70">{text}</p>;
  }

  return (
    <div className="mt-1 space-y-1">
      {clientMatch?.[1]?.trim() && (
        <div className="flex gap-2 text-xs">
          <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-medium flex-shrink-0 h-fit">
            Client
          </span>
          <span className="text-base-content/70">{clientMatch[1].trim()}</span>
        </div>
      )}
      {subMatch?.[1]?.trim() && (
        <div className="flex gap-2 text-xs">
          <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 font-medium flex-shrink-0 h-fit">
            Subcontractor
          </span>
          <span className="text-base-content/70">{subMatch[1].trim()}</span>
        </div>
      )}
    </div>
  );
};

// Get the worst risk level color for a clause
function getWorstRiskColor(clause: ContractClause): string {
  if (clause.riskAssessments.length === 0) return '';
  const worst = clause.riskAssessments.reduce((max, r) => (r.score > max.score ? r : max));
  return RiskLevelColors[worst.level as keyof typeof RiskLevelColors] || '#6b7280';
}

// Individual clause rendered as a document section
const ClauseSection = memo(({
  clause,
  isHighlighted,
  onClauseClick,
}: {
  clause: ContractClause;
  isHighlighted: boolean;
  onClauseClick: (clauseNumber: string) => void;
}) => {
  const [risksExpanded, setRisksExpanded] = useState(false);
  const [contentExpanded, setContentExpanded] = useState(true);
  const hasRisks = clause.riskAssessments.length > 0;
  const riskCount = clause.riskAssessments.length;
  const borderColor = getWorstRiskColor(clause);
  const clauseId = clause.clauseNumber || `Clause ${clause.clauseOrder}`;
  const isLongContent = (clause.clauseContent?.length || 0) > 800;

  return (
    <div
      id={`clause-${clauseId}`}
      className={`relative rounded-lg border transition-all duration-300 ${
        isHighlighted ? 'clause-highlight' : ''
      } ${hasRisks ? 'bg-base-100' : 'bg-base-100/60'}`}
      style={{
        borderLeftWidth: '4px',
        borderLeftColor: borderColor || 'oklch(var(--b3))',
      }}
    >
      {/* Clause heading */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-base-200/50">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {hasRisks ? (
            <Icon icon={alertTriangleIcon} className="size-4 flex-shrink-0" style={{ color: borderColor }} />
          ) : (
            <Icon icon={checkCircleIcon} className="size-4 text-base-content/30 flex-shrink-0" />
          )}
          <h3 className="font-semibold text-base truncate">
            {clause.clauseNumber || `Clause ${clause.clauseOrder}`}
          </h3>
          {clause.clauseTitle && (
            <span className="text-sm text-base-content/50 truncate">— {clause.clauseTitle}</span>
          )}
          {hasRisks && (
            <span
              className="px-2 py-0.5 rounded-full text-xs font-medium text-white flex-shrink-0"
              style={{ backgroundColor: borderColor }}
            >
              {riskCount} risk{riskCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <button
          onClick={() => onClauseClick(clause.clauseNumber || `Clause ${clause.clauseOrder}`)}
          className="btn btn-ghost btn-xs gap-1 text-primary hover:bg-primary/10 flex-shrink-0 ml-2"
          title="Ask AI about this clause"
        >
          <Icon icon={messageCircleIcon} className="size-3.5" />
          <span className="hidden xl:inline">Ask AI</span>
        </button>
      </div>

      {/* Clause content */}
      {clause.clauseContent && (
        <div className="px-4 py-3">
          <div
            className={`text-sm text-base-content/80 whitespace-pre-wrap leading-relaxed ${
              isLongContent && !contentExpanded ? 'max-h-48 overflow-hidden relative' : ''
            }`}
          >
            {clause.clauseContent}
            {isLongContent && !contentExpanded && (
              <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-base-100 to-transparent" />
            )}
          </div>
          {isLongContent && (
            <button
              onClick={() => setContentExpanded(!contentExpanded)}
              className="text-xs text-primary hover:underline mt-1"
            >
              {contentExpanded ? 'Show less' : 'Show more...'}
            </button>
          )}
        </div>
      )}

      {/* Inline risk assessments */}
      {hasRisks && (
        <div className="border-t border-base-200/50">
          <button
            onClick={() => setRisksExpanded(!risksExpanded)}
            className="flex items-center gap-1.5 px-4 py-2 w-full text-left hover:bg-base-200/30 transition-colors"
          >
            <Icon
              icon={risksExpanded ? chevronDownIcon : chevronRightIcon}
              className="size-3.5 text-base-content/50"
            />
            <span className="text-xs font-semibold text-base-content/50 uppercase tracking-wide">
              Risk Assessments ({riskCount})
            </span>
          </button>
          {risksExpanded && (
            <div className="px-4 pb-3 space-y-2">
              {clause.riskAssessments.map((risk, i) => (
                <div key={i} className="rounded-lg border border-base-200 overflow-hidden">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-base-200/30">
                    <span
                      className="px-2 py-0.5 rounded text-xs font-semibold text-white"
                      style={{
                        backgroundColor: RiskLevelColors[risk.level as keyof typeof RiskLevelColors] || '#6b7280',
                      }}
                    >
                      {risk.level}
                    </span>
                    <span className="text-xs font-medium text-base-content/60">{risk.categoryEn || risk.category}</span>
                  </div>
                  <div className="px-3 py-2 space-y-1.5">
                    {(risk.riskDescriptionEn || risk.riskDescription) && (
                      <p className="text-xs leading-relaxed">{risk.riskDescriptionEn || risk.riskDescription}</p>
                    )}
                    {risk.matchedText && (
                      <div className="p-1.5 bg-base-200/30 rounded text-xs italic border-l-2 border-base-300 text-base-content/60">
                        "{risk.matchedText}"
                      </div>
                    )}
                    {(risk.recommendationEn || risk.recommendation) && (
                      <DualPerspective text={risk.recommendationEn || risk.recommendation || ''} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
});
ClauseSection.displayName = 'ClauseSection';

// Main component
const ClauseDocumentView = forwardRef<ClauseDocumentViewHandle, ClauseDocumentViewProps>(
  ({ clauses, highlightedClauses, onClauseClick }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const clauseRefs = useRef<Map<string, HTMLElement>>(new Map());

    // Register clause elements for scroll targeting
    const registerClauseRef = useCallback((clauseNumber: string, element: HTMLElement | null) => {
      if (element) {
        clauseRefs.current.set(clauseNumber, element);
      } else {
        clauseRefs.current.delete(clauseNumber);
      }
    }, []);

    // Expose scrollToClause method
    useImperativeHandle(ref, () => ({
      scrollToClause: (clauseNumber: string) => {
        // Try exact match first, then partial
        let element = document.getElementById(`clause-${clauseNumber}`);
        if (!element) {
          // Try finding by partial match (e.g., "Article 3" matches "Article 3.1")
          const allClauseElements = containerRef.current?.querySelectorAll('[id^="clause-"]');
          allClauseElements?.forEach((el) => {
            const id = el.id.replace('clause-', '');
            if (id.toLowerCase().includes(clauseNumber.toLowerCase()) ||
                clauseNumber.toLowerCase().includes(id.toLowerCase())) {
              element = el as HTMLElement;
            }
          });
        }
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      },
    }), []);

    if (clauses.length === 0) {
      return (
        <div className="flex-1 flex items-center justify-center text-base-content/40">
          <div className="text-center">
            <Icon icon={checkCircleIcon} className="size-10 mx-auto mb-2" />
            <p className="text-sm">No clauses match the selected filter</p>
          </div>
        </div>
      );
    }

    return (
      <div ref={containerRef} className="flex-1 overflow-y-auto">
        {/* Document-style container */}
        <div className="max-w-4xl mx-auto space-y-3 pb-8">
          {clauses.map((clause) => {
            const clauseId = clause.clauseNumber || `Clause ${clause.clauseOrder}`;
            const isHighlighted = highlightedClauses.some(
              (h) => h.toLowerCase() === clauseId.toLowerCase() ||
                     clauseId.toLowerCase().includes(h.toLowerCase()) ||
                     h.toLowerCase().includes(clauseId.toLowerCase())
            );
            return (
              <div
                key={clause.id}
                ref={(el) => registerClauseRef(clauseId, el)}
              >
                <ClauseSection
                  clause={clause}
                  isHighlighted={isHighlighted}
                  onClauseClick={onClauseClick}
                />
              </div>
            );
          })}
        </div>

        {/* Highlight animation styles */}
        <style>{`
          @keyframes clause-pulse {
            0%, 100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
            50% { box-shadow: 0 0 0 8px rgba(59, 130, 246, 0); }
          }
          .clause-highlight {
            animation: clause-pulse 1.5s ease-in-out 3;
            border-color: rgb(59, 130, 246) !important;
            background-color: oklch(var(--b1)) !important;
          }
        `}</style>
      </div>
    );
  }
);

ClauseDocumentView.displayName = 'ClauseDocumentView';

export default ClauseDocumentView;
