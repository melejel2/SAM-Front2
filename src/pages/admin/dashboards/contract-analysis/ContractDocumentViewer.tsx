import { forwardRef, useImperativeHandle, useRef, useEffect, useState, useCallback } from 'react';
import {
  DocumentEditorContainerComponent,
  Toolbar,
  Inject,
} from '@syncfusion/ej2-react-documenteditor';
import { Search } from '@syncfusion/ej2-documenteditor';
import { registerLicense } from '@syncfusion/ej2-base';
import { getContractSfdt } from '@/api/services/contracts-api';
import { useAuth } from '@/contexts/auth';
import { Icon } from '@iconify/react';
import fileTextIcon from '@iconify/icons-lucide/file-text';
import loaderIcon from '@iconify/icons-lucide/loader';

registerLicense('Ngo9BigBOggjHTQxAR8/V1JGaF5cXGpCf1FpRmJGdld5fUVHYVZUTXxaS00DNHVRdkdmWH1feHRWQmRcUkZ/WkVWYEs=');

export interface ContractDocumentViewerHandle {
  highlightClause: (clauseText: string) => void;
  clearHighlights: () => void;
  searchAndScrollTo: (text: string) => void;
}

interface ContractDocumentViewerProps {
  contractDatasetId: number;
  onDocumentLoaded?: () => void;
}

