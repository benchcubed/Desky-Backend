export interface ServiceResponse<T> {
    success: boolean;
    data?: string;
    error?: string | Error;
}