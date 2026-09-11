import React, { useRef, useState } from 'react';
import { BhuFile } from '../../types';
import { X, Printer, Download } from 'lucide-react';
import { RDO_LOGO_BASE64 } from '../../utils/logoBase64';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface PrintSlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: BhuFile | null;
  onShowToast: (msg: string) => void;
}

export const PrintSlipModal: React.FC<PrintSlipModalProps> = ({
  isOpen,
  onClose,
  file,
  onShowToast,
}) => {
  const slipRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen || !file) return null;

  const handleDownloadPdf = async () => {
    if (!slipRef.current) return;
    setIsGenerating(true);

    try {
      const element = slipRef.current;
      const canvas = await html2canvas(element, {
        scale: 2.5,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
        scrollX: 0,
        scrollY: 0,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const margin = 10;
      const printableWidth = pageWidth - margin * 2;
      const printableHeight = (canvas.height * printableWidth) / canvas.width;

      // Ensure it stays strictly within a single page
      let finalWidth = printableWidth;
      let finalHeight = printableHeight;
      if (finalHeight > pageHeight - margin * 2) {
        const scale = (pageHeight - margin * 2) / finalHeight;
        finalHeight = pageHeight - margin * 2;
        finalWidth = finalWidth * scale;
      }

      const x = margin + (printableWidth - finalWidth) / 2;
      const y = margin;

      pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);
      pdf.save(`RDO_File_Tracking_Slip_${file.appNumber}.pdf`);
      onShowToast(`Official Slip for Application #${file.appNumber} downloaded as PDF!`);
    } catch (err: any) {
      console.error('Slip PDF error:', err);
      onShowToast('Error creating PDF slip. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    try {
      const historyRows = (file.history && file.history.length > 0)
        ? file.history.map((h) => `
            <tr>
              <td style="border: 1px solid #000000; padding: 6px 8px; text-align: center; white-space: nowrap;">${h.date || '-'}</td>
              <td style="border: 1px solid #000000; padding: 6px 8px; font-weight: 600;">${h.action || '-'}</td>
              <td style="border: 1px solid #000000; padding: 6px 8px; text-align: center;">${h.from || '-'}</td>
              <td style="border: 1px solid #000000; padding: 6px 8px; text-align: center;">${h.to || '-'}</td>
              <td style="border: 1px solid #000000; padding: 6px 8px;">${h.remarks || '-'}</td>
              <td style="border: 1px solid #000000; padding: 6px 8px; text-align: center;">${h.user || 'Staff'}</td>
            </tr>
          `).join('')
        : `
            <tr>
              <td style="border: 1px solid #000000; padding: 6px 8px; text-align: center;">${file.receivedDate || '-'}</td>
              <td style="border: 1px solid #000000; padding: 6px 8px; font-weight: 600;">File Received from MRO</td>
              <td style="border: 1px solid #000000; padding: 6px 8px; text-align: center;">MRO ${file.mandal}</td>
              <td style="border: 1px solid #000000; padding: 6px 8px; text-align: center;">D Section, RDO Office</td>
              <td style="border: 1px solid #000000; padding: 6px 8px;">Initial Receipt</td>
              <td style="border: 1px solid #000000; padding: 6px 8px; text-align: center;">Staff</td>
            </tr>
          `;

      const slipFullHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>Official Tracking Slip - ${file.appNumber}</title>
            <style>
              @page {
                size: A4 portrait;
                margin: 8mm 10mm;
              }
              * {
                box-sizing: border-box;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              body {
                margin: 0;
                padding: 0;
                background: #ffffff;
                color: #000000;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
              }
              .slip-box {
                border: 2px solid #000000;
                padding: 22px 24px;
                background-color: #ffffff;
                width: 100%;
                max-width: 720px;
                margin: 0 auto;
                page-break-inside: avoid !important;
              }
              .header-table {
                width: 100%;
                border-collapse: collapse;
                border: none;
                margin-bottom: 10px;
              }
              .header-table td {
                border: none;
                padding: 0;
                vertical-align: middle;
              }
              .emblem-img {
                width: 58px !important;
                height: 58px !important;
                object-fit: contain;
                display: block;
              }
              .title-center {
                text-align: center;
              }
              .govt-title {
                font-size: 15px;
                font-weight: 900;
                letter-spacing: 0.5px;
                text-transform: uppercase;
                margin: 0 0 2px 0;
                color: #000000;
              }
              .rdo-title {
                font-size: 12.5px;
                font-weight: 800;
                margin: 0 0 2px 0;
                color: #000000;
              }
              .sub-title {
                font-size: 10.5px;
                font-weight: 700;
                letter-spacing: 0.3px;
                text-transform: uppercase;
                margin: 0;
                color: #000000;
              }
              .slip-badge {
                border: 1.5px solid #000000;
                border-radius: 4px;
                padding: 4px 6px;
                text-align: center;
                width: 65px;
                margin-left: auto;
              }
              .divider {
                height: 1.5px;
                background-color: #000000;
                margin: 8px 0 14px 0;
              }
              table.details-table {
                width: 100%;
                border-collapse: collapse;
                border: 1.5px solid #000000;
                font-size: 11px;
                margin-bottom: 14px;
              }
              table.details-table td {
                border: 1px solid #000000;
                padding: 6.5px 10px;
                vertical-align: middle;
              }
              .label-col {
                width: 33%;
                font-weight: 700;
                color: #000000;
                background-color: #ffffff;
              }
              .val-col {
                font-weight: 500;
                color: #000000;
              }
              .section-heading {
                font-size: 11px;
                font-weight: 800;
                text-transform: uppercase;
                letter-spacing: 0.3px;
                margin: 0 0 8px 0;
                color: #000000;
              }
              table.timeline-table {
                width: 100%;
                border-collapse: collapse;
                border: 1.5px solid #000000;
                font-size: 10.5px;
                margin-bottom: 24px;
              }
              table.timeline-table th {
                border: 1px solid #000000;
                padding: 6px 8px;
                font-weight: 700;
                background-color: #ffffff;
                color: #000000;
              }
              table.timeline-table td {
                border: 1px solid #000000;
                padding: 6px 8px;
                vertical-align: middle;
                color: #000000;
              }
              .footer-row {
                display: flex;
                justify-content: space-between;
                align-items: flex-end;
                font-size: 11px;
                font-weight: 700;
                color: #000000;
                padding-top: 10px;
              }
              .sign-line {
                border-top: 1.5px solid #000000;
                width: 230px;
                margin-bottom: 4px;
              }
            </style>
          </head>
          <body>
            <div class="slip-box">
              <table class="header-table">
                <tr>
                  <td style="width: 65px;">
                    <img src="${RDO_LOGO_BASE64}" alt="Emblem" class="emblem-img" />
                  </td>
                  <td class="title-center">
                    <div class="govt-title">GOVERNMENT OF TELANGANA</div>
                    <div class="rdo-title">REVENUE DIVISIONAL OFFICE, HUZURNAGAR</div>
                    <div class="sub-title">D SECTION – OFFICIAL FILE TRACKING ACKNOWLEDGEMENT SLIP</div>
                  </td>
                  <td style="width: 65px; text-align: right;">
                    <div class="slip-badge">
                      <div style="font-size: 9.5px; font-weight: 900; letter-spacing: 0.5px;">OFFICIAL</div>
                      <div style="font-size: 8px; font-weight: 700;">SLIP</div>
                    </div>
                  </td>
                </tr>
              </table>

              <div class="divider"></div>

              <table class="details-table">
                <tbody>
                  <tr>
                    <td class="label-col">Application Number:</td>
                    <td class="val-col"><strong style="font-size: 13px;">${file.appNumber}</strong></td>
                  </tr>
                  <tr>
                    <td class="label-col">Applicant Name:</td>
                    <td class="val-col">${file.applicantName}</td>
                  </tr>
                  <tr>
                    <td class="label-col">Mandal / Revenue Village:</td>
                    <td class="val-col">${file.mandal} • ${file.village}</td>
                  </tr>
                  <tr>
                    <td class="label-col">Survey Number(s):</td>
                    <td class="val-col">${file.surveyNo}</td>
                  </tr>
                  <tr>
                    <td class="label-col">Module:</td>
                    <td class="val-col">${file.module}</td>
                  </tr>
                  <tr>
                    <td class="label-col">Received from MRO Date:</td>
                    <td class="val-col">${file.receivedDate}</td>
                  </tr>
                  <tr>
                    <td class="label-col">Current Status:</td>
                    <td class="val-col"><strong>${file.status}</strong></td>
                  </tr>
                  <tr>
                    <td class="label-col">Remarks:</td>
                    <td class="val-col">${file.remarks || 'None'}</td>
                  </tr>
                </tbody>
              </table>

              <div class="section-heading">FILE MOVEMENT &amp; ENDORSEMENT TIMELINE:</div>

              <table class="timeline-table">
                <thead>
                  <tr>
                    <th style="width: 14%; text-align: center;">Date</th>
                    <th style="width: 22%; text-align: left;">Action Taken</th>
                    <th style="width: 18%; text-align: center;">From</th>
                    <th style="width: 18%; text-align: center;">To</th>
                    <th style="width: 16%; text-align: left;">Remarks</th>
                    <th style="width: 12%; text-align: center;">Updated By</th>
                  </tr>
                </thead>
                <tbody>
                  ${historyRows}
                </tbody>
              </table>

              <div class="footer-row">
                <div>Generated by: D Section, RDO Office Huzurnagar</div>
                <div style="text-align: right;">
                  <div class="sign-line"></div>
                  <div>Signature &amp; Stamp of Competent Authority</div>
                </div>
              </div>
            </div>
            <script>
              window.onload = function() {
                window.focus();
                window.print();
                setTimeout(function() { window.close(); }, 600);
              };
            </script>
          </body>
        </html>
      `;

      const printWindow = window.open('', '_blank', 'width=850,height=950');
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(slipFullHtml);
        printWindow.document.close();
      } else {
        window.print();
      }
    } catch (err) {
      console.warn('Print error:', err);
      handleDownloadPdf();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-3 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xl max-w-3xl w-full overflow-hidden my-6">
        {/* Controls Bar */}
        <div className="bg-[#061122] text-white px-5 py-3 flex justify-between items-center border-b-2 border-amber-500">
          <div className="flex items-center gap-2">
            <span className="bg-amber-500 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded tracking-wider uppercase">
              BHU BHARATI
            </span>
            <h3 className="font-extrabold text-sm text-white">Official File Tracking Slip</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              disabled={isGenerating}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isGenerating ? 'Generating PDF...' : 'Download PDF'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm"
            >
              <Printer className="w-3.5 h-3.5 text-white" />
              <span>Print Slip</span>
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition cursor-pointer ml-1">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Slip Area (Screen preview styled exactly matching the screenshot) */}
        <div className="p-6 bg-slate-100/70 overflow-y-auto max-h-[78vh] flex justify-center">
          <div
            ref={slipRef}
            id="slipContent"
            style={{
              width: '100%',
              maxWidth: '680px',
              backgroundColor: '#ffffff',
              color: '#000000',
              border: '2px solid #000000',
              padding: '22px 24px',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
              boxSizing: 'border-box',
            }}
          >
            {/* Header Table */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
              <div style={{ width: '60px', flexShrink: 0 }}>
                <img
                  src={RDO_LOGO_BASE64}
                  alt="RDO Office Huzurnagar Logo"
                  style={{ width: '58px', height: '58px', objectFit: 'contain', display: 'block' }}
                />
              </div>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: '15px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px', color: '#000000' }}>
                  GOVERNMENT OF TELANGANA
                </div>
                <div style={{ fontSize: '12.5px', fontWeight: 800, marginBottom: '2px', color: '#000000' }}>
                  REVENUE DIVISIONAL OFFICE, HUZURNAGAR
                </div>
                <div style={{ fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3px', color: '#000000' }}>
                  D SECTION – OFFICIAL FILE TRACKING ACKNOWLEDGEMENT SLIP
                </div>
              </div>
              <div style={{ width: '60px', flexShrink: 0, textAlign: 'right' }}>
                <div
                  style={{
                    border: '1.5px solid #000000',
                    borderRadius: '4px',
                    padding: '4px 6px',
                    textAlign: 'center',
                    width: '65px',
                    marginLeft: 'auto',
                  }}
                >
                  <div style={{ fontSize: '9.5px', fontWeight: 900, letterSpacing: '0.5px' }}>OFFICIAL</div>
                  <div style={{ fontSize: '8px', fontWeight: 700 }}>SLIP</div>
                </div>
              </div>
            </div>

            {/* Horizontal Line */}
            <div style={{ height: '1.5px', backgroundColor: '#000000', margin: '10px 0 14px 0' }} />

            {/* Details Table */}
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                border: '1.5px solid #000000',
                fontSize: '11px',
                marginBottom: '14px',
              }}
            >
              <tbody>
                <tr>
                  <td style={{ width: '33%', fontWeight: 700, padding: '6.5px 10px', border: '1px solid #000000', backgroundColor: '#ffffff' }}>
                    Application Number:
                  </td>
                  <td style={{ padding: '6.5px 10px', border: '1px solid #000000', fontWeight: 800, fontSize: '13px' }}>
                    {file.appNumber}
                  </td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 700, padding: '6.5px 10px', border: '1px solid #000000', backgroundColor: '#ffffff' }}>
                    Applicant Name:
                  </td>
                  <td style={{ padding: '6.5px 10px', border: '1px solid #000000' }}>{file.applicantName}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 700, padding: '6.5px 10px', border: '1px solid #000000', backgroundColor: '#ffffff' }}>
                    Mandal / Revenue Village:
                  </td>
                  <td style={{ padding: '6.5px 10px', border: '1px solid #000000' }}>
                    {file.mandal} • {file.village}
                  </td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 700, padding: '6.5px 10px', border: '1px solid #000000', backgroundColor: '#ffffff' }}>
                    Survey Number(s):
                  </td>
                  <td style={{ padding: '6.5px 10px', border: '1px solid #000000' }}>{file.surveyNo}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 700, padding: '6.5px 10px', border: '1px solid #000000', backgroundColor: '#ffffff' }}>
                    Module:
                  </td>
                  <td style={{ padding: '6.5px 10px', border: '1px solid #000000' }}>{file.module}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 700, padding: '6.5px 10px', border: '1px solid #000000', backgroundColor: '#ffffff' }}>
                    Received from MRO Date:
                  </td>
                  <td style={{ padding: '6.5px 10px', border: '1px solid #000000' }}>{file.receivedDate}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 700, padding: '6.5px 10px', border: '1px solid #000000', backgroundColor: '#ffffff' }}>
                    Current Status:
                  </td>
                  <td style={{ padding: '6.5px 10px', border: '1px solid #000000', fontWeight: 800 }}>{file.status}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 700, padding: '6.5px 10px', border: '1px solid #000000', backgroundColor: '#ffffff' }}>
                    Remarks:
                  </td>
                  <td style={{ padding: '6.5px 10px', border: '1px solid #000000' }}>{file.remarks || 'None'}</td>
                </tr>
              </tbody>
            </table>

            {/* Timeline Heading */}
            <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.3px', margin: '0 0 8px 0', color: '#000000' }}>
              FILE MOVEMENT &amp; ENDORSEMENT TIMELINE:
            </div>

            {/* Timeline Table */}
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                border: '1.5px solid #000000',
                fontSize: '10.5px',
                marginBottom: '26px',
              }}
            >
              <thead>
                <tr>
                  <th style={{ width: '14%', border: '1px solid #000000', padding: '6px 8px', textAlign: 'center', backgroundColor: '#ffffff', fontWeight: 700 }}>
                    Date
                  </th>
                  <th style={{ width: '22%', border: '1px solid #000000', padding: '6px 8px', textAlign: 'left', backgroundColor: '#ffffff', fontWeight: 700 }}>
                    Action Taken
                  </th>
                  <th style={{ width: '18%', border: '1px solid #000000', padding: '6px 8px', textAlign: 'center', backgroundColor: '#ffffff', fontWeight: 700 }}>
                    From
                  </th>
                  <th style={{ width: '18%', border: '1px solid #000000', padding: '6px 8px', textAlign: 'center', backgroundColor: '#ffffff', fontWeight: 700 }}>
                    To
                  </th>
                  <th style={{ width: '16%', border: '1px solid #000000', padding: '6px 8px', textAlign: 'left', backgroundColor: '#ffffff', fontWeight: 700 }}>
                    Remarks
                  </th>
                  <th style={{ width: '12%', border: '1px solid #000000', padding: '6px 8px', textAlign: 'center', backgroundColor: '#ffffff', fontWeight: 700 }}>
                    Updated By
                  </th>
                </tr>
              </thead>
              <tbody>
                {(file.history && file.history.length > 0) ? (
                  file.history.map((h, i) => (
                    <tr key={i}>
                      <td style={{ border: '1px solid #000000', padding: '6px 8px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        {h.date}
                      </td>
                      <td style={{ border: '1px solid #000000', padding: '6px 8px', fontWeight: 600 }}>{h.action}</td>
                      <td style={{ border: '1px solid #000000', padding: '6px 8px', textAlign: 'center' }}>{h.from}</td>
                      <td style={{ border: '1px solid #000000', padding: '6px 8px', textAlign: 'center' }}>{h.to}</td>
                      <td style={{ border: '1px solid #000000', padding: '6px 8px' }}>{h.remarks || '-'}</td>
                      <td style={{ border: '1px solid #000000', padding: '6px 8px', textAlign: 'center' }}>{h.user || 'Staff'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td style={{ border: '1px solid #000000', padding: '6px 8px', textAlign: 'center' }}>{file.receivedDate}</td>
                    <td style={{ border: '1px solid #000000', padding: '6px 8px', fontWeight: 600 }}>File Received from MRO</td>
                    <td style={{ border: '1px solid #000000', padding: '6px 8px', textAlign: 'center' }}>MRO {file.mandal}</td>
                    <td style={{ border: '1px solid #000000', padding: '6px 8px', textAlign: 'center' }}>D Section, RDO Office</td>
                    <td style={{ border: '1px solid #000000', padding: '6px 8px' }}>Initial Receipt</td>
                    <td style={{ border: '1px solid #000000', padding: '6px 8px', textAlign: 'center' }}>Staff</td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Footer / Signatures */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                fontSize: '11px',
                fontWeight: 700,
                color: '#000000',
                paddingTop: '6px',
              }}
            >
              <div>Generated by: D Section, RDO Office Huzurnagar</div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ borderTop: '1.5px solid #000000', width: '230px', marginBottom: '4px' }} />
                <div>Signature &amp; Stamp of Competent Authority</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

