
package com.example.whatsapp.controller;

import com.example.whatsapp.dto.userdto.*;
import com.example.whatsapp.service.UserService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponseDto> register(
            @Valid @RequestBody UserCreateDto request) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(userService.createUser(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponseDto> login(
            @Valid @RequestBody LoginUserDto request) {

        return ResponseEntity.ok(userService.login(request));
    }

    @PostMapping("/all")
    public ResponseEntity<List<UserResponseDto>> getAllUsers() {

        return ResponseEntity.ok(userService.getAllUsers());
    }

    @PostMapping("/get-by-id")
    public ResponseEntity<UserResponseDto> getUserById(
            @Valid @RequestBody UserIdDto request) {

        return ResponseEntity.ok(userService.getUserById(request));
    }

    @PostMapping("/get-by-company-id")
    public ResponseEntity<List<UserResponseDto>> getUsersByCompanyId(
            @Valid @RequestBody CompanyIdDto dto) {

        return ResponseEntity.ok(
                userService.getUsersByCompanyId(dto)
        );
    }

    @PostMapping("/update")
    public ResponseEntity<UserResponseDto> updateUser(
            @Valid @RequestBody UserUpdateDto request) {

        return ResponseEntity.ok(
                userService.updateUser(request)
        );
    }

    @PostMapping("/delete")
    public ResponseEntity<String> deleteUser(
            @Valid @RequestBody UserIdDto request) {

        userService.deleteUser(request);

        return ResponseEntity.ok("User deleted successfully");
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<String> forgotPassword(
            @Valid @RequestBody ForgotPasswordDto request) {

        userService.sendForgotPasswordOtp(request);

        return ResponseEntity.ok(
                "Password reset OTP sent successfully to your email"
        );
    }

    // VERIFY FORGOT PASSWORD OTP
    @PostMapping("/verify-otp")
    public ResponseEntity<String> verifyOtp(
            @Valid @RequestBody VerifyOtpDto request) {

        userService.verifyForgotPasswordOtp(request);

        return ResponseEntity.ok(
                "OTP verified successfully"
        );
    }

    // RESET PASSWORD
    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(
            @Valid @RequestBody ResetPasswordDto request) {

        userService.resetPassword(request);

        return ResponseEntity.ok(
                "Password reset successfully"
        );
    }
}
