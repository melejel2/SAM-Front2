//export const ACTIVE_URL = "https://samback.karamentreprises.com/";
export const ACTIVE_URL = "https://localhost:7055/";
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
    
    // Validate redirect URL to prevent open redirect attacks
    const loginUrl = "/auth/login";
    const currentPath = window.location.pathname;
    
    // Only redirect if not already on login page to prevent infinite loops
    if (currentPath !== loginUrl && !currentPath.startsWith("/auth/")) {
        // Use a safe redirect method
        window.location.href = loginUrl;
    }
};

const apiRequest = async <T = any>({
    endpoint,
    method,
    responseType = "json",
    token,
    body,
    headers = {},
}: ApiRequestParams): Promise<T | { isSuccess: false; success: false; message: string; status?: number }> => {
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
            let errorData: any = null;

            try {
                errorData = JSON.parse(errorText);
                errorMessage = errorData.message || errorMessage;
            } catch {
                // If JSON parsing fails, use the raw error text if available
                if (errorText && errorText.trim()) {
                    errorMessage = errorText;
                }
            }

            // Provide more user-friendly error messages based on status codes
            if (response.status === 400) {
                errorMessage = errorData?.message || "Invalid request. Please check your input and try again.";
            } else if (response.status === 401) {
                handleUnauthorized();
                return {
                    isSuccess: false,
                    success: false,
                    message: "Your session has expired. Please log in again.",
                    status: 401,
                };
            } else if (response.status === 403) {
                errorMessage = errorData?.message || "Access denied. You don't have permission to perform this action.";
            } else if (response.status === 404) {
                errorMessage = errorData?.message || "The requested resource was not found.";
            } else if (response.status === 409) {
                errorMessage = errorData?.message || "A conflict occurred. The resource may already exist or be in use.";
            } else if (response.status === 422) {
                errorMessage = errorData?.message || "Invalid data provided. Please check your input.";
            } else if (response.status === 429) {
                errorMessage = "Too many requests. Please wait a moment and try again.";
            } else if (response.status >= 500) {
                errorMessage = "Server error occurred. Please try again later or contact support.";
            } else if (!errorData?.message) {
                // Fallback for any other status codes without specific messages
                errorMessage = `Request failed with status ${response.status}. Please try again.`;
            }

            return {
                isSuccess: false,
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

        // Always try to parse as JSON first, regardless of content-type
        const responseText = await response.text();
        
        if (responseText.trim() === '') {
            // For GET requests, empty response likely means empty array
            return (method === 'GET' ? [] : {}) as T;
        }
        
        try {
            const parsedResponse = JSON.parse(responseText);
            return parsedResponse as T;
        } catch (error) {
            console.error('JSON parsing error:', error, 'Response text:', responseText);
            // Check if it's a content-type issue
            const contentType = response.headers.get('content-type');
            console.log('Content-Type:', contentType);
            
            return {
                isSuccess: false,
                success: false,
                message: 'Invalid JSON response from server'
            } as T;
        }
    } catch (error) {
        console.error("API Request Failed:", error);
        return {
            isSuccess: false,
            success: false,
            message: error instanceof Error ? error.message : "Unknown error occurred",
        };
    }
};
export default apiRequest;
