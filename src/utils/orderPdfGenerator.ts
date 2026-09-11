import { AppealCase } from '../types';

/**
 * Generates an official Revenue Court Final Order / Proceedings Document Data URI
 * for Court of the Revenue Divisional Officer, Huzurnagar
 * strictly complying with The Telangana Bhu Bharati (Record of Rights in Land) Act, 2025
 * (Telangana Act No. 1 of 2025) and Rules, 2025 (G.O. Ms. No. 39, Rev (LA-I) Dept, dt: 14-04-2025).
 */
export async function generateOfficialOrderPdf(appealCase: AppealCase): Promise<string> {
  // Method 1: Try using window.PDFLib for vector-perfect official court proceedings
  if (typeof window !== 'undefined' && (window as any).PDFLib) {
    try {
      const { PDFDocument, rgb, StandardFonts } = (window as any).PDFLib;
      const doc = await PDFDocument.create();

      const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);
      const regularFont = await doc.embedFont(StandardFonts.Helvetica);
      const obliqueFont = await doc.embedFont(StandardFonts.HelveticaOblique);

      const a4Width = 595.28;
      const a4Height = 841.89;

      // Color Palette
      const navy = rgb(0.06, 0.22, 0.40); // #0f3866
      const lightNavy = rgb(0.92, 0.95, 0.98);
      const gold = rgb(0.95, 0.75, 0.25);
      const darkText = rgb(0.1, 0.12, 0.15);
      const grayText = rgb(0.35, 0.40, 0.45);
      const borderGray = rgb(0.75, 0.80, 0.85);

      // ==========================================
      // PAGE 1: CASE PARTICULARS, PARTIES & GROUNDS
      // ==========================================
      const page1 = doc.addPage([a4Width, a4Height]);

      // Double Outer Border
      page1.drawRectangle({
        x: 22,
        y: 22,
        width: a4Width - 44,
        height: a4Height - 44,
        borderWidth: 1.5,
        borderColor: navy,
        color: rgb(1, 1, 1),
      });
      page1.drawRectangle({
        x: 26,
        y: 26,
        width: a4Width - 52,
        height: a4Height - 52,
        borderWidth: 0.5,
        borderColor: borderGray,
      });

      // Top Government Header Banner
      page1.drawRectangle({
        x: 27,
        y: a4Height - 96,
        width: a4Width - 54,
        height: 68,
        color: navy,
      });

      const t1 = "GOVERNMENT OF TELANGANA — REVENUE DEPARTMENT";
      const t2 = "COURT OF THE REVENUE DIVISIONAL OFFICER & SUB-DIVISIONAL MAGISTRATE";
      const t3 = "HUZURNAGAR DIVISION • SURYAPET DISTRICT";

      page1.drawText(t1, {
        x: (a4Width - boldFont.widthOfTextAtSize(t1, 9.5)) / 2,
        y: a4Height - 46,
        size: 9.5,
        font: boldFont,
        color: gold,
      });
      page1.drawText(t2, {
        x: (a4Width - boldFont.widthOfTextAtSize(t2, 11)) / 2,
        y: a4Height - 64,
        size: 11,
        font: boldFont,
        color: rgb(1, 1, 1),
      });
      page1.drawText(t3, {
        x: (a4Width - boldFont.widthOfTextAtSize(t3, 9)) / 2,
        y: a4Height - 80,
        size: 9,
        font: boldFont,
        color: rgb(0.85, 0.92, 1),
      });

      // Present Presiding Officer
      let y = a4Height - 116;
      page1.drawText("PRESENT: REVENUE DIVISIONAL OFFICER & SUB-DIVISIONAL MAGISTRATE, HUZURNAGAR", {
        x: 42,
        y,
        size: 8.5,
        font: boldFont,
        color: darkText,
      });

      // Statutory Reference Box: Telangana Bhu Bharati Act, 2025
      y -= 22;
      page1.drawRectangle({
        x: 42,
        y: y - 8,
        width: a4Width - 84,
        height: 28,
        color: lightNavy,
        borderColor: navy,
        borderWidth: 0.8,
      });

      const actTitle = "THE TELANGANA BHU BHARATI (RECORD OF RIGHTS IN LAND) ACT, 2025 (ACT NO. 1 OF 2025)";
      const ruleTitle = "Rules, 2025 (G.O. Ms. No. 39, Revenue (LA-I) Department, Dated: 14-04-2025)";
      page1.drawText(actTitle, {
        x: (a4Width - boldFont.widthOfTextAtSize(actTitle, 8.5)) / 2,
        y: y + 8,
        size: 8.5,
        font: boldFont,
        color: navy,
      });
      page1.drawText(ruleTitle, {
        x: (a4Width - regularFont.widthOfTextAtSize(ruleTitle, 7.5)) / 2,
        y: y - 3,
        size: 7.5,
        font: regularFont,
        color: darkText,
      });

      // Case Metadata Strip
      y -= 28;
      page1.drawText(`CASE NO: ${appealCase.caseNo}`, {
        x: 42,
        y,
        size: 9.5,
        font: boldFont,
        color: navy,
      });

      const dateStr = `Date of Order: ${appealCase.finalOrderDate || appealCase.hearingDate || 'N/A'}`;
      page1.drawText(dateStr, {
        x: a4Width - 42 - boldFont.widthOfTextAtSize(dateStr, 9),
        y,
        size: 9,
        font: boldFont,
        color: navy,
      });

      y -= 14;
      const statutorySection = appealCase.bhuBharatiActSection ||
        "Section 15(1) read with Rule 14 of Telangana Bhu Bharati (RoR in Land) Rules, 2025";
      page1.drawText(`STATUTORY PROVISION: ${statutorySection}`, {
        x: 42,
        y,
        size: 8.5,
        font: boldFont,
        color: rgb(0.2, 0.25, 0.3),
      });

      y -= 12;
      page1.drawText(`APPEAL CLASSIFICATION: ${appealCase.appealType}`, {
        x: 42,
        y,
        size: 8,
        font: regularFont,
        color: grayText,
      });

      if (appealCase.impugnedOrderNo) {
        y -= 12;
        page1.drawText(`IMPUGNED ORDER / PROCEEDINGS: ${appealCase.impugnedOrderNo} ${appealCase.impugnedOrderDate ? `(Dt: ${appealCase.impugnedOrderDate})` : ''} of Tahsildar, Mandal ${appealCase.mandal}`, {
          x: 42,
          y,
          size: 8,
          font: regularFont,
          color: rgb(0.5, 0.2, 0.1),
        });
      }

      // Divider
      y -= 10;
      page1.drawLine({
        start: { x: 42, y },
        end: { x: a4Width - 42, y },
        thickness: 0.8,
        color: borderGray,
      });

      // Parties Section
      y -= 16;
      page1.drawText("BETWEEN / APPELLANT(S):", {
        x: 42,
        y,
        size: 8.5,
        font: boldFont,
        color: navy,
      });

      y -= 13;
      page1.drawText(`${appealCase.appellantName}`, {
        x: 55,
        y,
        size: 9.5,
        font: boldFont,
        color: darkText,
      });

      if (appealCase.appellantAdvocate) {
        y -= 11;
        page1.drawText(`Counsel for Appellant: ${appealCase.appellantAdvocate}`, {
          x: 55,
          y,
          size: 8,
          font: obliqueFont,
          color: grayText,
        });
      }

      y -= 14;
      const vsLabel = "— VERSUS —";
      page1.drawText(vsLabel, {
        x: (a4Width - boldFont.widthOfTextAtSize(vsLabel, 8)) / 2,
        y,
        size: 8,
        font: boldFont,
        color: rgb(0.4, 0.4, 0.4),
      });

      y -= 14;
      page1.drawText("AND / RESPONDENT(S):", {
        x: 42,
        y,
        size: 8.5,
        font: boldFont,
        color: navy,
      });

      y -= 13;
      page1.drawText(`${appealCase.respondentName}`, {
        x: 55,
        y,
        size: 9.5,
        font: boldFont,
        color: darkText,
      });

      if (appealCase.respondentAdvocate) {
        y -= 11;
        page1.drawText(`Counsel for Respondent: ${appealCase.respondentAdvocate}`, {
          x: 55,
          y,
          size: 8,
          font: obliqueFont,
          color: grayText,
        });
      }

      // Divider
      y -= 12;
      page1.drawLine({
        start: { x: 42, y },
        end: { x: a4Width - 42, y },
        thickness: 0.8,
        color: borderGray,
      });

      // Land Schedule
      y -= 16;
      page1.drawText("SCHEDULE OF PROPERTY / LAND PARTICULARS:", {
        x: 42,
        y,
        size: 8.5,
        font: boldFont,
        color: navy,
      });

      y -= 13;
      const landLine1 = `District: Suryapet  |  Division: Huzurnagar  |  Mandal: ${appealCase.mandal}  |  Village: ${appealCase.village}`;
      page1.drawText(landLine1, {
        x: 55,
        y,
        size: 8.5,
        font: regularFont,
        color: darkText,
      });

      y -= 12;
      const landLine2 = `Survey / Sub-Division No: ${appealCase.surveyNo || 'N/A'}    Extent: ${appealCase.extent || 'N/A'}    Classification: Agricultural Patta Land`;
      page1.drawText(landLine2, {
        x: 55,
        y,
        size: 8.5,
        font: boldFont,
        color: darkText,
      });

      // Divider
      y -= 12;
      page1.drawLine({
        start: { x: 42, y },
        end: { x: a4Width - 42, y },
        thickness: 0.8,
        color: borderGray,
      });

      // Facts & Case History Section
      y -= 16;
      page1.drawText("BRIEF FACTS & GROUNDS OF APPEAL UNDER TELANGANA BHU BHARATI ACT, 2025:", {
        x: 42,
        y,
        size: 8.5,
        font: boldFont,
        color: navy,
      });

      const factsP1 = `1. The appellant filed the present appeal aggrieved by the impugned order of the Tahsildar, ${appealCase.mandal} in respect of land admeasuring ${appealCase.extent} in Survey No. ${appealCase.surveyNo} situated at ${appealCase.village} village.`;
      const factsP2 = `2. Upon receipt of appeal under Section 15(1) of the Act read with Rule 14 of the Telangana Bhu Bharati Rules, 2025, statutory notices in the prescribed form were duly issued to the parties concerned.`;
      const factsP3 = `3. Both parties appeared through their respective learned advocates and submitted written pleadings, relevant revenue records, and oral arguments in adherence to the principles of natural justice.`;
      const factsP4 = `4. The Tahsildar, ${appealCase.mandal} was directed to cause physical inspection through Mandal Girdawar and submit a factual verification report along with certified extract of Village Accounts under Rule 12 of the Rules, 2025.`;

      [factsP1, factsP2, factsP3, factsP4].forEach((p) => {
        y -= 13;
        // Simple wrap
        const words = p.split(' ');
        let cur = '';
        for (const w of words) {
          const test = cur ? `${cur} ${w}` : w;
          if (regularFont.widthOfTextAtSize(test, 8) > (a4Width - 95)) {
            page1.drawText(cur, { x: 50, y, size: 8, font: regularFont, color: darkText });
            y -= 10.5;
            cur = w;
          } else {
            cur = test;
          }
        }
        if (cur) {
          page1.drawText(cur, { x: 50, y, size: 8, font: regularFont, color: darkText });
        }
      });

      // Page 1 Footer
      page1.drawText("[Continued on Page 2 ...]", {
        x: a4Width - 160,
        y: 36,
        size: 8,
        font: obliqueFont,
        color: grayText,
      });
      page1.drawText("Page 1 of 2 • Court of the Revenue Divisional Officer, Huzurnagar", {
        x: 42,
        y: 36,
        size: 7.5,
        font: regularFont,
        color: grayText,
      });

      // ==========================================
      // PAGE 2: FINDINGS, OPERATIVE ORDER & DIRECTIVES
      // ==========================================
      const page2 = doc.addPage([a4Width, a4Height]);

      // Page 2 Double Border
      page2.drawRectangle({
        x: 22,
        y: 22,
        width: a4Width - 44,
        height: a4Height - 44,
        borderWidth: 1.5,
        borderColor: navy,
        color: rgb(1, 1, 1),
      });
      page2.drawRectangle({
        x: 26,
        y: 26,
        width: a4Width - 52,
        height: a4Height - 52,
        borderWidth: 0.5,
        borderColor: borderGray,
      });

      // Page 2 Header Banner
      page2.drawRectangle({
        x: 27,
        y: a4Height - 65,
        width: a4Width - 54,
        height: 38,
        color: navy,
      });
      page2.drawText("COURT OF THE REVENUE DIVISIONAL OFFICER, HUZURNAGAR — FINAL PROCEEDINGS", {
        x: 42,
        y: a4Height - 48,
        size: 8.5,
        font: boldFont,
        color: gold,
      });
      page2.drawText(`CASE NO: ${appealCase.caseNo}  •  VILLAGE: ${appealCase.village}  •  MANDAL: ${appealCase.mandal}`, {
        x: 42,
        y: a4Height - 60,
        size: 8,
        font: regularFont,
        color: rgb(0.9, 0.95, 1),
      });

      let y2 = a4Height - 88;

      // Findings Section
      page2.drawText("FINDINGS & POINTS FOR DETERMINATION:", {
        x: 42,
        y: y2,
        size: 8.5,
        font: boldFont,
        color: navy,
      });

      y2 -= 14;
      const findingsText =
        "Having carefully examined the original revenue records, village accounts, Pahani copies, report submitted by the Tahsildar, and the rival submissions made by counsels for both sides in light of the statutory provisions under the Telangana Bhu Bharati (Record of Rights in Land) Act, 2025 and Rules, 2025, this Court arrives at the following considered findings:";
      
      const fWords = findingsText.split(' ');
      let fCur = '';
      for (const w of fWords) {
        const test = fCur ? `${fCur} ${w}` : w;
        if (regularFont.widthOfTextAtSize(test, 8) > (a4Width - 95)) {
          page2.drawText(fCur, { x: 50, y: y2, size: 8, font: regularFont, color: darkText });
          y2 -= 10.5;
          fCur = w;
        } else {
          fCur = test;
        }
      }
      if (fCur) {
        page2.drawText(fCur, { x: 50, y: y2, size: 8, font: regularFont, color: darkText });
        y2 -= 10.5;
      }

      // Final Order Result Box
      y2 -= 14;
      page2.drawRectangle({
        x: 42,
        y: y2 - 6,
        width: a4Width - 84,
        height: 26,
        color: lightNavy,
        borderColor: navy,
        borderWidth: 1,
      });

      const orderHead = `FINAL ORDER & PROCEEDINGS: ${appealCase.finalOrderNo || 'DISPOSAL ORDER'}`;
      page2.drawText(orderHead, {
        x: 52,
        y: y2 + 8,
        size: 9.5,
        font: boldFont,
        color: navy,
      });

      const resText = `RESULT: ${appealCase.status.toUpperCase()}`;
      page2.drawText(resText, {
        x: a4Width - 42 - boldFont.widthOfTextAtSize(resText, 9) - 10,
        y: y2 + 8,
        size: 9,
        font: boldFont,
        color: appealCase.status.includes('Allowed')
          ? rgb(0.05, 0.5, 0.2)
          : appealCase.status.includes('Dismissed')
          ? rgb(0.7, 0.1, 0.1)
          : rgb(0.3, 0.2, 0.7),
      });

      // Operative Judgment Gist
      y2 -= 22;
      page2.drawText("OPERATIVE JUDGMENT / DISPOSAL PORTION:", {
        x: 42,
        y: y2,
        size: 8.5,
        font: boldFont,
        color: navy,
      });

      y2 -= 13;
      const operativeGist = appealCase.finalOrderSummary ||
        "In exercise of the appellate powers conferred under Section 15(1) of the Telangana Bhu Bharati (Record of Rights in Land) Act, 2025 (Act No. 1 of 2025) and Rule 14 of the Telangana Bhu Bharati (Record of Rights in Land) Rules, 2025, this Court hereby passes orders on merits and disposes of the appeal accordingly.";

      const opWords = operativeGist.split(' ');
      let opCur = '';
      for (const w of opWords) {
        const test = opCur ? `${opCur} ${w}` : w;
        if (regularFont.widthOfTextAtSize(test, 8.5) > (a4Width - 95)) {
          page2.drawText(opCur, { x: 50, y: y2, size: 8.5, font: regularFont, color: darkText });
          y2 -= 11.5;
          opCur = w;
        } else {
          opCur = test;
        }
      }
      if (opCur) {
        page2.drawText(opCur, { x: 50, y: y2, size: 8.5, font: regularFont, color: darkText });
        y2 -= 12;
      }

      // Specific Statutory Directives to Tahsildar for Bhu Bharati Portal
      y2 -= 10;
      page2.drawText("STATUTORY DIRECTIVES FOR BHU BHARATI PORTAL IMPLEMENTATION:", {
        x: 42,
        y: y2,
        size: 8.5,
        font: boldFont,
        color: rgb(0.6, 0.2, 0.05),
      });

      const d1 = "• The Tahsildar concerned is directed to carry out consequential amendments in the Bhu Bharati Portal in terms of Rule 5(6) / Rule 7(8) of the Telangana Bhu Bharati Rules, 2025.";
      const d2 = "• After effecting the changes in the Record of Rights, an updated Pattadar Pass Book-cum-Title Deed shall be issued to the entitled party under Rule 5(7) / 10(1) within thirty (30) days.";
      const d3 = "• A compliance report shall be submitted to this Court immediately upon updating the Bhu Bharati digital portal.";

      [d1, d2, d3].forEach((d) => {
        y2 -= 12;
        page2.drawText(d, { x: 50, y: y2, size: 7.5, font: regularFont, color: darkText });
      });

      if (appealCase.remarks) {
        y2 -= 13;
        page2.drawText(`Special Remarks: ${appealCase.remarks}`, {
          x: 50,
          y: y2,
          size: 7.5,
          font: obliqueFont,
          color: grayText,
        });
      }

      // Limitation clause under Bhu Bharati Act, 2025
      y2 -= 14;
      const limitationNote =
        "Note: As per Rule 14 and Section 15 of the Act, any party aggrieved by this order may prefer a Second Appeal before the District Collector within thirty (30) days from the date of communication of this order.";
      page2.drawText(limitationNote, {
        x: 42,
        y: y2,
        size: 7,
        font: obliqueFont,
        color: grayText,
      });

      // Signature and Seal Block
      const sigY = 110;
      page2.drawText("Given under my hand and the seal of this Court.", {
        x: 42,
        y: sigY + 44,
        size: 8,
        font: regularFont,
        color: grayText,
      });

      page2.drawText("REVENUE DIVISIONAL OFFICER", {
        x: a4Width - 230,
        y: sigY + 28,
        size: 9.5,
        font: boldFont,
        color: navy,
      });
      page2.drawText("& SUB-DIVISIONAL MAGISTRATE", {
        x: a4Width - 230,
        y: sigY + 16,
        size: 8.5,
        font: boldFont,
        color: navy,
      });
      page2.drawText("HUZURNAGAR, SURYAPET DISTRICT", {
        x: a4Width - 230,
        y: sigY + 4,
        size: 8,
        font: regularFont,
        color: darkText,
      });

      // Dispatch communication
      const dispY = 46;
      page2.drawText("Copy communicated to:", { x: 42, y: dispY + 22, size: 7.5, font: boldFont, color: navy });
      page2.drawText("1. The Appellant(s) & Respondent(s) concerned.", { x: 50, y: dispY + 12, size: 7, font: regularFont, color: darkText });
      page2.drawText(`2. The Tahsildar, ${appealCase.mandal} (for immediate compliance on Bhu Bharati Portal).`, { x: 50, y: dispY + 3, size: 7, font: regularFont, color: darkText });
      page2.drawText("3. The Joint Sub-Registrar, Huzurnagar / File & Stock Copy.", { x: 50, y: dispY - 6, size: 7, font: regularFont, color: darkText });

      page2.drawText("Page 2 of 2 • Certified Official Order Copy", {
        x: a4Width - 220,
        y: 28,
        size: 7,
        font: regularFont,
        color: grayText,
      });

      return await doc.saveAsBase64({ dataUri: true });
    } catch (err) {
      console.warn("PDFLib multi-page generation failed, using jsPDF fallback:", err);
    }
  }

  // Method 2: Fallback via jsPDF
  if (typeof window !== 'undefined' && (window as any).jspdf) {
    try {
      const { jsPDF } = (window as any).jspdf;
      const pdf = new jsPDF('p', 'mm', 'a4');
      const w = pdf.internal.pageSize.getWidth();

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(15, 56, 102);
      pdf.text("GOVERNMENT OF TELANGANA — REVENUE DEPARTMENT", w / 2, 18, { align: 'center' });
      pdf.setFontSize(12);
      pdf.text("COURT OF THE REVENUE DIVISIONAL OFFICER, HUZURNAGAR", w / 2, 24, { align: 'center' });
      
      pdf.setFontSize(8.5);
      pdf.setTextColor(60, 60, 60);
      pdf.text("THE TELANGANA BHU BHARATI (RECORD OF RIGHTS IN LAND) ACT, 2025 (ACT NO. 1 OF 2025)", w / 2, 30, { align: 'center' });
      pdf.text("Rules, 2025 (G.O. Ms. No. 39, Rev (LA-I) Dept, dt: 14-04-2025)", w / 2, 35, { align: 'center' });

      pdf.setLineWidth(0.4);
      pdf.setDrawColor(15, 56, 102);
      pdf.line(14, 38, w - 14, 38);

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9.5);
      pdf.text(`CASE NO: ${appealCase.caseNo}`, 14, 45);
      pdf.text(`Date: ${appealCase.finalOrderDate || appealCase.hearingDate || 'N/A'}`, w - 14, 45, { align: 'right' });

      pdf.setFontSize(8.5);
      pdf.setTextColor(40, 40, 40);
      pdf.text(`Appeal Classification: ${appealCase.appealType}`, 14, 51);
      if (appealCase.impugnedOrderNo) {
        pdf.text(`Impugned Order: ${appealCase.impugnedOrderNo} of Tahsildar, ${appealCase.mandal}`, 14, 57);
      }

      pdf.text(`Appellant: ${appealCase.appellantName}  ${appealCase.appellantAdvocate ? `(Adv: ${appealCase.appellantAdvocate})` : ''}`, 14, 65);
      pdf.text(`Respondent: ${appealCase.respondentName}  ${appealCase.respondentAdvocate ? `(Adv: ${appealCase.respondentAdvocate})` : ''}`, 14, 71);
      pdf.text(`Land Details: Mandal: ${appealCase.mandal}, Village: ${appealCase.village}, Sy.No: ${appealCase.surveyNo}, Extent: ${appealCase.extent}`, 14, 77);

      pdf.line(14, 82, w - 14, 82);

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor(15, 56, 102);
      pdf.text(`FINAL ORDER: ${appealCase.finalOrderNo || 'DISPOSAL ORDER'}`, 14, 90);
      pdf.text(`Result: ${appealCase.status}`, 14, 96);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8.5);
      pdf.setTextColor(20, 20, 20);
      const splitSummary = pdf.splitTextToSize(appealCase.finalOrderSummary || 'Appeal disposed as per law under Telangana Bhu Bharati Act, 2025.', w - 28);
      pdf.text(splitSummary, 14, 104);

      const ySign = 160;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.text("REVENUE DIVISIONAL OFFICER & SUB-DIVISIONAL MAGISTRATE", w - 14, ySign, { align: 'right' });
      pdf.setFont('helvetica', 'normal');
      pdf.text("HUZURNAGAR, SURYAPET DISTRICT", w - 14, ySign + 5, { align: 'right' });

      return pdf.output('datauristring');
    } catch (e) {
      console.error("jsPDF generation error:", e);
    }
  }

  // Method 3: Clean data URI fallback
  return `data:text/plain;charset=utf-8,${encodeURIComponent(
    `COURT OF THE REVENUE DIVISIONAL OFFICER, HUZURNAGAR\nTELANGANA BHU BHARATI (RECORD OF RIGHTS IN LAND) ACT, 2025\nCASE NO: ${appealCase.caseNo}\nStatus: ${appealCase.status}\nOrder No: ${appealCase.finalOrderNo || 'N/A'}\nDate: ${appealCase.finalOrderDate || 'N/A'}\n\nSummary:\n${appealCase.finalOrderSummary || 'N/A'}`
  )}`;
}
