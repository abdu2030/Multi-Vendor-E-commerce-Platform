import { apiRequest } from "./api";

export type Category = {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  description: string | null;
};

export function getCategories() {
  return apiRequest<Category[]>("/categories");
}
