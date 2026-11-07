
import api from "./apiservice";

export interface UserCreateDto {
    name: string;
    email: string;
    password: string;
    phone?: string;
}

export interface LoginUserDto {
    email: string;
    password: string;
}

export interface UserIdDto {
    id: number;
}

export interface UserUpdateDto {
    id: number;
    name: string;
    email: string;
    phone?: string;
}

export interface UserResponseDto {
    id: number;
    name: string;
    email: string;
    phone?: string;
}

export interface AuthResponseDto {
    accessToken: string;
    tokenType?: string;
    user?: UserResponseDto;
}

const userService = {

    register: async (data: UserCreateDto): Promise<AuthResponseDto> => {
        return await api.post("/user/register", data);
    },

    login: async (data: LoginUserDto): Promise<AuthResponseDto> => {
        return await api.post("/user/login", data);
    },

    getAllUsers: async (): Promise<UserResponseDto[]> => {
        return await api.post("/user/all", {});
    },

    getUserById: async (data: UserIdDto): Promise<UserResponseDto> => {
        return await api.post("/user/get-by-id", data);
    },

    updateUser: async (data: UserUpdateDto): Promise<UserResponseDto> => {
        return await api.post("/user/update", data);
    },

    deleteUser: async (data: UserIdDto): Promise<string> => {
        return await api.post("/user/delete", data);
    },

};

export default userService;
