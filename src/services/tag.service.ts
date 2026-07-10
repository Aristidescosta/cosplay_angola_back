
import { CreateTag, FilterTag, UpdateTag } from "../schemas/tag.schema";
import { slugify } from "../utils/slug";
import { prisma } from "../config/database";
import { Tag } from "../generated/prisma/client";

export class TagService {
    async create(data: CreateTag): Promise<Tag> {
        const slug = slugify(data.name);
        const existingTag = await prisma.tag.findUnique({
            where: { slug }
        })
        if (existingTag)
            throw new Error('Já existe uma tag com este nome')
        const tag = await prisma.tag.create({
            data: {
                name: data.name,
                category: data.category,
                slug
            }
        })
        return tag;
    }

    async update(id: string, data: UpdateTag): Promise<Tag> {
        const existing = await prisma.tag.findUnique({ where: { id } });
        if (!existing)
            throw new Error('Tag não encontrada');

        if (data.name && data.name !== existing.name) {
            const slug = slugify(data.name);
            const slugConflict = await prisma.tag.findUnique({ where: { slug } });
            if (slugConflict && slugConflict.id !== id)
                throw new Error('Já existe uma tag com este nome');
        }

        const tagUpdated = await prisma.tag.update({
            where: { id },
            data: {
                ...(data.name !== undefined && { name: data.name, slug: slugify(data.name) }),
                ...(data.category !== undefined && { category: data.category }),
            }
        })
        return tagUpdated;
    }

    async delete(id: string) {
        const tag = await prisma.tag.findUnique({
            where: { id }
        })
        if (!tag)
            throw new Error('Tag não encontrada');
        await prisma.tag.delete({
            where: { id }
        })
        return { message: 'Tag apagada com sucesso' }
    }

    async list(filters: FilterTag) {
        const where: any = {};
        const offset = (filters.page - 1) * filters.limit;
        if (filters.category !== undefined)
            where.category = filters.category;
        if (filters.search) {
            where.OR = [
                { name: { contains: filters.search, mode: 'insensitive' } }
            ]
        }

        const orderBy = filters.sortBy === 'popularity'
            ? { usageCount: 'desc' as const }
            : { name: 'asc' as const };

        const [allTags, total] = await prisma.$transaction([
            prisma.tag.findMany({
                where,
                take: filters.limit,
                skip: offset,
                orderBy
            }),
            prisma.tag.count({ where })
        ])
        return {
            tags: allTags,
            total,
            limit: filters.limit,
            offset
        }
    }

    async getBySlug(slug: string) {
        const tag = await prisma.tag.findUnique({
            where: { slug },
        })
        if (!tag)
            throw new Error('Tag não encontrada');
        return tag;
    }
}