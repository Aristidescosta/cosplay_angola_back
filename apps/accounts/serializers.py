from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework.validators import UniqueValidator


class RegisterSerializer(serializers.ModelSerializer):
    """
    Serializer para registro de novos usuários.

    Valida:
    - Email único
    - Senha forte (usando validadores do Django)
    - Confirmação de senha
    """

    # Email com validador de unicidade
    email = serializers.EmailField(
        required=True, validators=[UniqueValidator(queryset=User.objects.all())]
    )

    # Senha com validador de força
    password = serializers.CharField(
        write_only=True,  # Nunca retorna a senha
        required=True,
        validators=[validate_password],
        style={"input_type": "password"},
    )

    # Confirmação de senha
    password2 = serializers.CharField(
        write_only=True, required=True, style={"input_type": "password"}
    )

    class Meta:
        model = User
        fields = (
            "username",
            "email",
            "password",
            "password2",
            "first_name",
            "last_name",
        )
        extra_kwargs = {
            "first_name": {"required": False},
            "last_name": {"required": False},
        }

    def validate(self, attrs):
        """Valida se as senhas coincidem."""
        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError(
                {"password": "Os campos de senha não coincidem."}
            )
        return attrs

    def create(self, validated_data):
        """Cria usuário com senha hasheada."""
        # Remove password2 (não existe no modelo User)
        validated_data.pop("password2")

        # Cria usuário usando create_user (faz hash automático da senha)
        user = User.objects.create_user(**validated_data)
        return user


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer básico de usuário para retornar dados após autenticação.
    Não retorna senha por segurança.
    """

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "is_superuser",
            "is_staff",
        )
        read_only_fields = ("id", "is_superuser", "is_staff")
