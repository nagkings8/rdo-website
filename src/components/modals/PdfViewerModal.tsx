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

    // Cloudinary URL Handler
    if (fileData.startsWith('http://') || fileData.startsWith('https://')) {
      setIsCloud(true);
      const isDocPdf = fileData.toLowerCase().includes('.pdf') || !fileData.match(/\.(jpg|jpeg|png|webp)$/i);
      setIsPdf(isDocPdf);

      // Force inline viewing URL for Cloudinary
      let cleanUrl = fileData;
      if (cleanUrl.includes('/fl_attachment/')) {
        cleanUrl = cleanUrl.replace('/fl_attachment/', '/');
      }
      setDisplayUrl(cleanUrl);

      // Google Docs Viewer handles Cloudinary PDFs directly inside iframe without forced download
      if (isDocPdf) {
        setViewerUrl(`https://docs.google.com/viewer?url=${encodeURIComponent(cleanUrl)}&embedded=true`);
      } else {
        setViewerUrl(cleanUrl);
      }
      return;
    }

    // Base64 Local Data URL Handler
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
      console.error('Error parsing Base64 document:', err);
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
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.target = '_blank';
      link.download = `${fileName}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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
    if (iframeRef.current) {
      try {
        iframeRef.current.contentWindow?.focus();
        iframeRef.current.contentWindow?.print();
        return;
      } catch (e) {
        console.warn('Iframe print access restricted, fallback to new tab.');
      }
    }

    // If iframe print is blocked by browser sandbox
    if (displayUrl) {
      window.open(displayUrl, '_blank', 'noopener,noreferrer');
      onShowToast('Document opened in new tab. Use Ctrl + P to print.');
    }
  };

  const handleOpenTab = () => {
    if (displayUrl) {
      window.open(displayUrl, '_blank', 'noopener,noreferrer');
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
            <button
              onClick={handleDownload}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1.5 rounded text-xs flex items-center gap-1 shadow-sm transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
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
          {viewerUrl ? (
            isPdf ? (
              <iframe
                ref={iframeRef}
                src={viewerUrl}
                title="Official Document Viewer"
                className="w-full h-full border-none rounded bg-white"
              />
            ) : (
              <div className="w-full h-full overflow-auto flex items-center justify-center p-4">
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