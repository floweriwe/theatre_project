/**
 * FilePreviewModal Component
 *
 * Modal overlay interface for previewing documents with FileViewer integration.
 * Fetches presigned URL from backend and displays appropriate viewer based on MIME type.
 *
 * Features:
 * - Full-screen modal with dark theme
 * - Loading state with spinner
 * - Error handling with fallback
 * - Download button
 * - Close on overlay click or Escape
 *
 * @example
 * <FilePreviewModal
 *   isOpen={isPreviewOpen}
 *   onClose={() => setIsPreviewOpen(false)}
 *   documentId="123"
 *   fileName="contract.pdf"
 *   mimeType="application/pdf"
 * />
 */

import { useState, useEffect } from 'react';
import { Download, AlertCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { FileViewer } from '@/components/FileViewer/FileViewer';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { documentService } from '@/services/document_service';
import { useAuthStore } from '@/store/authStore';

// =============================================================================
// Types
// =============================================================================

interface FilePreviewModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback to close modal */
  onClose: () => void;
  /** Document ID for fetching presigned URL */
  documentId: string;
  /** Original file name */
  fileName: string;
  /** MIME type for viewer routing */
  mimeType: string;
}

// =============================================================================
// Main Component
// =============================================================================

export function FilePreviewModal({
  isOpen,
  onClose,
  documentId,
  fileName,
  mimeType,
}: FilePreviewModalProps) {
  const [presignedUrl, setPresignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const accessToken = useAuthStore((state) => state.accessToken);

  // Fetch presigned URL when modal opens
  useEffect(() => {
    if (isOpen && documentId) {
      setLoading(true);
      setError(null);
      setPresignedUrl(null);

      fetchPresignedUrl(documentId, accessToken)
        .then((url) => {
          setPresignedUrl(url);
          setLoading(false);
        })
        .catch((err) => {
          console.error('Failed to fetch presigned URL:', err);
          setError('Не удалось загрузить файл. Попробуйте снова или скачайте файл напрямую.');
          setLoading(false);
        });
    }
  }, [isOpen, documentId, accessToken]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setPresignedUrl(null);
      setLoading(true);
      setError(null);
    }
  }, [isOpen]);

  const handleDownload = () => {
    if (presignedUrl) {
      // Open in new tab to trigger download
      window.open(presignedUrl, '_blank');
    } else {
      // Fallback: use document service download URL
      const downloadUrl = documentService.getDownloadUrl(Number(documentId));
      window.open(downloadUrl, '_blank');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={fileName}
      size="full"
      footer={
        <div className="flex gap-3">
          <Button
            variant="ghost"
            onClick={handleDownload}
            disabled={loading}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Скачать
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Закрыть
          </Button>
        </div>
      }
    >
      <div className="h-[70vh]">
        {/* Loading State */}
        {loading && <LoadingState />}

        {/* Error State */}
        {error && !loading && (
          <ErrorState
            error={error}
            fileName={fileName}
            onDownload={handleDownload}
          />
        )}

        {/* File Viewer */}
        {presignedUrl && !loading && !error && (
          <FileViewer
            fileUrl={presignedUrl}
            mimeType={mimeType}
            fileName={fileName}
            documentId={documentId}
          />
        )}
      </div>
    </Modal>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

/**
 * Loading state component.
 */
function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <Spinner size="lg" variant="gold" />
      <span className="ml-3 text-[#94A3B8] mt-4">Загрузка файла...</span>
    </div>
  );
}

/**
 * Error state component with download fallback.
 */
interface ErrorStateProps {
  error: string;
  fileName: string;
  onDownload: () => void;
}

function ErrorState({ error, fileName, onDownload }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 bg-[#1A2332] rounded-lg border border-red-400/20">
      <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
      <p className="text-red-400 mb-2 text-center max-w-md">{error}</p>
      <p className="text-sm text-[#64748B] mb-6">{fileName}</p>
      <Button
        variant="secondary"
        onClick={onDownload}
        leftIcon={<Download className="w-4 h-4" />}
      >
        Скачать файл
      </Button>
    </div>
  );
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Fetch presigned URL for document download from backend.
 *
 * @param documentId - Document ID
 * @param token - Access token for authorization
 * @returns Presigned URL for direct file access
 */
async function fetchPresignedUrl(
  documentId: string,
  token: string | null
): Promise<string> {
  const response = await fetch(
    `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'}/documents/${documentId}/download`,
    {
      method: 'GET',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch presigned URL: ${response.status}`);
  }

  const data = await response.json();

  // Backend should return { url: "presigned-url" }
  if (!data.url) {
    throw new Error('Presigned URL not found in response');
  }

  return data.url;
}

// =============================================================================
// Export
// =============================================================================

export default FilePreviewModal;
