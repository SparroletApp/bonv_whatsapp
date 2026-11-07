import api from "./apiservice";

export interface CategorySummary { id: number; name: string; contactCount: number }
export interface ContactItem { id: number; name: string; phone: string; email: string | null }
export interface CategoryDetails extends CategorySummary { contacts: ContactItem[] }

const categoryInsightService = {
    list: () => api.get<CategorySummary[]>("/whatsapp/categories"),
    details: (id: number) => api.get<CategoryDetails>(`/whatsapp/categories/${id}`),
};

export default categoryInsightService;