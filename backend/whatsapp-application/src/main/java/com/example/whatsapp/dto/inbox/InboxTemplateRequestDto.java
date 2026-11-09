package com.example.whatsapp.dto.inbox;


import lombok.Data;
import java.util.List;

@Data
public class InboxTemplateRequestDto {

    private Long templateId;

    private String templateName;

    private String language;

    private List<String> parameters;
}