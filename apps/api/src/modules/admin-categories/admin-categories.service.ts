import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
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
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogs: AuditLogsService
  ) {}

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

  async create(dto: CreateCategoryDto, adminUserId: string) {
    const parentId = dto.parentId?.trim() || null;

    if (parentId) {
      await this.findCategoryOrThrow(parentId);
    }

    const name = dto.name.trim();
    const slug = await this.createUniqueSlug(dto.slug?.trim() || name);

    const data = {
        name,
        slug,
        parentId,
        description: normalizeOptionalText(dto.description),
        isActive: dto.isActive ?? true
      };

    return this.prisma.$transaction(async (tx) => {
      const category = await tx.category.create({
        data,
        select: categorySelect
      });

      await this.auditLogs.create({
        actorUserId: adminUserId,
        action: "CATEGORY_CREATED",
        entity: "Category",
        entityId: category.id,
        metadata: data
      }, tx);

      return category;
    });
  }

  async update(id: string, dto: UpdateCategoryDto, adminUserId: string) {
    const existingCategory = await this.findCategoryOrThrow(id);

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

    const [category] = await this.prisma.$transaction([
      this.prisma.category.update({
        where: { id },
        data,
        select: categorySelect
      }),
      this.auditLogs.create({
        actorUserId: adminUserId,
        action: "CATEGORY_UPDATED",
        entity: "Category",
        entityId: id,
        metadata: {
          changes: buildChanges(existingCategory, data)
        }
      })
    ]);

    return category;
  }

  async setActive(id: string, isActive: boolean, adminUserId: string) {
    const existingCategory = await this.findCategoryOrThrow(id);

    const [category] = await this.prisma.$transaction([
      this.prisma.category.update({
        where: { id },
        data: { isActive },
        select: categorySelect
      }),
      this.auditLogs.create({
        actorUserId: adminUserId,
        action: isActive ? "CATEGORY_ACTIVATED" : "CATEGORY_DEACTIVATED",
        entity: "Category",
        entityId: id,
        metadata: {
          previousIsActive: existingCategory.isActive,
          newIsActive: isActive,
          name: existingCategory.name,
          slug: existingCategory.slug
        }
      })
    ]);

    return category;
  }

  private async findCategoryOrThrow(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      select: { id: true, parentId: true, name: true, slug: true, description: true, isActive: true }
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

type AuditableCategory = {
  name?: string;
  slug?: string;
  parentId?: string | null;
  description?: string | null;
  isActive?: boolean;
};

type CategoryChangeSet = Record<string, { from: string | boolean | null; to: string | boolean | null }>;

function buildChanges(before: AuditableCategory, after: AuditableCategory) {
  const changes: CategoryChangeSet = {};

  for (const [field, nextValue] of Object.entries(after)) {
    if (typeof nextValue === "undefined") {
      continue;
    }

    const previousValue = before[field as keyof AuditableCategory] ?? null;
    const normalizedNextValue = nextValue ?? null;

    if (previousValue !== normalizedNextValue) {
      changes[field] = {
        from: previousValue,
        to: normalizedNextValue
      };
    }
  }

  return changes;
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
