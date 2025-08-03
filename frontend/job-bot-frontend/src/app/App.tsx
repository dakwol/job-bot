import { useState } from "react";
import axios from "axios";
import { VacancyCard } from "../feature/VacancyCard";
import styles from './styles.module.scss';
import { ResumeUploader } from "../feature/ResumeUploader";
import { BaseLayout } from '../shared/BaseLayout';
import { Sidebar } from '../feature/Sidebar';
import { LogoApp } from '../components/logoApp';
import { Button } from '../components/Button';
import { Alert } from '../components/Alert';

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Загружаем резюме и первую страницу вакансий
  const uploadResume = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      await axios.post("http://localhost:8000/upload-resume", formData);

      // Сбрасываем пагинацию
      setPage(0);
      setHasMore(true);

      const res = await axios.get(`http://localhost:8000/match-hh?query=frontend&page=0`);
      setResults(res.data);
      if (res.data.length === 0) setHasMore(false);
    } catch (e) {
      setError("Ошибка при загрузке или получении вакансий");
    } finally {
      setLoading(false);
    }
  };

  // Загружаем следующую страницу и добавляем результаты
  const loadMore = async () => {
    if (!hasMore) return;
    setLoading(true);
    setError(null);
    try {
      const nextPage = page + 1;
      const res = await axios.get(`http://localhost:8000/match-hh?query=frontend&page=${nextPage}`);
      if (res.data.length === 0) {
        setHasMore(false);
      } else {
        setResults((prev) => [...prev, ...res.data]);
        setPage(nextPage);
      }
    } catch (e) {
      setError("Ошибка при загрузке следующих вакансий");
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseLayout
      sidebar={<Sidebar />}
    >
      <LogoApp link={'/logo.svg'} text={'Coffee Job Bot'} />
      <ResumeUploader onFileSelect={setFile} disabled={loading} />
      <Button
        onClick={uploadResume}
        disabled={loading || !file}
        label={loading ? "Загрузка..." : "Найти вакансии"}
      />

      {error && <Alert label={error}/>}

      <ul className={styles.vacancyCardList}>
        {results.map((r) => (
          <VacancyCard
            key={r.vacancy.id}
            vacancy={{
              id: r.vacancy.id,
              name: r.vacancy.name,
              alternate_url: r.vacancy.alternate_url || "",
              experience: r.vacancy.experience,
              schedule: r.vacancy.schedule,
              snippet: r.vacancy.snippet,
              address: r.vacancy.address,
              employer: r.vacancy.employer,
            }}
            similarity={r.similarity}
          />
        ))}
      </ul>

      {hasMore && !loading && results.length > 0 && (
        <Button onClick={loadMore} label='Загрузить ещё'/>
      )}
    </BaseLayout>
  );
}

export default App;
