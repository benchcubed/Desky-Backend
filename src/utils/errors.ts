export class HttpError extends Error {
    constructor(public statusCode: number, message: string) {
        super(message);
        this.statusCode = statusCode;
        this.name = "HttpError";
    }
}