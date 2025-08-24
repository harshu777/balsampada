// Education System Constants for Indian Tuition Classes

export interface BoardOption {
  value: string;
  label: string;
  description?: string;
}

export interface StandardOption {
  value: string;
  label: string;
  group: string;
}

export interface SubjectOption {
  value: string;
  label: string;
}

export interface BatchOption {
  value: string;
  label: string;
}

export interface MediumOption {
  value: string;
  label: string;
}

export interface ClassTypeOption {
  value: string;
  label: string;
  description: string;
}

export const BOARDS: BoardOption[] = [
  { value: 'CBSE', label: 'CBSE', description: 'Central Board of Secondary Education' },
  { value: 'ICSE', label: 'ICSE', description: 'Indian Certificate of Secondary Education' },
  { value: 'State Board', label: 'State Board', description: 'State Education Board' },
  { value: 'IB', label: 'IB', description: 'International Baccalaureate' },
  { value: 'Cambridge', label: 'Cambridge', description: 'Cambridge International' },
  { value: 'NIOS', label: 'NIOS', description: 'National Institute of Open Schooling' },
  { value: 'Other', label: 'Other', description: 'Other Boards' }
];

export const STANDARDS: StandardOption[] = [
  { value: '1', label: 'Class 1', group: 'Primary' },
  { value: '2', label: 'Class 2', group: 'Primary' },
  { value: '3', label: 'Class 3', group: 'Primary' },
  { value: '4', label: 'Class 4', group: 'Primary' },
  { value: '5', label: 'Class 5', group: 'Primary' },
  { value: '6', label: 'Class 6', group: 'Middle' },
  { value: '7', label: 'Class 7', group: 'Middle' },
  { value: '8', label: 'Class 8', group: 'Middle' },
  { value: '9', label: 'Class 9', group: 'Secondary' },
  { value: '10', label: 'Class 10', group: 'Secondary' },
  { value: '11', label: 'Class 11', group: 'Senior Secondary' },
  { value: '12', label: 'Class 12', group: 'Senior Secondary' },
  { value: 'UG', label: 'Undergraduate', group: 'Higher Education' },
  { value: 'PG', label: 'Postgraduate', group: 'Higher Education' }
];

export const SUBJECTS = {
  primary: [
    { value: 'Mathematics', label: 'Mathematics' },
    { value: 'Science', label: 'Science' },
    { value: 'English', label: 'English' },
    { value: 'Hindi', label: 'Hindi' },
    { value: 'Social Studies', label: 'Social Studies' },
    { value: 'Environmental Studies', label: 'Environmental Studies (EVS)' },
    { value: 'General Knowledge', label: 'General Knowledge' }
  ],
  secondary: [
    { value: 'Mathematics', label: 'Mathematics' },
    { value: 'Physics', label: 'Physics' },
    { value: 'Chemistry', label: 'Chemistry' },
    { value: 'Biology', label: 'Biology' },
    { value: 'Computer Science', label: 'Computer Science' },
    { value: 'English', label: 'English' },
    { value: 'Hindi', label: 'Hindi' },
    { value: 'History', label: 'History' },
    { value: 'Geography', label: 'Geography' },
    { value: 'Civics', label: 'Civics' },
    { value: 'Economics', label: 'Economics' },
    { value: 'Sanskrit', label: 'Sanskrit' },
    { value: 'French', label: 'French' },
    { value: 'German', label: 'German' }
  ],
  seniorSecondary: [
    { value: 'Mathematics', label: 'Mathematics' },
    { value: 'Physics', label: 'Physics' },
    { value: 'Chemistry', label: 'Chemistry' },
    { value: 'Biology', label: 'Biology' },
    { value: 'Computer Science', label: 'Computer Science' },
    { value: 'English', label: 'English Core' },
    { value: 'Accountancy', label: 'Accountancy' },
    { value: 'Business Studies', label: 'Business Studies' },
    { value: 'Economics', label: 'Economics' },
    { value: 'History', label: 'History' },
    { value: 'Geography', label: 'Geography' },
    { value: 'Psychology', label: 'Psychology' },
    { value: 'Sociology', label: 'Sociology' },
    { value: 'Political Science', label: 'Political Science' }
  ]
};

