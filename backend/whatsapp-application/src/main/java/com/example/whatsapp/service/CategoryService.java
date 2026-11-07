package com.example.whatsapp.service;

import com.example.whatsapp.dto.categorydto.CategoryCreateDto;
import com.example.whatsapp.dto.categorydto.CategoryIdDto;
import com.example.whatsapp.dto.categorydto.CategoryResponseDto;
import com.example.whatsapp.dto.categorydto.CategoryUpdateDto;

import java.util.List;

public interface CategoryService {

    CategoryResponseDto createCategory(CategoryCreateDto dto);

    List<CategoryResponseDto> getAllCategories();

    CategoryResponseDto getCategoryById(CategoryIdDto dto);

    CategoryResponseDto updateCategory(CategoryUpdateDto dto);

    void deleteCategory(CategoryIdDto dto);
}