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
            setDocReady(true);
            onDocumentLoaded?.();
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
        const editor = containerRef.current?.documentEditor;
        if (editor?.searchModule) {
          editor.searchModule.clearSearchHighlight();
          editor.searchModule.findAll(text, 'None');
        }
      }
    }, [docReady]);

    const handleCreated = useCallback(() => {
      if (containerRef.current?.documentEditor) {
        containerRef.current.documentEditor.documentEditorSettings.showRuler = false;
      }
    }, []);

    // Search and scroll to clause — skips TOC/legend by jumping to second match if multiple exist
    const searchAndScrollTo = useCallback((text: string) => {
      if (!containerRef.current?.documentEditor || !docReady) {
        pendingSearchRef.current = text;
        return;
      }
      try {
        const search = containerRef.current.documentEditor.searchModule as Search | undefined;
        if (!search) return;
        search.clearSearchHighlight();
        search.findAll(text, 'None');
        const sr = (search as unknown as { searchResults?: { length: number; index: number; navigate: () => void } }).searchResults;
        if (sr && sr.length > 1) {
          // Skip the first match (typically the TOC/legend listing) and go to the actual section
          sr.index = 1;
          sr.navigate();
        }
      } catch (e) {
        console.warn('Search failed for:', text, e);
      }
    }, [docReady]);

    const highlightClause = useCallback((text: string) => {
      if (!containerRef.current?.documentEditor || !docReady) {
        pendingSearchRef.current = text;
        return;
      }
      try {
        const editor = containerRef.current.documentEditor;
        editor.searchModule?.clearSearchHighlight();
        editor.searchModule?.findAll(text, 'None');
      } catch (e) {
        console.warn('Highlight failed for:', text, e);
      }
    }, [docReady]);

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
