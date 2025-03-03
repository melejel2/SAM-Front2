export const ACTIVE_URL = "https://localhost:7055/";
export const ACTIVE_API_URL = `${ACTIVE_URL}api/`;

type ApiRequestParams = {
    endpoint: string;
    method: string;
    responseType?: "json" | "blob";
    token?: string;
    body?: BodyInit | Record<string, unknown>;
    headers?: Record<string, string>;
};

const apiRequest = async <T = any>({
    endpoint,
    method,
    responseType = "json",
    token,
    body,
    headers = {},
}: ApiRequestParams): Promise<T | { success: false; message: string; status?: number }> => {
    const normalizedEndpoint = endpoint.replace(/^\//, "");
    const url = `${ACTIVE_API_URL}${normalizedEndpoint}`;

    const headersInit: HeadersInit = {};

    // Add Authorization header if token exists
    if (token) {
        headersInit.Authorization = `Bearer ${token}`;
    }

    // Determine Content-Type based on body type
    if (body) {
        if (body instanceof FormData) {
            // Let browser set Content-Type for FormData
        } else if (body instanceof URLSearchParams) {
            headersInit["Content-Type"] = "application/x-www-form-urlencoded";
        } else if (typeof body === "object") {
            headersInit["Content-Type"] = "application/json";
        }
    }

    // Merge headers
    const mergedHeaders = { ...headersInit, ...headers };

    // Prepare request options
    const requestOptions: RequestInit = {
        method,
        headers: mergedHeaders,
    };

    // Handle body
    if (body) {
        requestOptions.body = body instanceof FormData || body instanceof URLSearchParams ? body : JSON.stringify(body);
    }

    try {
        const response = await fetch(url, requestOptions);

        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = `HTTP error! status: ${response.status}`;

            try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.message || errorMessage;
            } catch {
                errorMessage = errorText || errorMessage;
            }

            return {
                success: false,
                message: errorMessage,
                status: response.status,
            };
        }

        if (responseType === "blob") {
            return (await response.blob()) as T;
        }

        if (response.status === 204) {
            // No Content
            return {} as T;
        }

        return (await response.json()) as T;
    } catch (error) {
        console.error("API Request Failed:", error);
        return {
            success: false,
            message: error instanceof Error ? error.message : "Unknown error occurred",
        };
    }
};

export default apiRequest;
