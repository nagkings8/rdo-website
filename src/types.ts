export interface FileHistory {
  date: string;
  action: string;
  from: string;
  to: string;
  user: string;
  remarks: string;
  hasSignedAttachment?: boolean;
}

export interface BhuFile {
  id: number;
  appNumber: string;
  applicantName: string;
  mandal: string;
  village: string;
  surveyNo: string;
  module: string;
  receivedDate: string;
  status: string;
  remarks: string;
  history: FileHistory[];
  hasAttachment?: boolean;
  attachmentKey?: string | null;
  fileAttachment?: string;
  hasInitialAttachment?: boolean;
}

export interface InwardTapal {
  id: number;
  inwardNo: string;
  receivedDate: string;
  sender: string;
  mandal: string;
  village?: string;
  subject: string;
  seat?: string;
  status: string;
  remarks?: string;
  linkedOutwardNo?: string;
  hasAttachment?: boolean;
  attachmentKey?: string | null;
  fileAttachment?: string;
  returnHistory?: Array<{
    date: string;
    from: string;
    status: string;
    remarks?: string;
  }>;
}

export interface OutwardDespatch {
  id: number;
  outwardNo: string;
  outwardDate: string;
  entryType: 'INWARD_LINKED' | 'FRESH';
  linkedInwardNo?: string | null;
  sentTo: string;
  subject: string;
  mode: string;
  remarks: string;
  priority?: string;
  hasAttachment?: boolean;
  attachmentKey?: string | null;
  fileAttachment?: string;
}

export type UserRole = 'ADMIN' | 'STAFF' | 'VIEWER';

export interface StaffUser {
  id: number;
  name: string;
  role: UserRole;
  cadre: string;
  phone?: string;
  password?: string;
  active: boolean;
}

export interface AdminProfile {
  id: number;
  name: string;
  role: 'ADMIN';
  cadre: string;
  phone: string;
  password: string;
  active: boolean;
}

export const MANDAL_VILLAGES: Record<string, string[]> = {
  "CHINTHALAPALEM": ["Adlur", "Chinthala Palem", "Chintriyala", "Donda Padu", "Gudi Malka Puram", "Nemalipuri", "Reballe", "Thammaram", "Vajine Palli", "Vellatur"],
  "GARIDE PALLE": ["Gaddi Palli", "Ganuga Banda", "Garide Palli", "Kalmala Chervu", "Kaluva Palle", "Kuthubsha Puram", "Ponugodu", "Raini Gudem", "Sarvaram", "Talla Makapuram", "Velidanda"],
  "HUZURNAGAR": ["Amara Varam", "Burugadda", "Huzur Nagar", "Lakka Varam", "Lingagiri", "Machavaram", "Yapala Singaram"],
  "MATTAMPALLE": ["Allipuram", "Channaya Palem", "Choutapalli", "Gundla Palli", "Mattam Palli", "Mattapalli", "Pedda Veedu", "Raghunadha Palem", "Vardha Puram", "Yatavakilla"],
  "MELLACHERUVU": ["Kandibanda", "Mella Chervu", "Revuru", "Yapala Madharam"],
  "NEREDUCHERLA": ["Bodala Dinna", "Chillepalli", "Dacharam", "Dirsencherla", "Fathepuram", "Janala Dinne", "Kallur", "Kalvala Dinna", "Medaram", "Nereducherla", "Penchikal Dinne", "Somavaram", "Yellaram"],
  "PALAKEEDU": ["Alanga Puram", "Bothalapalem", "Guduguntla Palem", "Gundeboina Gudem", "Gundla Pahad", "Janapahad", "Komatikunta", "Mahankali Gudem", "Musivoddu Singaram", "Palakeedu", "Ravipahad", "Sajjapuram", "Sunya Pahad", "Yella Puram"]
};

export const REVENUE_MODULES = [
  "Pending Mutation",
  "Court Cases & Intimation",
  "Missing Survey Number",
  "Data Correction",
  "DS Pending",
  "Succession",
  "Issue of PPB – Court Cases",
  "Prohibited Properties",
  "NALA Without PPB",
  "Survey Number Deletion (SD)",
  "Extent Correction (EX)",
  "Land Nature Correction (LN)",
  "Organization PPB",
  "Pending NALA",
  "NRI PPB",
  "Urban Lands PPB"
] as const;

export const MANDAL_LIST = [
  "CHINTHALAPALEM",
  "GARIDE PALLE",
  "HUZURNAGAR",
  "MATTAMPALLE",
  "MELLACHERUVU",
  "NEREDUCHERLA",
  "PALAKEEDU"
] as const;

