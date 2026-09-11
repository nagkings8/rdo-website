import { BhuFile, InwardTapal, OutwardDespatch, StaffUser, AdminProfile } from '../types';

const DB_NAME = 'RDO_Huzurnagar_Storage_v1';
const STORE_NAME = 'documents';

declare global {
  interface Window {
    PDFLib?: any;
    jspdf?: any;
    html2canvas?: any;
    XLSX?: any;
  }
}

export function openDocDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function setAttachmentInDB(key: string, data: string): Promise<boolean> {
  if (!key || !data) return false;
  try {
    const db = await openDocDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(data, key);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('IndexedDB set error:', err);
    return false;
  }
}

export async function getAttachmentFromDB(key: string): Promise<string | null> {
  if (!key) return null;
  try {
    const db = await openDocDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch (err) {
    console.warn('IndexedDB get error:', err);
    return null;
  }
}

export async function deleteAttachmentFromDB(key: string): Promise<void> {
  if (!key) return;
  try {
    const db = await openDocDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(key);
  } catch (err) {
    console.warn('IndexedDB delete error:', err);
  }
}

export function safeSaveLocalStorage(key: string, data: any): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn('LocalStorage save warning:', e);
  }
}

export function safeGetLocalStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.warn('LocalStorage get warning:', e);
    return fallback;
  }
}

export function dataUriToUint8Array(dataUri: string): Uint8Array {
  const parts = dataUri.split(',');
  const base64 = parts[1] || '';
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function addImagePageToPdf(doc: any, imageDataUrl: string, stampText: string = ''): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = async function() {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height + (stampText ? 36 : 0);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve();
          return;
        }
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (stampText) {
          ctx.fillStyle = '#991b1b';
          ctx.fillRect(0, 0, canvas.width, 36);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 15px sans-serif';
          ctx.fillText(`[OFFICE OF RDO HUZURNAGAR - D SECTION] ${stampText}`, 14, 23);
        }

        ctx.drawImage(img, 0, stampText ? 36 : 0);
        const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.90);
        const jpegBytes = dataUriToUint8Array(jpegDataUrl);
        const embeddedImg = await doc.embedJpg(jpegBytes);
        const imgDims = embeddedImg.scale(1);
        const page = doc.addPage([imgDims.width, imgDims.height]);
        page.drawImage(embeddedImg, { x: 0, y: 0, width: imgDims.width, height: imgDims.height });
        resolve();
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = reject;
    img.src = imageDataUrl;
  });
}

export async function stampSingleDocument(dataUri: string, stampText: string): Promise<string> {
  if (!window.PDFLib) return dataUri;
  try {
    const { PDFDocument, rgb, StandardFonts } = window.PDFLib;
    if (dataUri.startsWith('data:application/pdf')) {
      const bytes = dataUriToUint8Array(dataUri);
      const doc = await PDFDocument.load(bytes);
      const helveticaFont = await doc.embedFont(StandardFonts.HelveticaBold);
      const pages = doc.getPages();
      pages.forEach((page: any) => {
        const { width, height } = page.getSize();
        page.drawRectangle({
          x: 0,
          y: height - 24,
          width: width,
          height: 24,
          color: rgb(0.95, 0.95, 0.95),
          opacity: 0.95
        });
        page.drawText(`[RDO HUZURNAGAR - D SECTION] ${stampText}`, {
          x: 14,
          y: height - 16,
          size: 9,
          font: helveticaFont,
          color: rgb(0.7, 0.1, 0.1)
        });
      });
      return await doc.saveAsBase64({ dataUri: true });
    } else if (dataUri.startsWith('data:image/')) {
      const doc = await PDFDocument.create();
      await addImagePageToPdf(doc, dataUri, stampText);
      return await doc.saveAsBase64({ dataUri: true });
    }
  } catch (e) {
    console.warn("Stamp single document error:", e);
  }
  return dataUri;
}

