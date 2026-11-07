package com.example.whatsapp.service;

import com.example.whatsapp.dto.contactdto.*;

import java.util.List;

public interface ContactService {

    ContactResponseDto createContact(ContactCreateDto dto);

    List<ContactResponseDto> getAllContacts();

    ContactResponseDto getContactById(ContactIdDto dto);

    ContactResponseDto updateContact(ContactUpdateDto dto);

    void deleteContact(ContactIdDto dto);
}