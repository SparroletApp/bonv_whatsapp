import api from "./apiservice";

export interface CategoryResponseDto {
    id: number;
    categoryName: string;
    createdAt: string;
    updatedAt: string | null;
}

export interface CategoryCreateDto {
    categoryName: string;
}

export interface CategoryUpdateDto {
    id: number;
    categoryName: string;
}

export interface CategoryIdDto {
    id: number;
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