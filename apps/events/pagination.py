from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class EventoPagination(PageNumberPagination):
    """
    Paginação customizada para eventos.

    Características:
    - 10 eventos por página por padrão
    - Cliente pode escolher até 100 por página
    - Retorna informações extras (total, páginas, etc)

    Uso:
        GET /api/events/                    → Página 1 (10 eventos)
        GET /api/events/?page=2             → Página 2 (10 eventos)
        GET /api/events/?page_size=20       → Página 1 (20 eventos)
        GET /api/events/?page=3&page_size=5 → Página 3 (5 eventos)
    """

    # Quantos itens por página por padrão
    page_size = 10

    # Nome do query param para página
    page_query_param = "page"

    # Nome do query param para tamanho da página
    page_size_query_param = "page_size"

    # Máximo de itens que o cliente pode pedir
    max_page_size = 100

    def get_paginated_response(self, data):
        """
        Customiza a resposta paginada.

        Resposta padrão do DRF:
        {
            "count": 100,
            "next": "http://api.../events/?page=2",
            "previous": null,
            "results": [...]
        }

        Nossa resposta customizada (mais informações):
        {
            "count": 100,
            "total_pages": 10,
            "current_page": 1,
            "page_size": 10,
            "next": "http://api.../events/?page=2",
            "previous": null,
            "results": [...]
        }
        """
        return Response(
            {
                "count": self.page.paginator.count,
                "total_pages": self.page.paginator.num_pages,
                "current_page": self.page.number,
                "page_size": self.get_page_size(self.request),
                "next": self.get_next_link(),
                "previous": self.get_previous_link(),
                "results": data,
            }
        )
