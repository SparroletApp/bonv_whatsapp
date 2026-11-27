package com.example.whatsapp.service;

import com.example.whatsapp.dto.categorydto.*;

import java.util.List;

public interface CategoryService {

    CategoryResponseDto createCategory(CategoryCreateDto dto);

    List<CategoryResponseDto> getAllCategories();
    List<CategoryResponseDto> getCategoriesByCompanyId(CategoryCompanyIdDto dto);
    CategoryResponseDto getCategoryById(CategoryIdDto dto);

    CategoryResponseDto updateCategory(CategoryUpdateDto dto);

    void deleteCategory(CategoryIdDto dto);
}