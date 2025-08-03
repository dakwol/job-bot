from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import re
import nltk
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer

nltk.download('stopwords')
nltk.download('wordnet')

def preprocess(text: str) -> str:
    text = text.lower()
    text = re.sub(r'\W+', ' ', text)  # удаляем неалфавитные символы
    tokens = text.split()
    stop_words = set(stopwords.words('english'))
    lemmatizer = WordNetLemmatizer()
    tokens = [lemmatizer.lemmatize(t) for t in tokens if t not in stop_words and len(t) > 2]
    return ' '.join(tokens)

def calculate_similarity(resume_text: str, vacancy_texts: list[str]) -> list[tuple[int, float]]:
    if not resume_text or not vacancy_texts:
        return []

    corpus = [preprocess(resume_text)] + [preprocess(v) for v in vacancy_texts]

    tfidf = TfidfVectorizer(
        ngram_range=(1,2),       # учитываем униграммы и биграммы
        min_df=2,                # игнорируем редкие слова
        max_df=0.9,              # игнорируем слишком частые
        norm='l2',               # нормализация
        max_features=10000       # ограничиваем словарь (если большой корпус)
    )
    tfidf_matrix = tfidf.fit_transform(corpus)

    resume_vec = tfidf_matrix[0:1]
    vacancy_vecs = tfidf_matrix[1:]

    similarities = cosine_similarity(resume_vec, vacancy_vecs).flatten()

    return list(enumerate(similarities))
