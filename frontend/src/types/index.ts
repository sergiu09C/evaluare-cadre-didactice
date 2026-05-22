// User & Auth Types
export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'admin' | 'professor';
  professorId?: number;
  program?: {
    name: string;
    code: string;
    level: 'licenta' | 'master' | 'doctorat';
    year: number;
    faculty: string;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

// Professor & Course Types
export interface Professor {
  id: number;
  name: string;
  firstName: string;
  lastName: string;
  title: string;
  department: string;
  type?: 'curs' | 'laborator' | 'seminar';
  course: {
    id: number;
    name: string;
    code: string;
    semester: string;
    academicYear: string;
  };
  evaluation: {
    id: number | null;
    status: 'not_started' | 'draft' | 'submitted';
    startedAt?: string;
    submittedAt?: string;
    deadline?: string;
  };
}

// Evaluation & Questions Types
export interface Question {
  id: number;
  text: string;
  type: 'likert' | 'text';
  category: string;
  isRequired: boolean;
  response?: {
    likert?: number;
    text?: string;
  } | null;
}

export interface Evaluation {
  id: number;
  status: 'draft' | 'submitted';
  deadline: string;
  startedAt: string;
  submittedAt?: string;
  professor: {
    name: string;
    title: string;
  };
  course: {
    name: string;
  };
}

export interface EvaluationResponse {
  questionId: number;
  likert?: number;
  text?: string;
}

export interface EvaluationStatus {
  total: number;
  completed: number;
  draft: number;
  notStarted: number;
  completionRate: number;
  breakdown?: {
    discipline: number;
    cadreDidacticeUnice: number;
    cursuri: number;
    laboratoare: number;
    seminare: number;
  };
}

// Admin Dashboard Types
export interface DashboardStats {
  overview: {
    totalStudents: number;
    totalProfessors: number;
    totalEvaluations: number;
    completedEvaluations: number;
    inProgressEvaluations: number;
    completionRate: number;
  };
  topPerformers: ProfessorSummary[];
  needsAttention: ProfessorSummary[];
  facultyCompletion: FacultyCompletion[];
  completionTrend?: {
    date: string;
    completed: number;
    total: number;
  }[];
  scoreDistribution?: {
    name: string;
    value: number;
  }[];
}

export interface ProfessorSummary {
  id: number;
  name: string;
  title?: string;
  department?: string;
  faculty?: string;
  stats?: {
    totalEvaluations: number;
    completedEvaluations: number;
    averageScore: number | null;
    isCritical: boolean;
  };
  averageScore?: number;
  evaluationCount?: number;
}

export interface FacultyCompletion {
  faculty: string;
  total: number;
  completed: number;
  completionRate: number;
}

export interface ProfessorDetailedStats {
  professor: {
    id: number;
    name: string;
    title: string;
    department: string;
    faculty: string;
  };
  statistics: {
    evaluations: {
      total_assigned: number;
      completed: number;
      in_progress: number;
      completion_rate: number;
    };
    overallAverage: number | null;
    categoryAverages: {
      category: string;
      average: number;
      responseCount: number;
    }[];
    scoreDistribution: {
      score: number;
      count: number;
    }[];
  };
  feedback: {
    textResponses: {
      question: string;
      category: string;
      answer: string;
      date: string;
    }[];
  };
}

// Accessibility Types
export interface AccessibilityPreferences {
  fontSize: 'small' | 'normal' | 'large' | 'extra-large';
  highContrast: boolean;
  reduceMotion: boolean;
  theme: 'light' | 'dark' | 'system';
  dyslexiaFont: boolean;
}

export interface AccessibilityContextType {
  preferences: AccessibilityPreferences;
  loading: boolean;
  updatePreference: <K extends keyof AccessibilityPreferences>(
    key: K,
    value: AccessibilityPreferences[K]
  ) => Promise<void>;
  resetToDefaults: () => Promise<void>;
  syncWithBackend: () => Promise<void>;
}

// Feedback & Achievements Types
export interface FeedbackStats {
  faculty: {
    completionRate: number;
    activeStudents: number;
    totalStudents: number;
    message: string;
  };
  program: {
    activeStudents: number;
    totalStudents: number;
    message: string;
  };
  global: {
    totalSubmitted: number;
    totalDraft: number;
    totalEvaluations: number;
    message: string;
  };
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedAt?: string;
}

export interface AchievementProgress {
  allComplete: {
    current: number;
    total: number;
    percentage: number;
  };
  fastResponder: {
    current: number;
    total: number;
    percentage: number;
  };
  detailedFeedback: {
    current: number;
    total: number;
    percentage: number;
  };
}

export interface AchievementsResponse {
  achievements: Achievement[];
  progress: AchievementProgress;
  totalBadges: number;
  totalPossible: number;
}

export interface EvaluationHistoryItem {
  id: number;
  status: 'draft' | 'submitted';
  startedAt: string;
  submittedAt?: string;
  deadline?: string;
  professor: {
    id: number;
    name: string;
    type?: 'curs' | 'laborator' | 'seminar';
  };
  course: {
    id: number;
    name: string;
    code: string;
  };
  responsesCount: number;
}

export interface EvaluationHistoryResponse {
  history: EvaluationHistoryItem[];
  summary: {
    total: number;
    submitted: number;
    draft: number;
  };
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
  createdAt: string;
  read: boolean;
}

export interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

export interface ClosingLoopEntry {
  id: number;
  title: string;
  body: string;
  dot_color: string;
  related_dimension?: string | null;
  sort_order: number;
  updated_at: string;
}

export interface ClosingLoopEntryAdmin extends ClosingLoopEntry {
  is_published: boolean | number;
  created_at: string;
}

export interface ProfessorStudentsList {
  courses: Array<{
    course_id: number;
    course_name: string;
    course_code: string;
    course_type: string;
    semester: string;
    total_enrolled: number;
    total_evaluated: number;
    completion_rate: number;
    students: Array<{ name: string; year: number | null }>;
  }>;
  total_unique_students: number;
  unique_students_who_evaluated: number;
  total_evaluations_received: number;
  total_enrollments: number;
}

export interface AdminUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'professor' | 'admin';
  is_active: boolean | number;
  professor_id?: number | null;
  program_id?: number | null;
  year?: number | null;
  department?: string | null;
  faculty?: string | null;
}
