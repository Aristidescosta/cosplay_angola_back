from rest_framework import permissions


class IsSuperUser(permissions.BasePermission):
    """
    Permissão customizada: permite acesso apenas para superusuários.

    Uso:
        class MyView(APIView):
            permission_classes = [IsSuperUser]

    O que faz:
    - Verifica se o usuário está autenticado (request.user.is_authenticated)
    - Verifica se é superusuário (request.user.is_superuser)
    - Retorna True se ambos são True, False caso contrário

    Por que usar isso?
    - Protege rotas de admin
    - Impede que usuários comuns acessem funcionalidades restritas
    - Centraliza lógica de permissão (não repete código)
    """

    def has_permission(self, request, view):
        """
        Retorna True se o usuário tem permissão, False caso contrário.

        Args:
            request: Objeto HttpRequest do Django
            view: View que está sendo acessada

        Returns:
            bool: True se tem permissão, False caso contrário
        """
        # Primeiro verifica se está autenticado
        if not request.user or not request.user.is_authenticated:
            return False

        # Depois verifica se é superusuário
        return request.user.is_superuser

    def has_object_permission(self, request, view, obj):
        """
        Retorna True se o usuário tem permissão para acessar este objeto específico.

        Útil para casos como:
        - Usuário só pode editar seus próprios posts
        - Admin pode editar posts de qualquer um

        Args:
            request: Objeto HttpRequest
            view: View sendo acessada
            obj: Objeto específico sendo acessado

        Returns:
            bool: True se tem permissão, False caso contrário
        """
        # Superusuários podem acessar qualquer objeto
        return request.user.is_superuser


class IsSuperUserOrReadOnly(permissions.BasePermission):
    """
    Permissão: superusuários podem fazer tudo, outros apenas ler.

    Útil para endpoints públicos que precisam de admin para editar.

    Exemplo:
        GET /api/events/ - Qualquer um pode ver (read-only)
        POST /api/events/ - Só super admin pode criar
        PUT /api/events/1/ - Só super admin pode editar
        DELETE /api/events/1/ - Só super admin pode deletar
    """

    def has_permission(self, request, view):
        # Métodos seguros (GET, HEAD, OPTIONS) são permitidos para todos
        if request.method in permissions.SAFE_METHODS:
            return True

        # Outros métodos (POST, PUT, DELETE) só para superusuários
        return (
            request.user and request.user.is_authenticated and request.user.is_superuser
        )


class IsOwnerOrSuperUser(permissions.BasePermission):
    """
    Permissão: dono do objeto ou superusuário pode editar.

    Útil para:
    - Usuário pode editar seu próprio perfil
    - Admin pode editar perfil de qualquer um

    IMPORTANTE: O objeto precisa ter um campo 'user' ou 'owner'
    """

    def has_object_permission(self, request, view, obj):
        # Superusuários podem tudo
        if request.user.is_superuser:
            return True

        # Verifica se o objeto pertence ao usuário
        # Tenta 'user' primeiro, depois 'owner', depois 'author'
        owner = (
            getattr(obj, "user", None)
            or getattr(obj, "owner", None)
            or getattr(obj, "author", None)
        )

        return owner == request.user
