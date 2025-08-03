import requests
from typing import List, Dict, Optional
import time
from datetime import datetime, timedelta

class HeadHunterService:
    BASE_URL = "https://api.hh.ru"
    
    def __init__(self):
        self.session = requests.Session()
        self.last_request_time = 0
        self.request_delay = 0.2  # Rate limiting
        
    def _make_request(self, endpoint: str, params: Dict = None) -> Dict:
        """Rate-limited requests to HH API"""
        current_time = time.time()
        time_since_last = current_time - self.last_request_time
        
        if time_since_last < self.request_delay:
            time.sleep(self.request_delay - time_since_last)
            
        response = self.session.get(f"{self.BASE_URL}{endpoint}", params=params)
        self.last_request_time = time.time()
        
        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"HH API error: {response.status_code}")
    
    def search_vacancies(self, query: str, page: int = 0, area: int = 1) -> List[Dict]:
        """Search vacancies with enhanced parameters"""
        params = {
            "text": query,
            "page": page,
            "per_page": 50,
            "area": area,  # 1 = Moscow
            "period": 30,  # Last 30 days
            "order_by": "publication_time",
            "search_field": ["name", "company_name", "description"]
        }
        
        data = self._make_request("/vacancies", params)
        return data.get("items", [])
    
    def get_vacancy_details(self, vacancy_id: str) -> Dict:
        """Get detailed vacancy information"""
        return self._make_request(f"/vacancies/{vacancy_id}")
    
    def apply_to_vacancy(self, vacancy_id: str, resume_id: str, cover_letter: str) -> bool:
        """Apply to vacancy (requires authorization)"""
        # NOTE: Для реального применения нужна OAuth авторизация HH
        # Пока что mock implementation
        print(f"Mock: Applying to vacancy {vacancy_id} with resume {resume_id}")
        return True