import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { ConfirmDialog, AlertDialog } from '../components/AccessibleModal';
import { SuccessNotification, ErrorNotification } from '../components/LiveRegion';
import { useTabNavigation } from '../hooks/useTabNavigation';
import { FocusTrap } from '../components/a11y';

export default function AdminControls() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'platform' | 'messages' | 'filters' | 'disciplines' | 'questionnaire' | 'email'>('platform');

  // Platform settings state
  const [platformSettings, setPlatformSettings] = useState<any>(null);
  const [isActive, setIsActive] = useState(true);
  const [closureMessage, setClosureMessage] = useState('');
  const [autoReminders, setAutoReminders] = useState(true);
  const [reminderDays, setReminderDays] = useState('3,2,1');
  const [deadlineEnabled, setDeadlineEnabled] = useState(false);
  const [deadlineDate, setDeadlineDate] = useState('');
  const [autoCloseOnDeadline, setAutoCloseOnDeadline] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // Messaging state
  const [messageTitle, setMessageTitle] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [filterOptions, setFilterOptions] = useState<any>(null);
  const [selectedFaculties, setSelectedFaculties] = useState<number[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [selectedYears, setSelectedYears] = useState<number[]>([]);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageHistory, setMessageHistory] = useState<any[]>([]);

  // Advanced filters state
  const [statsFilter, setStatsFilter] = useState({
    facultyId: '',
    level: '',
    yearNumber: '',
    courseType: '',
    semester: ''
  });
  const [filteredStats, setFilteredStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Discipline comparison state
  const [courseNames, setCourseNames] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [disciplineComparison, setDisciplineComparison] = useState<any>(null);
  const [loadingDisciplines, setLoadingDisciplines] = useState(false);

  // Questionnaire management state
  const [questions, setQuestions] = useState<any[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [questionForm, setQuestionForm] = useState({
    text: '',
    type: 'likert' as 'likert' | 'text',
    category: '',
    is_required: true
  });

  // Email settings state
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [emailHost, setEmailHost] = useState('');
  const [emailPort, setEmailPort] = useState(587);
  const [emailSecure, setEmailSecure] = useState(false);
  const [emailUser, setEmailUser] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [emailFromName, setEmailFromName] = useState('Platformă Evaluare');
  const [emailFromAddress, setEmailFromAddress] = useState('');
  const [sendEmailOnMessage, setSendEmailOnMessage] = useState(true);
  const [testEmail, setTestEmail] = useState('');
  const [testingEmail, setTestingEmail] = useState(false);
  const [savingEmailSettings, setSavingEmailSettings] = useState(false);

  // Dialog states
  const [showConfirmPlatformOff, setShowConfirmPlatformOff] = useState(false);
  const [showConfirmPlatformSave, setShowConfirmPlatformSave] = useState(false);
  const [showConfirmSendMessage, setShowConfirmSendMessage] = useState(false);
  const [showConfirmDeleteQuestion, setShowConfirmDeleteQuestion] = useState(false);
  const [deleteQuestionId, setDeleteQuestionId] = useState<number | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    title: string;
    message: string;
    variant: 'info' | 'success' | 'error';
  }>({ title: '', message: '', variant: 'info' });

  // Ref for tab navigation
  const tablistRef = useRef<HTMLElement>(null);

  // Tab index mapping
  const tabOrder = ['platform', 'messages', 'filters', 'disciplines', 'questionnaire', 'email'] as const;
  const activeTabIndex = tabOrder.indexOf(activeTab);

  // Enable keyboard navigation for tabs (Arrow keys, Home/End)
  useTabNavigation({
    tablistRef,
    activeTabIndex,
    onTabChange: (index) => setActiveTab(tabOrder[index]),
    enabled: true,
    loop: true,
  });

  useEffect(() => {
    loadPlatformSettings();
    loadFilterOptions();
    loadMessageHistory();
    loadCourseNames();
    loadQuestions();
  }, []);

  // Helper function to show alert dialogs
  const showAlertDialog = (title: string, message: string, variant: 'info' | 'success' | 'error' = 'info') => {
    setAlertConfig({ title, message, variant });
    setShowAlert(true);
  };

  // Helper function for toggle switch keyboard support
  const handleToggleKeyDown = (event: React.KeyboardEvent, callback: () => void) => {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      callback();
    }
  };

  const loadCourseNames = async () => {
    try {
      const data = await api.getCourseNames();
      setCourseNames(data.courses || []);
    } catch (error) {
      console.error('Error loading course names:', error);
    }
  };

  const handleLoadDisciplineComparison = async () => {
    if (!selectedCourse) {
      showAlertDialog('Atenție', 'Selectează o disciplină', 'info');
      return;
    }

    try {
      setLoadingDisciplines(true);
      const data = await api.getDisciplineComparison(selectedCourse);
      setDisciplineComparison(data);
    } catch (error) {
      console.error('Error loading discipline comparison:', error);
    } finally {
      setLoadingDisciplines(false);
    }
  };

  const loadPlatformSettings = async () => {
    try {
      const data = await api.getPlatformSettings();
      setPlatformSettings(data);
      setIsActive(data.is_active);
      setClosureMessage(data.closure_message);
      setAutoReminders(data.auto_reminders_enabled);
      setReminderDays(data.reminder_days);
      setDeadlineEnabled(data.evaluation_deadline_enabled || false);
      setDeadlineDate(data.evaluation_deadline_date || '');
      setAutoCloseOnDeadline(data.auto_close_on_deadline || false);

      // Email settings
      setEmailEnabled(data.email_enabled || false);
      setEmailHost(data.email_host || '');
      setEmailPort(data.email_port || 587);
      setEmailSecure(data.email_secure || false);
      setEmailUser(data.email_user || '');
      setEmailPassword(data.email_password || '');
      setEmailFromName(data.email_from_name || 'Platformă Evaluare');
      setEmailFromAddress(data.email_from_address || '');
      setSendEmailOnMessage(data.send_email_on_message !== undefined ? data.send_email_on_message : true);
    } catch (error) {
      console.error('Error loading platform settings:', error);
    }
  };

  const handleTogglePlatform = () => {
    const newStatus = !isActive;

    if (!newStatus) {
      // Turning platform OFF - show warning
      setShowConfirmPlatformOff(true);
    } else {
      setIsActive(newStatus);
    }
  };

  const confirmPlatformOff = () => {
    setIsActive(false);
  };

  const savePlatformSettings = async () => {
    // Extra confirmation when saving platform as OFF
    if (!isActive && platformSettings?.is_active) {
      setShowConfirmPlatformSave(true);
      return;
    }

    await executeSavePlatformSettings();
  };

  const executeSavePlatformSettings = async () => {
    try {
      setSavingSettings(true);
      await api.updatePlatformSettings({
        is_active: isActive,
        closure_message: closureMessage,
        auto_reminders_enabled: autoReminders,
        reminder_days: reminderDays,
        evaluation_deadline_enabled: deadlineEnabled,
        evaluation_deadline_date: deadlineDate || null,
        auto_close_on_deadline: autoCloseOnDeadline
      });
      showAlertDialog('Succes', 'Setări salvate cu succes!', 'success');
      loadPlatformSettings();
    } catch (error: any) {
      showAlertDialog('Eroare', error.response?.data?.error || 'Eroare la salvarea setărilor', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  const saveEmailSettings = async () => {
    try {
      setSavingEmailSettings(true);

      await api.updatePlatformSettings({
        email_enabled: emailEnabled,
        email_host: emailHost,
        email_port: emailPort,
        email_secure: emailSecure,
        email_user: emailUser,
        email_password: emailPassword !== '********' ? emailPassword : undefined,
        email_from_name: emailFromName,
        email_from_address: emailFromAddress,
        send_email_on_message: sendEmailOnMessage
      });

      showAlertDialog('Succes', 'Setările email au fost salvate cu succes!', 'success');
      loadPlatformSettings();
    } catch (error: any) {
      showAlertDialog('Eroare', error.response?.data?.error || 'Eroare la salvarea setărilor email', 'error');
    } finally {
      setSavingEmailSettings(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail) {
      showAlertDialog('Atenție', 'Introdu o adresă de email pentru test', 'info');
      return;
    }

    try {
      setTestingEmail(true);

      const response = await api.testEmail(testEmail);
      showAlertDialog('Succes', `Email de test trimis cu succes către ${testEmail}! Verifică inbox-ul (sau spam-ul).`, 'success');
    } catch (error: any) {
      showAlertDialog('Eroare', `Eroare la trimiterea email-ului de test: ${error.response?.data?.details || error.response?.data?.error || 'Eroare necunoscută'}`, 'error');
    } finally {
      setTestingEmail(false);
    }
  };

  const loadFilterOptions = async () => {
    try {
      const data = await api.getFilterOptions();
      setFilterOptions(data);
    } catch (error) {
      console.error('Error loading filter options:', error);
    }
  };

  const loadMessageHistory = async () => {
    try {
      const data = await api.getMessageHistory({ limit: 20 });
      setMessageHistory(data.messages || []);
    } catch (error) {
      console.error('Error loading message history:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!messageTitle || !messageContent) {
      showAlertDialog('Atenție', 'Titlu și conținut sunt obligatorii', 'info');
      return;
    }

    setShowConfirmSendMessage(true);
  };

  const confirmSendMessage = async () => {
    // Build target audience
    const target_audience: any = {};
    if (selectedFaculties.length > 0) target_audience.facultyIds = selectedFaculties;
    if (selectedLevel) target_audience.level = selectedLevel;
    if (selectedYears.length > 0) target_audience.yearNumbers = selectedYears;

    try {
      setSendingMessage(true);
      const result = await api.sendMessage({
        title: messageTitle,
        content: messageContent,
        target_audience: Object.keys(target_audience).length > 0 ? target_audience : undefined
      });

      showAlertDialog('Succes', `Mesaj trimis cu succes către ${result.recipientsCount} studenți!`, 'success');
      setMessageTitle('');
      setMessageContent('');
      setSelectedFaculties([]);
      setSelectedLevel('');
      setSelectedYears([]);
      loadMessageHistory();
    } catch (error: any) {
      showAlertDialog('Eroare', error.response?.data?.error || 'Eroare la trimiterea mesajului', 'error');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleLoadFilteredStats = async () => {
    try {
      setLoadingStats(true);
      const filters: any = {};
      if (statsFilter.facultyId) filters.facultyId = parseInt(statsFilter.facultyId);
      if (statsFilter.level) filters.level = statsFilter.level;
      if (statsFilter.yearNumber) filters.yearNumber = parseInt(statsFilter.yearNumber);
      if (statsFilter.courseType) filters.courseType = statsFilter.courseType;
      if (statsFilter.semester) filters.semester = statsFilter.semester;

      const data = await api.getFilteredStats(filters);
      setFilteredStats(data);
    } catch (error) {
      console.error('Error loading filtered stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  // Questionnaire Management Functions
  const loadQuestions = async () => {
    try {
      setLoadingQuestions(true);
      const data = await api.getAllQuestions();
      setQuestions(data.questions || []);
    } catch (error) {
      console.error('Error loading questions:', error);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleSaveQuestion = async () => {
    if (!questionForm.text || !questionForm.category) {
      showAlertDialog('Atenție', 'Textul și categoria sunt obligatorii', 'info');
      return;
    }

    try {
      if (editingQuestion) {
        await api.updateQuestion(editingQuestion.id, {
          ...questionForm,
          order_index: editingQuestion.order_index
        });
        showAlertDialog('Succes', 'Întrebare actualizată cu succes!', 'success');
      } else {
        await api.createQuestion(questionForm);
        showAlertDialog('Succes', 'Întrebare creată cu succes!', 'success');
      }

      setShowQuestionForm(false);
      setEditingQuestion(null);
      setQuestionForm({ text: '', type: 'likert', category: '', is_required: true });
      loadQuestions();
    } catch (error: any) {
      showAlertDialog('Eroare', error.response?.data?.error || 'Eroare la salvarea întrebării', 'error');
    }
  };

  const handleEditQuestion = (question: any) => {
    setEditingQuestion(question);
    setQuestionForm({
      text: question.text,
      type: question.type,
      category: question.category,
      is_required: question.is_required
    });
    setShowQuestionForm(true);
  };

  const handleDeleteQuestion = async (id: number) => {
    setDeleteQuestionId(id);
    setShowConfirmDeleteQuestion(true);
  };

  const confirmDeleteQuestion = async () => {
    if (!deleteQuestionId) return;

    try {
      await api.deleteQuestion(deleteQuestionId);
      showAlertDialog('Succes', 'Întrebare ștearsă cu succes!', 'success');
      loadQuestions();
    } catch (error: any) {
      showAlertDialog('Eroare', error.response?.data?.error || 'Eroare la ștergerea întrebării', 'error');
    } finally {
      setDeleteQuestionId(null);
    }
  };

  const handleMoveQuestion = async (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === questions.length - 1)) {
      return;
    }

    const newQuestions = [...questions];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newQuestions[index], newQuestions[targetIndex]] = [newQuestions[targetIndex], newQuestions[index]];

    try {
      setQuestions(newQuestions);
      await api.reorderQuestions(newQuestions.map(q => q.id));
    } catch (error) {
      console.error('Error reordering questions:', error);
      loadQuestions(); // Reload on error
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Panou Control Platformă</h1>
        <button onClick={() => navigate('/admin')} className="btn btn-secondary">
          ← Înapoi la Dashboard
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav ref={tablistRef} className="-mb-px flex space-x-8" role="tablist" aria-label="Secțiuni panou control administrare">
          <button
            onClick={() => setActiveTab('platform')}
            role="tab"
            aria-selected={activeTab === 'platform'}
            aria-controls="panel-platform"
            id="tab-platform"
            tabIndex={activeTab === 'platform' ? 0 : -1}
            className={`${
              activeTab === 'platform'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium`}
          >
            Setări Platformă
          </button>
          <button
            onClick={() => setActiveTab('messages')}
            role="tab"
            aria-selected={activeTab === 'messages'}
            aria-controls="panel-messages"
            id="tab-messages"
            tabIndex={activeTab === 'messages' ? 0 : -1}
            className={`${
              activeTab === 'messages'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium`}
          >
            Mesaje Studenți
          </button>
          <button
            onClick={() => setActiveTab('filters')}
            role="tab"
            aria-selected={activeTab === 'filters'}
            aria-controls="panel-filters"
            id="tab-filters"
            tabIndex={activeTab === 'filters' ? 0 : -1}
            className={`${
              activeTab === 'filters'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium`}
          >
            Filtre Avansate
          </button>
          <button
            onClick={() => setActiveTab('disciplines')}
            role="tab"
            aria-selected={activeTab === 'disciplines'}
            aria-controls="panel-disciplines"
            id="tab-disciplines"
            tabIndex={activeTab === 'disciplines' ? 0 : -1}
            className={`${
              activeTab === 'disciplines'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium`}
          >
            Comparație Discipline
          </button>
          <button
            onClick={() => setActiveTab('questionnaire')}
            role="tab"
            aria-selected={activeTab === 'questionnaire'}
            aria-controls="panel-questionnaire"
            id="tab-questionnaire"
            tabIndex={activeTab === 'questionnaire' ? 0 : -1}
            className={`${
              activeTab === 'questionnaire'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium`}
          >
            Editare Chestionar
          </button>
          <button
            onClick={() => setActiveTab('email')}
            role="tab"
            aria-selected={activeTab === 'email'}
            aria-controls="panel-email"
            id="tab-email"
            tabIndex={activeTab === 'email' ? 0 : -1}
            className={`${
              activeTab === 'email'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium`}
          >
            Setări Email
          </button>
        </nav>
      </div>

      {/* Platform Settings Tab */}
      {activeTab === 'platform' && (
        <div className="card p-6 space-y-6" role="tabpanel" id="panel-platform" aria-labelledby="tab-platform">
          <h2 className="text-xl font-semibold text-gray-900">Setări Platformă</h2>

          {/* Platform ON/OFF Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="text-lg font-medium text-gray-900" id="platform-status-label">Status Platformă</h3>
              <p className="text-sm text-gray-600" id="platform-status-desc">
                {isActive ? 'Platforma este ACTIVĂ și accesibilă studenților' : 'Platforma este ÎNCHISĂ'}
              </p>
            </div>
            <button
              onClick={handleTogglePlatform}
              onKeyDown={(e) => handleToggleKeyDown(e, handleTogglePlatform)}
              role="switch"
              aria-checked={isActive}
              aria-labelledby="platform-status-label"
              aria-describedby="platform-status-desc"
              className={`${
                isActive ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
              } relative inline-flex h-12 w-24 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2`}
            >
              <span
                className={`${
                  isActive ? 'translate-x-14' : 'translate-x-1'
                } inline-block h-10 w-10 transform rounded-full bg-white transition-transform`}
                aria-hidden="true"
              />
              <span className="absolute inset-0 flex items-center justify-center text-white font-medium text-sm" aria-hidden="true">
                {isActive ? 'ON' : 'OFF'}
              </span>
              <ScreenReaderOnly>{isActive ? 'Platforma activă' : 'Platforma închisă'}</ScreenReaderOnly>
            </button>
          </div>

          {/* Closure Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mesaj de închidere platformă
            </label>
            <textarea
              value={closureMessage}
              onChange={(e) => setClosureMessage(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Mesajul afișat studenților când platforma este închisă"
            />
          </div>

          {/* Auto Reminders */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={autoReminders}
              onChange={(e) => setAutoReminders(e.target.checked)}
              className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <label className="text-sm font-medium text-gray-700">
              Remindere automate activate
            </label>
          </div>

          {/* Reminder Days */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Zile reminder (separate prin virgulă)
            </label>
            <input
              type="text"
              value={reminderDays}
              onChange={(e) => setReminderDays(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="3,2,1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Zilele înainte de deadline când se trimit remindere automate
            </p>
          </div>

          {/* Evaluation Deadline Section */}
          <div className="border-t border-gray-200 pt-4 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Deadline Evaluări</h3>

            {/* Enable Deadline */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="deadline-enabled"
                checked={deadlineEnabled}
                onChange={(e) => setDeadlineEnabled(e.target.checked)}
                className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="deadline-enabled" className="text-sm font-medium text-gray-700">
                Activează deadline pentru evaluări
              </label>
            </div>

            {/* Deadline Date/Time Picker */}
            {deadlineEnabled && (
              <div className="ml-6 space-y-3 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data și ora limită
                  </label>
                  <input
                    type="datetime-local"
                    value={deadlineDate}
                    onChange={(e) => setDeadlineDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Studenții nu vor mai putea completa evaluări după această dată
                  </p>
                </div>

                {/* Auto-close on Deadline */}
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="auto-close"
                    checked={autoCloseOnDeadline}
                    onChange={(e) => setAutoCloseOnDeadline(e.target.checked)}
                    className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="auto-close" className="text-sm text-gray-700">
                    Închide automat platforma la deadline
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Save Button */}
          <button
            onClick={savePlatformSettings}
            disabled={savingSettings}
            className="btn btn-primary w-full"
          >
            {savingSettings ? 'Se salvează...' : 'Salvează Setări'}
          </button>
        </div>
      )}

      {/* Messages Tab */}
      {activeTab === 'messages' && (
        <div className="space-y-6" role="tabpanel" id="panel-messages" aria-labelledby="tab-messages">
          {/* Send Message Form */}
          <div className="card p-6 space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Trimite Mesaj Studenți</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Titlu</label>
              <input
                type="text"
                value={messageTitle}
                onChange={(e) => setMessageTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Titlul mesajului"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Conținut</label>
              <textarea
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                rows={5}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Conținutul mesajului"
              />
            </div>

            {/* Filters */}
            {filterOptions && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Facultăți</label>
                  <select
                    multiple
                    value={selectedFaculties.map(String)}
                    onChange={(e) => setSelectedFaculties(Array.from(e.target.selectedOptions, opt => parseInt(opt.value)))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    size={3}
                  >
                    {filterOptions.faculties.map((f: any) => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nivel studii</label>
                  <select
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Toate</option>
                    <option value="licenta">Licență</option>
                    <option value="master">Master</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ani de studiu</label>
                  <select
                    multiple
                    value={selectedYears.map(String)}
                    onChange={(e) => setSelectedYears(Array.from(e.target.selectedOptions, opt => parseInt(opt.value)))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    size={3}
                  >
                    <option value="1">Anul 1</option>
                    <option value="2">Anul 2</option>
                    <option value="3">Anul 3</option>
                    <option value="4">Anul 4</option>
                  </select>
                </div>
              </div>
            )}

            <button
              onClick={handleSendMessage}
              disabled={sendingMessage}
              className="btn btn-primary w-full"
            >
              {sendingMessage ? 'Se trimite...' : 'Trimite Mesaj'}
            </button>
          </div>

          {/* Message History */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Istoric Mesaje</h2>
            <div className="space-y-3">
              {messageHistory.map((msg) => (
                <div key={msg.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">{msg.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{msg.content}</p>
                    </div>
                    <span className="text-xs text-gray-500">{msg.recipients_count} destinatari</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(msg.sent_at).toLocaleString('ro-RO')} - Trimis de {msg.sent_by_name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filters Tab */}
      {activeTab === 'filters' && (
        <div className="space-y-6" role="tabpanel" id="panel-filters" aria-labelledby="tab-filters">
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Statistici cu Filtre Avansate</h2>

            {filterOptions && (
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                <select
                  value={statsFilter.facultyId}
                  onChange={(e) => setStatsFilter({...statsFilter, facultyId: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Toate facultățile</option>
                  {filterOptions.faculties.map((f: any) => (
                    <option key={f.id} value={f.id}>{f.code}</option>
                  ))}
                </select>

                <select
                  value={statsFilter.level}
                  onChange={(e) => setStatsFilter({...statsFilter, level: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Toate nivelurile</option>
                  <option value="licenta">Licență</option>
                  <option value="master">Master</option>
                </select>

                <select
                  value={statsFilter.yearNumber}
                  onChange={(e) => setStatsFilter({...statsFilter, yearNumber: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Toți anii</option>
                  <option value="1">Anul 1</option>
                  <option value="2">Anul 2</option>
                  <option value="3">Anul 3</option>
                  <option value="4">Anul 4</option>
                </select>

                <select
                  value={statsFilter.courseType}
                  onChange={(e) => setStatsFilter({...statsFilter, courseType: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Toate tipurile</option>
                  <option value="curs">Curs</option>
                  <option value="laborator">Laborator</option>
                  <option value="seminar">Seminar</option>
                </select>

                <select
                  value={statsFilter.semester}
                  onChange={(e) => setStatsFilter({...statsFilter, semester: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Ambele semestre</option>
                  <option value="1">Semestrul 1</option>
                  <option value="2">Semestrul 2</option>
                </select>
              </div>
            )}

            <button
              onClick={handleLoadFilteredStats}
              disabled={loadingStats}
              className="btn btn-primary mb-4"
            >
              {loadingStats ? 'Se încarcă...' : 'Aplică Filtre'}
            </button>

            {/* Results Table */}
            {filteredStats && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Facultate</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Program</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nivel</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">An</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tip Curs</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completări</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rată %</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Scor Mediu</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredStats.stats.map((stat: any, idx: number) => (
                      <tr key={idx}>
                        <td className="px-6 py-4 text-sm text-gray-900">{stat.faculty_name}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{stat.program_name}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{stat.level === 'licenta' ? 'L' : 'M'}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{stat.year_number}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{stat.course_type}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{stat.completed}/{stat.total_evaluations}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{stat.completion_rate}%</td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {stat.average_score ? stat.average_score.toFixed(2) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Disciplines Tab */}
      {activeTab === 'disciplines' && (
        <div className="card p-6" role="tabpanel" id="panel-disciplines" aria-labelledby="tab-disciplines">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Comparație Profesori - Aceeași Disciplină</h2>
          <p className="text-gray-600 mb-6">
            Compară performanța profesorilor care predau aceeași disciplină
          </p>

          <div className="flex gap-4 mb-6">
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Selectează disciplina</option>
              {courseNames.map((course) => (
                <option key={course.name} value={course.name}>
                  {course.name} ({course.professorCount} profesori)
                </option>
              ))}
            </select>

            <button
              onClick={handleLoadDisciplineComparison}
              disabled={loadingDisciplines || !selectedCourse}
              className="btn btn-primary"
            >
              {loadingDisciplines ? 'Se încarcă...' : 'Compară'}
            </button>
          </div>

          {disciplineComparison && (
            <div>
              <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-900">Disciplina: {disciplineComparison.courseName}</h3>
                <p className="text-sm text-blue-700">{disciplineComparison.comparisons.length} profesori găsiți</p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Profesor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Titlu</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Departament</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Facultate</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tip Curs</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Evaluări</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rată %</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Scor Mediu</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {disciplineComparison.comparisons.map((comp: any, idx: number) => (
                      <tr key={idx} className={idx === 0 ? 'bg-green-50' : ''}>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {comp.professor_name}
                          {idx === 0 && <span className="ml-2 text-green-600">🏆</span>}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{comp.professor_title}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{comp.department}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{comp.faculty_name}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{comp.course_type}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{comp.completed}/{comp.total_evaluations}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{comp.completion_rate}%</td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`font-semibold ${
                            comp.average_score >= 4 ? 'text-green-600' :
                            comp.average_score >= 3 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {comp.average_score ? comp.average_score.toFixed(2) : '-'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Questionnaire Management Tab */}
      {activeTab === 'questionnaire' && (
        <div className="space-y-6" role="tabpanel" id="panel-questionnaire" aria-labelledby="tab-questionnaire">
          <div className="card p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Editare Chestionar de Evaluare</h2>
                <p className="text-gray-600 mt-1">Gestionează întrebările din chestionarul de evaluare</p>
              </div>
              <button
                onClick={() => {
                  setEditingQuestion(null);
                  setQuestionForm({ text: '', type: 'likert', category: '', is_required: true });
                  setShowQuestionForm(true);
                }}
                className="btn btn-primary"
              >
                + Adaugă Întrebare
              </button>
            </div>

            {/* Questions List */}
            {loadingQuestions ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Se încarcă...</p>
              </div>
            ) : questions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>Nu există întrebări în chestionar</p>
              </div>
            ) : (
              <div className="space-y-3">
                {questions.map((question, index) => (
                  <div key={question.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-start gap-4">
                      {/* Order Controls */}
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => handleMoveQuestion(index, 'up')}
                          disabled={index === 0}
                          className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
                          title="Mută în sus"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleMoveQuestion(index, 'down')}
                          disabled={index === questions.length - 1}
                          className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
                          title="Mută în jos"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>

                      {/* Question Content */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-semibold text-gray-500">#{index + 1}</span>
                          <span className={`px-2 py-1 text-xs font-medium rounded ${
                            question.type === 'likert'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {question.type === 'likert' ? 'Scală Likert' : 'Text liber'}
                          </span>
                          <span className="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-800">
                            {question.category}
                          </span>
                          {question.is_required && (
                            <span className="text-red-500 text-xs">* Obligatoriu</span>
                          )}
                        </div>
                        <p className="text-gray-900">{question.text}</p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditQuestion(question)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                          title="Editează"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(question.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                          title="Șterge"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Question Form Modal */}
          {showQuestionForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <FocusTrap enabled={showQuestionForm}>
                <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    {editingQuestion ? 'Editare Întrebare' : 'Întrebare Nouă'}
                  </h3>

                  <div className="space-y-4">
                    {/* Question Text */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Text Întrebare <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={questionForm.text}
                        onChange={(e) => setQuestionForm({ ...questionForm, text: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        rows={3}
                        placeholder="Introduceți textul întrebării..."
                      />
                    </div>

                    {/* Question Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tip Întrebare <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={questionForm.type}
                        onChange={(e) => setQuestionForm({ ...questionForm, type: e.target.value as 'likert' | 'text' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="likert">Scală Likert (1-5)</option>
                        <option value="text">Text liber</option>
                      </select>
                    </div>

                    {/* Category */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Categorie <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={questionForm.category}
                        onChange={(e) => setQuestionForm({ ...questionForm, category: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="ex: Metodologie predare, Evaluare, etc."
                      />
                    </div>

                    {/* Required */}
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="is_required"
                        checked={questionForm.is_required}
                        onChange={(e) => setQuestionForm({ ...questionForm, is_required: e.target.checked })}
                        className="h-4 w-4 text-primary-600 border-gray-300 rounded"
                      />
                      <label htmlFor="is_required" className="ml-2 text-sm text-gray-700">
                        Întrebare obligatorie
                      </label>
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                    <button
                      onClick={() => {
                        setShowQuestionForm(false);
                        setEditingQuestion(null);
                        setQuestionForm({ text: '', type: 'likert', category: '', is_required: true });
                      }}
                      className="btn btn-secondary"
                    >
                      Anulează
                    </button>
                    <button
                      onClick={handleSaveQuestion}
                      className="btn btn-primary"
                    >
                      {editingQuestion ? 'Actualizează' : 'Creează'} Întrebare
                    </button>
                  </div>
                </div>
              </div>
              </FocusTrap>
            </div>
          )}
        </div>
      )}

      {/* Email Settings Tab */}
      {activeTab === 'email' && (
        <div className="card p-6 space-y-6" role="tabpanel" id="panel-email" aria-labelledby="tab-email">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Setări Email</h2>
            <p className="text-sm text-gray-600 mt-1">
              Configurează sistemul de notificări email pentru studenți
            </p>
          </div>

          {/* Enable Email */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="text-lg font-medium text-gray-900" id="email-toggle-label">Activează Email Notifications</h3>
              <p className="text-sm text-gray-600" id="email-toggle-desc">
                Trimite notificări automate prin email către studenți
              </p>
            </div>
            <button
              onClick={() => setEmailEnabled(!emailEnabled)}
              onKeyDown={(e) => handleToggleKeyDown(e, () => setEmailEnabled(!emailEnabled))}
              role="switch"
              aria-checked={emailEnabled}
              aria-labelledby="email-toggle-label"
              aria-describedby="email-toggle-desc"
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                emailEnabled ? 'bg-primary-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  emailEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {emailEnabled && (
            <>
              {/* SMTP Configuration */}
              <div className="space-y-4 border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900">Configurare SMTP</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Email Host */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Server SMTP <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={emailHost}
                      onChange={(e) => setEmailHost(e.target.value)}
                      placeholder="smtp.gmail.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Ex: smtp.gmail.com, smtp.office365.com</p>
                  </div>

                  {/* Email Port */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Port SMTP <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={emailPort}
                      onChange={(e) => setEmailPort(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">587 (TLS) sau 465 (SSL)</p>
                  </div>

                  {/* Email User */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Username/Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={emailUser}
                      onChange={(e) => setEmailUser(e.target.value)}
                      placeholder="your-email@example.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  {/* Email Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Parolă <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={emailPassword}
                      onChange={(e) => setEmailPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Pentru Gmail, folosește App Password
                    </p>
                  </div>
                </div>

                {/* SSL/TLS Toggle */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="email-secure"
                    checked={emailSecure}
                    onChange={(e) => setEmailSecure(e.target.checked)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="email-secure" className="ml-2 text-sm text-gray-700">
                    Folosește SSL/TLS (port 465)
                  </label>
                </div>
              </div>

              {/* Sender Configuration */}
              <div className="space-y-4 border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900">Configurare Expeditor</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* From Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nume Expeditor <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={emailFromName}
                      onChange={(e) => setEmailFromName(e.target.value)}
                      placeholder="Platformă Evaluare"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  {/* From Address */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Expeditor <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={emailFromAddress}
                      onChange={(e) => setEmailFromAddress(e.target.value)}
                      placeholder="noreply@universitate.ro"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              </div>

              {/* Notification Settings */}
              <div className="space-y-4 border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900">Setări Notificări</h3>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="send-email-on-message"
                    checked={sendEmailOnMessage}
                    onChange={(e) => setSendEmailOnMessage(e.target.checked)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="send-email-on-message" className="ml-2 text-sm text-gray-700">
                    Trimite email când se postează un mesaj nou
                  </label>
                </div>
              </div>

              {/* Test Email */}
              <div className="space-y-4 border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900">Testare Configurație</h3>
                <p className="text-sm text-gray-600">
                  Trimite un email de test pentru a verifica dacă configurația funcționează corect
                </p>

                <div className="flex gap-3">
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="test@example.com"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
                  />
                  <button
                    onClick={handleTestEmail}
                    disabled={testingEmail || !testEmail}
                    className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {testingEmail ? 'Se trimite...' : 'Trimite Test'}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Save Button */}
          <div className="flex justify-end pt-6 border-t">
            <button
              onClick={saveEmailSettings}
              disabled={savingEmailSettings}
              className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {savingEmailSettings ? 'Se salvează...' : '💾 Salvează Setările Email'}
            </button>
          </div>

          {/* Help Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">ℹ️ Informații Utile</h4>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Pentru Gmail: Activează "2-Step Verification" și generează un "App Password"</li>
              <li>Pentru Office 365: Folosește credențialele normale de email</li>
              <li>Asigură-te că serverul SMTP permite trimiterea de emailuri</li>
              <li>Verifică inbox-ul și folderul spam pentru email-urile de test</li>
            </ul>
          </div>
        </div>
      )}

      {/* Accessible Dialogs */}
      <ConfirmDialog
        isOpen={showConfirmPlatformOff}
        onClose={() => setShowConfirmPlatformOff(false)}
        onConfirm={confirmPlatformOff}
        title="Închidere Platformă"
        message="ATENȚIE! Vrei să ÎNCHIZI platforma? Studenții NU vor mai putea accesa evaluările până când o reactivezi. Ești sigur?"
        confirmText="Da, închide platforma"
        cancelText="Anulează"
        variant="danger"
      />

      <ConfirmDialog
        isOpen={showConfirmPlatformSave}
        onClose={() => setShowConfirmPlatformSave(false)}
        onConfirm={executeSavePlatformSettings}
        title="Salvare Platformă Închisă"
        message="Confirmi că vrei să salvezi platforma ca ÎNCHISĂ? Studenții nu vor putea evalua până la reactivare."
        confirmText="Da, salvează"
        cancelText="Anulează"
        variant="warning"
      />

      <ConfirmDialog
        isOpen={showConfirmSendMessage}
        onClose={() => setShowConfirmSendMessage(false)}
        onConfirm={confirmSendMessage}
        title="Confirmare Trimitere Mesaj"
        message={`Ești sigur că vrei să trimiți mesajul "${messageTitle}"? ${
          selectedFaculties.length > 0 || selectedLevel || selectedYears.length > 0
            ? 'Cu filtrele selectate'
            : 'Către toți studenții'
        }`}
        confirmText="Trimite mesajul"
        cancelText="Anulează"
        variant="info"
      />

      <ConfirmDialog
        isOpen={showConfirmDeleteQuestion}
        onClose={() => {
          setShowConfirmDeleteQuestion(false);
          setDeleteQuestionId(null);
        }}
        onConfirm={confirmDeleteQuestion}
        title="Ștergere Întrebare"
        message="Sigur vrei să ștergi această întrebare? Această acțiune nu poate fi anulată."
        confirmText="Șterge întrebarea"
        cancelText="Anulează"
        variant="danger"
      />

      <AlertDialog
        isOpen={showAlert}
        onClose={() => setShowAlert(false)}
        title={alertConfig.title}
        message={alertConfig.message}
        variant={alertConfig.variant}
      />
    </div>
  );
}
