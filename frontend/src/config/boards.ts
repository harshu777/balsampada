// Board and Subject Configuration for Tuition Portal

export const BOARDS = {
  IB: {
    name: 'International Baccalaureate (IB)',
    code: 'IB',
    grades: ['4', '5', '6', '7', '8', '9', '10'],
    programs: {
      PYP: { name: 'Primary Years Programme', grades: ['4', '5'] },
      MYP: { name: 'Middle Years Programme', grades: ['6', '7', '8', '9', '10'] }
    },
    subjects: [
      { code: 'IB_MATH', name: 'Mathematics', variants: ['AA', 'AI'] },
      { code: 'IB_PHY', name: 'Physics', level: ['SL', 'HL'] },
      { code: 'IB_CHEM', name: 'Chemistry', level: ['SL', 'HL'] },
      { code: 'IB_BIO', name: 'Biology', level: ['SL', 'HL'] },
      { code: 'IB_ENG', name: 'English Language & Literature' },
      { code: 'IB_HIST', name: 'History' },
      { code: 'IB_GEO', name: 'Geography' },
      { code: 'IB_ECO', name: 'Economics' },
      { code: 'IB_CS', name: 'Computer Science' },
      { code: 'IB_TOK', name: 'Theory of Knowledge', grades: ['11', '12'] }
    ]
  },
  
  IGCSE: {
    name: 'Cambridge IGCSE',
    code: 'IGCSE',
    grades: ['4', '5', '6', '7', '8', '9', '10'],
    levels: {
      PRIMARY: { name: 'Cambridge Primary', grades: ['4', '5'] },
      LOWER_SEC: { name: 'Lower Secondary', grades: ['6', '7', '8'] },
      IGCSE: { name: 'IGCSE', grades: ['9', '10'] }
    },
    subjects: [
      { code: 'IG_MATH', name: 'Mathematics', variants: ['Core', 'Extended'] },
      { code: 'IG_PHY', name: 'Physics' },
      { code: 'IG_CHEM', name: 'Chemistry' },
      { code: 'IG_BIO', name: 'Biology' },
      { code: 'IG_CSCI', name: 'Combined Science' },
      { code: 'IG_ENG', name: 'First Language English' },
      { code: 'IG_ENG2', name: 'English as Second Language' },
      { code: 'IG_CS', name: 'Computer Science' },
      { code: 'IG_ICT', name: 'Information & Communication Technology' },
      { code: 'IG_BUS', name: 'Business Studies' },
      { code: 'IG_ACC', name: 'Accounting' },
      { code: 'IG_ECO', name: 'Economics' }
    ]
  },
  
  ICSE: {
    name: 'Indian Certificate of Secondary Education',
    code: 'ICSE',
    grades: ['4', '5', '6', '7', '8', '9', '10'],
    subjects: [
      { code: 'ICSE_ENG', name: 'English Language & Literature' },
      { code: 'ICSE_HIN', name: 'Hindi' },
      { code: 'ICSE_MATH', name: 'Mathematics' },
      { code: 'ICSE_PHY', name: 'Physics' },
      { code: 'ICSE_CHEM', name: 'Chemistry' },
      { code: 'ICSE_BIO', name: 'Biology' },
      { code: 'ICSE_HIST', name: 'History & Civics' },
      { code: 'ICSE_GEO', name: 'Geography' },
      { code: 'ICSE_COMP', name: 'Computer Applications' },
      { code: 'ICSE_EVS', name: 'Environmental Science', grades: ['4', '5', '6', '7', '8'] },
      { code: 'ICSE_ECO', name: 'Economics', grades: ['9', '10'] },
      { code: 'ICSE_COM', name: 'Commercial Studies', grades: ['9', '10'] }
    ]
  },
  
  CBSE: {
    name: 'Central Board of Secondary Education',
    code: 'CBSE',
    grades: ['4', '5', '6', '7', '8', '9', '10'],
    subjects: [
      { code: 'CBSE_ENG', name: 'English', variants: ['Core', 'Elective'] },
      { code: 'CBSE_HIN', name: 'Hindi', variants: ['Course A', 'Course B'] },
      { code: 'CBSE_MATH', name: 'Mathematics', variants: ['Standard', 'Basic'] },
      { code: 'CBSE_SCI', name: 'Science' },
      { code: 'CBSE_SST', name: 'Social Science' },
      { code: 'CBSE_SANS', name: 'Sanskrit' },
      { code: 'CBSE_CS', name: 'Computer Science' },
      { code: 'CBSE_IP', name: 'Informatics Practices' },
      { code: 'CBSE_AI', name: 'Artificial Intelligence', grades: ['8', '9', '10'] },
      { code: 'CBSE_PE', name: 'Physical Education' }
    ]
  },
  
  SSC: {
    name: 'Secondary School Certificate (Maharashtra)',
    code: 'SSC',
    grades: ['4', '5', '6', '7', '8', '9', '10'],
    languages: ['English', 'Marathi', 'Hindi', 'Urdu'],
    subjects: [
      { code: 'SSC_ENG', name: 'English' },
      { code: 'SSC_MAR', name: 'Marathi' },
      { code: 'SSC_HIN', name: 'Hindi' },
      { code: 'SSC_MATH', name: 'Mathematics', parts: ['Algebra', 'Geometry'] },
      { code: 'SSC_SCI', name: 'Science & Technology', parts: ['Part 1', 'Part 2'] },
      { code: 'SSC_HIST', name: 'History' },
      { code: 'SSC_GEO', name: 'Geography' },
      { code: 'SSC_POL', name: 'Political Science' },
      { code: 'SSC_EVS', name: 'Environmental Studies', grades: ['4', '5', '6', '7'] }
    ]
  }
};