export async function mergeNewSignedDocToDossier(
  existingAttachment: string | null | undefined,
  newFileDataUrl: string,
  stampText: string = ''
): Promise<string> {
  if (!window.PDFLib) return newFileDataUrl;
  const { PDFDocument, rgb, StandardFonts } = window.PDFLib;
  let mergedDoc: any;

  if (existingAttachment && existingAttachment.startsWith('data:application/pdf')) {
    const existingBytes = dataUriToUint8Array(existingAttachment);
    mergedDoc = await PDFDocument.load(existingBytes);
  } else if (existingAttachment && existingAttachment.startsWith('data:image/')) {
    mergedDoc = await PDFDocument.create();
    await addImagePageToPdf(mergedDoc, existingAttachment);
  } else {
    mergedDoc = await PDFDocument.create();
  }

  if (newFileDataUrl.startsWith('data:application/pdf')) {
    const newBytes = dataUriToUint8Array(newFileDataUrl);
    const donorDoc = await PDFDocument.load(newBytes);
    const helveticaFont = await donorDoc.embedFont(StandardFonts.HelveticaBold);
    const donorPages = donorDoc.getPages();
    if (stampText) {
      donorPages.forEach((p: any) => {
        const { width, height } = p.getSize();
        p.drawRectangle({
          x: 0,
          y: height - 24,
          width: width,
          height: 24,
          color: rgb(0.95, 0.95, 0.95),
          opacity: 0.95
        });
        p.drawText(`[RDO HUZURNAGAR - D SECTION] ${stampText}`, {
          x: 14,
          y: height - 16,
          size: 9,
          font: helveticaFont,
          color: rgb(0.7, 0.1, 0.1)
        });
      });
    }
    const copiedPages = await mergedDoc.copyPages(donorDoc, donorDoc.getPageIndices());
    copiedPages.forEach((p: any) => mergedDoc.addPage(p));
  } else if (newFileDataUrl.startsWith('data:image/')) {
    await addImagePageToPdf(mergedDoc, newFileDataUrl, stampText);
  }

  return await mergedDoc.saveAsBase64({ dataUri: true });
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isFutureDate(dateStr: string): boolean {
  if (!dateStr) return false;
  return dateStr > getTodayDateString();
}

export function exportBhuBharatiToCSV(filesData: BhuFile[]): void {
  let csv = "data:text/csv;charset=utf-8,";
  csv += "Sl No,Application ID,Applicant Name,Mandal,Village,Survey No,Module,Received Date,Status,Remarks\n";
  filesData.forEach((f, i) => {
    csv += `"${i+1}","${f.appNumber}","${f.applicantName}","${f.mandal}","${f.village}","${f.surveyNo}","${f.module}","${f.receivedDate}","${f.status}","${(f.remarks||'').replace(/"/g, '""')}"\n`;
  });
  const encodedUri = encodeURI(csv);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `Bhu_Bharati_Master_Huzurnagar_${getTodayDateString()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportInwardToCSV(inwardTapalData: InwardTapal[]): void {
  let csv = "data:text/csv;charset=utf-8,";
  csv += "Sl No,Inward No,Received Date,Sender,Mandal,Subject,Assigned Seat,Status\n";
  inwardTapalData.forEach((t, i) => {
    csv += `"${i+1}","${t.inwardNo}","${t.receivedDate}","${(t.sender||'').replace(/"/g, '""')}","${t.mandal}","${(t.subject||'').replace(/"/g, '""')}","${t.seat||'-'}","${t.status}"\n`;
  });
  const encodedUri = encodeURI(csv);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `Inward_Tapal_Register_Huzurnagar_${getTodayDateString()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportOutwardToCSV(outwardData: OutwardDespatch[]): void {
  let csv = "data:text/csv;charset=utf-8,";
  csv += "Sl No,Outward No,Despatch Date,Source Type,Dispatched To,Subject,Mode,Remarks\n";
  outwardData.forEach((o, i) => {
    const type = o.entryType === 'INWARD_LINKED' || o.linkedInwardNo ? `Inward: ${o.linkedInwardNo || ''}` : 'Fresh Entry';
    csv += `"${i+1}","${o.outwardNo}","${o.outwardDate}","${type}","${(o.sentTo||'').replace(/"/g, '""')}","${(o.subject||'').replace(/"/g, '""')}","${o.mode||'-'}","${(o.remarks||'').replace(/"/g, '""')}"\n`;
  });
  const encodedUri = encodeURI(csv);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `Outward_Despatch_Register_Huzurnagar_${getTodayDateString()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export const INITIAL_FILES: BhuFile[] = [];

export const INITIAL_INWARD: InwardTapal[] = [];

export const INITIAL_OUTWARD: OutwardDespatch[] = [];

export const INITIAL_ADMIN_PROFILE: AdminProfile = {
  id: 999,
  name: 'Administrator (RDO)',
  role: 'ADMIN',
  cadre: 'Revenue Divisional Officer / Sub-Collector',
  phone: '9848012345',
  password: 'admin',
  active: true,
};

export const INITIAL_STAFF: StaffUser[] = [
  { id: 1, name: 'Rupavath Nagaraju', role: 'STAFF', cadre: 'Typist-cum-Computer Operator', phone: '9490123451', password: 'staff', active: true },
  { id: 2, name: 'Meesala Chaitanya', role: 'STAFF', cadre: 'Record Assistant / Junior Assistant', phone: '9490123452', password: 'staff', active: true },
  { id: 3, name: 'Malothu Nageswara Rao', role: 'STAFF', cadre: 'Senior Assistant / Section Assistant', phone: '9490123453', password: 'staff', active: true },
  { id: 4, name: 'Chityala Jyothi', role: 'STAFF', cadre: 'Hand Hold Person (HHP)', phone: '9490123454', password: 'staff', active: true }
];
