from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", ".env.local"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "TechBondhu API"
    env: str = Field(default="development", validation_alias="APP_ENV")
    debug: bool = Field(default=False, validation_alias="APP_DEBUG")
    api_v1_prefix: str = Field(default="/api/v1", validation_alias="APP_API_V1_PREFIX")
    cors_origins_raw: str = Field(
        default="http://localhost:3000",
        validation_alias="APP_CORS_ORIGINS",
    )
    supabase_url: str | None = Field(default=None, validation_alias="SUPABASE_URL")
    supabase_anon_key: str | None = Field(
        default=None,
        validation_alias="SUPABASE_ANON_KEY",
    )
    supabase_service_role_key: str | None = Field(
        default=None,
        validation_alias="SUPABASE_SERVICE_ROLE_KEY",
    )
    better_auth_url: str = Field(
        default="http://localhost:3000",
        validation_alias="BETTER_AUTH_URL",
    )
    better_auth_jwks_url_override: str | None = Field(
        default=None,
        validation_alias="BETTER_AUTH_JWKS_URL",
    )

    @property
    def cors_origins(self) -> list[str]:
        return [
            origin.strip()
            for origin in self.cors_origins_raw.split(",")
            if origin.strip()
        ]

    @property
    def better_auth_jwks_url(self) -> str:
        if self.better_auth_jwks_url_override:
            return self.better_auth_jwks_url_override
        return f"{self.better_auth_url.rstrip('/')}/api/auth/jwks"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

