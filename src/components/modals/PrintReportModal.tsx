import React, { useState } from 'react';
import { PrintReportPayload, generatePrintHtml } from '../../utils/printReport';
import { X, Printer, ExternalLink, Download, AlertCircle, FileCheck2 } from 'lucide-react';
import { RDO_LOGO_BASE64 } from '../../utils/logoBase64';

interface PrintReportModalProps {
  isOpen: boolean;
  data: PrintReportPayload | null;
  onClose: () => void;
  onShowToast?: (msg: string) => void;
}

export const PrintReportModal: React.FC<PrintReportModalProps> = ({
  isOpen,
  data,
  onClose,
  onShowToast,
}) => {
  const [layoutMode, setLayoutMode] = useState<'fit' | 'multi'>('fit');

  if (!isOpen || !data) return null;

  const isOfficial = data.isOfficial ?? false;
  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const currentTime = new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const handlePrintDirect = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      if (onShowToast) onShowToast('Please allow popups to print report.');
      return;
    }
    const html = generatePrintHtml(data, true);
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleOpenInNewTab = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      if (onShowToast) onShowToast('Please allow popups to open report in new tab.');
      return;
    }
    const html = generatePrintHtml(data, false);
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleDownloadHtml = () => {
    const html = generatePrintHtml(data, false);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.fileName || data.title.replace(/\s+/g, '_')}_${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
    if (onShowToast) onShowToast('HTML report downloaded.');
  };

  const isCourtDoc =
    data.title.toLowerCase().includes('court') ||
    data.title.toLowerCase().includes('appeal') ||
    data.title.toLowerCase().includes('cause list') ||
    data.title.toLowerCase().includes('case');

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-6xl max-h-[96vh] flex flex-col overflow-hidden">
        
        {/* Top Command Toolbar */}
        <div className="bg-[#0b192c] text-white px-4 py-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="bg-amber-500 text-slate-950 text-[10px] font-black uppercase px-2 py-0.5 rounded shadow-xs">
              PRINT &amp; EXPORT PREVIEW
            </span>
            <h2 className="text-sm sm:text-base font-black truncate max-w-md text-white">
              {data.title}
            </h2>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={handlePrintDirect}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download / Save PDF</span>
            </button>

            <button
              onClick={handlePrintDirect}
              className="bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>

            <button
              onClick={handleOpenInNewTab}
              className="bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition shadow-xs cursor-pointer"
              title="Open standalone report in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open in Tab</span>
            </button>

            <button
              onClick={handleDownloadHtml}
              className="bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition shadow-xs cursor-pointer"
              title="Download standalone HTML document"
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>Download HTML</span>
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Info Alert & Layout Selector */}
        <div className="bg-amber-50/90 border-b border-amber-200 px-4 py-2 flex flex-wrap items-center justify-between text-xs text-amber-950 gap-2">
          <div className="flex items-center gap-1.5 font-medium">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              <strong>Note:</strong> If print dialog is blocked, click <strong>"Open in Tab"</strong> or <strong>"Download HTML"</strong>.
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-700">PDF Layout:</span>
            <div className="bg-white border border-slate-300 rounded-lg p-0.5 flex gap-1 text-[11px] font-bold">
              <button
                onClick={() => setLayoutMode('fit')}
                className={`px-2 py-0.5 rounded transition ${layoutMode === 'fit' ? 'bg-[#0f3b63] text-white' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Fit to 1 Page
              </button>
              <button
                onClick={() => setLayoutMode('multi')}
                className={`px-2 py-0.5 rounded transition ${layoutMode === 'multi' ? 'bg-amber-400 text-slate-950 font-black' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Multi-Page (Page Breakup)
              </button>
            </div>
            <span className="text-[11px] font-semibold text-slate-500">
              {data.landscape ? 'A4 Landscape' : 'A4 Portrait'}
            </span>
          </div>
        </div>

        {/* Live Preview Paper Sheet */}
        <div className="flex-1 overflow-auto bg-slate-200/80 p-4 sm:p-6 flex justify-center">
          <div className="bg-white text-slate-950 p-6 sm:p-8 rounded-xl shadow-xl w-full max-w-[1080px] border border-slate-300 print-preview-sheet text-xs">
            
            {/* Header Box */}
            <div className="border-b-2 border-[#0f3b63] pb-3 mb-3">
              <div className="flex items-center justify-between gap-4">
                <img
                  src={RDO_LOGO_BASE64}
                  alt="RDO Logo"
                  className="w-14 h-14 object-contain shrink-0"
                />
                <div className="flex-1 text-center">
                  <div className="text-[11px] font-black text-[#0f3b63] uppercase tracking-wider">
                    GOVERNMENT OF TELANGANA • REVENUE DEPARTMENT
                  </div>
                  <div className="text-base sm:text-lg font-black text-slate-950 mt-0.5">
                    {data.subtitle || 'Revenue Divisional Office, Huzurnagar • Suryapet District'}
                  </div>
                  <div className="inline-block bg-[#134674] text-white text-xs font-black px-4 py-1 rounded mt-1.5 uppercase tracking-wide">
                    {data.title}
                  </div>
                </div>

                {/* Conditional Badge: Official Copy vs Public Copy */}
                <div
                  className={`w-14 shrink-0 text-center text-[10px] font-black rounded p-1.5 border leading-tight ${
                    isOfficial
                      ? 'border-[#0f3b63] text-[#0f3b63] bg-blue-50/60'
                      : 'border-slate-400 text-slate-600 bg-slate-50'
                  }`}
                >
                  {isOfficial ? (
                    <>OFFICIAL<br />COPY</>
                  ) : (
                    <>PUBLIC<br />COPY</>
                  )}
                </div>
              </div>

              {/* Meta strip */}
              <div className="flex justify-between items-center text-[11px] font-bold text-slate-700 mt-2.5 pt-1.5 border-t border-slate-300">
                <span>District: Suryapet | Division: Huzurnagar</span>
                <span>
                  {data.period ? `Period / As on: ${data.period} | ` : ''}
                  Printed on: {currentDate} {currentTime}
                </span>
              </div>
            </div>

            {/* Injected Table HTML */}
            <div
              className="table-container overflow-x-auto my-3"
              dangerouslySetInnerHTML={{ __html: data.tableHtml }}
            />

            {/* CONDITIONAL SIGNATURES: ONLY SHOW IF LOGIN (isOfficial === true) */}
            {isOfficial ? (
              <div className="mt-8 pt-4 border-t border-slate-200 grid grid-cols-3 gap-4 text-center text-[11px]">
                <div>
                  <div className="text-slate-500 font-medium">
                    {isCourtDoc ? 'Court Prepared by:' : 'Prepared by:'}
                  </div>
                  <div className="mt-7 font-black text-slate-900">
                    {isCourtDoc ? 'Bench Clerk / Superintendent' : 'Senior Assistant / D Section'}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {isCourtDoc ? 'Appeal Cases Section • RDO Huzurnagar' : 'RDO Office, Huzurnagar'}
                  </div>
                </div>

                <div>
                  <div className="text-slate-500 font-medium">Verified by:</div>
                  <div className="mt-7 font-black text-slate-900">
                    Divisional Administrative Officer (DAO)
                  </div>
                  <div className="text-[10px] text-slate-500">RDO Office, Huzurnagar</div>
                </div>

                <div>
                  <div className="text-slate-500 font-medium">
                    {isCourtDoc ? 'Bench Presiding Officer:' : 'Approved by:'}
                  </div>
                  <div className="mt-7 font-black text-slate-900">
                    {isCourtDoc ? 'Revenue Divisional Officer & SDM' : 'Revenue Divisional Officer (RDO)'}
                  </div>
                  <div className="text-[10px] text-slate-500">Huzurnagar Division</div>
                </div>
              </div>
            ) : (
              /* Public copy footer: signatures completely removed */
              <div className="mt-6 pt-3 border-t border-slate-200 text-center text-[10.5px] text-slate-500 font-medium bg-slate-50 p-2 rounded-lg">
                * Computer generated informational summary for public verification. (Unsigned copy)
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
};