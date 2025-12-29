# seed_data.py
"""
Script para popular o banco de dados com dados de teste.
Uso: python manage.py shell < seed_data.py
"""

import os
import uuid
from datetime import date, timedelta

import django
from django.utils import timezone
from django.utils.text import slugify

from apps.cosplay_collections.models import Colecao
from apps.cosplayers.models import Cosplayer
from apps.events.models import Categoria, Evento, Newsletter, Parceiro
from apps.media_files.models import Midia

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()


def ensure_unique_slug_for_colecao(colecao):
    """
    Gera e atribui um slug único para uma instância de Colecao, se necessário.
    """
    if not hasattr(colecao, "slug"):
        return
    current = getattr(colecao, "slug", None)
    if current:
        return
    base = slugify(getattr(colecao, "titulo", "") or "")
    if not base:
        base = f"colecao-{uuid.uuid4().hex[:6]}"
    slug = base
    # Garante unicidade
    counter = 0
    while Colecao.objects.filter(slug=slug).exists():
        counter += 1
        slug = f"{base}-{counter}"
        if counter > 100:
            # fallback aleatório
            slug = f"{base}-{uuid.uuid4().hex[:6]}"
            break
    colecao.slug = slug
    colecao.save(update_fields=["slug"])


# Limpar dados existentes (CUIDADO: só use em desenvolvimento!)
print("🗑️  Limpando dados antigos...")
ColecaoMidia = __import__(
    "apps.media_files.models", fromlist=["ColecaoMidia"]
).ColecaoMidia
EventoParceiro = __import__(
    "apps.events.models", fromlist=["EventoParceiro"]
).EventoParceiro

ColecaoMidia.objects.all().delete()
EventoParceiro.objects.all().delete()
Midia.objects.all().delete()
Colecao.objects.all().delete()
Newsletter.objects.all().delete()
Parceiro.objects.all().delete()
Evento.objects.all().delete()
Categoria.objects.all().delete()
Cosplayer.objects.all().delete()

print("✅ Dados antigos removidos!")

# CATEGORIAS
print("\n📁 Criando Categorias...")
cat_concurso = Categoria.objects.create(
    nome="Concurso de Cosplay",
    descricao="Competições de cosplay com premiações",
    tipo="evento",
)

cat_exposicao = Categoria.objects.create(
    nome="Exposição Temática",
    descricao="Exposições fotográficas e mostras de cosplay",
    tipo="evento",
)

cat_workshop = Categoria.objects.create(
    nome="Workshop",
    descricao="Workshops de técnicas de cosplay, maquiagem e fotografia",
    tipo="evento",
)

print(f"✅ {Categoria.objects.count()} categorias criadas!")

# COSPLAYERS
print("\n👥 Criando Cosplayers...")
cosplayer1 = Cosplayer.objects.create(
    nome="Maria Silva",
    nome_artistico="Nami Cosplay AO",
    biografia=(
        "Cosplayer angolana especializada"
        " em personagens de anime. Participo de eventos desde 2020."
    ),
    foto_perfil="https://via.placeholder.com/400x400?text=Maria+Silva",
    instagram="namicosplayao",
    facebook="namicosplayangola",
    tiktok="namicosplayao",
)

cosplayer2 = Cosplayer.objects.create(
    nome="João Santos",
    nome_artistico="Luffy AO",
    biografia="Cosplayer focado em personagens de One Piece e outros shounens.",
    foto_perfil="https://via.placeholder.com/400x400?text=Joao+Santos",
    instagram="luffyao",
    tiktok="luffyaocosplay",
)

cosplayer3 = Cosplayer.objects.create(
    nome="Ana Costa",
    biografia=(
        "Iniciante no mundo do cosplay," " apaixonada por personagens femininas fortes."
    ),
    foto_perfil="https://via.placeholder.com/400x400?text=Ana+Costa",
    instagram="anacostacosplay",
)

print(f"✅ {Cosplayer.objects.count()} cosplayers criados!")

# EVENTOS
print("\n📅 Criando Eventos...")
now = timezone.now()
evento1 = Evento.objects.create(
    titulo="Anima Luanda 2025",
    descricao=(
        "O maior evento de cultura pop e anime de Angola. Concursos"
        " , stands, convidados especiais e muito mais!"
    ),
    data_inicio=now + timedelta(days=60),
    data_fim=now + timedelta(days=62),
    local="Centro de Convenções de Talatona",
    categoria=cat_concurso,
    tipo_evento="concurso",
    abrangencia="nacional",
    status="publicado",
    imagem_destaque="https://via.placeholder.com/1200x600?text=Anima+Luanda+2025",
)

evento2 = Evento.objects.create(
    titulo="Workshop: Técnicas de Maquiagem para Cosplay",
    descricao=(
        "Aprenda técnicas profissionais de maquiagem para cosplay "
        "com a maquiadora Carla Mendes."
    ),
    data_inicio=now + timedelta(days=30),
    data_fim=now + timedelta(days=30),
    local="Centro Cultural Português",
    categoria=cat_workshop,
    tipo_evento="workshop",
    abrangencia="nacional",
    status="publicado",
    imagem_destaque="https://via.placeholder.com/1200x600?text=Workshop+Maquiagem",
)

