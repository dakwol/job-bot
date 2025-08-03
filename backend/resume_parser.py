# Добавить в resume_parser.py

import re
from typing import Dict, List, Optional
import pdfplumber

def extract_resume_text(file_path: str) -> str:
    text = ""
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            text += page.extract_text() or ""
    return text

def analyze_resume(resume_text: str) -> Dict:
    """
    Анализирует текст резюме и извлекает ключевую информацию
    """
    analysis = {
        "skills": extract_skills(resume_text),
        "experience_years": extract_experience_years(resume_text),
        "email": extract_email(resume_text),
        "phone": extract_phone(resume_text),
        "languages": extract_languages(resume_text),
        "education": extract_education(resume_text)
    }
    
    return analysis


def extract_skills(text: str) -> List[str]:
    """Извлекает навыки и технологии из резюме"""
    
    # Расширенный список технических навыков
    tech_skills = [
        # Языки программирования
        'python', 'javascript', 'java', 'c#', 'c++', 'php', 'ruby', 'go', 'rust',
        'typescript', 'kotlin', 'swift', 'scala', 'r', 'matlab', 'perl',
        
        # Веб-технологии
        'html', 'css', 'react', 'vue', 'angular', 'node.js', 'express', 'django',
        'flask', 'fastapi', 'spring', 'laravel', 'symfony', 'rails',
        
        # Базы данных
        'sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch',
        'oracle', 'sqlite', 'cassandra', 'neo4j',
        
        # DevOps и инфраструктура
        'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'terraform', 'ansible',
        'jenkins', 'gitlab', 'github', 'ci/cd', 'nginx', 'apache',
        
        # Данные и ML
        'pandas', 'numpy', 'scikit-learn', 'tensorflow', 'pytorch', 'keras',
        'jupyter', 'tableau', 'power bi', 'spark', 'hadoop',
        
        # Другие технологии
        'git', 'linux', 'bash', 'powershell', 'api', 'rest', 'graphql',
        'microservices', 'agile', 'scrum', 'jira', 'confluence'
    ]
    
    text_lower = text.lower()
    found_skills = []
    
    for skill in tech_skills:
        # Ищем точные совпадения (целые слова)
        pattern = r'\b' + re.escape(skill.lower()) + r'\b'
        if re.search(pattern, text_lower):
            found_skills.append(skill.title())
    
    # Дополнительный поиск по ключевым секциям
    skills_sections = re.findall(
        r'(?:навыки|skills|технологии|technologies)[:\s]*(.*?)(?:\n\n|\n[А-ЯA-Z]|$)', 
        text, 
        re.IGNORECASE | re.DOTALL
    )
    
    for section in skills_sections:
        # Разбиваем по запятым, точкам с запятой и переносам строк
        items = re.split(r'[,;\n•·-]', section)
        for item in items:
            item = item.strip()
            if len(item) > 2 and len(item) < 30:  # разумная длина для навыка
                found_skills.append(item.title())
    
    # Убираем дубликаты и возвращаем уникальные навыки
    return list(set(found_skills))

def extract_experience_years(text: str) -> int:
    """Извлекает количество лет опыта (учитывает месяцы)"""
    
    patterns = [
        r'(\d+)\s*(?:лет|года|год)\s*опыта',
        r'опыт\s*(?:работы)?\s*(\d+)\s*(?:лет|года|год)',
        r'(\d+)\+?\s*years?\s*(?:of\s*)?experience',
        r'experience[:\s]*(\d+)\+?\s*years?',
        r'стаж\s*(?:работы)?\s*(\d+)\s*(?:лет|года|год)',
        r'опыт\s*работы\s*[-—:]?\s*(\d+)\s*(?:лет|года|год)\s*(\d+)?\s*(?:месяц[аев]?)?'
    ]
    
    max_months = 0
    text_lower = text.lower()
    
    for pattern in patterns:
        matches = re.findall(pattern, text_lower)
        for match in matches:
            try:
                if isinstance(match, tuple):
                    years = int(match[0])
                    months = int(match[1]) if len(match) > 1 and match[1] else 0
                else:
                    years = int(match)
                    months = 0
                total_months = years * 12 + months
                if total_months > max_months and total_months < 50 * 12:
                    max_months = total_months
            except ValueError:
                continue

    # Альтернатива — по датам
    if max_months == 0:
        date_patterns = [
            r'(\d{4})\s*[-–]\s*(\d{4})',
            r'(\d{2})\.(\d{4})\s*[-–]\s*(\d{2})\.(\d{4})',
        ]
        for pattern in date_patterns:
            matches = re.findall(pattern, text)
            for match in matches:
                try:
                    if len(match) == 2:
                        start, end = int(match[0]), int(match[1])
                        months = max(0, (end - start) * 12)
                    elif len(match) == 4:
                        start_month, start_year = int(match[0]), int(match[1])
                        end_month, end_year = int(match[2]), int(match[3])
                        months = max(0, (end_year - start_year) * 12 + (end_month - start_month))
                    max_months = max(max_months, months)
                except:
                    continue

    return max_months // 12  # возвращаем количество лет



def extract_email(text: str) -> Optional[str]:
    """Извлекает email адрес"""
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    matches = re.findall(email_pattern, text)
    return matches[0] if matches else None


def extract_phone(text: str) -> Optional[str]:
    """Извлекает номер телефона"""
    # Паттерны для российских и международных номеров
    phone_patterns = [
        r'\+7\s*\(?\d{3}\)?\s*\d{3}[-\s]?\d{2}[-\s]?\d{2}',  # +7 (xxx) xxx-xx-xx
        r'8\s*\(?\d{3}\)?\s*\d{3}[-\s]?\d{2}[-\s]?\d{2}',    # 8 (xxx) xxx-xx-xx
        r'\+\d{1,3}\s*\(?\d{3}\)?\s*\d{3}[-\s]?\d{2}[-\s]?\d{2}'  # международный
    ]
    
    for pattern in phone_patterns:
        matches = re.findall(pattern, text)
        if matches:
            return matches[0]
    
    return None


def extract_languages(text: str) -> List[str]:
    """Извлекает знание языков"""
    languages = ['english', 'английский', 'немецкий', 'german', 'французский', 'french', 
                'испанский', 'spanish', 'итальянский', 'italian', 'китайский', 'chinese']
    
    text_lower = text.lower()
    found_languages = []
    
    for lang in languages:
        if lang in text_lower:
            found_languages.append(lang.title())
    
    return list(set(found_languages))


def extract_education(text: str) -> List[str]:
    """Извлекает информацию об образовании"""
    education_keywords = [
        'университет', 'институт', 'академия', 'колледж', 'техникум',
        'university', 'institute', 'college', 'bachelor', 'master', 'phd',
        'бакалавр', 'магистр', 'специалист', 'кандидат наук', 'доктор наук'
    ]
    
    education_info = []
    text_lower = text.lower()
    
    for keyword in education_keywords:
        if keyword in text_lower:
            # Пытаемся найти строку с этим ключевым словом
            lines = text.split('\n')
            for line in lines:
                if keyword in line.lower() and len(line.strip()) > 10:
                    education_info.append(line.strip())
                    break
    
    return list(set(education_info))