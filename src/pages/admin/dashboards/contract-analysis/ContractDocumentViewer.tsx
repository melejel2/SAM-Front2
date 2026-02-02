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

    // Core search logic — shared by direct calls and pending search
    const executeSearch = useCallback((text: string) => {
      const editor = containerRef.current?.documentEditor;
      if (!editor) {
        console.warn('[DocViewer] No documentEditor instance');
        return;
      }

      // Access searchModule — Syncfusion exposes it after Search is injected
      const search = editor.searchModule;
      if (!search) {
        console.warn('[DocViewer] searchModule not available — Search service may not be injected');
        return;
      }

      try {
        search.clearSearchHighlight();
        search.findAll(text, 'None');

        // Access searchResults via the public property on Search
        const sr = (search as any).searchResultsInternal ?? (search as any).searchResults;
        console.log('[DocViewer] Search results for', JSON.stringify(text.slice(0, 60)), '→', sr?.length ?? 'no results object');

        if (sr && sr.length > 0) {
          if (sr.length > 1) {
            // Skip the first match (typically the TOC/legend listing)
            sr.index = 1;
          } else {
            sr.index = 0;
          }
          sr.navigate();
        }
      } catch (e) {
        console.warn('[DocViewer] Search/navigate failed:', e);
      }
    }, []);

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
          const sfdt = await getContractSfdt(contractDatasetId, token);
          if (cancelled) return;

          if (containerRef.current?.documentEditor) {
            containerRef.current.documentEditor.open(sfdt);
            console.log('[DocViewer] Document opened, searchModule:', !!containerRef.current.documentEditor.searchModule);
            setDocReady(true);
            onDocumentLoaded?.();
          } else {
            console.warn('[DocViewer] containerRef.current?.documentEditor not available after SFDT load');
          }
        } catch (err: any) {
          if (cancelled) return;
          console.error('Failed to load contract document:', err);
          setError(err.message || 'Failed to load contract document');
        } finally {
          if (!cancelled) setIsLoading(false);
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
          created={handleCreated}
        >
          <Inject services={[Toolbar, Search]} />
        </DocumentEditorContainerComponent>
      </div>
    );
  }
);

ContractDocumentViewer.displayName = 'ContractDocumentViewer';

export default ContractDocumentViewer;
