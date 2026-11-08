package com.example.whatsapp.dto.broadcastdto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class BroadcastAssignContactsDto {

    private Long broadcastId;

    private List<Long> contactIds;
}