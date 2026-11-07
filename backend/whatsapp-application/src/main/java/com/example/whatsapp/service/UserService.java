package com.example.whatsapp.service;

import com.example.whatsapp.dto.userdto.AuthResponseDto;
import com.example.whatsapp.dto.userdto.LoginUserDto;
import com.example.whatsapp.dto.userdto.UserCreateDto;
import com.example.whatsapp.dto.userdto.UserResponseDto;
import com.example.whatsapp.dto.userdto.UserIdDto;
import com.example.whatsapp.dto.userdto.UserUpdateDto;

import java.util.List;

public interface UserService {
    AuthResponseDto createUser(UserCreateDto dto);
    AuthResponseDto login(LoginUserDto dto);
    List<UserResponseDto> getAllUsers();
    UserResponseDto getUserById(UserIdDto dto);
    UserResponseDto updateUser(UserUpdateDto dto);
    void deleteUser(UserIdDto dto);
}