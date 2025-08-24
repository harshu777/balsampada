// Image configuration for the application
// Using Unsplash for high-quality stock images

export const images = {
  // Hero and Landing Page Images
  hero: {
    students: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&h=800&fit=crop',
    learning: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&h=800&fit=crop',
    classroom: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1200&h=800&fit=crop',
    collaboration: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&h=800&fit=crop',
  },

  // Dashboard Images
  dashboard: {
    studying: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&h=400&fit=crop',
    books: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&h=400&fit=crop',
    achievement: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=600&h=400&fit=crop',
    progress: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=600&h=400&fit=crop',
  },

  // Subject Images
  subjects: {
    mathematics: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=300&fit=crop',
    science: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop',
    english: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&h=300&fit=crop',
    history: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=400&h=300&fit=crop',
    geography: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=400&h=300&fit=crop',
    computer: 'https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=400&h=300&fit=crop',
    physics: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=300&fit=crop',
    chemistry: 'https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?w=400&h=300&fit=crop',
    biology: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=300&fit=crop',
  },

  // User Avatars (Placeholder)
  avatars: {
    student1: 'https://images.unsplash.com/photo-1554151228-14d9def656e4?w=150&h=150&fit=crop',
    student2: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop',
    student3: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150&h=150&fit=crop',
    teacher1: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop',
    teacher2: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop',
    teacher3: 'https://images.unsplash.com/photo-1582233479366-6d38bc390a08?w=150&h=150&fit=crop',
  },

  // Achievement and Badges
  achievements: {
    trophy: 'https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=200&h=200&fit=crop',
    medal: 'https://images.unsplash.com/photo-1578662996442-48f60103fc31?w=200&h=200&fit=crop',
    certificate: 'https://images.unsplash.com/photo-1549241520-425e3dfc01cb?w=200&h=200&fit=crop',
    star: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=200&h=200&fit=crop',
  },

  // Empty States
  empty: {
    noData: 'https://images.unsplash.com/photo-1584697964156-deca98e4439d?w=400&h=300&fit=crop',
    noClasses: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=300&fit=crop',
    noAssignments: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&h=300&fit=crop',
    notFound: 'https://images.unsplash.com/photo-1584824486509-112e4181ff6b?w=400&h=300&fit=crop',
  },

  // Authentication Pages
  auth: {
    login: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&h=600&fit=crop',
    register: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=600&fit=crop',
    forgotPassword: 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=800&h=600&fit=crop',
  },

  // Patterns and Backgrounds
  patterns: {
    dots: 'data:image/svg+xml,%3Csvg width="20" height="20" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="%239CA3AF" fill-opacity="0.05"%3E%3Ccircle cx="1" cy="1" r="1"/%3E%3C/g%3E%3C/svg%3E',
    grid: 'data:image/svg+xml,%3Csvg width="40" height="40" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="%239CA3AF" fill-opacity="0.03"%3E%3Cpath d="M0 0h40v1H0zM0 20h40v1H0z"/%3E%3Cpath d="M0 0v40h1V0zM20 0v40h1V0z"/%3E%3C/g%3E%3C/svg%3E',
  },

  // Logo and Branding
  logo: {
    light: '/logo-light.svg',
    dark: '/logo-dark.svg',
    square: '/logo-square.svg',
  },
};

// Helper function to get a random avatar
export const getRandomAvatar = (type: 'student' | 'teacher' = 'student'): string => {
  const avatars = type === 'student' 
    ? [images.avatars.student1, images.avatars.student2, images.avatars.student3]
    : [images.avatars.teacher1, images.avatars.teacher2, images.avatars.teacher3];
  return avatars[Math.floor(Math.random() * avatars.length)];
};

// Helper function to get subject image
export const getSubjectImage = (subject: string): string => {
  const normalizedSubject = subject.toLowerCase().replace(/\s+/g, '');
  return images.subjects[normalizedSubject as keyof typeof images.subjects] || images.subjects.science;
};