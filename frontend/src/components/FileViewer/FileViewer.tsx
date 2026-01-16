/**
 * FileViewer Component - Unified File Preview Dispatcher
 *
 * Routes file previews to appropriate viewer based on MIME type.
 * Supports PDF, DOCX/DOC (via backend conversion), spreadsheets, audio, video, and images.
 */

import { useState, useEffect } from 'react';
import { Download, FileQuestion } from 'lucide-react';
import { PDFViewer } from '@/components/documents/PDFViewer';
import { AudioPlayer } from '@/components/FileViewer/AudioPlayer';
import { VideoPlayer } from '@/components/FileViewer/VideoPlayer';
import { SpreadsheetViewer } from '@/components/FileViewer/SpreadsheetViewer';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';

interface FileViewerProps {
  fileUrl: string;
  mimeType: string;
  fileName?: string;
  documentId?: string;
}

/**
 * Main FileViewer component that dispatches to appropriate viewer.
 *
 * @example
 * <FileViewer
 *   fileUrl="/api/documents/123/download"
 *   mimeType="application/pdf"
 *   fileName="contract.pdf"
 * />
 */
export function FileViewer({ fileUrl, mimeType, fileName, documentId }: FileViewerProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // For DOCX/DOC, fetch preview URL from backend conversion endpoint
  useEffect(() => {
    if (isDocxOrDoc(mimeType) && documentId) {
      setLoading(true);
      fetchPreviewUrl(documentId)
        .then(url => {
          setPreviewUrl(url);
          setLoading(false);
        })
        .catch(() => {
          setError('Не удалось загрузить превью документа');
          setLoading(false);
        });
    }
  }, [mimeType, documentId]);

  const renderViewer = () => {
    // Loading state
    if (loading) {
      return <LoadingState />;
    }

    // Error state
    if (error) {
      return <ErrorState error={error} fileUrl={fileUrl} fileName={fileName} />;
    }

    // Route by MIME type
    switch (true) {
      case mimeType === 'application/pdf':
        return <PDFViewer fileUrl={fileUrl} fileName={fileName} />;

      case isDocxOrDoc(mimeType):
        // For DOCX/DOC, show PDF preview if available, otherwise fallback
        return previewUrl ? (
          <PDFViewer fileUrl={previewUrl} fileName={fileName} />
        ) : (
          <UnsupportedType
            fileUrl={fileUrl}
            fileName={fileName}
            mimeType={mimeType}
            message="Превью документа Word недоступно. Скачайте файл для просмотра."
          />
        );

      case isSpreadsheet(mimeType):
        return <SpreadsheetViewer fileUrl={fileUrl} />;

      case isAudio(mimeType):
        return <AudioPlayer fileUrl={fileUrl} fileName={fileName} />;

      case isVideo(mimeType):
        return <VideoPlayer fileUrl={fileUrl} fileName={fileName} />;

      case isImage(mimeType):
        return <ImageViewer fileUrl={fileUrl} fileName={fileName} />;

      default:
        return (
          <UnsupportedType
            fileUrl={fileUrl}
            fileName={fileName}
            mimeType={mimeType}
          />
        );
    }
  };

  return (
    <div className="w-full h-full">
      {renderViewer()}
    </div>
  );
}

// =============================================================================
// Helper Functions - MIME Type Detection
// =============================================================================

function isDocxOrDoc(mimeType: string): boolean {
  return (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/msword'
  );
}

function isSpreadsheet(mimeType: string): boolean {
  return (
    mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    mimeType === 'application/vnd.ms-excel' ||
    mimeType === 'text/csv'
  );
}

function isAudio(mimeType: string): boolean {
  return mimeType.startsWith('audio/');
}

function isVideo(mimeType: string): boolean {
  return mimeType.startsWith('video/');
}

function isImage(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

/**
 * Fetch preview URL for DOCX/DOC documents.
 * Backend should convert to PDF and return preview URL.
 */
async function fetchPreviewUrl(_documentId: string): Promise<string> {
  // TODO: Implement backend API call for document preview
  // For now, throw error to show unsupported message
  throw new Error('Preview not available');
}

// =============================================================================
// Viewer Components
// =============================================================================

/**
 * Loading state component.
 */
function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-6 bg-[#1A2332] rounded-lg border border-[#D4A574]/20">
      <Spinner size="lg" variant="gold" />
      <p className="mt-4 text-[#94A3B8]">Загрузка превью...</p>
    </div>
  );
}

/**
 * Error state component.
 */
interface ErrorStateProps {
  error: string;
  fileUrl: string;
  fileName?: string;
}

function ErrorState({ error, fileUrl, fileName }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-6 bg-[#1A2332] rounded-lg border border-red-400/20">
      <p className="text-red-400 mb-4 text-center">{error}</p>
      {fileName && (
        <p className="text-sm text-[#64748B] mb-4">{fileName}</p>
      )}
      <a
        href={fileUrl}
        download
        className="inline-flex items-center gap-2"
      >
        <Button variant="secondary" leftIcon={<Download className="w-4 h-4" />}>
          Скачать файл
        </Button>
      </a>
    </div>
  );
}

/**
 * Image viewer component.
 */
interface ImageViewerProps {
  fileUrl: string;
  fileName?: string;
}

function ImageViewer({ fileUrl, fileName }: ImageViewerProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  if (imageError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6 bg-[#1A2332] rounded-lg border border-red-400/20">
        <p className="text-red-400 mb-2">Не удалось загрузить изображение</p>
        <a href={fileUrl} download className="text-[#D4A574] hover:text-[#E8C297] underline">
          Скачать файл
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full">
      {fileName && (
        <h3 className="text-[#F1F5F9] font-medium mb-4 text-center truncate max-w-full">
          {fileName}
        </h3>
      )}

      <div className="relative w-full bg-[#0F1419] rounded-lg border border-[#D4A574]/20 p-4">
        {imageLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Spinner size="lg" variant="gold" />
          </div>
        )}
        <img
          src={fileUrl}
          alt={fileName || 'Preview'}
          className="max-w-full max-h-[70vh] mx-auto object-contain rounded"
          onLoad={() => setImageLoading(false)}
          onError={() => {
            setImageLoading(false);
            setImageError(true);
          }}
        />
      </div>
    </div>
  );
}

/**
 * Unsupported file type component.
 */
interface UnsupportedTypeProps {
  fileUrl: string;
  fileName?: string;
  mimeType: string;
  message?: string;
}

function UnsupportedType({ fileUrl, fileName, mimeType, message }: UnsupportedTypeProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-6 bg-[#1A2332] rounded-lg border border-[#D4A574]/20">
      <FileQuestion className="w-16 h-16 text-[#64748B] mb-4" />
      <p className="text-[#F1F5F9] font-medium mb-2">
        {message || 'Превью недоступно для данного типа файла'}
      </p>
      {fileName && (
        <p className="text-sm text-[#94A3B8] mb-1">{fileName}</p>
      )}
      <p className="text-xs text-[#64748B] mb-4">Тип файла: {mimeType}</p>
      <a
        href={fileUrl}
        download
        className="inline-flex items-center gap-2"
      >
        <Button variant="gold-outline" leftIcon={<Download className="w-4 h-4" />}>
          Скачать файл
        </Button>
      </a>
    </div>
  );
}

export default FileViewer;
