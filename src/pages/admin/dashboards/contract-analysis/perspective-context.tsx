import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { AnalysisPerspective } from '@/types/contract-analysis';

interface PerspectiveContextValue {
  perspective: AnalysisPerspective | null;
  setPerspective: (p: AnalysisPerspective) => void;
  clearPerspective: () => void;
  perspectiveLabel: string;
}

const STORAGE_KEY = 'sam.contractAnalysis.perspective';

const PerspectiveContext = createContext<PerspectiveContextValue | null>(null);

export function PerspectiveProvider({ children }: { children: ReactNode }) {
  const [perspective, setPerspectiveState] = useState<AnalysisPerspective | null>(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    return (stored === 'client' || stored === 'subcontractor') ? stored : null;
  });

  const setPerspective = useCallback((p: AnalysisPerspective) => {
    setPerspectiveState(p);
    sessionStorage.setItem(STORAGE_KEY, p);
  }, []);

  const clearPerspective = useCallback(() => {
    setPerspectiveState(null);
    sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  const perspectiveLabel = perspective === 'client' ? 'Client' : perspective === 'subcontractor' ? 'Subcontractor' : '';

  return (
    <PerspectiveContext.Provider value={{ perspective, setPerspective, clearPerspective, perspectiveLabel }}>
      {children}
    </PerspectiveContext.Provider>
  );
}

export function usePerspective() {
  const ctx = useContext(PerspectiveContext);
  if (!ctx) throw new Error('usePerspective must be used within PerspectiveProvider');
  return ctx;
}

/**
 * Pick the correct score/count field based on active perspective.
 * Falls back to the base (aggregated) field when no perspective is selected.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getPerspectiveField(
  data: any,
  baseField: string,
  perspective: AnalysisPerspective | null,
): number {
  if (perspective === 'client') {
    const key = `client${baseField.charAt(0).toUpperCase()}${baseField.slice(1)}`;
    return (data[key] as number) ?? (data[baseField] as number) ?? 0;
  }
  if (perspective === 'subcontractor') {
    const key = `subcontractor${baseField.charAt(0).toUpperCase()}${baseField.slice(1)}`;
    return (data[key] as number) ?? (data[baseField] as number) ?? 0;
  }
  return (data[baseField] as number) ?? 0;
}

/**
 * Filter risk assessments to only those relevant to the active perspective.
 */
export function filterByPerspective<T extends { perspectiveRelevance?: string }>(
  items: T[],
  perspective: AnalysisPerspective | null,
): T[] {
  if (!perspective) return items;
  const label = perspective === 'client' ? 'Client' : 'Subcontractor';
  return items.filter(
    (i) => !i.perspectiveRelevance || i.perspectiveRelevance === 'Both' || i.perspectiveRelevance === label,
  );
}

/**
 * Extract the relevant perspective text from a recommendation string.
 * Returns only the matching perspective text, or the full text if no pattern found.
 */
export function extractPerspectiveText(
  text: string,
  perspective: AnalysisPerspective | null,
): { clientText: string | null; subText: string | null; raw: string } {
  const clientMatch = text.match(/CLIENT:\s*(.*?)(?=\s*SUBCONTRACTOR:|$)/is);
  const subMatch = text.match(/SUBCONTRACTOR:\s*(.*?)$/is);

  const clientText = clientMatch?.[1]?.trim() || null;
  const subText = subMatch?.[1]?.trim() || null;

  return { clientText, subText, raw: text };
}

/**
 * Get the filtered recommendation text for the current perspective.
 */
export function getRecommendationForPerspective(
  text: string,
  perspective: AnalysisPerspective | null,
): string | null {
  const { clientText, subText, raw } = extractPerspectiveText(text, perspective);

  if (!clientText && !subText) return raw;

  if (perspective === 'client') return clientText || raw;
  if (perspective === 'subcontractor') return subText || raw;

  // No perspective selected - return full text
  return raw;
}
