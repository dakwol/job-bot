from typing import Dict
import openai  # Для GPT-генерации писем
import random

class CoverLetterGenerator:
    def __init__(self):
        # Для продакшена можно использовать OpenAI API или локальную модель
        self.templates = [
            """Здравствуйте!

Меня заинтересовала вакансия {position} в компании {company}. 
Мой опыт работы {experience} лет в области {skills} идеально подходит для данной позиции.

В резюме вы можете ознакомиться с моими проектами и достижениями. 
Готов обсудить детали сотрудничества в удобное для вас время.

С уважением.""",
            
            """Добрый день!

Рассматриваю возможность присоединиться к команде {company} на позицию {position}.
Имею {experience} лет опыта разработки с использованием {skills}.

Буду рад возможности внести свой вклад в развитие ваших проектов.

С уважением."""
        ]
    
    def generate_cover_letter(self, resume_data: Dict, vacancy: Dict) -> str:
        """Generate personalized cover letter"""
        
        template = random.choice(self.templates)
        
        # Extract key info
        position = vacancy.get("name", "разработчика")
        company = vacancy.get("employer", {}).get("name", "вашей компании")
        experience = resume_data.get("experience_years", 2)
        skills = ", ".join(resume_data.get("skills", [])[:3])  # Top 3 skills
        
        return template.format(
            position=position,
            company=company,
            experience=experience,
            skills=skills or "веб-разработки"
        )