
package com.example.whatsapp.service.impl;

import com.example.whatsapp.dto.userdto.*;

import com.example.whatsapp.entity.UserEntity;
import com.example.whatsapp.entity.Company;

import com.example.whatsapp.repository.UserRepository;
import com.example.whatsapp.repository.CompanyRepository;

import com.example.whatsapp.service.UserService;
import com.example.whatsapp.service.JwtService;
import com.example.whatsapp.service.MailService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final MailService mailService;

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    // CREATE USER
    @Override
    public AuthResponseDto createUser(UserCreateDto dto) {

        if (userRepository.existsByEmail(dto.getEmail())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Email already registered"
            );
        }

        UserEntity user = new UserEntity();

        user.setName(dto.getName());
        user.setEmail(dto.getEmail());
        user.setPassword(dto.getPassword());
        user.setPhone(dto.getPhone());
        user.setRole(dto.getRole());
        user.setStatus(true);

        if (dto.getCompanyId() != null && dto.getCompanyId() != 0) {

            Company company = companyRepository.findById(dto.getCompanyId())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND,
                            "Company not found"
                    ));

            user.setCompany(company);

        } else {
            user.setCompany(null);
        }

        UserEntity savedUser = userRepository.save(user);

        String token = jwtService.generateToken(savedUser.getEmail());

        return buildAuthResponse(savedUser, token);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserResponseDto> getUsersByCompanyId(CompanyIdDto dto) {

        return userRepository.findByCompany_Id(dto.getCompanyId())
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    // LOGIN
    @Override
    @Transactional(readOnly = true)
    public AuthResponseDto login(LoginUserDto dto) {

        UserEntity user = userRepository.findByEmail(dto.getEmail())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Invalid email or password"
                ));

        if (!Boolean.TRUE.equals(user.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Your account is inactive"
            );
        }

        if (!dto.getPassword().equals(user.getPassword())) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Invalid email or password"
            );
        }

        String token = jwtService.generateToken(user.getEmail());

        return buildAuthResponse(user, token);
    }

    // GET ALL USERS
    @Override
    @Transactional(readOnly = true)
    public List<UserResponseDto> getAllUsers() {

        return userRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    // GET USER BY ID
    @Override
    @Transactional(readOnly = true)
    public UserResponseDto getUserById(UserIdDto dto) {

        UserEntity user = userRepository.findById(dto.getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "User not found"
                ));

        return mapToResponse(user);
    }

    // UPDATE USER
    @Override
    public UserResponseDto updateUser(UserUpdateDto dto) {

        Long id = dto.getId();

        UserEntity user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "User not found"
                ));

        userRepository.findByEmail(dto.getEmail())
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> {
                    throw new ResponseStatusException(
                            HttpStatus.CONFLICT,
                            "Email already exists"
                    );
                });

        user.setName(dto.getName());
        user.setEmail(dto.getEmail());
        user.setPhone(dto.getPhone());

        if (dto.getRole() != null && !dto.getRole().isBlank()) {
            user.setRole(dto.getRole());
        }

        if (dto.getPassword() != null && !dto.getPassword().isBlank()) {
            user.setPassword(dto.getPassword());
        }

        if (dto.getCompanyId() != null && dto.getCompanyId() != 0) {

            Company company = companyRepository.findById(dto.getCompanyId())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND,
                            "Company not found"
                    ));

            user.setCompany(company);

        } else {
            user.setCompany(null);
        }

        return mapToResponse(userRepository.save(user));
    }

    // DELETE USER
    @Override
    public void deleteUser(UserIdDto dto) {

        UserEntity user = userRepository.findById(dto.getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "User not found"
                ));

        userRepository.delete(user);
    }

    // SEND FORGOT PASSWORD OTP
    @Override
    public void sendForgotPasswordOtp(ForgotPasswordDto dto) {

        UserEntity user = userRepository.findByEmail(dto.getEmail())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "User not found"
                ));

        if (!Boolean.TRUE.equals(user.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Your account is inactive"
            );
        }

        String otp = String.format(
                "%06d",
                SECURE_RANDOM.nextInt(1000000)
        );

        user.setOtp(passwordEncoder.encode(otp));
        user.setOtpVerified(false);
        user.setOtpExpiry(LocalDateTime.now().plusMinutes(5));

        userRepository.save(user);

        mailService.sendOtp(user.getEmail(), otp);
    }

    // VERIFY FORGOT PASSWORD OTP
    @Override
    public void verifyForgotPasswordOtp(VerifyOtpDto dto) {

        UserEntity user = userRepository.findByEmail(dto.getEmail())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "User not found"
                ));

        if (user.getOtp() == null || user.getOtpExpiry() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Please request a new OTP"
            );
        }

        if (!user.getOtpExpiry().isAfter(LocalDateTime.now())) {

            user.setOtp(null);
            user.setOtpExpiry(null);
            user.setOtpVerified(false);

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "OTP expired. Please request a new OTP"
            );
        }

        if (dto.getOtp() == null ||
                !passwordEncoder.matches(dto.getOtp(), user.getOtp())) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid OTP"
            );
        }

        user.setOtpVerified(true);

        userRepository.save(user);
    }

    // RESET PASSWORD
    @Override
    public void resetPassword(ResetPasswordDto dto) {

        UserEntity user = userRepository.findByEmail(dto.getEmail())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "User not found"
                ));

        if (!Boolean.TRUE.equals(user.getOtpVerified())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Please verify your OTP first"
            );
        }

        if (user.getOtpExpiry() == null ||
                !user.getOtpExpiry().isAfter(LocalDateTime.now())) {

            user.setOtp(null);
            user.setOtpExpiry(null);
            user.setOtpVerified(false);

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "OTP expired. Please request a new OTP"
            );
        }

        if (dto.getNewPassword() == null ||
                dto.getNewPassword().isBlank()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "New password is required"
            );
        }

        user.setPassword(
                passwordEncoder.encode(dto.getNewPassword())
        );

        // Clear OTP after successful reset
        user.setOtp(null);
        user.setOtpVerified(false);
        user.setOtpExpiry(null);

        userRepository.save(user);
    }

    private AuthResponseDto buildAuthResponse(
            UserEntity user,
            String token
    ) {

        AuthResponseDto response = new AuthResponseDto();

        response.setUserId(user.getId());
        response.setAccessToken(token);
        response.setUser(mapToResponse(user));

        return response;
    }

    private UserResponseDto mapToResponse(UserEntity user) {

        UserResponseDto dto = new UserResponseDto();

        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setEmail(user.getEmail());
        dto.setPhone(user.getPhone());
        dto.setRole(user.getRole());
        dto.setStatus(user.getStatus());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setUpdatedAt(user.getUpdatedAt());

        if (user.getCompany() != null) {
            dto.setCompanyId(user.getCompany().getId());
            dto.setCompanyName(user.getCompany().getCompanyName());
        } else {
            dto.setCompanyId(null);
            dto.setCompanyName(null);
        }

        return dto;
    }
}
