// src/app/App.tsx - ИСПРАВЛЕННАЯ ВЕРСИЯ
import { useState, useEffect } from "react";
import axios from "axios";
import { VacancyCard } from "../feature/VacancyCard";
import styles from './styles.module.scss';
import { ResumeUploader } from "../feature/ResumeUploader";
import { BaseLayout } from '../shared/BaseLayout';
import { Sidebar } from '../feature/Sidebar';
import { LogoApp } from '../components/logoApp';
import { Button } from '../components/Button';
import { Alert } from '../components/Alert';

interface ResumeAnalysis {
  skills: string[];
  experience_years: number;
  email?: string;
  phone?: string;
}

interface VacancyMatch {
  vacancy: any;
  similarity: number;
  match_score: number;
}

interface BotStatus {
  is_running: boolean;
  applications_sent: number;
  daily_limit: number;
  last_application: string | null;
}

interface Application {
  id: number;
  vacancy_id: string;
  status: string;
  applied_at: string;
  auto_applied: boolean;
}

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [resumeId, setResumeId] = useState<number | null>(null);
  const [resumeAnalysis, setResumeAnalysis] = useState<ResumeAnalysis | null>(null);
  const [matches, setMatches] = useState<VacancyMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState("python разработчик");
  const [minSimilarity, setMinSimilarity] = useState(0.3);

  // Bot state
  const [botStatus, setBotStatus] = useState<BotStatus>({
    is_running: false,
    applications_sent: 0,
    daily_limit: 50,
    last_application: null
  });

  const [applications, setApplications] = useState<Application[]>([]);
  const [activeTab, setActiveTab] = useState<'search' | 'applications' | 'bot'>('search');

  // Search vacancies - ИСПРАВЛЕНА ЛОГИКА
  const searchVacancies = async (rId?: number, pageNum = 0, reset = false) => {
    const targetResumeId = rId || resumeId;

    if (!targetResumeId) {
      console.log('No resume ID available for search');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = {
        resume_id: targetResumeId,
        query: searchQuery,
        page: pageNum,
        min_similarity: minSimilarity
      };

      console.log('Searching with params:', params);

      const response = await axios.get("http://localhost:8000/match-vacancies", { params });

      if (reset || pageNum === 0) {
        setMatches(response.data.matches);
      } else {
        setMatches(prev => [...prev, ...response.data.matches]);
      }

      setPage(pageNum);
      setHasMore(response.data.has_more);

      console.log(`Found ${response.data.matches.length} matches`);

    } catch (e: any) {
      console.error('Search error:', e);
      setError(e.response?.data?.detail || "Ошибка при поиске вакансий");
    } finally {
      setLoading(false);
    }
  };

  // Upload resume and analyze - ИСПРАВЛЕН АВТОПОИСК
  const uploadResume = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      console.log('Uploading resume...');
      const response = await axios.post("http://localhost:8000/upload-resume", formData);

      console.log('Resume uploaded:', response.data);

      const newResumeId = response.data.resume_id;
      setResumeId(newResumeId);
      setResumeAnalysis(response.data.analysis);

      // Автоматически запускаем поиск с новым resume_id
      console.log('Starting auto-search with resume_id:', newResumeId);

      // Используем setTimeout чтобы дать состоянию обновиться
      setTimeout(async () => {
        try {
          await searchVacancies(newResumeId, 0, true);
        } catch (searchError) {
          console.error('Auto-search failed:', searchError);
        }
      }, 100);

    } catch (e: any) {
      console.error('Upload error:', e);
      setError(e.response?.data?.detail || "Ошибка при загрузке резюме");
    } finally {
      // Не убираем loading сразу, так как начался поиск
      // setLoading(false);
    }
  };

  // Load more vacancies
  const loadMore = () => {
    if (hasMore && !loading) {
      searchVacancies(undefined, page + 1);
    }
  };

  // Manual apply to vacancy
  const applyToVacancy = async (vacancyId: string, coverLetter: string = "") => {
    if (!resumeId) return;

    try {
      await axios.post("http://localhost:8000/apply-to-vacancy", {
        vacancy_id: vacancyId,
        resume_id: resumeId,
        cover_letter: coverLetter
      });

      // Refresh applications
      loadApplications();

    } catch (e: any) {
      setError(e.response?.data?.detail || "Ошибка при отклике");
    }
  };

  // Load applications history
  const loadApplications = async () => {
    if (!resumeId) return;

    try {
      const response = await axios.get(`http://localhost:8000/applications?resume_id=${resumeId}`);
      setApplications(response.data.applications);
    } catch (e: any) {
      setError(e.response?.data?.detail || "Ошибка загрузки откликов");
    }
  };

  // Start auto application
  const startBot = async () => {
    if (!resumeId) return;

    try {
      await axios.post("http://localhost:8000/bot/start-auto-apply", {
        resume_id: resumeId,
        min_similarity: minSimilarity,
        max_applications: botStatus.daily_limit
      });

      setBotStatus(prev => ({ ...prev, is_running: true }));
      startStatusPolling();

    } catch (e: any) {
      setError(e.response?.data?.detail || "Ошибка запуска бота");
    }
  };

  // Stop auto application
  const stopBot = async () => {
    try {
      await axios.post("http://localhost:8000/bot/stop-auto-apply");
      setBotStatus(prev => ({ ...prev, is_running: false }));
      stopStatusPolling();
    } catch (e: any) {
      setError(e.response?.data?.detail || "Ошибка остановки бота");
    }
  };

  // Status polling
  const [statusInterval, setStatusInterval] = useState<NodeJS.Timeout | null>(null);

  const startStatusPolling = () => {
    const interval = setInterval(async () => {
      try {
        const response = await axios.get("http://localhost:8000/bot/application-status");
        setBotStatus(prev => ({
          ...prev,
          applications_sent: response.data.sent,
          last_application: response.data.recent_applications[0]?.applied_at || null
        }));

        // Also refresh applications list
        loadApplications();

      } catch (e) {
        console.error("Status polling error:", e);
      }
    }, 30000); // Every 30 seconds

    setStatusInterval(interval);
  };

  const stopStatusPolling = () => {
    if (statusInterval) {
      clearInterval(statusInterval);
      setStatusInterval(null);
    }
  };

  // Load applications when resumeId changes
  useEffect(() => {
    if (resumeId) {
      loadApplications();
    }
  }, [resumeId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (statusInterval) {
        clearInterval(statusInterval);
      }
    };
  }, [statusInterval]);


  const renderSearchTab = () => (
    <>
      <div>
        <ResumeUploader onFileSelect={setFile} disabled={loading} />

      {!resumeId && (
        <Button
          onClick={uploadResume}
          disabled={loading || !file}
          label={loading ? "Загрузка и поиск..." : "Загрузить резюме"}
        />
      )}
      </div>

      <div>
        {resumeAnalysis && (
        <div className={styles.resumeAnalysis}>
          <h3>Анализ резюме:</h3>
          <p><strong>Опыт:</strong> {resumeAnalysis.experience_years} лет</p>
          <p><strong>Навыки:</strong> {resumeAnalysis.skills.slice(0, 10).join(", ")}</p>
          {resumeAnalysis.email && <p><strong>Email:</strong> {resumeAnalysis.email}</p>}
          {resumeAnalysis.phone && <p><strong>Телефон:</strong> {resumeAnalysis.phone}</p>}
        </div>
      )}

      {resumeId && (
        <div className={styles.searchControls}>
          <div className={styles.inputGroup}>
            <label>Поисковый запрос:</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="python разработчик"
              className={styles.searchInput}
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Минимальное совпадение: {Math.round(minSimilarity * 100)}%</label>
            <input
              type="range"
              min="0.1"
              max="0.9"
              step="0.1"
              value={minSimilarity}
              onChange={(e) => setMinSimilarity(parseFloat(e.target.value))}
              className={styles.rangeInput}
            />
          </div>

          <Button
            onClick={() => searchVacancies(undefined, 0, true)}
            disabled={loading}
            label={loading ? "Поиск..." : "Найти вакансии"}
          />
        </div>
      )}
      </div>

      {loading && (
        <div className={styles.loadingIndicator}>
          <p>⏳ {resumeId ? 'Ищем подходящие вакансии...' : 'Загружаем и анализируем резюме...'}</p>
        </div>
      )}

      <div className={styles.resultsInfo}>
        {matches.length > 0 && (
          <p>Найдено {matches.length} подходящих вакансий</p>
        )}
      </div>

      <ul className={styles.vacancyCardList}>
        {matches.map((match) => (
          <VacancyCard
            key={match.vacancy.id}
            vacancy={match.vacancy}
            similarity={match.similarity}
            onApply={(coverLetter) => applyToVacancy(match.vacancy.id, coverLetter)}
            isApplied={applications.some(app => app.vacancy_id === match.vacancy.id)}
          />
        ))}
      </ul>

      {hasMore && !loading && matches.length > 0 && (
        <Button onClick={loadMore} label="Загрузить ещё" />
      )}

      {!loading && matches.length === 0 && resumeId && (
        <div className={styles.noResults}>
          <p>🔍 Вакансии не найдены. Попробуйте:</p>
          <ul>
            <li>Изменить поисковый запрос</li>
            <li>Снизить минимальное совпадение</li>
            <li>Проверить настройки поиска</li>
          </ul>
        </div>
      )}
    </>
  );

  const renderApplicationsTab = () => (
    <div className={styles.applicationsTab}>
      <h2>История откликов</h2>

      <div className={styles.applicationStats}>
        <div className={styles.statCard}>
          <h3>Всего откликов</h3>
          <p className={styles.statNumber}>{applications.length}</p>
        </div>
        <div className={styles.statCard}>
          <h3>Отправлено</h3>
          <p className={styles.statNumber}>{applications.filter(a => a.status === 'sent').length}</p>
        </div>
        <div className={styles.statCard}>
          <h3>Автоматических</h3>
          <p className={styles.statNumber}>{applications.filter(a => a.auto_applied).length}</p>
        </div>
      </div>

      <div className={styles.applicationsList}>
        {applications.map((app) => (
          <div key={app.id} className={styles.applicationCard}>
            <div className={styles.applicationInfo}>
              <p><strong>ID вакансии:</strong> {app.vacancy_id}</p>
              <p><strong>Статус:</strong>
                <span className={`${styles.status} ${styles[app.status]}`}>
                  {app.status === 'sent' ? 'Отправлено' :
                    app.status === 'pending' ? 'В ожидании' : 'Ошибка'}
                </span>
              </p>
              <p><strong>Дата:</strong> {new Date(app.applied_at).toLocaleString()}</p>
              {app.auto_applied && (
                <span className={styles.autoTag}>🤖 Автоматический отклик</span>
              )}
            </div>
          </div>
        ))}

        {applications.length === 0 && (
          <p className={styles.noApplications}>Пока нет откликов</p>
        )}
      </div>
    </div>
  );

  const renderBotTab = () => (
    <div className={styles.botTab}>
      <h2>Автоматические отклики</h2>

      <div className={styles.botStatus}>
        <div className={`${styles.statusIndicator} ${botStatus.is_running ? styles.running : styles.stopped}`}>
          {botStatus.is_running ? '🟢 Бот работает' : '🔴 Бот остановлен'}
        </div>

        <div className={styles.botStats}>
          <p><strong>Отправлено сегодня:</strong> {botStatus.applications_sent} из {botStatus.daily_limit}</p>
          {botStatus.last_application && (
            <p><strong>Последний отклик:</strong> {new Date(botStatus.last_application).toLocaleString()}</p>
          )}
        </div>
      </div>

      <div className={styles.botControls}>
        <div className={styles.inputGroup}>
          <label>Дневной лимит откликов:</label>
          <input
            type="number"
            min="1"
            max="100"
            value={botStatus.daily_limit}
            onChange={(e) => setBotStatus(prev => ({ ...prev, daily_limit: parseInt(e.target.value) }))}
            disabled={botStatus.is_running}
            className={styles.numberInput}
          />
        </div>

        <div className={styles.inputGroup}>
          <label>Минимальное совпадение для автооткликов: {Math.round(minSimilarity * 100)}%</label>
          <input
            type="range"
            min="0.3"
            max="0.8"
            step="0.1"
            value={minSimilarity}
            onChange={(e) => setMinSimilarity(parseFloat(e.target.value))}
            disabled={botStatus.is_running}
            className={styles.rangeInput}
          />
        </div>

        <div className={styles.botActions}>
          {!botStatus.is_running ? (
            <Button
              onClick={startBot}
              disabled={!resumeId || loading}
              label="🚀 Запустить бота"
            />
          ) : (
            <Button
              onClick={stopBot}
              disabled={loading}
              label="⏹️ Остановить бота"
            />
          )}
        </div>
      </div>

      <div className={styles.botInfo}>
        <h3>ℹ️ Как работает бот:</h3>
        <ul>
          <li>Ищет новые вакансии каждые 30 минут</li>
          <li>Отправляет отклики только на вакансии с высоким совпадением</li>
          <li>Генерирует персонализированные сопроводительные письма</li>
          <li>Соблюдает лимиты чтобы не заспамить</li>
          <li>Делает паузы между откликами (5 минут)</li>
        </ul>
      </div>
    </div>
  );

  return (
    <BaseLayout >
      <LogoApp link={'/logo.svg'} text={'Coffee Job Bot'} />

      <div className={styles.tabNavigation}>
        <button
          className={`${styles.tab} ${activeTab === 'search' ? styles.active : ''}`}
          onClick={() => setActiveTab('search')}
        >
          🔍 Поиск вакансий
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'applications' ? styles.active : ''}`}
          onClick={() => setActiveTab('applications')}
        >
          📋 Мои отклики ({applications.length})
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'bot' ? styles.active : ''}`}
          onClick={() => setActiveTab('bot')}
        >
          🤖 Автобот {botStatus.is_running && '(работает)'}
        </button>
      </div>

      {error && <Alert label={error} />}

      <div className={styles.tabContent}>
        {activeTab === 'search' && renderSearchTab()}
        {activeTab === 'applications' && renderApplicationsTab()}
        {activeTab === 'bot' && renderBotTab()}
      </div>
    </BaseLayout>
  );
}

export default App;