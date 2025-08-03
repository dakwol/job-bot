import re
import spacy
from typing import Dict, List
import json

class ResumeAnalyzer:
    def __init__(self):
        # Для продакшена лучше использовать spaCy
        # self.nlp = spacy.load("ru_core_news_sm")
        pass
    
    def analyze_resume(self, text: str) -> Dict:
        """Extract structured information from resume"""
        
        # Extract skills (простая версия)
        skills_patterns = [
            r'(?i)(python|javascript|react|typescript|fastapi|django|flask|sql|postgresql|mongodb|docker|kubernetes|aws|git)',
            r'(?i)(java|c\+\+|c#|php|ruby|go|rust|scala|kotlin)',
            r'(?i)(html|css|scss|sass|bootstrap|tailwind|vue|angular|node\.js|express)',
        ]
        
        skills = set()
        for pattern in skills_patterns:
            matches = re.findall(pattern, text)
            skills.update([m.lower() for m in matches])
        
        # Extract experience years
        exp_patterns = [
            r'(?i)(\d+)\s*(?:лет|года?|year)',
            r'(?i)опыт[:\s]*(\d+)',
            r'(?i)experience[:\s]*(\d+)'
        ]
        
        experience_years = 0
        for pattern in exp_patterns:
            matches = re.findall(pattern, text)
            if matches:
                experience_years = max(experience_years, int(matches[0]))
        
        # Extract contact info
        email_match = re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', text)
        phone_match = re.search(r'(?:\+7|8)[\s\-\(]?\d{3}[\s\-\)]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}', text)
        
        return {
            "skills": list(skills),
            "experience_years": experience_years,
            "email": email_match.group() if email_match else None,
            "phone": phone_match.group() if phone_match else None,
            "raw_text": text
        }