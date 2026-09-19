import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    APP_NAME: str = "FacilityAI"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # LLM Settings
    LLM_PROVIDER: str = "fallback"  # Options: openai, gemini, fallback
    LLM_MODEL: str = "gpt-4o-mini"
    OPENAI_API_KEY: str = ""
    GEMINI_API_KEY: str = ""

    # Embedding & Retrieval Settings
    EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"
    DATA_PATH: str = "data/maintenance_records.csv"
    VECTOR_DB_PATH: str = "vector_db"
    TOP_K_CASES: int = 5

    # CORS
    FRONTEND_URL: str = "http://localhost:5173"

    @property
    def resolved_data_path(self) -> Path:
        p = Path(self.DATA_PATH)
        if p.is_absolute() and p.exists():
            return p
        if (BASE_DIR / p).exists():
            return BASE_DIR / p
        if p.exists():
            return p.resolve()
        return BASE_DIR / p

    @property
    def resolved_vector_db_path(self) -> Path:
        p = Path(self.VECTOR_DB_PATH)
        if p.is_absolute():
            return p
        return BASE_DIR / p

    @property
    def is_llm_configured(self) -> bool:
        if self.LLM_PROVIDER == "openai" and bool(self.OPENAI_API_KEY):
            return True
        if self.LLM_PROVIDER == "gemini" and bool(self.GEMINI_API_KEY):
            return True
        return False

settings = Settings()
