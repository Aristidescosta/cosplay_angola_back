from django.contrib import admin
from django.urls import include, path  # noqa: F401

urlpatterns = [
    path("admin/", admin.site.urls),
    # Endpoints de autenticação
    path("api/auth/", include("apps.accounts.urls")),
    # APIs dos apps serão adicionadas aqui depois
    # path('api/cosplayers/', include('apps.cosplayers.urls')),
    # Eventos
    path("api/", include("apps.events.urls")),
]
