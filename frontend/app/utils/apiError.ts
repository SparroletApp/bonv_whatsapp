export const apiError = (e: any, fallback = "Something went wrong"): string =>
    e?.response?.data?.message || e?.message || fallback;