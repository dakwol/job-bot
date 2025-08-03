import requests
from fastapi import APIRouter, UploadFile, Query, HTTPException
from resume_parser import extract_resume_text
from matcher import calculate_similarity
from hh_parser import match_hh
import os

router = APIRouter()
resume_text_cache = ""  # глобальный кэш

@router.post("/upload-resume")
async def upload_resume(file: UploadFile):
    content = await file.read()
    os.makedirs("./tmp", exist_ok=True)

    path = f"./tmp/{file.filename}"
    with open(path, "wb") as f:
        f.write(content)

    global resume_text_cache
    resume_text_cache = extract_resume_text(path)

    return {"message": "Resume uploaded"}


@router.get("/match-hh")
def match_vacancies(query: str = Query(...), page: int = Query(0, ge=0)):
    global resume_text_cache
    if not resume_text_cache:
        raise HTTPException(status_code=400, detail="Resume not uploaded")

    vacancies = match_hh(query, page)
    vacancy_texts = [v["name"] + " " + v.get("snippet", {}).get("responsibility", "") for v in vacancies]
    similarities = calculate_similarity(resume_text_cache, vacancy_texts)

    top_matches = sorted(zip(vacancies, similarities), key=lambda x: x[1][1], reverse=True)[:10]

    result = []
    for vacancy, sim in top_matches:
        vacancy_id = vacancy["id"]
        try:
            stat_resp = requests.get(f"http://localhost:8000/vacancy-stats", params={"vacancy_id": vacancy_id})
            stat_data = stat_resp.json() if stat_resp.status_code == 200 else {}
        except Exception as e:
            stat_data = {}

        result.append({
            "vacancy": vacancy,
            "similarity": round(sim[1], 3),
            "page": page,
            "stats": stat_data
        })

    return result
