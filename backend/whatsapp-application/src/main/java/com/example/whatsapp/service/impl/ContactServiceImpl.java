
package com.example.whatsapp.service.impl;

import com.example.whatsapp.dto.broadcastdto.BroadcastAssignContactsDto;
import com.example.whatsapp.dto.categorydto.CategoryIdDto;
import com.example.whatsapp.dto.contactdto.*;

import com.example.whatsapp.entity.BroadCastEntity;
import com.example.whatsapp.entity.CategoryEntity;
import com.example.whatsapp.entity.Company;
import com.example.whatsapp.entity.ContactEntity;

import com.example.whatsapp.repository.BroadcastRepository;
import com.example.whatsapp.repository.CategoryRepository;
import com.example.whatsapp.repository.CompanyRepository;
import com.example.whatsapp.repository.ContactRepository;

import com.example.whatsapp.service.ContactService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional
public class ContactServiceImpl implements ContactService {

    private final ContactRepository contactRepository;
    private final CategoryRepository categoryRepository;
    private final BroadcastRepository broadcastRepository;
    private final CompanyRepository companyRepository;

    @Override
    public ContactResponseDto createContact(ContactCreateDto dto) {

        String phone = dto.getPhone().trim();

        if (contactRepository.existsByPhone(phone)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This phone number is already registered"
            );
        }

        Long[] categoryIds = validateCategoryIds(dto.getCategoryIds());

        Company company = companyRepository.findById(dto.getCompanyId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Company not found"
                ));

        ContactEntity contact = new ContactEntity();

        contact.setName(
                dto.getName() == null || dto.getName().isBlank()
                        ? null
                        : dto.getName().trim()
        );

        contact.setPhone(phone);

        contact.setEmail(
                dto.getEmail() == null || dto.getEmail().isBlank()
                        ? null
                        : dto.getEmail().trim()
        );

        contact.setCategoryIds(categoryIds);

        contact.setCompany(company);

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

        Long[] categoryIds = validateCategoryIds(dto.getCategoryIds());

        Company company = companyRepository.findById(dto.getCompanyId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Company not found"
                ));

        contact.setName(
                dto.getName() == null || dto.getName().isBlank()
                        ? null
                        : dto.getName().trim()
        );

        contact.setPhone(phone);

        contact.setEmail(
                dto.getEmail() == null || dto.getEmail().isBlank()
                        ? null
                        : dto.getEmail().trim()
        );

        contact.setCategoryIds(categoryIds);

        contact.setCompany(company);

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

    @Override
    public void assignContactsToBroadcast(BroadcastAssignContactsDto dto) {

        BroadCastEntity broadcast = broadcastRepository.findById(dto.getBroadcastId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Broadcast not found"
                ));

        if (dto.getContactIds() == null || dto.getContactIds().isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Please select at least one contact"
            );
        }

        Set<Long> contactIds = new HashSet<>(dto.getContactIds());

        List<ContactEntity> contacts = contactRepository.findAllById(contactIds);

        if (contacts.size() != contactIds.size()) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "One or more contacts were not found"
            );
        }

        for (ContactEntity contact : contacts) {
            contact.setBroadcast(broadcast);
        }

        contactRepository.saveAll(contacts);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ContactResponseDto> getContactsByCompanyId(ContactCompanyIdDto dto) {

        companyRepository.findById(dto.getCompanyId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Company not found"
                ));

        return contactRepository.findAllByCompany_Id(dto.getCompanyId())
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ContactResponseDto> getContactsByBroadcastId(Long broadcastId) {

        BroadCastEntity broadcast = broadcastRepository.findById(broadcastId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Broadcast not found"
                ));

        return contactRepository.findAllByBroadcast_Id(broadcast.getId())
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ContactResponseDto> getContactsByCategoryId(CategoryIdDto dto) {

        categoryRepository.findById(dto.getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Category not found"
                ));

        return contactRepository.findAllByCategoryId(dto.getId())
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    private Long[] validateCategoryIds(List<Long> ids) {

        if (ids == null || ids.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Please select at least one category"
            );
        }

        if (ids.stream().anyMatch(id -> id == null || id <= 0)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Category IDs must be positive"
            );
        }

        List<Long> uniqueIds = new ArrayList<>(new LinkedHashSet<>(ids));

        List<CategoryEntity> categories =
                categoryRepository.findAllById(uniqueIds);

        if (categories.size() != uniqueIds.size()) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "One or more categories were not found"
            );
        }

        return uniqueIds.toArray(new Long[0]);
    }

    private ContactResponseDto mapToResponse(ContactEntity contact) {

        ContactResponseDto response = new ContactResponseDto();

        response.setId(contact.getId());
        response.setName(contact.getName());
        response.setPhone(contact.getPhone());
        response.setEmail(contact.getEmail());

        Long[] ids = contact.getCategoryIds();

        List<Long> categoryIds = ids == null
                ? Collections.emptyList()
                : Arrays.asList(ids);

        response.setCategoryIds(categoryIds);

        // Return company ID
        response.setCompanyId(
                contact.getCompany() != null
                        ? contact.getCompany().getId()
                        : null
        );

        response.setCreatedAt(contact.getCreatedAt());
        response.setUpdatedAt(contact.getUpdatedAt());

        return response;
    }
}
