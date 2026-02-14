import axios, { AxiosInstance } from 'axios';
import type {
  AuthResponse,
  LoginCredentials,
  User,
  Professor,
  Evaluation,
  Question,
  EvaluationResponse,
  EvaluationStatus,
  DashboardStats,
  ProfessorSummary,
  ProfessorDetailedStats,
  AccessibilityPreferences,
} from '../types';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: '/api',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor pentru adăugare token JWT
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Interceptor pentru erori (ex: token expirat)
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
          // Token invalid sau expirat
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // ========== AUTH ENDPOINTS ==========

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  }

  async logout(): Promise<void> {
    await this.api.post('/auth/logout');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.api.get<User>('/auth/me');
    return response.data;
  }

  // ========== STUDENT EVALUATIONS ENDPOINTS ==========

  async getProfessorsToEvaluate(): Promise<{ professors: Professor[] }> {
    const response = await this.api.get<{ professors: Professor[] }>('/evaluations/professors');
    return response.data;
  }

  async getEvaluationStatus(): Promise<EvaluationStatus> {
    const response = await this.api.get<EvaluationStatus>('/evaluations/status');
    return response.data;
  }

  async createEvaluation(courseId: number, professorId: number): Promise<{ evaluationId: number; status: string }> {
    const response = await this.api.post('/evaluations', { courseId, professorId });
    return response.data;
  }

  async getEvaluation(evaluationId: number): Promise<{ evaluation: Evaluation; questions: Question[] }> {
    const response = await this.api.get(`/evaluations/${evaluationId}`);
    return response.data;
  }

  async saveResponses(evaluationId: number, responses: EvaluationResponse[]): Promise<{ message: string; saved: number }> {
    const response = await this.api.put(`/evaluations/${evaluationId}/responses`, { responses });
    return response.data;
  }

  async submitEvaluation(evaluationId: number): Promise<{ message: string; evaluationId: number; status: string }> {
    const response = await this.api.post(`/evaluations/${evaluationId}/submit`);
    return response.data;
  }

  // ========== ADMIN ENDPOINTS ==========

  async getDashboardStats(filters?: {
    facultyId?: number;
    level?: string;
    yearNumber?: number;
  }): Promise<DashboardStats> {
    const response = await this.api.get<DashboardStats>('/admin/dashboard', { params: filters });
    return response.data;
  }

  async getAdminFilterOptions(): Promise<{
    faculties: { id: number; name: string }[];
    levels: string[];
    years: number[];
    courseTypes: string[];
  }> {
    const response = await this.api.get('/admin/filter-options');
    return response.data;
  }

  async getAllProfessors(): Promise<{ professors: ProfessorSummary[] }> {
    const response = await this.api.get<{ professors: ProfessorSummary[] }>('/admin/professors');
    return response.data;
  }

  async getProfessorStats(professorId: number): Promise<ProfessorDetailedStats> {
    const response = await this.api.get<ProfessorDetailedStats>(`/admin/stats/professor/${professorId}`);
    return response.data;
  }

  async getCompletionStats(filters?: {
    facultyId?: number;
    programId?: number;
    yearId?: number;
    seriesId?: number;
    groupId?: number;
  }): Promise<any> {
    const response = await this.api.get('/admin/stats/completion', { params: filters });
    return response.data;
  }

  // ========== ADVANCED FILTERING ENDPOINTS ==========

  async getFilteredStats(filters?: {
    facultyId?: number;
    level?: string;
    yearNumber?: number;
    courseType?: string;
    semester?: string;
  }): Promise<any> {
    const response = await this.api.get('/admin/stats/filtered', { params: filters });
    return response.data;
  }

  async getDisciplineComparison(courseName: string, facultyId?: number): Promise<any> {
    const response = await this.api.get('/admin/stats/discipline', {
      params: { courseName, facultyId }
    });
    return response.data;
  }

  async getCourseNames(): Promise<{ courses: Array<{ name: string; professorCount: number }> }> {
    const response = await this.api.get('/admin/courses/names');
    return response.data;
  }

  async getYearStats(filters?: { facultyId?: number; level?: string }): Promise<any> {
    const response = await this.api.get('/admin/stats/by-year', { params: filters });
    return response.data;
  }

  async getCourseTypeStats(filters?: { facultyId?: number; yearNumber?: number }): Promise<any> {
    const response = await this.api.get('/admin/stats/by-course-type', { params: filters });
    return response.data;
  }

  // ========== PLATFORM SETTINGS ENDPOINTS ==========

  async getPlatformSettings(): Promise<any> {
    const response = await this.api.get('/platform/settings');
    return response.data;
  }

  async updatePlatformSettings(settings: {
    is_active?: boolean;
    closure_message?: string;
    auto_reminders_enabled?: boolean;
    reminder_days?: string;
    email_enabled?: boolean;
    email_host?: string;
    email_port?: number;
    email_secure?: boolean;
    email_user?: string;
    email_password?: string;
    email_from_name?: string;
    email_from_address?: string;
    send_email_on_message?: boolean;
  }): Promise<any> {
    const response = await this.api.put('/platform/settings', settings);
    return response.data;
  }

  async testEmail(testEmail: string): Promise<any> {
    const response = await this.api.post('/platform/test-email', { testEmail });
    return response.data;
  }

  // ========== MESSAGING ENDPOINTS ==========

  async sendMessage(data: {
    title: string;
    content: string;
    target_audience?: {
      facultyIds?: number[];
      yearNumbers?: number[];
      level?: string;
      seriesNames?: string[];
      groupIds?: number[];
    };
  }): Promise<any> {
    const response = await this.api.post('/platform/messages/send', data);
    return response.data;
  }

  async getMessageHistory(params?: {
    limit?: number;
    offset?: number;
    message_type?: string;
  }): Promise<any> {
    const response = await this.api.get('/platform/messages/history', { params });
    return response.data;
  }

  async getFilterOptions(): Promise<any> {
    const response = await this.api.get('/platform/filters/options');
    return response.data;
  }

  async getStudentMessages(): Promise<any> {
    const response = await this.api.get('/platform/messages/student');
    return response.data;
  }

  // ========== QUESTIONNAIRE MANAGEMENT ENDPOINTS ==========

  async getAllQuestions(): Promise<{ questions: Question[] }> {
    const response = await this.api.get('/questions');
    return response.data;
  }

  async createQuestion(question: {
    text: string;
    type: 'likert' | 'text';
    category: string;
    order_index?: number;
    is_required?: boolean;
  }): Promise<any> {
    const response = await this.api.post('/questions', question);
    return response.data;
  }

  async updateQuestion(id: number, question: {
    text: string;
    type: 'likert' | 'text';
    category: string;
    order_index: number;
    is_required: boolean;
  }): Promise<any> {
    const response = await this.api.put(`/questions/${id}`, question);
    return response.data;
  }

  async deleteQuestion(id: number): Promise<any> {
    const response = await this.api.delete(`/questions/${id}`);
    return response.data;
  }

  async reorderQuestions(questionIds: number[]): Promise<any> {
    const response = await this.api.post('/questions/reorder', { questionIds });
    return response.data;
  }

  // ========== USER PREFERENCES ENDPOINTS ==========

  async getUserPreferences(): Promise<{ preferences: AccessibilityPreferences }> {
    const response = await this.api.get<{ preferences: AccessibilityPreferences }>('/user/preferences');
    return response.data;
  }

  async updateUserPreferences(preferences: Partial<AccessibilityPreferences>): Promise<{
    message: string;
    preferences: AccessibilityPreferences;
  }> {
    const response = await this.api.put('/user/preferences', preferences);
    return response.data;
  }

  // ========== PROFESSOR ENDPOINTS ==========

  async getProfessorDashboard(): Promise<{
    summary: {
      totalEvaluations: number;
      overallAverage: number | null;
      uniqueStudents: number;
    };
    courseEvaluations: Array<{
      courseId: number;
      courseName: string;
      courseType: string;
      semester: string;
      evaluationCount: number;
      averageScore: number | null;
    }>;
    trend: {
      current: number | null;
      previous: number | null;
      change: number | null;
    };
  }> {
    const response = await this.api.get('/professor/dashboard');
    return response.data;
  }

  async getProfessorEvaluations(params?: {
    courseId?: number;
    semester?: string;
    academicYear?: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    evaluations: Array<{
      id: number;
      courseId: number;
      courseName: string;
      courseType: string;
      semester: string;
      academicYear: string;
      submittedAt: string;
      averageScore: number | null;
    }>;
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  }> {
    const response = await this.api.get('/professor/evaluations', { params });
    return response.data;
  }

  async getProfessorCourses(): Promise<{
    courses: Array<{
      id: number;
      name: string;
      courseType: string;
      semester: string;
      academicYear: string;
      statistics: {
        totalEvaluations: number;
        completedEvaluations: number;
        averageScore: number | null;
      };
    }>;
  }> {
    const response = await this.api.get('/professor/courses');
    return response.data;
  }

  async getProfessorCourseStats(courseId: number): Promise<{
    course: {
      id: number;
      name: string;
      courseType: string;
      semester: string;
      academicYear: string;
    };
    statistics: {
      totalEvaluations: number;
      averageScore: number | null;
    };
    questionDistribution: Array<{
      questionId: number;
      questionText: string;
      category: string;
      type: string;
      averageScore: number | null;
      responseCount: number;
      distribution: {
        score1: number;
        score2: number;
        score3: number;
        score4: number;
        score5: number;
      };
    }>;
    textFeedback: Array<{
      question: string;
      category: string;
      answer: string;
      submittedAt: string;
    }> | { message: string };
  }> {
    const response = await this.api.get(`/professor/courses/${courseId}/stats`);
    return response.data;
  }

  async exportProfessorData(params?: {
    courseId?: number;
    semester?: string;
    academicYear?: string;
  }): Promise<Blob> {
    const response = await this.api.get('/professor/export', {
      params,
      responseType: 'blob'
    });
    return response.data;
  }
}

export const api = new ApiService();
