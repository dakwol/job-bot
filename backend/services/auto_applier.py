from typing import List, Dict
import asyncio
from datetime import datetime
import logging
from .hh_service import HeadHunterService
from .cover_letter_generator import CoverLetterGenerator

logger = logging.getLogger(__name__)

class AutoApplier:
    def __init__(self, hh_service: HeadHunterService):
        self.hh_service = hh_service
        self.cover_letter_gen = CoverLetterGenerator()
        self.is_running = False
        
    async def start_auto_application(self, 
                                   resume_data: Dict, 
                                   vacancy_matches: List[Dict],
                                   min_similarity: float = 0.3,
                                   max_applications_per_day: int = 50):
        """Start automated application process"""
        
        if self.is_running:
            logger.warning("Auto applier is already running")
            return
            
        self.is_running = True
        applied_count = 0
        
        try:
            for match in vacancy_matches:
                if applied_count >= max_applications_per_day:
                    logger.info(f"Daily limit reached: {max_applications_per_day}")
                    break
                    
                vacancy = match["vacancy"]
                similarity = match["similarity"]
                
                if similarity < min_similarity:
                    continue
                    
                # Generate personalized cover letter
                cover_letter = self.cover_letter_gen.generate_cover_letter(
                    resume_data, vacancy
                )
                
                # Apply to vacancy
                success = await self._apply_with_retry(
                    vacancy["id"], 
                    resume_data["id"],
                    cover_letter
                )
                
                if success:
                    applied_count += 1
                    logger.info(f"Applied to {vacancy['name']} at {vacancy['employer']['name']}")
                
                # Delay between applications (important for rate limiting)
                await asyncio.sleep(300)  # 5 minutes between applications
                
        except Exception as e:
            logger.error(f"Auto application error: {e}")
        finally:
            self.is_running = False
            
        return applied_count
    
    async def _apply_with_retry(self, vacancy_id: str, resume_id: str, cover_letter: str, max_retries: int = 3) -> bool:
        """Apply with retry logic"""
        for attempt in range(max_retries):
            try:
                return self.hh_service.apply_to_vacancy(vacancy_id, resume_id, cover_letter)
            except Exception as e:
                logger.warning(f"Application attempt {attempt + 1} failed: {e}")
                if attempt < max_retries - 1:
                    await asyncio.sleep(60 * (attempt + 1))  # Exponential backoff
                    
        return False