export const FILE_STATUSES = [
  "Received from MRO",
  "Pending at RDO",
  "Forwarded to Collectorate",
  "Returned from Collectorate",
  "Returned to MRO",
  "Completed"
] as const;

export type AppealStatus =
  | 'Final Order Issued - Allowed'
  | 'Final Order Issued - Dismissed'
  | 'Final Order Issued - Remanded'
  | 'Interim Stay Granted'
  | 'Under Hearing'
  | 'Reserved for Orders';

export interface CaseHistoryEntry {
  id: string;
  businessDate: string; // Business on Date (e.g. 01-07-2026)
  hearingDate: string;  // Hearing Date (e.g. 13-08-2026)
  purpose: string;      // Purpose of Hearing / Stage (e.g. SUMMONS / NOTICE ISSUED, FOR APPEARANCE, FOR COUNTER, FOR ARGUMENTS, FINAL ORDER)
  judgeOfficer?: string;// Presiding Judge/Officer (e.g. "Revenue Divisional Officer & SDM, Huzurnagar")
  proceedings?: string; // Daily Order note (e.g. "Notice issued to Tahsildar & Respondents. Call on 13-08-2026")
  documentFile?: string;// Uploaded stage document (PDF / Image data URL)
  documentName?: string;// File name of the attached document
  uploadedAt?: string;  // Timestamp of upload
}

export interface AppealCase {
  id: number;
  caseNo: string;
  appealType: string;
  bhuBharatiActSection?: string;
  mandal: string;
  village: string;
  surveyNo: string;
  extent: string;
  appellantName: string;
  appellantAdvocate?: string;
  respondentName: string;
  respondentAdvocate?: string;
  filingDate: string; // MUST NOT BE FUTURE DATE
  registrationNo?: string;
  registrationDate?: string;
  cnrNumber?: string;
  firstHearingDate?: string;
  hearingDate?: string;
  nextHearingDate?: string;
  stagePurpose?: string;
  noticeIssuedDate?: string;
  noticeServedDate?: string;
  impugnedOrderNo?: string;
  impugnedOrderDate?: string;
  status: AppealStatus | string;
  finalOrderNo?: string;
  finalOrderDate?: string;
  finalOrderSummary?: string;
  hasFinalOrderAttachment?: boolean;
  attachmentKey?: string | null;
  finalOrderFile?: string;
  finalOrderFileName?: string;
  remarks?: string;
  caseHistory?: CaseHistoryEntry[];
}

export const APPEAL_TYPES = [
  "Bhu Bharati Appeal - RoR Rectification (Sec 15(1) r/w Sec 4 & Rule 14)",
  "Bhu Bharati Appeal - Mutation on Transfer / Sale / Gift (Sec 15(1) r/w Sec 5)",
  "Bhu Bharati Appeal - Succession / Will Mutation (Sec 15(1) r/w Sec 7)",
  "Bhu Bharati Appeal - Bhudhaar & Passbook (Sec 15(1) r/w Sec 9 & 10)",
  "Bhu Bharati Sec 6 - Sadabainama Un-registered Regularisation",
  "Bhu Bharati Sec 8 - Mutation on Court Decree / Award / Revenue Order",
  "Tenancy Act Appeal (Sec 90 of Tenancy & Agrl Lands Act, 1950)",
  "Inams Abolition Appeal (Sec 24 of Inams Abolition Act, 1955)",
  "Assigned Lands POT Act Appeal (Act 9 of 1977)",
  "Schedule A - RoR Correction (Survey No / Digital Sign / Extent / NALA)",
  "Other Revenue Appeal"
] as const;

export const APPEAL_STATUSES = [
  "Final Order Issued - Allowed",
  "Final Order Issued - Dismissed",
  "Final Order Issued - Remanded",
  "Interim Stay Granted",
  "Under Hearing",
  "Reserved for Orders"
] as const;

export type AuditActionType = 'ENTRY' | 'EDIT' | 'STATUS_CHANGE' | 'DELETE' | 'ORDER_UPLOAD';

export interface AuditLogEntry {
  id: string;
  timestamp: string; // Formatted date and time
  module: 'Bhu Bharati' | 'Tapal Inward' | 'Tapal Outward' | 'Appeal Cases' | 'Sadabainama' | 'Staff Admin';
  recordId: string; // e.g., "BB-2024-HZ-0012", "INW/2024/098", "ROR/12/2024"
  actionType: AuditActionType;
  performedBy: string; // Staff/Admin name and cadre
  userRole: string; // 'ADMIN' | 'STAFF'
  details: string; // Verbatim description of the action taken
}