export const BATCHES: BatchOption[] = [
  { value: 'A', label: 'Batch A' },
  { value: 'B', label: 'Batch B' },
  { value: 'C', label: 'Batch C' },
  { value: 'D', label: 'Batch D' },
  { value: 'E', label: 'Batch E' },
  { value: 'Morning', label: 'Morning Batch' },
  { value: 'Evening', label: 'Evening Batch' },
  { value: 'Weekend', label: 'Weekend Batch' }
];

export const MEDIUMS: MediumOption[] = [
  { value: 'English', label: 'English' },
  { value: 'Hindi', label: 'Hindi' },
  { value: 'Regional', label: 'Regional Language' },
  { value: 'Bilingual', label: 'Bilingual (English + Hindi)' }
];

export const CLASS_TYPES: ClassTypeOption[] = [
  { value: 'Regular', label: 'Regular Classes', description: 'Complete syllabus coverage' },
  { value: 'Crash Course', label: 'Crash Course', description: 'Quick revision course' },
  { value: 'Revision', label: 'Revision Classes', description: 'Pre-exam revision' },
  { value: 'Test Series', label: 'Test Series', description: 'Practice tests and mock exams' },
  { value: 'Doubt Clearing', label: 'Doubt Clearing', description: 'Q&A and problem solving' }
];

// Helper function to get subjects based on standard
export const getSubjectsByStandard = (standard: string): SubjectOption[] => {
  const stdNum = parseInt(standard);
  
  if (stdNum >= 1 && stdNum <= 5) {
    return SUBJECTS.primary;
  } else if (stdNum >= 6 && stdNum <= 10) {
    return SUBJECTS.secondary;
  } else if (stdNum >= 11 && stdNum <= 12) {
    return SUBJECTS.seniorSecondary;
  } else {
    // For UG/PG, return all unique subjects
    const allSubjects = [...SUBJECTS.primary, ...SUBJECTS.secondary, ...SUBJECTS.seniorSecondary];
    const uniqueSubjects = allSubjects.filter((subject, index, self) => 
      index === self.findIndex((s) => s.value === subject.value)
    );
    return uniqueSubjects;
  }
};

// Helper function to generate class title
export const generateClassTitle = (
  board: string,
  standard: string,
  subject: string,
  batch: string,
  classType: string
): string => {
  const stdLabel = STANDARDS.find(s => s.value === standard)?.label || `Class ${standard}`;
  const typePrefix = classType !== 'Regular' ? `${classType} - ` : '';
  const batchSuffix = batch !== 'A' ? ` (${batch})` : '';
  
  return `${typePrefix}${stdLabel} ${subject} - ${board}${batchSuffix}`;
};

// Helper function to get current academic year
export const getCurrentAcademicYear = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  
  // Academic year starts in April (month index 3)
  if (month >= 3) {
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
};

// Helper function to get class schedule suggestions
export const getScheduleSuggestions = (standard: string, classType: string) => {
  const suggestions = [];
  
  if (classType === 'Regular') {
    suggestions.push(
      { days: 'Mon-Wed-Fri', time: '4:00 PM - 5:30 PM', duration: 90 },
      { days: 'Tue-Thu-Sat', time: '5:00 PM - 6:30 PM', duration: 90 },
      { days: 'Daily', time: '6:00 PM - 7:00 PM', duration: 60 }
    );
  } else if (classType === 'Weekend') {
    suggestions.push(
      { days: 'Sat-Sun', time: '9:00 AM - 11:00 AM', duration: 120 },
      { days: 'Sat-Sun', time: '2:00 PM - 4:00 PM', duration: 120 }
    );
  } else if (classType === 'Crash Course') {
    suggestions.push(
      { days: 'Daily', time: '7:00 AM - 9:00 AM', duration: 120 },
      { days: 'Daily', time: '4:00 PM - 6:00 PM', duration: 120 }
    );
  }
  
  return suggestions;
};