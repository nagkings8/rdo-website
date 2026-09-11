// Default Sadabainama Abstract data matching the official Huzurnagar Division report
export const DEFAULT_SADABAINAMA_ABSTRACT: any[][] = [
  [
    "S. No",
    "Mandal Name",
    "Total Applications",
    "Total Survey Numbers",
    "Total Notice Generated",
    "Total Applications Pending At Tahsildar",
    "Total Applications Pending At RDO",
    "Total Completed Applications",
    "Total Survey Pending At Tahsildar",
    "Total Survey Pending At RDO",
    "Total Survey Approved By RDO",
    "Total Survey Rejected By RDO"
  ],
  ["1", "Chinthalapalem (Mallareddygudem)", "3,385", "3,560", "3,384", "22", "12", "3,348", "22", "21", "1", "3,500"],
  ["2", "Garide Palle", "2,379", "2,665", "2,377", "30", "46", "2,299", "31", "55", "10", "2,554"],
  ["3", "Huzurnagar", "417", "487", "417", "9", "1", "407", "9", "1", "25", "441"],
  ["4", "Mattampalle", "3,621", "4,062", "3,621", "16", "46", "3,559", "16", "79", "8", "3,924"],
  ["5", "Mellacheruvu", "1,781", "1,973", "1,780", "19", "2", "1,760", "20", "8", "0", "1,934"],
  ["6", "Nereducherla", "1,589", "1,743", "1,588", "15", "42", "1,530", "14", "53", "4", "1,654"],
  ["7", "Palakeedu", "602", "683", "602", "14", "10", "578", "14", "16", "0", "650"],
  ["", "TOTAL", "13,774", "15,173", "13,769", "125", "159", "13,481", "126", "233", "48", "14,657"]
];

// Default Sadabainama Detailed Report matching Telangana Revenue format (Clean official headers ready for Excel/CSV upload)
export const DEFAULT_SADABAINAMA_REPORT: any[][] = [
  ["Sadabainama Detailed Report as on 05-09-2026 17.56.04"],
  [
    "S. No",
    "Mandal Name",
    "Village Name",
    "Application No",
    "Khata No",
    "Survey No",
    "Extent (Ac.Gts)",
    "Applicant Name",
    "Father / Husband Name",
    "Seller / Executant Name",
    "Date of Agreement",
    "Current Status",
    "Pending Office / Level",
    "Action Taken"
  ]
];
