package com.example.whatsapp.service.impl;

import com.example.whatsapp.dto.categorydto.CategoryCreateDto;
import com.example.whatsapp.dto.categorydto.CategoryIdDto;
import com.example.whatsapp.dto.categorydto.CategoryResponseDto;
import com.example.whatsapp.dto.categorydto.CategoryUpdateDto;
import com.example.whatsapp.entity.CategoryEntity;
import com.example.whatsapp.repository.CategoryRepository;
import com.example.whatsapp.service.CategoryService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;

    @Override
    public CategoryResponseDto createCategory(CategoryCreateDto dto) {

        String categoryName = dto.getCategoryName().trim();

        if (categoryRepository.existsByCategoryName(categoryName)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Category already exists"
            );
        }

        CategoryEntity category = new CategoryEntity();
        category.setCategoryName(categoryName);

        CategoryEntity savedCategory = categoryRepository.save(category);

        return mapToResponse(savedCategory);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CategoryResponseDto> getAllCategories() {

        return categoryRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public CategoryResponseDto getCategoryById(CategoryIdDto dto) {

        CategoryEntity category = categoryRepository.findById(dto.getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Category not found"
                ));

        return mapToResponse(category);
    }

    @Override
    public CategoryResponseDto updateCategory(CategoryUpdateDto dto) {

        CategoryEntity category = categoryRepository.findById(dto.getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Category not found"
                ));

        String categoryName = dto.getCategoryName().trim();

        categoryRepository.findByCategoryName(categoryName)
                .filter(existing -> !existing.getId().equals(dto.getId()))
                .ifPresent(existing -> {
                    throw new ResponseStatusException(
                            HttpStatus.CONFLICT,
                            "Category name already exists"
                    );
                });

        category.setCategoryName(categoryName);

        CategoryEntity updatedCategory = categoryRepository.save(category);

        return mapToResponse(updatedCategory);
    }

    @Override
    public void deleteCategory(CategoryIdDto dto) {

        CategoryEntity category = categoryRepository.findById(dto.getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Category not found"
                ));

        categoryRepository.delete(category);
    }

    private CategoryResponseDto mapToResponse(CategoryEntity category) {

        CategoryResponseDto response = new CategoryResponseDto();

        response.setId(category.getId());
        response.setCategoryName(category.getCategoryName());
        response.setCreatedAt(category.getCreatedAt());
        response.setUpdatedAt(category.getUpdatedAt());

        return response;
    }
}