#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "🔧 Iniciando build..."

# Atualizar pip
echo "📦 Atualizando pip..."
pip install --upgrade pip

# Instalar dependências
echo "📦 Instalando dependências..."
pip install -r requirements.txt

# Coletar arquivos estáticos
echo "🎨 Coletando arquivos estáticos..."
python manage.py collectstatic --no-input

# Aplicar migrations
echo "🗄️  Aplicando migrations..."
python manage.py migrate

# --- CRIAR SUPERUSER (idempotente) ---
echo "🔐 Verificando/creando superuser (se variáveis definidas)..."

cat << 'PY' | python manage.py shell
from django.contrib.auth import get_user_model
import os, sys

User = get_user_model()
username = os.environ.get('DJANGO_SUPERUSER_USERNAME')
email = os.environ.get('DJANGO_SUPERUSER_EMAIL')
password = os.environ.get('DJANGO_SUPERUSER_PASSWORD')

if not username or not password:
    print("⚠️  DJANGO_SUPERUSER_USERNAME e/ou DJANGO_SUPERUSER_PASSWORD não definidos. Pulando criação.")
else:
    try:
        if User.objects.filter(username=username).exists():
            print("ℹ️  Superuser já existe:", username)
        else:
            User.objects.create_superuser(username=username, email=email or '', password=password)
            print("✅ Superuser criado:", username)
    except Exception as e:
        print("❌ Erro ao criar superuser:", e)
        # não sair com erro para não quebrar build
        sys.exit(0)
PY

echo "✅ Build concluído com sucesso!"
