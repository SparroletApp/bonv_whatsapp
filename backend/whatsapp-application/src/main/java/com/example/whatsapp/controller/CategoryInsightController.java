package com.example.whatsapp.controller;

import com.example.whatsapp.dto.categorydto.CategoryDetailsDto;
import com.example.whatsapp.dto.categorydto.CategorySummaryDto;
import com.example.whatsapp.dto.categorydto.ContactItemDto;
import com.example.whatsapp.entity.CategoryEntity;
import com.example.whatsapp.repository.CategoryRepository;
import com.example.whatsapp.repository.ContactRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/whatsapp/categories")
@RequiredArgsConstructor
public class CategoryInsightController {

    private final CategoryRepository categoryRepo;
    private final ContactRepository contactRepo;

    @GetMapping
    public List<CategorySummaryDto> list() {
        return categoryRepo.findAll().stream()
                .map(c -> new CategorySummaryDto(c.getId(), c.getCategoryName(), contactRepo.countByCategoryId(c.getId())))
                .toList();
    }

    @GetMapping("/{id}")
    public CategoryDetailsDto details(@PathVariable Long id) {
        CategoryEntity c = categoryRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Category not found"));
        List<ContactItemDto> contacts = contactRepo.findByCategoryId(id).stream()
                .map(ct -> new ContactItemDto(ct.getId(), ct.getName(), ct.getPhone(), ct.getEmail()))
                .toList();
        return new CategoryDetailsDto(c.getId(), c.getCategoryName(), contacts.size(), contacts);
    }
}