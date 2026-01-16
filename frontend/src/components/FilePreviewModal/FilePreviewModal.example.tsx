/**
 * FilePreviewModal - Usage Examples
 *
 * Demonstrates different use cases for the FilePreviewModal component.
 */

import { useState } from 'react';
import { Eye, FileText } from 'lucide-react';
import { FilePreviewModal } from './FilePreviewModal';
import { Button } from '@/components/ui/Button';

// =============================================================================
// Example 1: Basic Usage with Button Trigger
// =============================================================================

export function BasicExample() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="secondary"
        onClick={() => setIsOpen(true)}
        leftIcon={<Eye className="w-4 h-4" />}
      >
        Просмотреть документ
      </Button>

      <FilePreviewModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        documentId="123"
        fileName="Договор подряда.pdf"
        mimeType="application/pdf"
      />
    </>
  );
}

// =============================================================================
// Example 2: Table Row with Preview
// =============================================================================

interface Document {
  id: string;
  name: string;
  fileName: string;
  mimeType: string;
}

export function TableRowExample({ document }: { document: Document }) {
  const [previewOpen, setPreviewOpen] = useState(false);

  return (
    <>
      <tr className="border-b border-border-subtle hover:bg-bg-surface transition-colors">
        <td className="px-4 py-3 text-text-primary">{document.name}</td>
        <td className="px-4 py-3 text-text-secondary text-sm">{document.fileName}</td>
        <td className="px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPreviewOpen(true)}
            leftIcon={<Eye className="w-4 h-4" />}
          >
            Просмотр
          </Button>
        </td>
      </tr>

      <FilePreviewModal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        documentId={document.id}
        fileName={document.fileName}
        mimeType={document.mimeType}
      />
    </>
  );
}

// =============================================================================
// Example 3: Document Card with Preview
// =============================================================================

export function DocumentCardExample({ document }: { document: Document }) {
  const [previewOpen, setPreviewOpen] = useState(false);

  return (
    <>
      <div className="bg-[#1A2332] border border-[#D4A574]/20 rounded-lg p-4 hover:border-[#D4A574]/40 transition-colors">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-lg bg-[#243044] flex items-center justify-center flex-shrink-0">
            <FileText className="w-6 h-6 text-[#D4A574]" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[#F1F5F9] font-medium truncate">{document.name}</h3>
            <p className="text-[#94A3B8] text-sm mt-1 truncate">{document.fileName}</p>
            <div className="flex gap-2 mt-3">
              <Button
                variant="gold-outline"
                size="sm"
                onClick={() => setPreviewOpen(true)}
                leftIcon={<Eye className="w-3 h-3" />}
              >
                Просмотр
              </Button>
            </div>
          </div>
        </div>
      </div>

      <FilePreviewModal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        documentId={document.id}
        fileName={document.fileName}
        mimeType={document.mimeType}
      />
    </>
  );
}

// =============================================================================
// Example 4: Multiple Documents with Preview
// =============================================================================

export function DocumentListExample() {
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

  const documents: Document[] = [
    {
      id: '1',
      name: 'Договор подряда',
      fileName: 'contract_2024.pdf',
      mimeType: 'application/pdf',
    },
    {
      id: '2',
      name: 'Смета спектакля',
      fileName: 'budget_hamlet.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    },
    {
      id: '3',
      name: 'Эскиз декораций',
      fileName: 'scenery_sketch.jpg',
      mimeType: 'image/jpeg',
    },
  ];

  return (
    <>
      <div className="space-y-2">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="flex items-center justify-between p-3 bg-[#1A2332] rounded-lg border border-[#D4A574]/20"
          >
            <div>
              <h4 className="text-[#F1F5F9] font-medium">{doc.name}</h4>
              <p className="text-[#64748B] text-sm">{doc.fileName}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedDoc(doc)}
              leftIcon={<Eye className="w-4 h-4" />}
            >
              Просмотр
            </Button>
          </div>
        ))}
      </div>

      {selectedDoc && (
        <FilePreviewModal
          isOpen={!!selectedDoc}
          onClose={() => setSelectedDoc(null)}
          documentId={selectedDoc.id}
          fileName={selectedDoc.fileName}
          mimeType={selectedDoc.mimeType}
        />
      )}
    </>
  );
}

// =============================================================================
// Example 5: With API Integration
// =============================================================================

export function ApiIntegrationExample() {
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);

  const handleViewDocument = async (documentId: string) => {
    try {
      // Fetch document details from API
      const response = await fetch(`/api/v1/documents/${documentId}`);
      const doc = await response.json();

      // Open preview modal with fetched data
      setPreviewDoc({
        id: doc.id,
        name: doc.name,
        fileName: doc.file_name,
        mimeType: doc.mime_type,
      });
    } catch (error) {
      console.error('Failed to fetch document:', error);
    }
  };

  return (
    <>
      <Button
        variant="primary"
        onClick={() => handleViewDocument('456')}
        leftIcon={<Eye className="w-4 h-4" />}
      >
        Просмотреть документ
      </Button>

      {previewDoc && (
        <FilePreviewModal
          isOpen={!!previewDoc}
          onClose={() => setPreviewDoc(null)}
          documentId={previewDoc.id}
          fileName={previewDoc.fileName}
          mimeType={previewDoc.mimeType}
        />
      )}
    </>
  );
}

// =============================================================================
// Example 6: Supported MIME Types
// =============================================================================

export const SUPPORTED_MIME_TYPES = {
  // PDF documents
  pdf: 'application/pdf',

  // Word documents (requires backend conversion)
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  doc: 'application/msword',

  // Spreadsheets
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  xls: 'application/vnd.ms-excel',
  csv: 'text/csv',

  // Images
  jpg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  svg: 'image/svg+xml',

  // Audio
  mp3: 'audio/mpeg',
  wav: 'audio/wav',

  // Video
  mp4: 'video/mp4',
  webm: 'video/webm',
};

// =============================================================================
// Accessibility Checklist
// =============================================================================

/**
 * Accessibility Features:
 *
 * ✅ Keyboard Navigation
 *    - Close modal with Escape key
 *    - Tab navigation through buttons
 *
 * ✅ ARIA Attributes
 *    - Modal has role="dialog"
 *    - Modal is aria-modal="true"
 *    - Title is properly labeled
 *
 * ✅ Focus Management
 *    - Focus trapped within modal when open
 *    - Focus returned to trigger on close
 *
 * ✅ Screen Reader Support
 *    - All buttons have descriptive labels
 *    - Error messages are announced
 *    - Loading state is indicated
 *
 * ✅ Color Contrast
 *    - Text meets WCAG AA standards
 *    - Error states use red with sufficient contrast
 *    - Interactive elements clearly visible
 */

// =============================================================================
// Performance Considerations
// =============================================================================

/**
 * Performance Optimizations:
 *
 * 1. Lazy Loading
 *    - FileViewer components load only when needed
 *    - Presigned URL fetched only when modal opens
 *
 * 2. State Management
 *    - Local state reset on modal close to prevent memory leaks
 *    - Auth token accessed directly from Zustand store
 *
 * 3. Error Handling
 *    - Graceful fallback for failed URL fetches
 *    - Download button always available as backup
 *
 * 4. Resource Cleanup
 *    - Effect cleanup when modal closes
 *    - No unnecessary re-renders
 *
 * 5. Network Efficiency
 *    - Single API call per modal open
 *    - No polling or continuous requests
 */
