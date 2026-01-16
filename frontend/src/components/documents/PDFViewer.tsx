/**
 * PDF Viewer Component
 * Displays PDF files with navigation and zoom controls
 */

import { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import './PDFViewer.css';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  fileUrl: string;
  fileName?: string;
}

interface PDFDocumentProxy {
  numPages: number;
}

export function PDFViewer({ fileUrl, fileName }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(800);

  useEffect(() => {
    // Get container width for responsive sizing
    const updateWidth = () => {
      const container = document.getElementById('pdf-container');
      if (container) {
        setContainerWidth(container.clientWidth - 48); // Account for padding
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const onDocumentLoadSuccess = ({ numPages }: PDFDocumentProxy) => {
    setNumPages(numPages);
    setPageNumber(1);
    setLoading(false);
    setError(null);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('PDF load error:', error);
    setError('Не удалось загрузить PDF файл');
    setLoading(false);
  };

  const goToPrevPage = () => {
    setPageNumber((prev) => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setPageNumber((prev) => Math.min(prev + 1, numPages));
  };

  const zoomIn = () => {
    setScale((prev) => Math.min(prev + 0.2, 3.0));
  };

  const zoomOut = () => {
    setScale((prev) => Math.max(prev - 0.2, 0.5));
  };

  const fitToWidth = () => {
    setScale(1.0);
  };

  return (
    <div id="pdf-container" className="flex flex-col h-full">
      {/* Controls */}
      <div className="flex items-center justify-between gap-4 mb-4 p-4 bg-[#1A2332] rounded-lg border border-[#D4A574]/20">
        {/* Page Navigation */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={goToPrevPage}
            disabled={pageNumber <= 1 || loading}
            className="text-text-primary hover:bg-[#243044]"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <span className="text-sm text-[#F1F5F9] min-w-[100px] text-center">
            {loading ? (
              'Загрузка...'
            ) : (
              <>
                Страница <span className="font-medium text-[#D4A574]">{pageNumber}</span> из {numPages}
              </>
            )}
          </span>

          <Button
            variant="ghost"
            size="sm"
            onClick={goToNextPage}
            disabled={pageNumber >= numPages || loading}
            className="text-text-primary hover:bg-[#243044]"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={zoomOut}
            disabled={loading}
            className="text-text-primary hover:bg-[#243044]"
            title="Уменьшить"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>

          <span className="text-sm text-[#94A3B8] min-w-[60px] text-center">
            {Math.round(scale * 100)}%
          </span>

          <Button
            variant="ghost"
            size="sm"
            onClick={zoomIn}
            disabled={loading}
            className="text-text-primary hover:bg-[#243044]"
            title="Увеличить"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>

          <div className="w-px h-6 bg-[#D4A574]/20 mx-2" />

          <Button
            variant="ghost"
            size="sm"
            onClick={fitToWidth}
            disabled={loading}
            className="text-text-primary hover:bg-[#243044]"
            title="По ширине"
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* PDF Content */}
      <div className="flex-1 overflow-auto bg-[#0F1419] rounded-lg border border-[#D4A574]/20">
        <div className="flex items-center justify-center min-h-[500px] p-6">
          {error ? (
            <div className="text-center">
              <p className="text-red-400 mb-2">{error}</p>
              <p className="text-sm text-[#64748B]">{fileName}</p>
            </div>
          ) : (
            <Document
              file={fileUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={
                <div className="flex items-center gap-3">
                  <Spinner size="md" className="text-[#D4A574]" />
                  <span className="text-[#94A3B8]">Загрузка PDF...</span>
                </div>
              }
              error={
                <div className="text-center">
                  <p className="text-red-400">Ошибка загрузки PDF</p>
                </div>
              }
              className="flex flex-col items-center"
            >
              <Page
                pageNumber={pageNumber}
                scale={scale}
                width={Math.min(containerWidth * scale, containerWidth * 3)}
                loading={
                  <div className="flex items-center gap-3 py-8">
                    <Spinner size="sm" className="text-[#D4A574]" />
                    <span className="text-[#94A3B8]">Загрузка страницы...</span>
                  </div>
                }
                className="shadow-2xl"
                renderTextLayer={true}
                renderAnnotationLayer={true}
              />
            </Document>
          )}
        </div>
      </div>
    </div>
  );
}

export default PDFViewer;
