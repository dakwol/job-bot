from fastapi import FastAPI, Query, HTTPException
import requests

app = FastAPI()

HH_VACANCY_URL = "https://api.hh.ru/vacancies/{}"

@app.get("/vacancy-stats")
def vacancy_stats(vacancy_id: str = Query(...)):
    # Запрос вакансии на hh.ru
    resp = requests.get(HH_VACANCY_URL.format(vacancy_id))

    print(HH_VACANCY_URL.format(vacancy_id))

    if resp.status_code != 200:
        raise HTTPException(status_code=404, detail="Vacancy not found")

    vacancy_data = resp.json()

    # В hh API нет прямой статистики откликов, поэтому возвращаем базовую инфу и мок-статистику
    stats = {
        "vacancy_id": vacancy_id,
        "name": vacancy_data.get("name"),
        "published_at": vacancy_data.get("published_at"),
        "area": vacancy_data.get("area", {}).get("name"),
        "employer": vacancy_data.get("employer", {}).get("name"),
        "response_letter_required": vacancy_data.get("response_letter_required", False),

        # Мок-статистика (для примера)
        "total_applications": 120 + int(vacancy_id[-2:], 10) % 50,  # рандомно
        "acceptance_chance": round(0.15 + (int(vacancy_id[-1]) / 10) * 0.5, 2),  # 15%-65%
        "daily_applications": [5, 12, 15, 18, 20, 25, 15],
    }

    return stats
