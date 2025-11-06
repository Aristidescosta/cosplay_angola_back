import pytest
from django.contrib.auth.models import User


@pytest.mark.django_db
def test_create_user():
    """Testa se conseguimos criar um usuário no banco."""
    user = User.objects.create_user(
        username="testuser", email="test@example.com", password="testpass123"
    )
    assert user.username == "testuser"
    assert user.email == "test@example.com"
    assert user.check_password("testpass123")


def test_simple_math():
    """Teste simples sem banco de dados."""
    assert 1 + 1 == 2
