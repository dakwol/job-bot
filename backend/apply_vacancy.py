from pydantic import BaseModel

class ApplyRequest(BaseModel):
    vacancy_id: str