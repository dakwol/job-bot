import React, { useEffect, useState } from "react";
import styles from "./styles.module.scss";
import type { Vacancy } from "../type.ts";
import { Button } from '../../../components/Button/index.ts';
import { Alert } from '../../../components/Alert/index.ts';

type VacancyCardProps = {
  vacancy: Vacancy;
  similarity: number;
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
            fill="#4a90e2"
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
          fill="#555"
        >
          {`Д-${6 - i}`}
        </text>
      ))}
    </svg>
  );
};

export const VacancyCard: React.FC<VacancyCardProps> = ({ vacancy, similarity }) => {
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
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(false);

  const handleApply = async () => {
    setApplying(true);
    setError(null);
    try {
      const res = await fetch("http://localhost:8000/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vacancy_id: vacancy.id }),
      });
      if (!res.ok) throw new Error("Ошибка отклика");
      setApplied(true);
    } catch (e) {
      setError("Не удалось откликнуться");
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

  return (
    <div className={styles.vacancyCard}>
      <div className={styles.vacancyCardHeader}>
        <div>
          <div>
            {logo && <img src={logo} alt="Логотип" className={styles.vacancyCardLogo} />}
            <h3 className={styles.vacancyCardTitle}>
              <a href={alternate_url} target="_blank" rel="noreferrer">
                {name}
              </a>
            </h3>
            <p className={styles.company}>{employer?.name}</p>
          </div>
        </div>
        <div className={styles.similarity}>
          Совпадение: <strong>{Math.round(similarity * 100)}%</strong>
        </div>
      </div>

      <div className={styles.info}>
        {experience?.name && <p>Опыт: {experience.name}</p>}
        {schedule?.name && <p>График: {schedule.name}</p>}
        {address?.raw && <p>Адрес: {address.raw}</p>}
        {rating && <p>Рейтинг компании: {rating} ⭐</p>}
      </div>

      <div className={styles.snippet}>
        {snippet?.requirement && (
          <p>
            <strong>Требования:</strong> {snippet.requirement}
          </p>
        )}
        {snippet?.responsibility && (
          <p>
            <strong>Обязанности:</strong> {snippet.responsibility}
          </p>
        )}
      </div>

      <div className={styles.actions}>
        <a href={alternate_url} target="_blank" rel="noreferrer" className="btn">
          Подробнее на hh.ru
        </a>
        <Button onClick={handleApply} disabled={applying || applied} label={applied ? "Отклик отправлен" : applying ? "Отправляем..." : "Откликнуться"} />
     
        <Button
          onClick={() => setShowStats((prev) => !prev)}
          label={showStats ? "Скрыть статистику" : "Показать статистику"}
        />
      </div>

      {showStats && (
        <div className={styles.statistics}>
          <h4>Статистика по вакансии</h4>
          {loadingStats && <p>Загрузка...</p>}
          {statsError && <Alert label={statsError} />}
          {stats && (
            <>
              <p>
                Всего откликов: <strong>{stats.total_applications}</strong>
              </p>
              <p>
                Вероятность принятия резюме:{" "}
                <strong>{Math.round(stats.acceptance_chance * 100)}%</strong>
              </p>
              <div>
                <h5>Отклики за последние 7 дней</h5>
                <BarChart data={stats.daily_applications} />
              </div>
            </>
          )}
        </div>
      )}

      {error && <Alert label={error} />}
    </div>
  );
};
