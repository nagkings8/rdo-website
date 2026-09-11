import React, { useState, useEffect, useRef } from 'react';
import { X, Download, Printer, ExternalLink } from 'lucide-react';

interface PdfViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileData: string | null;
  title: string;
  subtitle?: string;
  fileName?: string;
  onShowToast: (msg: string) => void;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({
  isOpen,
  onClose,
  fileData,
  title,
  subtitle,
  fileName = 'Official_Document',
  onShowToast,
}) => {
  const [blobUrl, setBlobUrl] = useState<string>('');
  const [isPdf, setIsPdf] = useState<boolean>(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!isOpen || !fileData) {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
        setBlobUrl('');
      }
      return;
    }

    try {
      const parts = fileData.split(',');
      const meta = parts[0];
      const mime = meta.split(':')[1]?.split(';')[0] || 'application/pdf';
      const base64 = parts[1] || '';
      const binary = atob(base64);
      const len = binary.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: mime });
      const url = URL.createObjectURL(blob);
      setBlobUrl(url);
      setIsPdf(mime.includes('pdf'));
    } catch (err) {
      console.error('Error generating document blob url:', err);
      onShowToast('Error loading attached document preview.');
    }

    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [isOpen, fileData]);

  if (!isOpen || !fileData) return null;

  const handlePrint = () => {
    try {
      if (iframeRef.current && isPdf) {
        try {
          iframeRef.current.contentWindow?.focus();
          iframeRef.current.contentWindow?.print();
          return;
        } catch (crossErr) {
          console.warn('Iframe print restriction:', crossErr);
        }
      }
    } catch (e) {}

    if (blobUrl) {
      try {
        const win = window.open(blobUrl, '_blank');
        if (win) {
          onShowToast('Document opened in new window. Use Ctrl+P to print.');
          return;
        }
      } catch (e) {}
    }
    onShowToast("Please use 'Download PDF' to save and print this document.");
  };

  const handleOpenTab = () => {
    if (blobUrl) {
      try {
        const win = window.open(blobUrl, '_blank');
        if (!win) {
          const a = document.createElement('a');
          a.href = blobUrl;
          a.target = '_blank';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
      } catch (e) {
        onShowToast('Unable to open in a new tab. Please use Download PDF.');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xl max-w-5xl w-full h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-[#061122] text-white px-5 py-3 flex flex-wrap justify-between items-center gap-3 border-b-2 border-amber-500 shrink-0">
          <div>
            <h3 className="font-extrabold text-sm md:text-base text-amber-300">{title}</h3>
            {subtitle && (
              <div
                className="text-[11px] text-slate-300"
                dangerouslySetInnerHTML={{ __html: subtitle }}
              />
            )}
          </div>
          <div className="flex items-center gap-2">
            {blobUrl && (
              <a
                href={blobUrl}
                download={`${fileName}.${isPdf ? 'pdf' : 'jpg'}`}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1.5 rounded text-xs flex items-center gap-1 shadow-sm transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </a>
            )}
            <button
              onClick={handlePrint}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-2.5 py-1.5 rounded text-xs flex items-center gap-1 shadow-sm transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={handleOpenTab}
              className="bg-slate-700 hover:bg-slate-600 text-white font-bold px-2.5 py-1.5 rounded text-xs flex items-center gap-1 transition cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Open Tab</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Viewer */}
        <div className="flex-1 bg-slate-800 relative overflow-hidden flex items-center justify-center p-2">
          {blobUrl ? (
            isPdf ? (
              <iframe
                ref={iframeRef}
                src={blobUrl}
                title="Official Document Viewer"
                className="w-full h-full border-none rounded bg-white"
              />
            ) : (
              <div className="w-full h-full overflow-auto flex items-center justify-center p-4">
                <img
                  src={blobUrl}
                  alt="Attached Document"
                  className="max-w-full max-h-full object-contain rounded shadow-lg bg-white"
                />
              </div>
            )
          ) : (
            <div className="text-white text-xs">Loading document...</div>
          )}
        </div>
      </div>
    </div>
  );
};
