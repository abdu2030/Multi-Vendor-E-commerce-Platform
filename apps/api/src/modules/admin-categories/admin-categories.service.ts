import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";

type CategoryListItem = {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  parent: {
    id: string;
    name: string;
    slug: string;
  } | null;
  _count: {
    children: number;
    products: number;
  };
};

type CategoryTreeItem = CategoryListItem & {
  children: CategoryTreeItem[];
};

@Injectable()
export class AdminCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  getAll(includeInactive: boolean) {
    return this.prisma.category.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: [{ parentId: "asc" }, { name: "asc" }],
      select: categorySelect
    });
  }

  async getTree(includeInactive: boolean) {
    const categories = await this.getAll(includeInactive);

    return buildCategoryTree(categories);
  }

  async create(dto: CreateCategoryDto) {
    const parentId = dto.parentId?.trim() || null;

    if (parentId) {
      await this.findCategoryOrThrow(parentId);
    }

    const name = dto.name.trim();
    const slug = await this.createUniqueSlug(dto.slug?.trim() || name);

    return this.prisma.category.create({
      data: {
        name,
        slug,
        parentId,
        description: normalizeOptionalText(dto.description),
        isActive: dto.isActive ?? true
      },
      select: categorySelect
    });
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.findCategoryOrThrow(id);

    const data: {
      name?: string;
      slug?: string;
      parentId?: string | null;
      description?: string | null;
      isActive?: boolean;
    } = {};

    if (typeof dto.name !== "undefined") {
      data.name = dto.name.trim();
    }

    if (typeof dto.slug !== "undefined") {
      data.slug = await this.createUniqueSlug(dto.slug.trim(), id);
    }

    if (typeof dto.parentId !== "undefined") {
      const parentId = dto.parentId?.trim() || null;

      await this.assertParentAllowed(id, parentId);
      data.parentId = parentId;
    }

    if (typeof dto.description !== "undefined") {
      data.description = normalizeOptionalText(dto.description);
    }

    if (typeof dto.isActive !== "undefined") {
      data.isActive = dto.isActive;
    }

    return this.prisma.category.update({
      where: { id },
      data,
      select: categorySelect
    });
  }

  async setActive(id: string, isActive: boolean) {
    await this.findCategoryOrThrow(id);

    return this.prisma.category.update({
      where: { id },
      data: { isActive },
      select: categorySelect
    });
  }

  private async findCategoryOrThrow(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      select: { id: true, parentId: true }
    });

    if (!category) {
      throw new NotFoundException("Category was not found.");
    }

    return category;
  }

  private async assertParentAllowed(categoryId: string, parentId: string | null) {
    if (!parentId) {
      return;
    }

    if (categoryId === parentId) {
      throw new ConflictException("A category cannot be its own parent.");
    }

    let parent = await this.findCategoryOrThrow(parentId);

    while (parent.parentId) {
      if (parent.parentId === categoryId) {
        throw new ConflictException("A category cannot be moved under its own child.");
      }

      parent = await this.findCategoryOrThrow(parent.parentId);
    }
  }

  private async createUniqueSlug(value: string, excludeId?: string) {
    const baseSlug = slugify(value);
    let slug = baseSlug;
    let suffix = 2;

    while (
      await this.prisma.category.findFirst({
        where: {
          slug,
          ...(excludeId ? { id: { not: excludeId } } : {})
        },
        select: { id: true }
      })
    ) {
      slug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    return slug;
  }
}

const categorySelect = {
  id: true,
  parentId: true,
  name: true,
  slug: true,
  description: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  parent: {
    select: {
      id: true,
      name: true,
      slug: true
    }
  },
  _count: {
    select: {
      children: true,
      products: true
    }
  }
} as const;

function buildCategoryTree(categories: CategoryListItem[]) {
  const byId = new Map<string, CategoryTreeItem>();
  const roots: CategoryTreeItem[] = [];

  for (const category of categories) {
    byId.set(category.id, { ...category, children: [] });
  }

  for (const category of byId.values()) {
    if (category.parentId && byId.has(category.parentId)) {
      byId.get(category.parentId)?.children.push(category);
      continue;
    }

    roots.push(category);
  }

  return roots;
}

function normalizeOptionalText(value?: string | null) {
  if (typeof value === "undefined") {
    return undefined;
  }

  return value?.trim() || null;
}

function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "category";
}
