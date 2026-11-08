package com.example.whatsapp.controller;

import com.example.whatsapp.dto.broadcastdto.BroadcastAssignContactsDto;
import com.example.whatsapp.dto.broadcastdto.BroadcastIdRequestDto;
import com.example.whatsapp.dto.contactdto.ContactCreateDto;
import com.example.whatsapp.dto.contactdto.ContactIdDto;
import com.example.whatsapp.dto.contactdto.ContactResponseDto;
import com.example.whatsapp.dto.contactdto.ContactUpdateDto;
import com.example.whatsapp.service.ContactService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/contacts")
@RequiredArgsConstructor
public class ContactController {

    private final ContactService contactService;

    @PostMapping("/create")
    public ResponseEntity<ContactResponseDto> createContact(
            @Valid @RequestBody ContactCreateDto dto) {

        ContactResponseDto response = contactService.createContact(dto);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/get-all")
    public ResponseEntity<List<ContactResponseDto>> getAllContacts() {

        List<ContactResponseDto> response = contactService.getAllContacts();

        return ResponseEntity.ok(response);
    }

    @PostMapping("/get-by-id")
    public ResponseEntity<ContactResponseDto> getContactById(
            @Valid @RequestBody ContactIdDto dto) {

        ContactResponseDto response = contactService.getContactById(dto);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/update")
    public ResponseEntity<ContactResponseDto> updateContact(
            @Valid @RequestBody ContactUpdateDto dto) {

        ContactResponseDto response = contactService.updateContact(dto);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/delete")
    public ResponseEntity<String> deleteContact(
            @Valid @RequestBody ContactIdDto dto) {

        contactService.deleteContact(dto);

        return ResponseEntity.ok("Contact deleted successfully");
    }

    @PostMapping("/assign-broadcast")
    public ResponseEntity<String> assignContactsToBroadcast(
            @Valid @RequestBody BroadcastAssignContactsDto dto) {

        contactService.assignContactsToBroadcast(dto);

        return ResponseEntity.ok(
                "Selected contacts assigned to broadcast successfully"
        );
    }
    @PostMapping("/get-by-broadcast")
    public ResponseEntity<List<ContactResponseDto>> getContactsByBroadcastId(
            @RequestBody BroadcastIdRequestDto dto
    ) {
        return ResponseEntity.ok(
                contactService.getContactsByBroadcastId(dto.getId())
        );
    }
}