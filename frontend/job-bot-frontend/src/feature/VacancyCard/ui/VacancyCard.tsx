// src/feature/VacancyCard/ui/VacancyCard.tsx - ПОЛНАЯ УЛУЧШЕННАЯ ВЕРСИЯ
import React, { useEffect, useState } from "react";
import styles from "./styles.module.scss";
import type { Vacancy } from "../type.ts";
import { Button } from '../../../components/Button/index.ts';
import { Alert } from '../../../components/Alert/index.ts';

type VacancyCardProps = {
  vacancy: Vacancy;
  similarity: number;
  onApply?: (coverLetter: string) => void;
  isApplied?: boolean;
};

type VacancyStats = {
  total_applications: number;
  acceptance_chance: number;
  daily_applications: number[];
};

const BarChart: React.FC<{ data: number[]; width?: number; height?: number }> = ({
  data,
  width = 200,
  height = 100,
}) => {
  const max = Math.max(...data);
  const barWidth = width / data.length - 4;
  return (
    <svg width={width} height={height}>
      {data.map((value, i) => {
        const barHeight = (value / max) * (height - 20);
        return (
          <rect
            key={i}
            x={i * (barWidth + 4)}
            y={height - barHeight}
            width={barWidth}
            height={barHeight}
            fill="#b7ac98"
          />
        );
      })}
      {/* подписи по оси X */}
      {data.map((_, i) => (
        <text
          key={i}
          x={i * (barWidth + 4) + barWidth / 2}
          y={height - 2}
          fontSize="10"
          textAnchor="middle"
          fill="#e2e2de"
        >
          {`Д-${6 - i}`}
        </text>
      ))}
    </svg>
  );
};

const CoverLetterModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (letter: string) => void;
  vacancyName: string;
}> = ({ isOpen, onClose, onSubmit, vacancyName }) => {
  const [coverLetter, setCoverLetter] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const generateCoverLetter = () => {
    setIsGenerating(true);
    // Симуляция генерации письма
    setTimeout(() => {
      const template = `Здравствуйте!

Меня заинтересовала вакансия "${vacancyName}". 
Мой опыт и навыки отлично подходят для данной позиции.

В приложенном резюме вы можете ознакомиться с моими проектами и достижениями. 
Готов обсудить детали сотрудничества в удобное для вас время.

С уважением.`;
      setCoverLetter(template);
      setIsGenerating(false);
    }, 1000);
  };

  const handleSubmit = () => {
    onSubmit(coverLetter);
    onClose();
    setCoverLetter("");
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h3>Сопроводительное письмо</h3>
          <button className={styles.closeButton} onClick={onClose}>✕</button>
        </div>

        <div className={styles.modalBody}>
          <p className={styles.vacancyTitle}>К вакансии: <strong>{vacancyName}</strong></p>

          <div className={styles.letterActions}>
            <Button
              onClick={generateCoverLetter}
              disabled={isGenerating}
              label={isGenerating ? "Генерирую..." : "🪄 Сгенерировать письмо"}
            />
          </div>

          <textarea
            className={styles.letterTextarea}
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
            placeholder="Введите текст сопроводительного письма или сгенерируйте автоматически"
            rows={10}
          />
        </div>

        <div className={styles.modalFooter}>
          <Button onClick={onClose} label="Отмена" />
          <Button
            onClick={handleSubmit}
            disabled={!coverLetter.trim()}
            label="📤 Отправить отклик"
          />
        </div>
      </div>
    </div>
  );
};

