# Cosplay Angola - Backend API

Backend profissional em Django + DRF para o acervo digital de cosplay em Angola.

![Python Version](https://img.shields.io/badge/python-3.11%2B-blue)
![Django Version](https://img.shields.io/badge/django-5.0-green)
![DRF Version](https://img.shields.io/badge/drf-3.14-orange)
![Code Style](https://img.shields.io/badge/code%20style-black-black)

## 📋 Sobre o Projeto

Cosplay Angola é um acervo digital profissional que documenta e promove o movimento cosplay em Angola. Este repositório contém a API backend que gerencia cosplayers, coleções fotográficas, eventos e conteúdo audiovisual.

**Documentos do projeto:**
- [Termo de Abertura (TAP)](docs/TAP.pdf)
- [Modelo de Negócio](docs/MODELO_NEGOCIO.pdf)

## 🚀 Tecnologias

- **Python 3.11+**
- **Django 5.0** - Framework web
- **Django REST Framework 3.14** - API REST
- **PostgreSQL** - Banco de dados (produção)
- **SQLite** - Banco de dados (desenvolvimento)
- **pytest** - Framework de testes
- **Black** - Formatador de código
- **Flake8** - Linter
- **isort** - Organizador de imports
- **pre-commit** - Git hooks
- **Commitizen** - Conventional Commits

## 📦 Pré-requisitos

- Python 3.11 ou superior
- pip (gerenciador de pacotes Python)
- Git
- PostgreSQL 14+ (produção) ou SQLite (desenvolvimento)

## 🔧 Instalação e Configuração

### 1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/cosplay-angola-backend.git
cd cosplay-angola-backend
```

### 2. Crie e ative o ambiente virtual

**Linux/Mac:**
```bash
python3 -m venv venv
source venv/bin/activate
```

**Windows:**
```bash
python -m venv venv
venv\Scripts\activate
```

### 3. Instale as dependências
```bash
pip install -r requirements.txt
```

### 4. Configure as variáveis de ambiente
```bash
cp .env.example .env
```

Edite o arquivo `.env` e preencha as variáveis:
```env
SECRET_KEY=sua-chave-secreta-aqui
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database Configuration (PostgreSQL)
DB_ENGINE=django.db.backends.postgresql
DB_NAME=cosplay_angola_db
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
DB_HOST=localhost
DB_PORT=5432
```

Para gerar uma SECRET_KEY segura:
```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

### 5. Execute as migrações do banco de dados
```bash
python manage.py migrate
```
### 6. (Opcional) Popule o banco com dados de teste
```bash
python manage.py shell < seed_data.py
```

### 7. (Opcional) Crie um superusuário
```bash
python manage.py createsuperuser
```

### 8. Rode o servidor de desenvolvimento
```bash
python manage.py runserver
```

Acesse:
- API: http://127.0.0.1:8000/
- Admin: http://127.0.0.1:8000/admin/

---

### 🛠️ Gerenciamento do Banco

#### Criar novas migrations
```bash
# Após modificar algum model:
python manage.py makemigrations

# Aplicar migrations:
python manage.py migrate
```

#### Verificar status das migrations
```bash
python manage.py showmigrations
```

#### Resetar banco de dados (CUIDADO!)
```bash
# Apenas em desenvolvimento!
python manage.py flush
python manage.py migrate
python manage.py shell < seed_data.py
```

#### Gerar novo diagrama ERD
```bash
python manage.py graph_models cosplay_collections cosplayers events media_files \
    --arrow-shape normal \
    -o erd_cosplay_angola_detailed.png
```

#### Backup do banco (PostgreSQL)
```bash
pg_dump -U seu_usuario cosplay_angola_db > backup_$(date +%Y%m%d).sql
```

#### Restaurar backup (PostgreSQL)
```bash
psql -U seu_usuario cosplay_angola_db < backup_20250101.sql
```

---

## 🧪 Testes

### Rodar todos os testes
```bash
pytest
```

### Rodar com cobertura
```bash
pytest --cov
```

### Relatório de cobertura HTML
```bash
pytest --cov --cov-report=html
# Abra htmlcov/index.html no navegador
```

## 🎨 Qualidade de Código

### Formatação automática
```bash
black .
isort .
```

### Verificação de qualidade
```bash
flake8
```

### Rodar tudo de uma vez
```bash
black . && isort . && flake8 && pytest
```

### Pre-commit hooks

Os hooks rodam automaticamente antes de cada commit. Para rodar manualmente:
```bash
pre-commit run --all-files
```

## 📝 Padrão de Commits

Este projeto usa [Conventional Commits](https://www.conventionalcommits.org/).

### Fazer commit com Commitizen
```bash
git add .
cz commit
```

ou use o formato direto:
```bash
git commit -m "feat(cosplayers): adiciona model Cosplayer"
```

### Tipos de commit

- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Mudanças na documentação
- `style`: Formatação (sem mudança de código)
- `refactor`: Refatoração (sem adicionar feature ou corrigir bug)
- `test`: Adição ou modificação de testes
- `chore`: Manutenção geral

## 🏗️ Estrutura do Projeto
```
cosplay-angola-backend/
├── apps/                    # Apps Django
│   ├── cosplayers/         # Gerenciamento de cosplayers
│   ├── collections/        # Coleções fotográficas
│   ├── events/             # Eventos cobertos
│   └── media_files/        # Arquivos de mídia
├── config/                 # Configurações Django
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── tests/                  # Testes globais
├── .env.example           # Template de variáveis de ambiente
├── .gitignore
├── manage.py
├── pytest.ini
├── pyproject.toml
├── requirements.txt
└── README.md
```

## 🤝 Como Contribuir

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feat/minha-feature`)
3. Commit suas mudanças usando Conventional Commits (`git commit -m 'feat: adiciona nova feature'`)
4. Push para a branch (`git push origin feat/minha-feature`)
5. Abra um Pull Request

### Checklist antes de abrir PR

- [ ] Código formatado com Black e isort
- [ ] Sem erros no Flake8
- [ ] Testes passando (`pytest`)
- [ ] Cobertura de testes adequada
- [ ] Commits seguindo Conventional Commits
- [ ] Documentação atualizada se necessário
- [ ] Migrations criadas e testadas

---

## 📚 Documentação Adicional

- [Guia de Configuração PostgreSQL](docs/postgres_setup.md)
- [Guia de Autenticação JWT](docs/jwt_auth.md)
- [Diagrama ERD](erd_cosplay_angola_detailed.png)

---

**Cosplay Angola** - Documentando e promovendo a cultura cosplay em Angola 🇦🇴
