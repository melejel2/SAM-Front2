export const ACTIVE_URL = "https://localhost:7185/";

export const ACTIVE_API_URL = `${ACTIVE_URL}api/`;

const apiRequest = async (
  endpoint: string,
  method: string,
  token: string,
  body?: any,
  responseType: "json" | "blob" = "json"
) => {
  // Remove leading slash if present
  const normalizedEndpoint = endpoint.startsWith("/")
    ? endpoint.slice(1)
    : endpoint;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };

  if (responseType !== "blob") {
    headers["Content-Type"] = "application/json";
  }

  const requestOptions: RequestInit = {
    method,
    headers, // Pass the headers object here
  };

  if (body) {
    requestOptions.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(
      `${ACTIVE_API_URL}${normalizedEndpoint}`,
      requestOptions
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`HTTP error! status: ${response.status}`);
      // Instead of throwing, return an error object
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
