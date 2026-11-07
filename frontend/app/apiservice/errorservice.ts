
import axios from "axios";
import type { ApiErrorResponse } from "./contactservice";

const errorService = {
    getErrorMessage: (error: unknown): string => {

        if (axios.isAxiosError<ApiErrorResponse>(error)) {
            return (
                error.response?.data?.message ||
                error.message ||
                "Something went wrong. Please try again."
            );
        }

        if (error instanceof Error) {
            return error.message;
        }

        return "Something went wrong. Please try again.";
    },
};

export default errorService;
