import requests
from fastapi import APIRouter, UploadFile, Query, HTTPException
from resume_parser import extract_resume_text, analyze_resume  # добавляем analyze_resume
from matcher import calculate_similarity
from hh_parser import match_hh
import os
import hashlib
import time

router = APIRouter()

# Улучшенный кэш с ID и анализом
resume_cache = {}

@router.post("/upload-resume")
async def upload_resume(file: UploadFile):
    content = await file.read()
    os.makedirs("./tmp", exist_ok=True)

    print('content', content)

    path = f"./tmp/{file.filename}"
    with open(path, "wb") as f:
        f.write(content)

    # Извлекаем текст резюме
    resume_text = extract_resume_text(path)
    
    # Генерируем уникальный ID для резюме
    resume_id = int(hashlib.md5(resume_text.encode()).hexdigest()[:8], 16)
    
    # Анализируем резюме (нужно реализовать эту функцию)
    analysis = analyze_resume(resume_text)
    
    # Сохраняем в кэш
    global resume_cache
    resume_cache[resume_id] = {
        "text": resume_text,
        "analysis": analysis,
        "uploaded_at": time.time(),
        "filename": file.filename
    }

    return {
        "resume_id": resume_id,
        "analysis": analysis,
        "message": "Resume uploaded and analyzed successfully"
    }


@router.get("/match-vacancies")  # изменяем название эндпоинта
def match_vacancies(
    resume_id: int = Query(...),
    query: str = Query("front-end"), 
    page: int = Query(0, ge=0),
    min_similarity: float = Query(0.3, ge=0.0, le=1.0)
):
    global resume_cache
    
    # Проверяем наличие резюме в кэше
    if resume_id not in resume_cache:
        raise HTTPException(status_code=400, detail="Resume not found")

    resume_text = resume_cache[resume_id]["text"]
    
    # Получаем вакансии с HH
    vacancies = match_hh(query, page)
    
    if not vacancies:
        return {
            "matches": [],
            "has_more": False,
            "page": page,
            "total": 0
        }
    
    # Подготавливаем тексты вакансий для сравнения
    vacancy_texts = []
    for v in vacancies:
        text = v["name"]
        if v.get("snippet", {}).get("responsibility"):
            text += " " + v["snippet"]["responsibility"]
        if v.get("snippet", {}).get("requirement"):
            text += " " + v["snippet"]["requirement"]
        vacancy_texts.append(text)
    
    # Вычисляем similarity
    similarities = calculate_similarity(resume_text, vacancy_texts)
    
    # Фильтруем по минимальному совпадению и сортируем
    matches = []
    for vacancy, sim in zip(vacancies, similarities):
        if sim[1] >= min_similarity:  # sim[1] - это similarity score
            vacancy_id = vacancy["id"]
            
            # Получаем статистику вакансии (опционально)
            try:
                stat_resp = requests.get(
                    f"http://localhost:8000/vacancy-stats", 
                    params={"vacancy_id": vacancy_id},
                    timeout=5
                )
                stat_data = stat_resp.json() if stat_resp.status_code == 200 else {}
            except Exception as e:
                stat_data = {}

            matches.append({
                "vacancy": vacancy,
                "similarity": round(sim[1], 3),
                "match_score": round(sim[1] * 100, 1),  # процент совпадения
                "stats": stat_data
            })
    
    # Сортируем по similarity
    matches.sort(key=lambda x: x["similarity"], reverse=True)
    
    # Ограничиваем количество результатов на странице
    per_page = 20
    start_idx = 0  # для первой страницы
    end_idx = per_page
    page_matches = matches[start_idx:end_idx]
    
    return {
        "matches": page_matches,
        "has_more": len(matches) > per_page,  # есть ли еще результаты
        "page": page,
        "total": len(matches),
        "resume_id": resume_id
    }


# Дополнительные полезные эндпоинты

@router.get("/resume/{resume_id}")
def get_resume_info(resume_id: int):
    """Получить информацию о загруженном резюме"""
    global resume_cache
    
    if resume_id not in resume_cache:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    resume_data = resume_cache[resume_id]
    return {
        "resume_id": resume_id,
        "analysis": resume_data["analysis"],
        "uploaded_at": resume_data["uploaded_at"],
        "filename": resume_data["filename"]
    }


@router.delete("/resume/{resume_id}")  
def delete_resume(resume_id: int):
    """Удалить резюме из кэша"""
    global resume_cache
    
    if resume_id not in resume_cache:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    del resume_cache[resume_id]
    return {"message": "Resume deleted successfully"}


@router.get("/resumes")
def list_resumes():
    """Список всех загруженных резюме"""
    global resume_cache
    
    resumes = []
    for resume_id, data in resume_cache.items():
        resumes.append({
            "resume_id": resume_id,
            "filename": data["filename"],
            "uploaded_at": data["uploaded_at"],
            "skills_count": len(data["analysis"].get("skills", [])),
            "experience_years": data["analysis"].get("experience_years", 0)
        })
    
    return {"resumes": resumes}