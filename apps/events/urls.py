from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .viewsets import EventoViewSet

# ============================================
# ROUTER (Cria URLs automaticamente)
# ============================================

router = DefaultRouter()
router.register(r"events", EventoViewSet, basename="evento")

# Isso gera automaticamente:
# GET    /api/events/              → list
# POST   /api/events/              → create
# GET    /api/events/{id}/         → retrieve
# PUT    /api/events/{id}/         → update
# PATCH  /api/events/{id}/         → partial_update
# DELETE /api/events/{id}/         → destroy
# GET    /api/events/proximos/     → action customizada
# GET    /api/events/passados/     → action customizada
# GET    /api/events/destaques/    → action customizada
# GET    /api/events/{id}/relacionados/ → action customizada

urlpatterns = [
    path("", include(router.urls)),
]
