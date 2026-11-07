package com.example.whatsapp.controller;

import com.example.whatsapp.dto.categorydto.CategoryCreateDto;
import com.example.whatsapp.dto.categorydto.CategoryIdDto;
import com.example.whatsapp.dto.categorydto.CategoryResponseDto;
import com.example.whatsapp.dto.categorydto.CategoryUpdateDto;
import com.example.whatsapp.service.CategoryService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @PostMapping("/create")
    public ResponseEntity<CategoryResponseDto> createCategory(
            @Valid @RequestBody CategoryCreateDto dto) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(categoryService.createCategory(dto));
    }

    @PostMapping("/get-all")
    public ResponseEntity<List<CategoryResponseDto>> getAllCategories() {

        return ResponseEntity.ok(categoryService.getAllCategories());
    }

    @PostMapping("/get-by-id")
    public ResponseEntity<CategoryResponseDto> getCategoryById(
            @Valid @RequestBody CategoryIdDto dto) {

        return ResponseEntity.ok(categoryService.getCategoryById(dto));
    }

    @PostMapping("/update")
    public ResponseEntity<CategoryResponseDto> updateCategory(
            @Valid @RequestBody CategoryUpdateDto dto) {

        return ResponseEntity.ok(categoryService.updateCategory(dto));
    }

    @PostMapping("/delete")
    public ResponseEntity<String> deleteCategory(
            @Valid @RequestBody CategoryIdDto dto) {

        categoryService.deleteCategory(dto);

        return ResponseEntity.ok("Category deleted successfully");
    }
}