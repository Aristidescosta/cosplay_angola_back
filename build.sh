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

echo "✅ Build concluído com sucesso!"
