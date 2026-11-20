
import api from "./apiservice";

export interface CategoryResponseDto {
    id: number;
    categoryName: string;
    createdAt: string;
    updatedAt: string | null;
}

export interface CategoryCreateDto {
    categoryName: string;
    companyId: number;
}

export interface CategoryUpdateDto {
    id: number;
    categoryName: string;
    companyId: number;
}

export interface CategoryIdDto {
    id: number;
}

export interface CompanyIdDto {
    companyId: number;
}

const categoryService = {
    createCategory: async (
        data: CategoryCreateDto
    ): Promise<CategoryResponseDto> => {
        return await api.post<CategoryResponseDto>(
            "/categories/create",
            data,
            { timeout: 15000 }
        );
    },

    getAllCategories: async (): Promise<CategoryResponseDto[]> => {
        return await api.post<CategoryResponseDto[]>(
            "/categories/get-all",
            {}
        );
    },

    getCategoriesByCompanyId: async (
        data: CompanyIdDto
    ): Promise<CategoryResponseDto[]> => {
        return await api.post<CategoryResponseDto[]>(
            "/categories/get-by-company-id",
            data
        );
    },

    getCategoryById: async (
        data: CategoryIdDto
    ): Promise<CategoryResponseDto> => {
        return await api.post<CategoryResponseDto>(
            "/categories/get-by-id",
            data
        );
    },

    updateCategory: async (
        data: CategoryUpdateDto
    ): Promise<CategoryResponseDto> => {
        return await api.post<CategoryResponseDto>(
            "/categories/update",
            data
        );
    },

    deleteCategory: async (
        data: CategoryIdDto
    ): Promise<string> => {
        return await api.post<string>(
            "/categories/delete",
            data
        );
    },
};

export default categoryService;
