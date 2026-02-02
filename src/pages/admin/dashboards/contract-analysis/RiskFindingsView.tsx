import { memo, useMemo } from 'react';
import { Icon } from '@iconify/react';
import type { RiskAssessment } from '@/types/contract-analysis';
import { RiskLevelColors } from '@/types/contract-analysis';
import { extractPerspectiveText, getRecommendationForPerspective, usePerspective } from './perspective-context';

import checkCircleIcon from '@iconify/icons-lucide/check-circle';

interface RiskFindingsViewProps {
  summary?: string;
  recommendations?: string[];
  risks: RiskAssessment[];
}

const RiskFindingsView = memo(({ summary, recommendations, risks }: RiskFindingsViewProps) => {
  const { perspective } = usePerspective();

  const filteredRecommendations = useMemo(() => {
    if (!recommendations?.length) return [];
    return recommendations
      .map((rec) => getRecommendationForPerspective(rec, perspective))
      .filter((rec): rec is string => !!rec && rec.trim().length > 0);
  }, [recommendations, perspective]);

  const hasSidebar = !!summary || filteredRecommendations.length > 0;

  return (
    <div className={`grid gap-4 ${hasSidebar ? 'grid-cols-1 lg:grid-cols-[1fr_1.5fr]' : 'grid-cols-1'}`}>
      {hasSidebar && (
        <div className="space-y-4">
          {summary && (
            <div className="rounded-lg border border-base-200 bg-base-100 p-4 shadow-sm">
              <h3 className="text-sm font-semibold mb-2">Summary</h3>
              <p className="text-sm text-base-content/70 leading-relaxed">{summary}</p>
            </div>
          )}

          {filteredRecommendations.length > 0 && (
            <div className="rounded-lg border border-base-200 bg-base-100 p-4 shadow-sm">
              <h3 className="text-sm font-semibold mb-2">Recommendations</h3>
              <ul className="space-y-2">
                {filteredRecommendations.map((rec, index) => (
                  <li key={index} className="flex gap-2 text-sm">
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
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">
            Risk Findings
            <span className="ml-2 text-xs font-normal text-base-content/50">
              {risks.length} item{risks.length === 1 ? '' : 's'}
            </span>
          </h3>
        </div>

        {risks.length === 0 ? (
          <div className="rounded-lg border border-base-200 bg-base-100 p-8 text-center">
            <Icon icon={checkCircleIcon} className="size-8 text-success/50 mx-auto" />
            <p className="mt-2 text-sm text-base-content/50">No risks found at this level</p>
          </div>
        ) : (
          risks.map((risk, index) => {
            const desc = risk.riskDescriptionEn || risk.riskDescription || '';
            const rec = risk.recommendationEn || risk.recommendation || '';
            const { clientText, subText } = extractPerspectiveText(rec, null);
            const showClient = !perspective || perspective === 'client';
            const showSub = !perspective || perspective === 'subcontractor';

            return (
              <div key={index} className="rounded-lg border border-base-200 bg-base-100 p-3 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="badge badge-sm border-0 text-white"
                      style={{ backgroundColor: RiskLevelColors[risk.level as keyof typeof RiskLevelColors] || '#6b7280' }}
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
                        <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-medium flex-shrink-0 h-fit">
                          Client
                        </span>
                        <span className="text-base-content/70">{clientText}</span>
                      </div>
                    )}
                    {showSub && subText && (
                      <div className="flex gap-2 text-xs">
                        <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 font-medium flex-shrink-0 h-fit">
                          Subcontractor
                        </span>
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
  );
});

RiskFindingsView.displayName = 'RiskFindingsView';

export default RiskFindingsView;
