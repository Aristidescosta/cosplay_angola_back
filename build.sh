#!/usr/bin/env bash
# exit on error
set -o errexit

# Instalar dependências
pip install -r requirements.txt

# Coletar arquivos estáticos
python manage.py collectstatic --no-input

# Aplicar migrations
python manage.py migrate

# Criar superusuário se não existir (opcional)
# python manage.py createsuperuser --noinput --username admin --email admin@cosplayangola.com || true
