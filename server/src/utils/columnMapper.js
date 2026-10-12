/**
 * Column Mapper and Normalizer for Bulk Data Import
 * Supports flexible alias matching for column headers in Excel/CSV files.
 */

export const STANDARD_FIELDS = [
  { key: 'slNo', label: 'Sl No', required: false },
  { key: 'rollNumber', label: 'Roll Number', required: true },
  { key: 'name', label: 'Student Name', required: true },
  { key: 'branch', label: 'Branch', required: false },
  { key: 'batch', label: 'Batch / Group', required: false },
  { key: 'mentorRollNumber', label: 'Mentor Roll No', required: false },
  { key: 'mentorName', label: 'Mentor Name', required: false },
  { key: 'leetcode', label: 'LeetCode URL', required: false },
  { key: 'codeforces', label: 'Codeforces URL', required: false },
  { key: 'hackerrank', label: 'HackerRank URL', required: false },
  { key: 'linkedin', label: 'LinkedIn URL', required: false },
  { key: 'github', label: 'GitHub URL', required: false },
  { key: 'resume', label: 'Resume URL', required: false }
];

const COLUMN_ALIASES = {
  slNo: [
    'sl no',
    'slno',
    'sl.no',
    's.no',
    's no',
    'sno',
    'serial no',
    'serial number',
    'sr no',
    'sr.no',
    'id'
  ],
  rollNumber: [
    'roll no',
    'rollno',
    'roll_no',
    'roll number',
    'student roll no',
    'student roll number',
    'htno',
    'hall ticket no',
    'hall ticket number',
    'reg no',
    'regno',
    'registration number',
    'student id',
    'studentid',
    'roll'
  ],
  name: [
    'student name',
    'student_name',
    'name',
    'full name',
    'fullname',
    'student full name',
    'student',
    'name of student',
    'candidate name'
  ],
  branch: [
    'branch',
    'department',
    'dept',
    'branch name',
    'academic branch',
    'stream',
    'course'
  ],
  batch: [
    'nbatch',
    'batch',
    'batch name',
    'nbatch name',
    'group',
    'cohort',
    'section',
    'student batch',
    'group name'
  ],
  mentorRollNumber: [
    'mentor roll no',
    'mentor rollno',
    'mentor_roll_no',
    'mentor roll number',
    'mentor id',
    'mentorid',
    'mentor emp id',
    'emp id',
    'empid',
    'employee id',
    'faculty id',
    'faculty roll no',
    'mentor code'
  ],
  mentorName: [
    'mentor name',
    'mentor_name',
    'name of mentor',
    'faculty name',
    'assigned mentor',
    'mentor',
    'faculty'
  ],
  leetcode: [
    'leetcode',
    'leetcode url',
    'leetcode link',
    'leetcode profile',
    'leetcode account',
    'lc'
  ],
  codeforces: [
    'codeforce',
    'codeforces',
    'codeforce url',
    'codeforces url',
    'codeforces link',
    'codeforces profile',
    'cf'
  ],
  hackerrank: [
    'hackerrank',
    'hacker rank',
    'hackerrank url',
    'hackerrank link',
    'hackerrank profile',
    'hr'
  ],
  linkedin: [
    'linkedin',
    'linked in',
    'linkedin url',
    'linkedin link',
    'linkedin profile'
  ],
  github: [
    'github',
    'git hub',
    'github url',
    'github link',
    'github profile'
  ],
  resume: [
    'resume',
    'resume url',
    'resume link',
    'cv',
    'cv url',
    'portfolio',
    'portfolio url'
  ]
};

/**
 * Normalize a column header string
 */
export const normalizeHeader = (header) => {
  if (!header) return '';
  return String(header)
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');
};

/**
 * Automatically map raw spreadsheet headers to standard schema fields
 */
export const autoDetectMapping = (rawHeaders) => {
  const mapping = {};
  const usedFields = new Set();

  rawHeaders.forEach((rawHeader) => {
    const normalized = normalizeHeader(rawHeader);
    let matchedField = null;

    // Direct match against known aliases
    for (const [fieldKey, aliases] of Object.entries(COLUMN_ALIASES)) {
      if (usedFields.has(fieldKey)) continue;

      if (aliases.some((alias) => alias === normalized || normalized.includes(alias))) {
        matchedField = fieldKey;
        break;
      }
    }

    if (matchedField) {
      mapping[rawHeader] = matchedField;
      usedFields.add(matchedField);
    } else {
      mapping[rawHeader] = null; // Unmapped
    }
  });

  return mapping;
};

/**
 * Clean cell values safely preserving roll number strings with leading zeroes
 */
export const sanitizeCellValue = (val) => {
  if (val === null || val === undefined) return '';
  let str = String(val).trim();
  // Strip formula triggers if any
  if (str.startsWith('=') || str.startsWith('+') || str.startsWith('-') || str.startsWith('@')) {
    str = str.substring(1).trim();
  }
  return str;
};