const ContractDocumentViewer = forwardRef<ContractDocumentViewerHandle, ContractDocumentViewerProps>(
  ({ contractDatasetId, onDocumentLoaded }, ref) => {
    const { getToken } = useAuth();
    const getTokenRef = useRef(getToken);
    getTokenRef.current = getToken;
    const containerRef = useRef<DocumentEditorContainerComponent | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [docReady, setDocReady] = useState(false);
    const pendingSearchRef = useRef<string | null>(null);
    const documentLoadedRef = useRef(false);

    // Try a single search term, return result count
    const trySearch = useCallback((search: any, text: string): number => {
      search.clearSearchHighlight();
      search.findAll(text, 'None');
      const sr = (search as any).searchResultsInternal ?? (search as any).searchResults;
      return sr?.length ?? 0;
    }, []);

    // Navigate to search results (skip first if multiple — typically TOC)
    const navigateResults = useCallback((search: any) => {
      const sr = (search as any).searchResultsInternal ?? (search as any).searchResults;
      if (sr && sr.length > 0) {
        sr.index = sr.length > 1 ? 1 : 0;
        sr.navigate();
      }
    }, []);

    // Build fallback search variants from original text
    const buildVariants = useCallback((text: string): string[] => {
      const variants: string[] = [text];

      // Strip colon variations: "13.7: Gardiennage" → "13.7 Gardiennage"
      const noColon = text.replace(/\s*:\s*/g, ' ').trim();
      if (noColon !== text) variants.push(noColon);

      // Add French-spaced colon: "13.7: X" → "13.7 : X"
      const frColon = text.replace(/(\S):(\s)/g, '$1 :$2');
      if (frColon !== text && !variants.includes(frColon)) variants.push(frColon);

      // Try just the title part after a number pattern: "13.7: Gardiennage" → "Gardiennage"
      const titleMatch = text.match(/^[\d.]+\s*[:：]?\s*(.{4,})/);
      if (titleMatch) variants.push(titleMatch[1].trim());

      // Try just the number part: "13.7: Gardiennage" → "13.7"
      const numMatch = text.match(/^([\d.]+)/);
      if (numMatch && numMatch[1].length >= 2) variants.push(numMatch[1]);

      return variants;
    }, []);

    // Core search logic — shared by direct calls and pending search
    const executeSearch = useCallback((text: string) => {
      const editor = containerRef.current?.documentEditor;
      if (!editor) {
        console.warn('[DocViewer] No documentEditor instance');
        return;
      }

      const search = editor.searchModule;
      if (!search) {
        console.warn('[DocViewer] searchModule not available — Search service may not be injected');
        return;
      }

      try {
        const variants = buildVariants(text);
        let found = 0;

        for (const variant of variants) {
          found = trySearch(search, variant);
          console.log('[DocViewer] Search', JSON.stringify(variant.slice(0, 60)), '→', found);
          if (found > 0) {
            navigateResults(search);
            return;
          }
        }

        // All variants exhausted — no match found
        console.warn('[DocViewer] No results for any variant of:', text.slice(0, 80));
      } catch (e) {
        console.warn('[DocViewer] Search/navigate failed:', e);
      }
    }, [buildVariants, trySearch, navigateResults]);

    // Load SFDT on mount
    useEffect(() => {
      let cancelled = false;

      const loadDocument = async () => {
        const token = getTokenRef.current();
        if (!token || !contractDatasetId) {
          setError('Missing authentication or contract ID');
          setIsLoading(false);
          return;
        }

        try {
          setIsLoading(true);
          setDocReady(false);
          setError(null);
          documentLoadedRef.current = false;

          const sfdt = await getContractSfdt(contractDatasetId, token);
          if (cancelled) return;

          if (containerRef.current?.documentEditor) {
            containerRef.current.documentEditor.open(sfdt);
            console.log('[DocViewer] Document opened, searchModule:', !!containerRef.current.documentEditor.searchModule);
          } else {
            console.warn('[DocViewer] containerRef.current?.documentEditor not available after SFDT load');
            setError('Document editor unavailable');
            setIsLoading(false);
          }
        } catch (err: any) {
          if (cancelled) return;
          console.error('Failed to load contract document:', err);
          setError(err.message || 'Failed to load contract document');
          setIsLoading(false);
        } finally {
        }
      };

      loadDocument();

      return () => {
        cancelled = true;
      };
    }, [contractDatasetId, onDocumentLoaded]);

    // Execute pending search once doc becomes ready
    useEffect(() => {
      if (docReady && pendingSearchRef.current) {
        const text = pendingSearchRef.current;
        pendingSearchRef.current = null;
        console.log('[DocViewer] Executing pending search:', text.slice(0, 60));
        executeSearch(text);
      }
    }, [docReady, executeSearch]);

    const handleDocumentChange = useCallback(() => {
      if (documentLoadedRef.current) return;
      documentLoadedRef.current = true;
      setDocReady(true);
      setIsLoading(false);
      onDocumentLoaded?.();
    }, [onDocumentLoaded]);

    const handleCreated = useCallback(() => {
      if (containerRef.current?.documentEditor) {
        containerRef.current.documentEditor.documentEditorSettings.showRuler = false;
      }
    }, []);

    const searchAndScrollTo = useCallback((text: string) => {
      console.log('[DocViewer] searchAndScrollTo called, docReady:', docReady, 'text:', text.slice(0, 60));
      if (!containerRef.current?.documentEditor || !docReady) {
        console.log('[DocViewer] Document not ready, queuing search');
        pendingSearchRef.current = text;
        return;
      }
      executeSearch(text);
    }, [docReady, executeSearch]);

    const highlightClause = useCallback((text: string) => {
      console.log('[DocViewer] highlightClause called, docReady:', docReady, 'text:', text.slice(0, 60));
      if (!containerRef.current?.documentEditor || !docReady) {
        pendingSearchRef.current = text;
        return;
      }
      executeSearch(text);
    }, [docReady, executeSearch]);

    const clearHighlights = useCallback(() => {
      pendingSearchRef.current = null;
      if (!containerRef.current?.documentEditor || !docReady) return;
      try {
        containerRef.current.documentEditor.searchModule?.clearSearchHighlight();
      } catch (e) {
        console.warn('Clear highlights failed:', e);
      }
    }, [docReady]);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      highlightClause,
      clearHighlights,
      searchAndScrollTo,
    }), [highlightClause, clearHighlights, searchAndScrollTo]);

    if (error) {
      return (
        <div className="flex-1 flex items-center justify-center text-base-content/50">
          <div className="text-center">
            <Icon icon={fileTextIcon} className="size-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{error}</p>
          </div>
        </div>
      );
    }

    return (
      <div className="relative h-full w-full">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-base-100/80">
            <div className="flex flex-col items-center gap-2">
              <Icon icon={loaderIcon} className="size-8 animate-spin text-primary" />
              <span className="text-sm text-base-content/60">Loading contract document...</span>
            </div>
          </div>
        )}
        <DocumentEditorContainerComponent
          ref={containerRef}
          height="100%"
          enableToolbar={false}
          restrictEditing={false}
          enableSpellCheck={false}
          enableComment={false}
          enableTrackChanges={false}
          showPropertiesPane={false}
          autoResizeOnVisibilityChange={true}
          created={handleCreated}
          documentChange={handleDocumentChange}
        >
          <Inject services={[Toolbar, Search]} />
        </DocumentEditorContainerComponent>
      </div>
    );
  }
);

ContractDocumentViewer.displayName = 'ContractDocumentViewer';

export default ContractDocumentViewer;
