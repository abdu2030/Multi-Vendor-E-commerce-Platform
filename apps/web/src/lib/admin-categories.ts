import { apiRequest } from "./api";

export type AdminCategory = {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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

export type AdminCategoryTreeItem = AdminCategory & {
  children: AdminCategoryTreeItem[];
};

export type CategoryPayload = {
  name: string;
  slug?: string;
  parentId?: string | null;
  description?: string | null;
  isActive?: boolean;
};

export function getAdminCategories(accessToken: string, includeInactive = true) {
  return apiRequest<AdminCategory[]>(`/admin/categories?includeInactive=${includeInactive}`, {
    token: accessToken
  });
}

export function getAdminCategoryTree(accessToken: string, includeInactive = true) {
  return apiRequest<AdminCategoryTreeItem[]>(`/admin/categories/tree?includeInactive=${includeInactive}`, {
    token: accessToken
  });
}

export function createAdminCategory(accessToken: string, payload: CategoryPayload) {
  return apiRequest<AdminCategory>("/admin/categories", {
    method: "POST",
    token: accessToken,
    body: JSON.stringify(payload)
  });
}

export function updateAdminCategory(accessToken: string, categoryId: string, payload: CategoryPayload) {
  return apiRequest<AdminCategory>(`/admin/categories/${categoryId}`, {
    method: "PATCH",
    token: accessToken,
    body: JSON.stringify(payload)
  });
}

export function setAdminCategoryActive(accessToken: string, categoryId: string, active: boolean) {
  return apiRequest<AdminCategory>(`/admin/categories/${categoryId}/${active ? "activate" : "deactivate"}`, {
    method: "PATCH",
    token: accessToken
  });
}
