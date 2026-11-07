from typing import Any, cast

from postgrest import CountMethod

from app.integrations.supabase import get_service_role_client


class ProductRepository:
    def list_products(
        self,
        *,
        query: str | None,
        category: str | None,
        page: int,
        page_size: int,
    ) -> tuple[list[dict[str, Any]], int]:
        start = (page - 1) * page_size
        request = (
            get_service_role_client()
            .table("products")
            .select(
                "id,name,slug,model_number,image_url,brand:brands(name),"
                "category:categories!inner(name,slug),"
                "cpu_specs(tdp_w,core_count,thread_count,base_clock_ghz,"
                "boost_clock_ghz,l3_cache_mb,socket:cpu_sockets(name)),"
                "offers:merchant_listings("
                "id,title,product_url,price,currency,stock,last_checked_at,"
                "is_active,merchant:merchants!inner(name,slug,logo_url))",
                count=CountMethod.exact,
            )
            .eq("is_active", True)
            .order("name")
            .range(start, start + page_size - 1)
        )
        if query:
            request = request.ilike("name", f"%{query.strip()}%")
        if category:
            request = request.eq("categories.slug", category)
        response = request.execute()
        return cast(list[dict[str, Any]], response.data), response.count or 0

    def get_by_slug(self, slug: str) -> dict[str, Any] | None:
        response = (
            get_service_role_client()
            .table("products")
            .select(
                "id,name,slug,model_number,description,image_url,"
                "brand:brands(name),category:categories!inner(name,slug),"
                "cpu_specs(tdp_w,max_power_w,ram_types,core_count,"
                "thread_count,base_clock_ghz,boost_clock_ghz,l3_cache_mb,"
                "source_url,"
                "socket:cpu_sockets(name)),"
                "offers:merchant_listings("
                "id,title,product_url,price,currency,stock,last_checked_at,"
                "is_active,merchant:merchants!inner(name,slug,logo_url),"
                "price_history(price,currency,captured_at))"
            )
            .eq("slug", slug)
            .eq("is_active", True)
            .limit(1)
            .execute()
        )
        if not response.data:
            return None
        return cast(dict[str, Any], response.data[0])
