from functools import lru_cache

from supabase import Client, create_client

from app.core.config import settings


@lru_cache
def get_service_role_client() -> Client:
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise RuntimeError("Supabase service-role configuration is missing")
    return create_client(
        settings.supabase_url,
        settings.supabase_service_role_key,
    )
