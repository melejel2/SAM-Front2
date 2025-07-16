export const ACTIVE_URL = "https://samback.karamentreprises.com/";
//export const ACTIVE_URL = "https://localhost:7055/";
//export const ACTIVE_URL = "http://localhost:5280/";
export const ACTIVE_API_URL = `${ACTIVE_URL}api/`;

type ApiRequestParams = {
    endpoint: string;
    method: string;
    responseType?: "json" | "blob";
    token?: string;
    body?: BodyInit | Record<string, unknown>;
    headers?: Record<string, string>;
};

const handleUnauthorized = () => {
    localStorage.removeItem("__SAM_ADMIN_AUTH__");
    window.location.href = "/auth/login";
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

    if (token) {
        headersInit.Authorization = `Bearer ${token}`;
    }

    if (body) {
        if (body instanceof FormData) {
            // Let browser set Content-Type
        } else if (body instanceof URLSearchParams) {
            headersInit["Content-Type"] = "application/x-www-form-urlencoded";
        } else if (typeof body === "object") {
            headersInit["Content-Type"] = "application/json";
        }
    }

    const mergedHeaders = { ...headersInit, ...headers };

    const requestOptions: RequestInit = {
        method,
        headers: mergedHeaders,
    };

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

            // Explicit 401 Handling
            if (response.status === 401) {
                handleUnauthorized();
                return {
                    success: false,
                    message: "Unauthorized. Please log in again.",
                    status: 401,
                };
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
            return {} as T;
        }

        // Check if response has content before parsing JSON
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const responseText = await response.text();
            if (responseText.trim() === '') {
                return {} as T;
            }
            try {
                return JSON.parse(responseText) as T;
            } catch (error) {
                console.error('JSON parsing error:', error, 'Response text:', responseText);
                return {
                    success: false,
                    message: 'Invalid JSON response from server'
                } as T;
            }
        }

        // For non-JSON responses, return success with empty result
        return {
            isSuccess: true,
            message: 'Request completed successfully'
        } as T;
    } catch (error) {
        console.error("API Request Failed:", error);
        return {
            success: false,
            message: error instanceof Error ? error.message : "Unknown error occurred",
        };
    }
};
export default apiRequest;
