
package com.example.whatsapp.service.impl;

import com.example.whatsapp.dto.contactdto.ContactCreateDto;
import com.example.whatsapp.dto.contactdto.ContactIdDto;
import com.example.whatsapp.dto.contactdto.ContactResponseDto;
import com.example.whatsapp.dto.contactdto.ContactUpdateDto;

import com.example.whatsapp.entity.CategoryEntity;
import com.example.whatsapp.entity.ContactEntity;

import com.example.whatsapp.repository.CategoryRepository;
import com.example.whatsapp.repository.ContactRepository;
import com.example.whatsapp.service.ContactService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ContactServiceImpl implements ContactService {

    private final ContactRepository contactRepository;
    private final CategoryRepository categoryRepository;

    @Override
    public ContactResponseDto createContact(ContactCreateDto dto) {

        String phone = dto.getPhone().trim();

        if (contactRepository.existsByPhone(phone)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This phone number is already registered"
            );
        }

        CategoryEntity category = categoryRepository.findById(dto.getCategoryId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Category not found"
                ));

        ContactEntity contact = new ContactEntity();

        contact.setName(dto.getName().trim());
        contact.setPhone(phone);
        contact.setEmail(dto.getEmail());
        contact.setCategory(category);

        ContactEntity savedContact = contactRepository.save(contact);

        return mapToResponse(savedContact);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ContactResponseDto> getAllContacts() {

        return contactRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ContactResponseDto getContactById(ContactIdDto dto) {

        ContactEntity contact = contactRepository.findById(dto.getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Contact not found"
                ));

        return mapToResponse(contact);
    }

    @Override
    public ContactResponseDto updateContact(ContactUpdateDto dto) {

        ContactEntity contact = contactRepository.findById(dto.getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Contact not found"
                ));

        String phone = dto.getPhone().trim();

        if (contactRepository.existsByPhoneAndIdNot(phone, dto.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This phone number is already used by another contact"
            );
        }

        CategoryEntity category = categoryRepository.findById(dto.getCategoryId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Category not found"
                ));

        contact.setName(dto.getName().trim());
        contact.setPhone(phone);
        contact.setEmail(dto.getEmail());
        contact.setCategory(category);

        ContactEntity updatedContact = contactRepository.save(contact);

        return mapToResponse(updatedContact);
    }

    @Override
    public void deleteContact(ContactIdDto dto) {

        ContactEntity contact = contactRepository.findById(dto.getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Contact not found"
                ));

        contactRepository.delete(contact);
    }

    private ContactResponseDto mapToResponse(ContactEntity contact) {

        ContactResponseDto response = new ContactResponseDto();

        response.setId(contact.getId());
        response.setName(contact.getName());
        response.setPhone(contact.getPhone());
        response.setEmail(contact.getEmail());

        response.setCategoryId(contact.getCategory().getId());
        response.setCategoryName(contact.getCategory().getCategoryName());

        response.setCreatedAt(contact.getCreatedAt());
        response.setUpdatedAt(contact.getUpdatedAt());

        return response;
    }
}
