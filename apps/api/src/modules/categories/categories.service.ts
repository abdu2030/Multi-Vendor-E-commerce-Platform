import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

type CategoryListItem = {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  description: string | null;
};

type CategoryTreeItem = CategoryListItem & {
  children: CategoryTreeItem[];
};

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  getAll() {
    return this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ parentId: "asc" }, { name: "asc" }],
      select: categorySelect
    });
  }

  async getTree() {
    const categories = await this.getAll();

    return buildCategoryTree(categories);
  }
}

const categorySelect = {
  id: true,
  parentId: true,
  name: true,
  slug: true,
  description: true
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
