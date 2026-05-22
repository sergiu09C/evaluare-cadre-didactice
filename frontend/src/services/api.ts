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
  NotificationsResponse,
  AchievementsResponse,
  EvaluationHistoryResponse,
  ClosingLoopEntry,
  ClosingLoopEntryAdmin,
  AdminUser,
  ProfessorStudentsList,
} from '../types';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: import.meta.env.VITE_API_URL || '/api',
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

    // Interceptor pentru erori — logout doar pe 401 (token invalid/expirat).
    // 403 = authenticated dar regula de business interzice (ex: platforma închisă,
    // deadline depășit). NU dezloghează.
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
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

  async forgotPassword(email: string): Promise<{ ok: boolean; message: string }> {
    const r = await this.api.post('/auth/forgot-password', { email });
    return r.data;
  }

  async resetPassword(token: string, password: string): Promise<{ ok: boolean; message: string }> {
    const r = await this.api.post('/auth/reset-password', { token, password });
    return r.data;
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

  // ===== Rich dashboards =====
  async getPublicFilterOptions(): Promise<{
    faculties: Array<{ id: number; name: string; code: string }>;
    programs: Array<{
      id: number;
      name: string;
      code: string;
      level: string;
      faculty_id: number;
      faculty_name: string;
      departments?: string[];
    }>;
    departments: Array<{
      name: string;
      faculty_id: number;
      faculty_name: string;
      programs?: number[];
    }>;
    years: number[];
    semesters: string[];
    academicYears: string[];
    courseTypes: string[];
    levels: string[];
    categories: string[];
  }> {
    const r = await this.api.get('/platform/filter-options-public');
    return r.data;
  }

  async getHeatmap(params: {
    rowDim?: 'faculty' | 'program' | 'department';
    colDim?: 'category' | 'semester' | 'year' | 'courseType';
    facultyId?: number;
    programId?: number;
    programLevel?: string;
    departmentId?: string;
    year?: number;
    semester?: string;
    courseType?: string;
    academicYear?: string;
  } = {}): Promise<{
    rowDim: string;
    colDim: string;
    rows: string[];
    cols: string[];
    cells: Array<{ row: string; col: string; n: number; avg: number | null }>;
  }> {
    const r = await this.api.get('/platform/heatmap', { params });
    return r.data;
  }

  async getGroupedBar(params: {
    groupBy?: 'faculty' | 'department' | 'program';
    splitBy?: 'semester' | 'courseType' | 'year';
    [k: string]: any;
  } = {}): Promise<{
    groupBy: string;
    splitBy: string;
    splits: string[];
    data: Array<{ group: string; [k: string]: any }>;
  }> {
    const r = await this.api.get('/platform/grouped-bar', { params });
    return r.data;
  }

  async getTopRankings(params: {
    entity?: 'professors' | 'courses' | 'departments';
    metric?: 'avg' | 'count';
    limit?: number;
    order?: 'desc' | 'asc';
    [k: string]: any;
  } = {}): Promise<{
    entity: string;
    metric: string;
    order: string;
    limit: number;
    items: Array<Record<string, any>>;
  }> {
    const r = await this.api.get('/platform/top-rankings', { params });
    return r.data;
  }

  async getTimeSeriesMonthly(params: { months?: number; [k: string]: any } = {}): Promise<{
    months: number;
    data: Array<{ month: string; submissions: number; avg_score: number | null }>;
  }> {
    const r = await this.api.get('/platform/time-series-monthly', { params });
    return r.data;
  }

  async getHomeStats(params?: {
    facultyId?: number;
    programId?: number;
    programLevel?: string;
    departmentId?: string;
    year?: number;
    semester?: string;
    courseType?: string;
    academicYear?: string;
    category?: string;
    days?: number;
  }): Promise<{
    role: 'student' | 'professor' | 'admin';
    filters: {
      facultyId: number | null;
      programId: number | null;
      programLevel: string | null;
      departmentId: string | null;
      year: number | null;
      semester: string | null;
      courseType: string | null;
      academicYear: string | null;
      category: string | null;
      days: number;
    };
    faculties: Array<{ id: number; name: string; code: string }>;
    hero: {
      totalStudents: number;
      totalProfessors: number;
      totalEvaluations: number;
      submittedThisMonth: number;
      overallAvg: number | null;
      completionRate: number;
      eligibleStudents: number;
      maxPossibleEvaluations: number;
      studentsWithRemaining?: number;
      studentsCompletedAll?: number;
    };
    scoreDistribution: { [k: string]: number };
    facultyBreakdown: Array<{ faculty_id: number; faculty_name: string; code: string; evaluations: number; avg_score: number | null }>;
    evalsByYear: Array<{ year: number; n: number }>;
    evalsByLevel: Array<{ level: string; n: number; avg: number | null }>;
    evalsByYearAndFaculty: Array<{ year: number; faculty: string; facultyName: string; n: number }>;
    actionsTotal: { proposed: number; accepted: number; completed: number; rejected: number };
    actionsByFaculty: Array<{ faculty_code: string; faculty_name: string; status: string; n: number }>;
    actionsByLevel: Array<{ level: string; status: string; n: number }>;
    myFacultyId: number | null;
    myFacultyName: string | null;
    myDepartment: string | null;
    myProfessorId: number | null;
    participation: {
      university: { evaluated: number; eligible: number; rate: number };
      faculty: { faculty_id: number; faculty_name: string; evaluated: number; eligible: number; rate: number } | null;
      me: { evaluated: number; eligible: number; rate: number } | null;
    };
    timeSeries: Array<{ day: string; n: number }>;
    categoryAverages: Array<{ category: string; avg: number | null; n: number }>;
    roleDistribution: { student: number; professor: number; admin: number };
    pipeline: Array<{ stage: string; label: string; value: number }>;
    closing_loop: {
      messages_open: number;
      messages_in_progress?: number;
      messages_answered: number;
      messages_closed?: number;
      messages_total?: number;
    };
    personal: Record<string, number | null> | null;
  }> {
    const r = await this.api.get('/platform/home-stats', { params });
    return r.data;
  }


  async getPlatformStatus(): Promise<{
    is_active: boolean;
    closure_message: string | null;
    deadline: string | null;
    deadline_passed?: boolean;
    evaluations_accepted?: boolean;
    platform_feedback_active?: boolean;
  }> {
    const response = await this.api.get<{
      is_active: boolean;
      closure_message: string | null;
      deadline: string | null;
      deadline_passed?: boolean;
      evaluations_accepted?: boolean;
      platform_feedback_active?: boolean;
    }>('/platform/status');
    return response.data;
  }

  async getNotifications(): Promise<NotificationsResponse> {
    const response = await this.api.get<NotificationsResponse>('/notifications');
    return response.data;
  }

  async getAchievements(): Promise<AchievementsResponse> {
    const response = await this.api.get<AchievementsResponse>('/student/achievements');
    return response.data;
  }

  async getEvaluationHistory(): Promise<EvaluationHistoryResponse> {
    const response = await this.api.get<EvaluationHistoryResponse>('/student/evaluation-history');
    return response.data;
  }

  async getFeedbackStats(): Promise<any> {
    const response = await this.api.get('/student/feedback-stats');
    return response.data;
  }

  // ========== CLOSING-THE-LOOP ==========
  async getClosingLoop(): Promise<{ entries: ClosingLoopEntry[] }> {
    const response = await this.api.get<{ entries: ClosingLoopEntry[] }>('/closing-the-loop');
    return response.data;
  }

  async getClosingLoopAdmin(): Promise<{ entries: ClosingLoopEntryAdmin[] }> {
    const response = await this.api.get<{ entries: ClosingLoopEntryAdmin[] }>('/closing-the-loop/admin');
    return response.data;
  }

  async createClosingLoop(data: Partial<ClosingLoopEntryAdmin>): Promise<{ id: number }> {
    const response = await this.api.post<{ id: number }>('/closing-the-loop', data);
    return response.data;
  }

  async updateClosingLoop(id: number, data: Partial<ClosingLoopEntryAdmin>): Promise<void> {
    await this.api.put(`/closing-the-loop/${id}`, data);
  }

  async deleteClosingLoop(id: number): Promise<void> {
    await this.api.delete(`/closing-the-loop/${id}`);
  }

  // ========== ADMIN USERS CRUD ==========
  async getAdminUsers(params?: {
    role?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{
    users: AdminUser[];
    pagination?: { page: number; pageSize: number; total: number; totalPages: number; hasMore: boolean };
  }> {
    const response = await this.api.get<{
      users: AdminUser[];
      pagination?: { page: number; pageSize: number; total: number; totalPages: number; hasMore: boolean };
    }>('/admin/users', { params });
    return response.data;
  }

  async getAdminUserCounts(
    params?: { search?: string },
  ): Promise<{ counts: { all: number; student: number; professor: number; admin: number } }> {
    const response = await this.api.get<{ counts: { all: number; student: number; professor: number; admin: number } }>(
      '/admin/users/counts',
      { params },
    );
    return response.data;
  }

  async createAdminUser(data: Partial<AdminUser> & { password: string }): Promise<{ id: number }> {
    const response = await this.api.post<{ id: number }>('/admin/users', data);
    return response.data;
  }

  async updateAdminUser(id: number, data: Partial<AdminUser>): Promise<void> {
    await this.api.put(`/admin/users/${id}`, data);
  }

  async deactivateAdminUser(id: number): Promise<void> {
    await this.api.delete(`/admin/users/${id}`);
  }

  // ========== PROFESSOR PROFILE EDITOR (admin) ==========
  async getProfessorProfile(userId: number): Promise<{
    professor: { id: number; facultyId: number | null; facultyName: string | null; department: string | null } | null;
    courses: Array<{
      id: number;
      name: string;
      activity: 'curs' | 'seminar' | 'laborator';
      semester: string;
      year: number;
      program: string;
      programLevel: string;
      programFacultyId: number;
    }>;
  }> {
    const r = await this.api.get(`/admin/users/${userId}/professor-profile`);
    return r.data;
  }

  async lookupCourses(params?: { facultyId?: number; search?: string }): Promise<{
    courses: Array<{
      id: number;
      name: string;
      activity: 'curs' | 'seminar' | 'laborator';
      semester: string;
      year: number;
      program: string;
      programLevel: string;
      currentProfessor: string | null;
    }>;
  }> {
    const r = await this.api.get('/admin/lookup/courses', { params });
    return r.data;
  }

  async lookupDepartments(params?: { facultyId?: number }): Promise<{ departments: string[] }> {
    const r = await this.api.get('/admin/lookup/departments', { params });
    return r.data;
  }

  // ========== PROFESSOR EVALUATION DETAILS (individual, full) ==========
  async getEvaluationDetails(evaluationId: number): Promise<{
    evaluation: {
      id: number;
      anon_id: string;
      submitted_at: string;
      course: {
        id: number;
        name: string;
        code: string;
        courseType: string;
        semester: string;
        academicYear: string;
      };
      average: number | null;
      score_distribution: { [k: string]: number };
      responses: Array<{
        question_id: number;
        question_text: string;
        category: string;
        question_type: string;
        likert: number | null;
        text: string | null;
      }>;
    };
  }> {
    const r = await this.api.get(`/professor/evaluations/${evaluationId}/details`);
    return r.data;
  }

  // ========== PROFESSOR DRILL-DOWN PER EVALUARE ==========
  async getCourseEvaluations(courseId: number): Promise<{
    threshold_met: boolean;
    min_required: number;
    total_evaluations: number;
    evaluations: Array<{
      anon_id: string;
      submitted_month: string;
      average: number | null;
      responses: Array<{
        question_id: number;
        question_text: string;
        category: string;
        likert: number | null;
        text: string | null;
      }>;
    }>;
    message?: string;
  }> {
    const r = await this.api.get(`/professor/courses/${courseId}/evaluations`);
    return r.data as any;
  }

  // ========== PROFESSOR TREND ==========
  async getProfessorTrend(): Promise<{ trend: Array<{ period: string; avg: number; count: number }> }> {
    const response = await this.api.get<{ trend: Array<{ period: string; avg: number; count: number }> }>('/professor/trend');
    return response.data;
  }

  // ========== PROFESSOR STUDENTS LIST (anonimizat) ==========
  async getProfessorStudentsList(): Promise<ProfessorStudentsList> {
    const response = await this.api.get<ProfessorStudentsList>('/professor/students-list');
    return response.data;
  }

  // ========== ACHIEVEMENTS (dynamic, admin-editable) ==========
  async getDynamicAchievements(): Promise<{
    achievements: Array<{ id: number; key: string; title: string; description: string; icon: string; tone: string; earned: boolean; earnedAt: string | null }>;
    totalBadges: number;
    totalPossible: number;
  }> {
    const response = await this.api.get('/achievements/user');
    return response.data;
  }

  async getAchievementDefinitions(): Promise<{
    definitions: Array<{ id: number; key: string; title: string; description: string; icon: string; tone: string; criteria_type: string; threshold: number; is_active: number }>;
  }> {
    const response = await this.api.get('/achievements/definitions');
    return response.data;
  }

  async createAchievementDef(data: any): Promise<{ id: number }> {
    const response = await this.api.post('/achievements/definitions', data);
    return response.data;
  }

  async updateAchievementDef(id: number, data: any): Promise<void> {
    await this.api.put(`/achievements/definitions/${id}`, data);
  }

  async deleteAchievementDef(id: number): Promise<void> {
    await this.api.delete(`/achievements/definitions/${id}`);
  }

  // ========== PLATFORM FEEDBACK ==========
  async getPlatformFeedbackQuestions(): Promise<{ questions: any[]; submissionCount: number }> {
    const response = await this.api.get('/platform-feedback/questions');
    return response.data;
  }

  async submitPlatformFeedback(
    responses: any[],
  ): Promise<{ ok: boolean; submissionId: number; count: number; submissionCount: number }> {
    const response = await this.api.post('/platform-feedback/submit', { responses });
    return response.data;
  }

  async listMyPlatformFeedbackSubmissions(): Promise<{
    submissions: Array<{ id: number; submitted_at: string; responseCount: number }>;
  }> {
    const r = await this.api.get('/platform-feedback/history');
    return r.data;
  }

  async getMyPlatformFeedbackSubmission(id: number): Promise<{
    submission: { id: number; submittedAt: string };
    items: Array<{
      questionId: number;
      text: string;
      type: 'likert' | 'text' | 'choice';
      category: string | null;
      options: string[];
      response: { likert: number | null; text: string | null; choice: string | null };
    }>;
  }> {
    const r = await this.api.get(`/platform-feedback/history/${id}`);
    return r.data;
  }

  // === Free-form messages cu closing-loop ===
  async createPlatformFeedbackMessage(data: {
    subject?: string;
    message: string;
    category?: string;
  }): Promise<{ id: number }> {
    const r = await this.api.post('/platform-feedback/messages', data);
    return r.data;
  }

  async listMyPlatformFeedbackMessages(): Promise<{ messages: any[] }> {
    const r = await this.api.get('/platform-feedback/messages/mine');
    return r.data;
  }

  async adminListPlatformFeedbackMessages(params?: { status?: string; role?: string }): Promise<{
    messages: any[];
  }> {
    const r = await this.api.get('/platform-feedback/admin/messages', { params });
    return r.data;
  }

  async adminRespondPlatformFeedbackMessage(
    id: number,
    response: string,
    status: 'open' | 'in_progress' | 'answered' | 'closed' = 'answered',
  ): Promise<{ ok: boolean }> {
    const r = await this.api.post(`/platform-feedback/admin/messages/${id}/respond`, {
      response,
      status,
    });
    return r.data;
  }

  async adminUpdatePlatformFeedbackMessageStatus(
    id: number,
    status: 'open' | 'in_progress' | 'answered' | 'closed',
  ): Promise<{ ok: boolean }> {
    const r = await this.api.patch(`/platform-feedback/admin/messages/${id}/status`, { status });
    return r.data;
  }

  async adminListPlatformFeedbackQuestions(): Promise<{ questions: any[] }> {
    const response = await this.api.get('/platform-feedback/admin/questions');
    return response.data;
  }

  async adminCreatePlatformFeedbackQuestion(data: any): Promise<{ id: number }> {
    const response = await this.api.post('/platform-feedback/admin/questions', data);
    return response.data;
  }

  async adminUpdatePlatformFeedbackQuestion(id: number, data: any): Promise<void> {
    await this.api.put(`/platform-feedback/admin/questions/${id}`, data);
  }

  async adminDeletePlatformFeedbackQuestion(id: number): Promise<void> {
    await this.api.delete(`/platform-feedback/admin/questions/${id}`);
  }

  async adminPlatformFeedbackReport(): Promise<{ report: any[]; total_respondents: number }> {
    const response = await this.api.get('/platform-feedback/admin/report');
    return response.data;
  }

  // ========== ACTIONS WORKFLOW ==========
  async listActionTemplates(): Promise<{ templates: any[] }> {
    const r = await this.api.get('/actions/templates');
    return r.data;
  }
  async createActionTemplate(data: any): Promise<{ id: number }> {
    const r = await this.api.post('/actions/templates', data);
    return r.data;
  }
  async deleteActionTemplate(id: number): Promise<void> {
    await this.api.delete(`/actions/templates/${id}`);
  }
  async proposeAction(data: { professor_id: number; template_id?: number | null; title: string; description?: string; category?: string }): Promise<{ id: number }> {
    const r = await this.api.post('/actions/propose', data);
    return r.data;
  }
  async adminListActions(params?: { professor_id?: number; status?: string }): Promise<{ actions: any[] }> {
    const r = await this.api.get('/actions/admin/list', { params });
    return r.data;
  }
  async adminActionsSummary(professor_id: number): Promise<any> {
    const r = await this.api.get('/actions/admin/summary', { params: { professor_id } });
    return r.data;
  }
  async professorListActions(): Promise<{ actions: any[] }> {
    const r = await this.api.get('/actions/my');
    return r.data;
  }
  async professorRespondAction(id: number, decision: 'accepted' | 'rejected' | 'completed', notes?: string): Promise<void> {
    await this.api.put(`/actions/my/${id}/respond`, { decision, notes });
  }

  // ========== GUIDES ==========
  async getGuide(role: 'student' | 'professor' | 'admin'): Promise<{ role: string; title: string; body: string; updated_at: string }> {
    const response = await this.api.get<{ role: string; title: string; body: string; updated_at: string }>(`/guides/${role}`);
    return response.data;
  }

  async getAllGuides(): Promise<{ guides: Array<{ role: string; title: string; body: string; updated_at: string }> }> {
    const response = await this.api.get<{ guides: Array<{ role: string; title: string; body: string; updated_at: string }> }>('/guides');
    return response.data;
  }

  async updateGuide(role: 'student' | 'professor' | 'admin', data: { title: string; body: string }): Promise<void> {
    await this.api.put(`/guides/${role}`, data);
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

  async exportAracis(): Promise<Blob> {
    const response = await this.api.get('/admin/export/aracis', { responseType: 'blob' });
    return response.data;
  }
}

export const api = new ApiService();