evento3 = Evento.objects.create(
    titulo="Exposição: Heróis em Foco",
    descricao=(
        "Exposição fotográfica com os melhores cosplays de "
        "super-heróis produzidos em Angola."
    ),
    data_inicio=now + timedelta(days=90),
    data_fim=now + timedelta(days=120),
    local="Galeria Rainha Ginga",
    categoria=cat_exposicao,
    tipo_evento="exposicao",
    abrangencia="nacional",
    status="rascunho",
    imagem_destaque="https://via.placeholder.com/1200x600?text=Herois+em+Foco",
)

print(f"✅ {Evento.objects.count()} eventos criados!")

# PARCEIROS
print("\n🤝 Criando Parceiros...")
parceiro1 = Parceiro.objects.create(
    nome="Unitel",
    tipo="patrocinador",
    descricao="Patrocinador oficial dos principais eventos de cultura pop em Angola",
    logo_url="https://via.placeholder.com/300x100?text=Unitel",
    site="https://www.unitel.ao",
    ativo=True,
)

parceiro2 = Parceiro.objects.create(
    nome="TV Zimbo",
    tipo="midia",
    descricao="Cobertura mediática e divulgação dos eventos",
    logo_url="https://via.placeholder.com/300x100?text=TV+Zimbo",
    site="https://www.tvzimbo.ao",
    ativo=True,
)

# Vincular parceiros aos eventos
evento1.parceiros.add(parceiro1, parceiro2)
evento2.parceiros.add(parceiro1)

print(f"✅ {Parceiro.objects.count()} parceiros criados!")

# COLEÇÕES
print("\n🎨 Criando Coleções...")
colecao1 = Colecao.objects.create(
    titulo="Especial Anima Luanda 2024",
    descricao="Cobertura fotográfica completa do evento Anima Luanda 2024",
    tipo="evento",
    data_producao=date(2024, 11, 15),
    destaque=True,
    evento=evento1,
)
ensure_unique_slug_for_colecao(colecao1)

colecao2 = Colecao.objects.create(
    titulo="Ensaio: Nami Cosplay - One Piece",
    descricao="Ensaio temático da personagem Nami de One Piece",
    tipo="cosplayer",
    data_producao=date(2025, 1, 10),
    destaque=True,
    cosplayer=cosplayer1,
)
ensure_unique_slug_for_colecao(colecao2)

colecao3 = Colecao.objects.create(
    titulo="Coleção Temática: Naruto",
    descricao="Coleção com diversos cosplays de personagens de Naruto",
    tipo="tematica",
    data_producao=date(2024, 12, 5),
    destaque=False,
)
ensure_unique_slug_for_colecao(colecao3)

print(f"✅ {Colecao.objects.count()} coleções criadas!")

# MÍDIAS
print("\n📸 Criando Mídias...")
midia1 = Midia.objects.create(
    titulo="Nami Cosplay - Foto Principal",
    descricao="Foto principal do ensaio de Nami",
    arquivo_url="https://via.placeholder.com/1920x1080?text=Nami+Cosplay+1",
    tipo="imagem",
    formato="jpg",
    tamanho_kb=2048,
    largura=1920,
    altura=1080,
    creditos_fotografo="Pedro Fotografia",
    data_captura=date(2025, 1, 10),
    destaque=True,
)

midia2 = Midia.objects.create(
    titulo="Nami Cosplay - Detalhe Cabelo",
    descricao="Detalhe do cabelo laranja da Nami",
    arquivo_url="https://via.placeholder.com/1920x1080?text=Nami+Detalhe",
    tipo="imagem",
    formato="jpg",
    tamanho_kb=1536,
    largura=1920,
    altura=1080,
    creditos_fotografo="Pedro Fotografia",
    data_captura=date(2025, 1, 10),
    destaque=False,
)

midia3 = Midia.objects.create(
    titulo="Anima Luanda 2024 - Abertura",
    descricao="Vídeo da cerimônia de abertura",
    arquivo_url="https://via.placeholder.com/1920x1080?text=Video+Anima+2024",
    tipo="video",
    formato="mp4",
    tamanho_kb=51200,  # 50MB
    largura=1920,
    altura=1080,
    creditos_fotografo="Equipe Cosplay Angola",
    data_captura=date(2024, 11, 15),
    destaque=True,
)

# Vincular mídias às coleções (verifica se os relacionamentos existem)
try:
    colecao2.midias.add(midia1, midia2)
    colecao1.midias.add(midia3)
except Exception:
    # caso o nome do campo seja diferente ou não exista, ignore silenciosamente
    pass

print(f"✅ {Midia.objects.count()} mídias criadas!")

# NEWSLETTER
print("\n📧 Criando assinantes da newsletter...")
Newsletter.objects.create(
    email="teste1@example.com",
    nome="Teste Um",
    ativo=True,
    data_confirmacao=timezone.now(),
)

Newsletter.objects.create(email="teste2@example.com", nome="Teste Dois", ativo=True)

print(f"✅ {Newsletter.objects.count()} assinantes criados!")

# RESUMO
print("\n" + "=" * 50)
print("🎉 SEED COMPLETO!")
print("=" * 50)
print(f"📁 Categorias: {Categoria.objects.count()}")
print(f"👥 Cosplayers: {Cosplayer.objects.count()}")
print(f"📅 Eventos: {Evento.objects.count()}")
print(f"🤝 Parceiros: {Parceiro.objects.count()}")
print(f"🎨 Coleções: {Colecao.objects.count()}")
print(f"📸 Mídias: {Midia.objects.count()}")
print(f"📧 Newsletter: {Newsletter.objects.count()}")
print("=" * 50)
print("\n✅ Acesse o admin para visualizar: http://127.0.0.1:8000/admin/")