// Grade to Standard Mapping
export const GRADE_STANDARD_MAP = {
  '4': 'IV / 4th Standard',
  '5': 'V / 5th Standard',
  '6': 'VI / 6th Standard',
  '7': 'VII / 7th Standard',
  '8': 'VIII / 8th Standard',
  '9': 'IX / 9th Standard',
  '10': 'X / 10th Standard (Board)'
};

// Special Programs and Features by Board
export const BOARD_FEATURES = {
  IB: [
    'Internal Assessments (IA)',
    'Extended Essay (EE) Support',
    'Theory of Knowledge (TOK)',
    'CAS (Creativity, Activity, Service)',
    'Learner Profile Development',
    'Interdisciplinary Learning'
  ],
  IGCSE: [
    'Past Paper Practice',
    'Practical Assessment Preparation',
    'Coursework Guidance',
    'Grade Predictions',
    'Component-wise Practice',
    'Exam Technique Training'
  ],
  ICSE: [
    'Project Work Assistance',
    'Internal Assessment Preparation',
    'Board Pattern Tests',
    'Previous Year Solutions',
    'Practical File Preparation',
    'Language Skills Development'
  ],
  CBSE: [
    'NCERT Solutions',
    'Competency-Based Questions',
    'Case Study Practice',
    'Sample Paper Solutions',
    'CCE Pattern Assessment',
    'Activity-Based Learning'
  ],
  SSC: [
    'State Board Pattern Tests',
    'Activity Sheets',
    'Practical Notebook Prep',
    'Oral Exam Preparation',
    'Board Question Bank',
    'Regional Language Support'
  ]
};

// Assessment Types by Board
export const ASSESSMENT_TYPES = {
  IB: ['Formative', 'Summative', 'IA', 'Mock Exams', 'TOK Essay'],
  IGCSE: ['Topic Tests', 'Mock Papers', 'Practical Exams', 'Coursework'],
  ICSE: ['Unit Tests', 'Semester Exams', 'Projects', 'Practicals'],
  CBSE: ['Periodic Tests', 'Half Yearly', 'Pre-Board', 'Board Exam Prep'],
  SSC: ['Unit Tests', 'Semester Exams', 'Preliminary Exams', 'Board Prep']
};

// Fee Structure Suggestions (per month)
export const FEE_STRUCTURE = {
  IB: { individual: 15000, group: 10000, doubt: 500 },
  IGCSE: { individual: 12000, group: 8000, doubt: 500 },
  ICSE: { individual: 8000, group: 5000, doubt: 300 },
  CBSE: { individual: 6000, group: 4000, doubt: 300 },
  SSC: { individual: 5000, group: 3000, doubt: 200 }
};

// Class Timings Structure
export const CLASS_TIMINGS = {
  weekday: {
    morning: ['6:00 AM - 7:30 AM', '7:30 AM - 9:00 AM'],
    evening: ['4:00 PM - 5:30 PM', '5:30 PM - 7:00 PM', '7:00 PM - 8:30 PM']
  },
  weekend: {
    morning: ['8:00 AM - 10:00 AM', '10:00 AM - 12:00 PM'],
    afternoon: ['2:00 PM - 4:00 PM', '4:00 PM - 6:00 PM']
  }
};

export default BOARDS;