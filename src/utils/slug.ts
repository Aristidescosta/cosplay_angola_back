export function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD') // Remove acentos
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, '-') // Espaços viram hífens
    .replace(/-+/g, '-') // Remove hífens duplicados
    .trim();
}