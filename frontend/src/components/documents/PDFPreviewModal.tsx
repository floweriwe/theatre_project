/**
 * PDF Preview Modal Component
 * Modal overlay for PDF preview with PDFViewer
 */

import { Modal } from '@/components/ui/Modal';
import { PDFViewer } from './PDFViewer';

interface PDFPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string;
  fileName: string;
}

export function PDFPreviewModal({
  isOpen,
  onClose,
  fileUrl,
  fileName,
}: PDFPreviewModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="full"
      title="Предпросмотр документа"
      subtitle={fileName}
      showCloseButton={true}
      closeOnOverlayClick={true}
      closeOnEscape={true}
    >
      <div className="h-[70vh]">
        <PDFViewer fileUrl={fileUrl} fileName={fileName} />
      </div>
    </Modal>
  );
}

export default PDFPreviewModal;
