
import api from "./apiservice";

export interface UserCreateDto {
    name: string;
    email: string;
    password: string;
    phone?: string;
    role: string;
    companyId?: number | null;
}

export interface LoginUserDto {
    email: string;
    password: string;
}

export interface UserIdDto {
    id: number;
}

export interface CompanyIdDto {
    companyId: number;
}

export interface UserUpdateDto {
    id: number;
    name: string;
    email: string;
    phone?: string;
    role: string;
    companyId?: number | null;
    password?: string;
}

export interface UserResponseDto {
    id: number;
    name: string;
    email: string;
    password: string;
    phone?: string;
    role: string;
    status?: boolean;
    companyId?: number | null;
    companyName?: string | null;
    createdAt?: string;
    updatedAt?: string;
}

export interface AuthResponseDto {
    userId: number;
    accessToken: string;
    tokenType?: string;
    user?: UserResponseDto;
}


export interface ForgotPasswordDto {
    email: string;
}

export interface VerifyOtpDto {
    email: string;
    otp: string;
}

export interface ResetPasswordDto {
    email: string;
    newPassword: string;
}

const userService = {


    register: async (data: UserCreateDto): Promise<AuthResponseDto> => {
        return await api.post<AuthResponseDto>("/user/register", data);
    },

    login: async (data: LoginUserDto): Promise<AuthResponseDto> => {
        return await api.post<AuthResponseDto>("/user/login", data);
    },

    getAllUsers: async (): Promise<UserResponseDto[]> => {
        return await api.post<UserResponseDto[]>("/user/all", {});
    },

    getUserById: async (data: UserIdDto): Promise<UserResponseDto> => {
        return await api.post<UserResponseDto>("/user/get-by-id", data);
    },

    getUsersByCompanyId: async (data: CompanyIdDto): Promise<UserResponseDto[]> => {
        return await api.post<UserResponseDto[]>("/user/get-by-company-id", data);
    },

    updateUser: async (data: UserUpdateDto): Promise<UserResponseDto> => {
        return await api.post<UserResponseDto>("/user/update", data);
    },

    deleteUser: async (data: UserIdDto): Promise<string> => {
        return await api.post<string>("/user/delete", data);
    },

    forgotPassword: async (data: ForgotPasswordDto): Promise<string> => {
        return await api.post<string>("/user/forgot-password", data);
    },

    verifyOtp: async (data: VerifyOtpDto): Promise<string> => {
        return await api.post<string>("/user/verify-otp", data);
    },

    resetPassword: async (data: ResetPasswordDto): Promise<string> => {
        return await api.post<string>("/user/reset-password", data);
    },

};

export default userService;
