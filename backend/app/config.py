from functools import lru_cache
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_ENV_FILE = Path(__file__).resolve().parent.parent / ".env"

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=BACKEND_ENV_FILE, extra="ignore")
    database_url: str = "postgresql+psycopg://carbon_user:2005@localhost:5432/carbon_twins"
    cors_origins: str = "http://localhost:3000"
    gemini_api_key: str | None = None
    # Modelo Flash-Lite estable: prioriza bajo costo y baja latencia para el chat.
    gemini_model: str = "gemini-3.5-flash-lite"
    langflow_url: str | None = None
    langflow_flow_id: str | None = None
    langflow_api_key: str | None = None
    langflow_timeout_seconds: float = 60.0
    ml_training_enabled: bool = True
    frontend_dist_dir: Path | None = None

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def langflow_configured(self) -> bool:
        return bool(self.langflow_url and self.langflow_flow_id and self.langflow_api_key)


@lru_cache
def get_settings() -> Settings:
    return Settings()
