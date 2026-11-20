package com.example.whatsapp.service;

import com.example.whatsapp.dto.userdto.*;

import java.util.List;

public interface UserService {
    AuthResponseDto createUser(UserCreateDto dto);
    AuthResponseDto login(LoginUserDto dto);
    List<UserResponseDto> getAllUsers();
    UserResponseDto getUserById(UserIdDto dto);
    UserResponseDto updateUser(UserUpdateDto dto);
    void deleteUser(UserIdDto dto);
    void sendForgotPasswordOtp(ForgotPasswordDto dto);
    void verifyForgotPasswordOtp(VerifyOtpDto dto);
    void resetPassword(ResetPasswordDto dto);

    List<UserResponseDto> getUsersByCompanyId(CompanyIdDto dto);
}