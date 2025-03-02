export const ACTIVE_URL = "https://localhost:7055/";
export const ACTIVE_API_URL = `${ACTIVE_URL}api/`;

const apiRequest = async (
    endpoint: string,
    method: string,
    responseType: "json" | "blob" = "json",
    token?: string,
    body?: any,
) => {
    // Remove leading slash if present
    const normalizedEndpoint = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint;

    // Build default headers
    const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
        ...(responseType !== "blob" && { "Content-Type": "application/json" }),
    };

    const requestOptions: RequestInit = {
        method,
        headers,
    };

    if (body) {
        requestOptions.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${ACTIVE_API_URL}${normalizedEndpoint}`, requestOptions);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error(`HTTP error! status: ${response.status}`);
            return {
                success: false,
                message: errorData.message || `HTTP error! status: ${response.status}`,
            };
        }

        if (responseType === "blob") {
            return await response.blob();
        }

        return await response.json();
    } catch (error) {
        console.error("API Request Failed:", error);
        return {
            success: false,
            message: error instanceof Error ? error.message : "Unknown error",
        };
    }
};

export default apiRequest;
