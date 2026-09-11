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
  const [displayUrl, setDisplayUrl] = useState<string>('');
  const [viewerUrl, setViewerUrl] = useState<string>('');
  const [isPdf, setIsPdf] = useState<boolean>(true);
  const [isCloud, setIsCloud] = useState<boolean>(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!isOpen || !fileData) {
      if (displayUrl && !isCloud) {
        URL.revokeObjectURL(displayUrl);
      }
      setDisplayUrl('');
      setViewerUrl('');
      return;
    }

    if (fileData.startsWith('http://') || fileData.startsWith('https://')) {
      setIsCloud(true);
      const isDocPdf =
        fileData.toLowerCase().includes('.pdf') ||
        !fileData.match(/\.(jpg|jpeg|png|webp)$/i);
      setIsPdf(isDocPdf);

      let cleanUrl = fileData.replace('/fl_attachment/', '/');
      setDisplayUrl(cleanUrl);

      if (isDocPdf) {
        setViewerUrl(
          `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(
            cleanUrl
          )}`
        );
      } else {
        setViewerUrl(cleanUrl);
      }
      return;
    }

    try {
      setIsCloud(false);
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
      setDisplayUrl(url);
      setViewerUrl(url);
      setIsPdf(mime.includes('pdf'));
    } catch (err) {
      console.error('Error parsing document:', err);
      onShowToast('Error loading document preview.');
    }

    return () => {
      if (displayUrl && !fileData.startsWith('http')) {
        URL.revokeObjectURL(displayUrl);
      }
    };
  }, [isOpen, fileData]);

  if (!isOpen || !fileData) return null;

  const handleDownload = () => {
    if (isCloud) {
      const downloadUrl = fileData.includes('/upload/')
        ? fileData.replace('/upload/', '/upload/fl_attachment/')
        : fileData;
      window.open(downloadUrl, '_blank');
      return;
    }

    if (displayUrl) {
      const link = document.createElement('a');
      link.href = displayUrl;
      link.download = `${fileName}.${isPdf ? 'pdf' : 'jpg'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handlePrint = () => {
    if (iframeRef.current && !isCloud) {
      try {
        iframeRef.current.contentWindow?.focus();
        iframeRef.current.contentWindow?.print();
        return;
      } catch (e) {
        console.warn('Iframe print restricted:', e);
      }
    }

    if (displayUrl) {
      window.open(displayUrl, '_blank', 'noopener,noreferrer');
      onShowToast('Document opened in new window. Use Ctrl+P to print.');
    }
  };

  const handleOpenTab = () => {
    if (displayUrl) {
      window.open(displayUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-5xl h-[95vh] sm:h-[90vh] flex flex-col overflow-hidden m-1 sm:m-2">
        <div className="bg-[#061122] text-white px-3 sm:px-5 py-2.5 sm:py-3 flex flex-wrap justify-between items-center gap-2 border-b-2 border-amber-500 shrink-0">
          <div className="min-w-[180px] flex-1">
            <h3 className="font-extrabold text-xs sm:text-base text-amber-300 truncate">
              {title}
            </h3>
            {subtitle && (
              <div
                className="text-[10px] sm:text-[11px] text-slate-300 truncate"
                dangerouslySetInnerHTML={{ __html: subtitle }}
              />
            )}
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={handleDownload}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2 sm:px-2.5 py-1 sm:py-1.5 rounded text-[11px] sm:text-xs flex items-center gap-1 shadow-sm transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
            <button
              onClick={handlePrint}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-2 sm:px-2.5 py-1 sm:py-1.5 rounded text-[11px] sm:text-xs flex items-center gap-1 shadow-sm transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Print</span>
            </button>
            <button
              onClick={handleOpenTab}
              className="bg-slate-700 hover:bg-slate-600 text-white font-bold px-2 sm:px-2.5 py-1 sm:py-1.5 rounded text-[11px] sm:text-xs flex items-center gap-1 transition cursor-pointer"
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

        <div className="flex-1 bg-slate-800 relative overflow-hidden flex items-center justify-center p-1 sm:p-2">
          {viewerUrl ? (
            isPdf ? (
              <iframe
                ref={iframeRef}
                src={viewerUrl}
                title="Official Document Viewer"
                className="w-full h-full border-none rounded bg-white"
              />
            ) : (
              <div className="w-full h-full overflow-auto flex items-center justify-center p-2">
                <img
                  src={viewerUrl}
                  alt="Attached Document"
                  className="max-w-full max-h-full object-contain rounded shadow-lg bg-white"
                />
              </div>
            )
          ) : (
            <div className="text-white text-xs">Loading document preview...</div>
          )}
        </div>
      </div>
    </div>
  );
};