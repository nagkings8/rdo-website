import React, { useRef, useState } from 'react';
import { PrintReportPayload, generatePrintHtml } from '../../utils/printReport';
import { RDO_LOGO_BASE64 } from '../../utils/logoBase64';
import { X, Printer, ExternalLink, Download, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface PrintReportModalProps {
  isOpen: boolean;
  data: PrintReportPayload | null;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

export const PrintReportModal: React.FC<PrintReportModalProps> = ({
  isOpen,
  data,
  onClose,
  onShowToast,
}) => {
  const previewRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [fitMode, setFitMode] = useState<'fit' | 'break'>('fit');

  if (!isOpen || !data) return null;

  const {
    title,
    subtitle = 'Revenue Divisional Office, Huzurnagar • Suryapet District',
    period,
    landscape = false,
    tableHtml,
    fileName = 'Official_Report',
  } = data;

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

  const sanitizedFileName = (fileName || title || 'RDO_Report')
    .replace(/[^a-zA-Z0-9_-]/g, '_');

  const isCourtDoc =
    title.toLowerCase().includes('court') ||
    title.toLowerCase().includes('appeal') ||
    title.toLowerCase().includes('cause list') ||
    title.toLowerCase().includes('case') ||
    (subtitle && subtitle.toLowerCase().includes('court'));

  // 1. Direct Isolated Print (Guaranteed to apply @page orientation and no iframe sandbox clipping)
  const handleBrowserPrint = () => {
    try {
      const fullHtml = generatePrintHtml(data, true);
      let printFrame = document.getElementById('print-service-frame') as HTMLIFrameElement;
      if (!printFrame) {
        printFrame = document.createElement('iframe');
        printFrame.id = 'print-service-frame';
        printFrame.style.position = 'fixed';
        printFrame.style.right = '0';
        printFrame.style.bottom = '0';
        printFrame.style.width = '0';
        printFrame.style.height = '0';
        printFrame.style.border = '0';
        printFrame.style.visibility = 'hidden';
        document.body.appendChild(printFrame);
      }

      const frameDoc = printFrame.contentDocument || printFrame.contentWindow?.document;
      if (frameDoc) {
        frameDoc.open();
        frameDoc.write(fullHtml);
        frameDoc.close();
        setTimeout(() => {
          printFrame.contentWindow?.focus();
          printFrame.contentWindow?.print();
        }, 250);
        return;
      }
      // Fallback
      window.print();
    } catch (err) {
      console.warn('Direct print error:', err);
      handleOpenInNewWindow();
    }
  };

  // 2. Open in New Tab / Window (Guaranteed to work even if iframe sandbox blocks modals)
  const handleOpenInNewWindow = () => {
    const fullHtml = generatePrintHtml(data, true);
    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    const win = window.open(blobUrl, '_blank');
    if (win) {
      win.focus();
      onShowToast('Opened official printable report in new window with print dialog.');
    } else {
      handleDownloadHtml();
      onShowToast('Popup blocked. Downloading official HTML report for printing.');
    }
  };

  // 3. Save as PDF via html2canvas & jsPDF with Row-Aware Multi-Page Breakup & Fit-to-Paper
  const handleDownloadPdf = async () => {
    if (!previewRef.current) return;
    setIsGeneratingPdf(true);

    try {
      const element = previewRef.current;
      const scrollParent = element.parentElement;
      const originalScrollTop = scrollParent ? scrollParent.scrollTop : 0;
      if (scrollParent) {
        scrollParent.scrollTop = 0;
      }

      // Temporarily lock element to exact standard A4 width so html2canvas renders true paper layout
      // Standard A4 at 96 DPI: Portrait is 794px, Landscape is 1123px
      const targetWidth = landscape ? 1123 : 794;
      const prevInlineWidth = element.style.width;
      const prevInlineMaxWidth = element.style.maxWidth;
      const prevInlineMinWidth = element.style.minWidth;
      const prevInlineBoxSizing = element.style.boxSizing;

      element.style.width = `${targetWidth}px`;
      element.style.maxWidth = `${targetWidth}px`;
      element.style.minWidth = `${targetWidth}px`;
      element.style.boxSizing = 'border-box';

      // Allow DOM to reflow at standard A4 width
      await new Promise((r) => setTimeout(r, 60));

      const captureHeight = element.scrollHeight;

      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
        width: targetWidth,
        height: captureHeight,
        windowWidth: targetWidth + 40,
        windowHeight: captureHeight + 80,
        scrollY: 0,
        scrollX: 0,
        x: 0,
        y: 0,
      });

      // Restore original element styling immediately
      element.style.width = prevInlineWidth;
      element.style.maxWidth = prevInlineMaxWidth;
      element.style.minWidth = prevInlineMinWidth;
      element.style.boxSizing = prevInlineBoxSizing;

      if (scrollParent) {
        scrollParent.scrollTop = originalScrollTop;
      }

      const pdf = new jsPDF(landscape ? 'l' : 'p', 'mm', 'a4');
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      const margin = landscape ? 7 : 8;
      const printableWidth = pageWidth - margin * 2;
      const printableHeight = pageHeight - margin * 2;
      // Reserve 6mm at the bottom for the official footer
      const effectivePrintableHeight = printableHeight - 6;

      const pxPerMm = canvas.width / printableWidth;
      const maxPageHeightCanvas = Math.floor(effectivePrintableHeight * pxPerMm);
      const canvasScale = canvas.width / targetWidth;

      // Extract DOM bounds for row-aware page splitting
      const elRect = element.getBoundingClientRect();
      const tableEl = element.querySelector('table');
      const theadEl = tableEl ? tableEl.querySelector('thead') : null;
      const tbodyRowEls: HTMLTableRowElement[] = tableEl ? Array.from(tableEl.querySelectorAll<HTMLTableRowElement>('tbody tr')) : [];
      const footerBlockEl = element.querySelector('.break-inside-avoid');

      const getBounds = (domNode: Element | null) => {
        if (!domNode) return null;
        const r = domNode.getBoundingClientRect();
        return {
          top: Math.round((r.top - elRect.top) * canvasScale),
          bottom: Math.round((r.bottom - elRect.top) * canvasScale),
          height: Math.round(r.height * canvasScale),
        };
      };

      const theadBounds = getBounds(theadEl);
      const footerBounds = getBounds(footerBlockEl);
      const rowBounds = tbodyRowEls.map((tr: Element) => getBounds(tr)!);

      // Check whether to fit on a single page:
      // If fitMode === 'fit', or if document comfortably fits within 1.35x page height or has <= 8 rows
      const canFitSingle = canvas.height <= maxPageHeightCanvas * 1.35 || tbodyRowEls.length <= 8;
      const shouldFitSingle = fitMode === 'fit' ? canFitSingle : false;

      if (shouldFitSingle) {
        let renderWidth = printableWidth;
        let renderHeight = printableWidth * (canvas.height / canvas.width);

        if (renderHeight > effectivePrintableHeight) {
          const scale = effectivePrintableHeight / renderHeight;
          renderHeight = effectivePrintableHeight;
          renderWidth = renderWidth * scale;
        }

        const renderX = margin + (printableWidth - renderWidth) / 2;
        const renderY = margin;

        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', renderX, renderY, renderWidth, renderHeight);

        pdf.setFontSize(8);
        pdf.setTextColor(100, 116, 139);
        pdf.text(
          'Page 1 of 1 • Court of Revenue Divisional Officer, Huzurnagar',
          pageWidth / 2,
          pageHeight - 3.5,
          { align: 'center' }
        );

        pdf.save(`${sanitizedFileName}_${currentDate.replace(/\//g, '-')}.pdf`);
        onShowToast('Official Single-Page PDF (Fit to Paper) downloaded successfully.');
        return;
      }

      // ==========================================
      // ROW-AWARE MULTI-PAGE BREAKUP ENGINE
      // Guarantees:
      // 1. NO row is ever sliced in half across pages
      // 2. Table column headers (thead) repeat on page 2+
      // 3. Official Signatures block is protected on last page
      // ==========================================
      if (rowBounds.length > 0) {
        interface PagePlan {
          isFirstPage: boolean;
          startRowIdx: number;
          endRowIdx: number;
          hasFooter: boolean;
        }

        const pagePlans: PagePlan[] = [];

        // Plan Page 1:
        // Starts at y = 0, includes Header + thead + as many complete rows as fit
        let p1EndRow = -1;
        for (let i = 0; i < rowBounds.length; i++) {
          const rowBottom = rowBounds[i].bottom;
          if (i === rowBounds.length - 1 && footerBounds && footerBounds.bottom <= maxPageHeightCanvas) {
            p1EndRow = i;
            break;
          }
          if (rowBottom <= maxPageHeightCanvas) {
            p1EndRow = i;
          } else {
            break;
          }
        }

        if (p1EndRow === -1) {
          p1EndRow = 0;
        }

        const p1HasFooter = (p1EndRow === rowBounds.length - 1) && (!footerBounds || footerBounds.bottom <= maxPageHeightCanvas);

        pagePlans.push({
          isFirstPage: true,
          startRowIdx: 0,
          endRowIdx: p1EndRow,
          hasFooter: p1HasFooter,
        });

        // Plan subsequent pages:
        let nextStartRow = p1EndRow + 1;
        const theadHeight = theadBounds ? theadBounds.height : 0;
        const availHeightOtherPages = maxPageHeightCanvas - theadHeight;

        while (nextStartRow < rowBounds.length) {
          const pageRowStartCanvasY = rowBounds[nextStartRow].top;
          let pageEndRow = nextStartRow;
          let pageHasFooter = false;

          for (let j = nextStartRow; j < rowBounds.length; j++) {
            const rowsHeight = rowBounds[j].bottom - pageRowStartCanvasY;
            if (j === rowBounds.length - 1) {
              const withFooter = rowsHeight + (footerBounds ? footerBounds.height : 0);
              if (withFooter <= availHeightOtherPages) {
                pageEndRow = j;
                pageHasFooter = true;
                break;
              }
            }

            if (rowsHeight <= availHeightOtherPages) {
              pageEndRow = j;
            } else {
              if (j === nextStartRow) {
                pageEndRow = j;
              }
              break;
            }
          }

          pagePlans.push({
            isFirstPage: false,
            startRowIdx: nextStartRow,
            endRowIdx: pageEndRow,
            hasFooter: pageHasFooter,
          });

          nextStartRow = pageEndRow + 1;
        }

        // What if all rows are done, but footer didn't fit on the last page?
        const lastPlan = pagePlans[pagePlans.length - 1];
        if (!lastPlan.hasFooter && footerBounds) {
          pagePlans.push({
            isFirstPage: false,
            startRowIdx: -1,
            endRowIdx: -1,
            hasFooter: true,
          });
        }

        const totalPages = pagePlans.length;

        // Render each page plan into the PDF
        for (let pIdx = 0; pIdx < totalPages; pIdx++) {
          if (pIdx > 0) {
            pdf.addPage();
          }

          const plan = pagePlans[pIdx];

          if (plan.isFirstPage) {
            // Page 1: slice from y = 0 to end of row (or footer)
            const sliceBottom = plan.hasFooter && footerBounds 
              ? footerBounds.bottom 
              : rowBounds[plan.endRowIdx].bottom;
            const sliceCanvas = document.createElement('canvas');
            sliceCanvas.width = canvas.width;
            sliceCanvas.height = sliceBottom;
            const ctx = sliceCanvas.getContext('2d');
            if (ctx) {
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(0, 0, sliceCanvas.width, sliceBottom);
              ctx.drawImage(canvas, 0, 0, canvas.width, sliceBottom, 0, 0, canvas.width, sliceBottom);

              const sliceData = sliceCanvas.toDataURL('image/png');
              const slicePdfHeight = (sliceBottom * printableWidth) / canvas.width;
              pdf.addImage(sliceData, 'PNG', margin, margin, printableWidth, slicePdfHeight);
            }
          } else if (plan.startRowIdx >= 0) {
            // Page 2+: repeats thead at top, then draws rows, then footer if present
            const rowsTop = rowBounds[plan.startRowIdx].top;
            const rowsBottom = rowBounds[plan.endRowIdx].bottom;
            const rowsHeight = rowsBottom - rowsTop;
            const footerHeight = (plan.hasFooter && footerBounds) ? footerBounds.height : 0;
            const totalSliceHeight = theadHeight + rowsHeight + footerHeight;

            const sliceCanvas = document.createElement('canvas');
            sliceCanvas.width = canvas.width;
            sliceCanvas.height = totalSliceHeight;
            const ctx = sliceCanvas.getContext('2d');
            if (ctx) {
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(0, 0, sliceCanvas.width, totalSliceHeight);

              // 1. Draw repeated thead
              if (theadBounds) {
                ctx.drawImage(canvas, 0, theadBounds.top, canvas.width, theadHeight, 0, 0, canvas.width, theadHeight);
              }

              // 2. Draw clean rows
              ctx.drawImage(canvas, 0, rowsTop, canvas.width, rowsHeight, 0, theadHeight, canvas.width, rowsHeight);

              // 3. Draw footer if present
              if (plan.hasFooter && footerBounds) {
                ctx.drawImage(canvas, 0, footerBounds.top, canvas.width, footerHeight, 0, theadHeight + rowsHeight, canvas.width, footerHeight);
              }

              const sliceData = sliceCanvas.toDataURL('image/png');
              const slicePdfHeight = (totalSliceHeight * printableWidth) / canvas.width;
              pdf.addImage(sliceData, 'PNG', margin, margin, printableWidth, slicePdfHeight);
            }
          } else {
            // Standalone footer page
            if (footerBounds) {
              const sliceCanvas = document.createElement('canvas');
              sliceCanvas.width = canvas.width;
              sliceCanvas.height = footerBounds.height;
              const ctx = sliceCanvas.getContext('2d');
              if (ctx) {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, sliceCanvas.width, footerBounds.height);
                ctx.drawImage(canvas, 0, footerBounds.top, canvas.width, footerBounds.height, 0, 0, canvas.width, footerBounds.height);

                const sliceData = sliceCanvas.toDataURL('image/png');
                const slicePdfHeight = (footerBounds.height * printableWidth) / canvas.width;
                pdf.addImage(sliceData, 'PNG', margin, margin, printableWidth, slicePdfHeight);
              }
            }
          }

          // Page Numbering Footer
          pdf.setFontSize(8);
          pdf.setTextColor(100, 116, 139);
          pdf.text(
            `Page ${pIdx + 1} of ${totalPages} • Court of Revenue Divisional Officer, Huzurnagar`,
            pageWidth / 2,
            pageHeight - 3.5,
            { align: 'center' }
          );
        }

        pdf.save(`${sanitizedFileName}_${currentDate.replace(/\//g, '-')}.pdf`);
        onShowToast(`Official PDF (${totalPages} pages with clean row breaks) downloaded successfully.`);
        return;
      }

      // Fallback for non-table documents
      const totalPages = Math.ceil(canvas.height / maxPageHeightCanvas);
      for (let pageNum = 0; pageNum < totalPages; pageNum++) {
        if (pageNum > 0) pdf.addPage();
        const sourceY = pageNum * maxPageHeightCanvas;
        const currentSliceHeightPx = Math.min(maxPageHeightCanvas, canvas.height - sourceY);
        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = currentSliceHeightPx;
        const ctx = sliceCanvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, sliceCanvas.width, currentSliceHeightPx);
          ctx.drawImage(canvas, 0, sourceY, canvas.width, currentSliceHeightPx, 0, 0, canvas.width, currentSliceHeightPx);
          const sliceData = sliceCanvas.toDataURL('image/png');
          const slicePdfHeight = (currentSliceHeightPx * printableWidth) / canvas.width;
          pdf.addImage(sliceData, 'PNG', margin, margin, printableWidth, slicePdfHeight);
          pdf.setFontSize(8);
          pdf.setTextColor(100, 116, 139);
          pdf.text(
            `Page ${pageNum + 1} of ${totalPages} • Court of Revenue Divisional Officer, Huzurnagar`,
            pageWidth / 2,
            pageHeight - 3.5,
            { align: 'center' }
          );
        }
      }

      pdf.save(`${sanitizedFileName}_${currentDate.replace(/\//g, '-')}.pdf`);
      onShowToast(`Official PDF (${totalPages} pages) downloaded successfully.`);
    } catch (err) {
      console.error('PDF generation error:', err);
      onShowToast('Could not generate PDF directly; opening printable window.');
      handleOpenInNewWindow();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // 4. Download Standalone HTML file
  const handleDownloadHtml = () => {
    const fullHtml = generatePrintHtml(data, false);
    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sanitizedFileName}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onShowToast('Printable HTML file downloaded.');
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-slate-100 border border-slate-300 rounded-xl shadow-2xl max-w-6xl w-full flex flex-col max-h-[94vh] overflow-hidden my-auto print:max-w-none print:max-h-none print:border-none print:shadow-none print:bg-white print:rounded-none">
        
        {/* Modal Top Control Bar (Hidden on actual print) */}
        <div className="bg-[#061122] text-white px-4 py-3 flex flex-wrap justify-between items-center gap-3 border-b-2 border-amber-500 shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <span className="bg-amber-500 text-slate-950 text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-wider">
              PRINT &amp; EXPORT PREVIEW
            </span>
            <h3 className="font-bold text-sm text-white truncate max-w-md">
              {title}
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Primary Action: Direct Download PDF */}
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-md transition cursor-pointer disabled:opacity-50"
              title="Download official PDF file directly to device"
            >
              <Download className="w-4 h-4 text-emerald-100" />
              <span>{isGeneratingPdf ? 'Generating PDF...' : 'Download Official PDF'}</span>
            </button>

            {/* Print directly */}
            <button
              onClick={handleBrowserPrint}
              className="bg-slate-700 hover:bg-slate-600 text-slate-100 font-semibold text-xs px-3 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              title="Print directly using printer / browser dialog"
            >
              <Printer className="w-4 h-4 text-slate-300" />
              <span>Print</span>
            </button>

            {/* Open in New Window Print */}
            <button
              onClick={handleOpenInNewWindow}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs px-3 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              title="Open standalone document in new window"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-300" />
              <span className="hidden sm:inline">Open in Tab</span>
            </button>

            {/* Standalone HTML File */}
            <button
              onClick={handleDownloadHtml}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-3 py-2 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
              title="Download standalone HTML file"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download HTML</span>
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer ml-1"
              title="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Informative Guidance Banner & Fit Controls */}
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs text-amber-900 shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Note:</strong> If print dialog is blocked, click <strong>"Open in New Tab to Print"</strong> or <strong>"Save as PDF"</strong>.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-700">PDF Layout:</span>
            <div className="inline-flex rounded-md shadow-xs bg-amber-200/70 p-0.5 border border-amber-300">
              <button
                type="button"
                onClick={() => setFitMode('fit')}
                className={`px-2.5 py-1 text-[11px] font-extrabold rounded transition cursor-pointer ${
                  fitMode === 'fit'
                    ? 'bg-[#0f3b63] text-white shadow-xs'
                    : 'text-slate-800 hover:bg-amber-100'
                }`}
                title="Automatically fit document to single A4 paper (no cut, no extra page)"
              >
                Fit to 1 Page
              </button>
              <button
                type="button"
                onClick={() => setFitMode('break')}
                className={`px-2.5 py-1 text-[11px] font-extrabold rounded transition cursor-pointer ${
                  fitMode === 'break'
                    ? 'bg-[#0f3b63] text-white shadow-xs'
                    : 'text-slate-800 hover:bg-amber-100'
                }`}
                title="Clean multi-page breakup: slices cleanly at row borders and repeats column headers (no row is ever cut)"
              >
                Multi-Page (Page Breakup)
              </button>
            </div>

            <span className="text-[11px] font-semibold text-slate-500 hidden md:inline ml-1">
              A4 {landscape ? 'Landscape' : 'Portrait'}
            </span>
          </div>
        </div>

        {/* Scrollable Printable Document Container */}
        <div className="overflow-y-auto p-3 sm:p-5 flex justify-center bg-slate-200/80 print:p-0 print:bg-white print:overflow-visible">
          {/* Exact Paper Document Sheet */}
          <div
            ref={previewRef}
            className={`bg-white border border-slate-300 shadow-md ${
              landscape ? 'p-4 sm:p-6 w-full max-w-[1280px] min-w-[900px]' : 'p-5 sm:p-8 w-full max-w-[794px] min-w-[550px]'
            } rounded-sm print:shadow-none print:border-none print:p-0 print:max-w-none`}
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
              color: '#0f172a',
            }}
          >
            {/* Government Letterhead Header */}
            <div className="border-b-2 border-[#0f3b63] pb-2.5 mb-3">
              <div className="flex items-center justify-between gap-3 mb-2">
                <img
                  src={RDO_LOGO_BASE64}
                  alt="RDO Huzurnagar Logo"
                  className={`object-contain shrink-0 ${landscape ? 'w-14 h-14' : 'w-16 h-16'}`}
                />
                <div className="text-center flex-1">
                  <div className={`font-extrabold text-[#0f3b63] uppercase tracking-wider mb-0.5 ${landscape ? 'text-xs sm:text-sm' : 'text-xs sm:text-sm'}`}>
                    GOVERNMENT OF TELANGANA • REVENUE DEPARTMENT
                  </div>
                  <div className={`font-black text-slate-900 mb-1 ${landscape ? 'text-sm sm:text-base' : 'text-sm sm:text-base'}`}>
                    {subtitle}
                  </div>
                  <div className={`inline-block bg-[#134674] text-white font-extrabold rounded tracking-wide mt-0.5 ${landscape ? 'text-xs px-3.5 py-1' : 'text-xs sm:text-sm px-4 py-1'}`}>
                    {title}
                  </div>
                </div>
                <div className={`shrink-0 text-center font-extrabold text-[#0f3b63] border-2 border-[#0f3b63] rounded px-2 py-1 leading-tight ${landscape ? 'w-14 text-[8px]' : 'w-16 text-[9.5px]'}`}>
                  OFFICIAL<br/>COPY
                </div>
              </div>
              <div className={`flex justify-between items-center text-slate-600 font-semibold mt-2 px-1 border-t border-slate-200 pt-1 ${landscape ? 'text-[10px] sm:text-xs' : 'text-[11px] sm:text-xs'}`}>
                <span>District: Suryapet | Division: Huzurnagar</span>
                <span>
                  {period ? `Period / As on: ${period} | ` : ''}
                  Printed on: {currentDate} {currentTime}
                </span>
              </div>
            </div>

            {/* Document Table Content */}
            <div
              className="overflow-x-auto print:overflow-visible mb-4"
              dangerouslySetInnerHTML={{ __html: tableHtml }}
            />

            {/* Official Signatures Block */}
            <div className={`pt-3.5 border-t border-slate-200 flex justify-between font-bold text-slate-800 break-inside-avoid ${landscape ? 'mt-4 text-xs' : 'mt-4 text-xs'}`}>
              <div className="text-center">
                <div className="text-slate-500 font-normal text-[11px]">{isCourtDoc ? 'Court Prepared by:' : 'Prepared by:'}</div>
                <div className="mt-5 text-slate-900 font-extrabold text-xs">
                  {isCourtDoc ? 'Bench Clerk / Superintendent' : 'Senior Assistant / D Section'}
                </div>
                <div className="text-[10px] text-slate-500">
                  {isCourtDoc ? 'Appeal Cases Section • RDO Huzurnagar' : 'RDO Office, Huzurnagar'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-slate-500 font-normal text-[11px]">Verified by:</div>
                <div className="mt-5 text-slate-900 font-extrabold text-xs">Divisional Administrative Officer (DAO)</div>
                <div className="text-[10px] text-slate-500">RDO Office, Huzurnagar</div>
              </div>
              <div className="text-center">
                <div className="text-slate-500 font-normal text-[11px]">{isCourtDoc ? 'Bench Presiding Officer:' : 'Approved by:'}</div>
                <div className="mt-5 text-slate-900 font-extrabold text-xs">
                  {isCourtDoc ? 'Revenue Divisional Officer & SDM' : 'Revenue Divisional Officer (RDO)'}
                </div>
                <div className="text-[10px] text-slate-500">Huzurnagar Division</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