export const VacancyCard: React.FC<VacancyCardProps> = ({
  vacancy,
  similarity,
  onApply,
  isApplied = false
}) => {
  const {
    name,
    alternate_url,
    experience,
    schedule,
    snippet,
    address,
    employer,
  } = vacancy;

  const rating = employer?.employer_rating?.total_rating;
  const logo = employer?.logo_urls?.["90"] || "";

  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [showCoverLetterModal, setShowCoverLetterModal] = useState(false);

  const handleApplyClick = () => {
    if (onApply) {
      setShowCoverLetterModal(true);
    }
  };

  const handleApplySubmit = async (coverLetter: string) => {
    if (!onApply) return;

    setApplying(true);
    setError(null);

    try {
      await onApply(coverLetter);
    } catch (e: any) {
      setError(e.message || "Не удалось откликнуться");
    } finally {
      setApplying(false);
    }
  };

  const [stats, setStats] = useState<VacancyStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    if (showStats && !stats && !loadingStats) {
      setLoadingStats(true);
      fetch(`http://localhost:8000/vacancy-stats?vacancy_id=${vacancy.id}`)
        .then((res) => {
          if (!res.ok) throw new Error("Ошибка загрузки статистики");
          return res.json();
        })
        .then((data) => {
          setStats({
            total_applications: data.total_applications,
            acceptance_chance: data.acceptance_chance,
            daily_applications: data.daily_applications,
          });
        })
        .catch(() => setStatsError("Не удалось загрузить статистику"))
        .finally(() => setLoadingStats(false));
    }
  }, [showStats, stats, vacancy.id]);

  // Функция для определения цвета совпадения
  const getSimilarityColor = (sim: number) => {
    if (sim >= 0.7) return '#4CAF50'; // зеленый
    if (sim >= 0.5) return '#FF9800'; // оранжевый
    return '#757575'; // серый
  };

  // Функция для получения эмодзи рейтинга
  const getRatingEmoji = (score: number) => {
    if (score >= 0.8) return '🔥';
    if (score >= 0.6) return '⭐';
    if (score >= 0.4) return '👍';
    return '💼';
  };

  return (
    <>
      <div className={`${styles.vacancyCard} ${isApplied ? styles.applied : ''}`}>
        <div className={styles.vacancyCardHeader}>
          <div className={styles.mainInfo}>
            {logo && <img src={logo} alt="Логотип" className={styles.vacancyCardLogo} />}
            <div className={styles.titleSection}>
              <h3 className={styles.vacancyCardTitle}>
                <a href={alternate_url} target="_blank" rel="noreferrer">
                  {name}
                </a>
              </h3>
              <p className={styles.company}>{employer?.name}</p>
              {employer?.accredited_it_employer && (
                <span className={styles.accreditedBadge}>✅ Аккредитованный IT работодатель</span>
              )}
            </div>
          </div>

          <div className={styles.matchInfo}>
            <div
              className={styles.similarity}
              style={{ color: getSimilarityColor(similarity) }}
            >
              {getRatingEmoji(similarity)} {Math.round(similarity * 100)}%
            </div>
            <div className={styles.matchLabel}>совпадение</div>
            {isApplied && <div className={styles.appliedBadge}>✅ Отклик отправлен</div>}
          </div>
        </div>

        <div className={styles.info}>
          {experience?.name && <p><strong>Опыт:</strong> {experience.name}</p>}
          {schedule?.name && <p><strong>График:</strong> {schedule.name}</p>}
          {address?.raw && <p><strong>Адрес:</strong> {address.raw}</p>}
          {address?.metro && (
            <p><strong>Метро:</strong> {address.metro.station_name} ({address.metro.line_name})</p>
          )}
          {rating && (
            <p><strong>Рейтинг компании:</strong> {rating} ⭐
              {employer?.employer_rating?.reviews_count &&
                ` (${employer.employer_rating.reviews_count} отзывов)`
              }
            </p>
          )}
        </div>

        <div className={styles.snippet}>
          {snippet?.requirement && (
            <div className={styles.requirements}>
              <strong>Требования:</strong>
              <p>{snippet.requirement}</p>
            </div>
          )}
          {snippet?.responsibility && (
            <div className={styles.responsibilities}>
              <strong>Обязанности:</strong>
              <p>{snippet.responsibility}</p>
            </div>
          )}
        </div>

        <div className={styles.actions}>
          <a href={alternate_url} target="_blank" rel="noreferrer" className={styles.detailsLink}>
            🔗 Подробнее на hh.ru
          </a>

          {!isApplied && onApply && (
            <Button
              onClick={handleApplyClick}
              disabled={applying}
              label={applying ? "Отправляем..." : "📤 Откликнуться"}
            />
          )}

          <Button
            onClick={() => setShowStats((prev) => !prev)}
            label={showStats ? "📊 Скрыть статистику" : "📈 Показать статистику"}
          />
        </div>

        {showStats && (
          <div className={styles.statistics}>
            <h4>📊 Статистика по вакансии</h4>
            {loadingStats && <p>Загрузка статистики...</p>}
            {statsError && <Alert label={statsError} />}
            {stats && (
              <div className={styles.statsContent}>
                <div className={styles.statsGrid}>
                  <div className={styles.statItem}>
                    <span className={styles.statValue}>{stats.total_applications}</span>
                    <span className={styles.statLabel}>всего откликов</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statValue}>{Math.round(stats.acceptance_chance * 100)}%</span>
                    <span className={styles.statLabel}>вероятность отклика</span>
                  </div>
                </div>

                <div className={styles.chartSection}>
                  <h5>Отклики за последние 7 дней</h5>
                  <BarChart data={stats.daily_applications} />
                </div>
              </div>
            )}
          </div>
        )}

        {error && <Alert label={error} />}
      </div>

      <CoverLetterModal
        isOpen={showCoverLetterModal}
        onClose={() => setShowCoverLetterModal(false)}
        onSubmit={handleApplySubmit}
        vacancyName={name}
      />
    </>
  );
};