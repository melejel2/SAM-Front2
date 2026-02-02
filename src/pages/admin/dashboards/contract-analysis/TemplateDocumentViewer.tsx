import { forwardRef, useImperativeHandle, useRef, useEffect, useState, useCallback } from 'react';
import {
  DocumentEditorContainerComponent,
  Toolbar,
  Inject,
} from '@syncfusion/ej2-react-documenteditor';
import { Search } from '@syncfusion/ej2-documenteditor';
import { registerLicense } from '@syncfusion/ej2-base';
import { getTemplateSfdt } from '@/api/services/contract-analysis-api';
import { Icon } from '@iconify/react';
import fileTextIcon from '@iconify/icons-lucide/file-text';
import loaderIcon from '@iconify/icons-lucide/loader';

registerLicense('Ngo9BigBOggjHTQxAR8/V1JGaF5cXGpCf1FpRmJGdld5fUVHYVZUTXxaS00DNHVRdkdmWH1feHRWQmRcUkZ/WkVWYEs=');

export interface TemplateDocumentViewerHandle {
  highlightClause: (clauseText: string) => void;
  clearHighlights: () => void;
  searchAndScrollTo: (text: string) => void;
}

interface TemplateDocumentViewerProps {
  templateId: number;
  onDocumentLoaded?: () => void;
}

const TemplateDocumentViewer = forwardRef<TemplateDocumentViewerHandle, TemplateDocumentViewerProps>(
  ({ templateId, onDocumentLoaded }, ref) => {
    const containerRef = useRef<DocumentEditorContainerComponent | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [docReady, setDocReady] = useState(false);
    const pendingSearchRef = useRef<string | null>(null);

    const trySearch = useCallback((search: any, text: string): number => {
      search.clearSearchHighlight();
      search.findAll(text, 'None');
      const sr = (search as any).searchResultsInternal ?? (search as any).searchResults;
      return sr?.length ?? 0;
    }, []);

    const navigateResults = useCallback((search: any) => {
      const sr = (search as any).searchResultsInternal ?? (search as any).searchResults;
      if (sr && sr.length > 0) {
        sr.index = sr.length > 1 ? 1 : 0;
        sr.navigate();
      }
    }, []);

    const buildVariants = useCallback((text: string): string[] => {
      const variants: string[] = [text];

      const noColon = text.replace(/\s*:\s*/g, ' ').trim();
      if (noColon !== text) variants.push(noColon);

      const frColon = text.replace(/(\S):(\s)/g, '$1 :$2');
      if (frColon !== text && !variants.includes(frColon)) variants.push(frColon);

      const titleMatch = text.match(/^[\d.]+\s*[:：]?\s*(.{4,})/);
      if (titleMatch) variants.push(titleMatch[1].trim());

      const numMatch = text.match(/^([\d.]+)/);
      if (numMatch && numMatch[1].length >= 2) variants.push(numMatch[1]);

      return variants;
    }, []);

    const executeSearch = useCallback((text: string) => {
      const editor = containerRef.current?.documentEditor;
      if (!editor) return;

      const search = editor.searchModule;
      if (!search) return;

      try {
        const variants = buildVariants(text);
        let found = 0;

        for (const variant of variants) {
          found = trySearch(search, variant);
          if (found > 0) {
            navigateResults(search);
            return;
          }
        }
      } catch (e) {
        console.warn('[TemplateDocViewer] Search failed:', e);
      }
    }, [buildVariants, trySearch, navigateResults]);

    useEffect(() => {
      let cancelled = false;

      const loadDocument = async () => {
        if (!templateId) {
          setError('Missing template ID');
          setIsLoading(false);
          return;
        }

        try {
          const sfdt = await getTemplateSfdt(templateId);
          if (cancelled) return;

          if (containerRef.current?.documentEditor) {
            containerRef.current.documentEditor.open(sfdt);
            setDocReady(true);
            onDocumentLoaded?.();
          } else {
            console.warn('[TemplateDocViewer] documentEditor not available after SFDT load');
          }
        } catch (err: any) {
          if (cancelled) return;
          console.error('Failed to load template document:', err);
          setError(err.message || 'Failed to load template document');
        } finally {
          if (!cancelled) setIsLoading(false);
        }
      };

      loadDocument();

      return () => {
        cancelled = true;
      };
    }, [templateId, onDocumentLoaded]);

    useEffect(() => {
      if (docReady && pendingSearchRef.current) {
        const text = pendingSearchRef.current;
        pendingSearchRef.current = null;
        executeSearch(text);
      }
    }, [docReady, executeSearch]);

    const handleCreated = useCallback(() => {
      if (containerRef.current?.documentEditor) {
        containerRef.current.documentEditor.documentEditorSettings.showRuler = false;
      }
    }, []);

    const searchAndScrollTo = useCallback((text: string) => {
      if (!containerRef.current?.documentEditor || !docReady) {
        pendingSearchRef.current = text;
        return;
      }
      executeSearch(text);
    }, [docReady, executeSearch]);

    const highlightClause = useCallback((text: string) => {
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
              <span className="text-sm text-base-content/60">Loading template document...</span>
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

TemplateDocumentViewer.displayName = 'TemplateDocumentViewer';

export default TemplateDocumentViewer;
