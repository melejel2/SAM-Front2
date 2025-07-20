import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useMsal } from "@azure/msal-react";

import apiRequest from "@/api/api";
import { useAuth } from "@/contexts/auth";
import useToast from "@/hooks/use-toast";
import { loginRequest } from "@/config/msal";
import { sanitizeInput, isValidEmail, isValidUsername, isValidDatabaseName } from "@/utils/security";

// Helper function to map API errors to user-friendly messages
const getErrorMessage = (response: any, isMetricLogin = false) => {
    const status = response?.status;
    const message = response?.message?.toLowerCase() || "";

    // Microsoft login specific errors
    if (isMetricLogin) {
        if (status === 404) {
            return "Email not registered. Please contact support to get access to the system.";
        }
        if (status === 400) {
            return "Invalid request. Please try again or contact support.";
        }
        if (status === 403) {
            return "Access denied. Your account may be inactive. Please contact support.";
        }
        if (message.includes("user not found") || message.includes("email not found")) {
            return "Email not registered. Please contact support to get access to the system.";
        }
        if (message.includes("inactive") || message.includes("disabled")) {
            return "Your account is inactive. Please contact support to reactivate your account.";
        }
        if (message.includes("database") || message.includes("db")) {
            return "Database access issue. Please contact support.";
        }
        return "Microsoft sign-in failed. Please contact support if the issue persists.";
    }

    // Regular login errors
    if (status === 404) {
        return "Username not found. Please check your username or contact support.";
    }
    if (status === 400) {
        if (message.includes("password") || message.includes("credential")) {
            return "Incorrect password. Please check your password and try again.";
        }
        if (message.includes("email") || message.includes("username")) {
            return "Username not found. Please check your username.";
        }
        return "Invalid username or password. Please check your credentials.";
    }
    if (status === 401) {
        return "Invalid username or password. Please check your credentials.";
    }
    if (status === 403) {
        return "Account access denied. Your account may be inactive. Please contact support.";
    }
    if (status === 429) {
        return "Too many login attempts. Please wait a few minutes and try again.";
    }
    if (status === 500) {
        return "Server error occurred. Please try again later or contact support.";
    }
    if (status === 503) {
        return "Service temporarily unavailable. Please try again later.";
    }

    // Check for specific error messages
    if (message.includes("user not found") || message.includes("email not found")) {
        return "Username not found. Please check your username or contact support.";
    }
    if (message.includes("password")) {
        return "Incorrect password. Please check your password and try again.";
    }
    if (message.includes("inactive") || message.includes("disabled")) {
        return "Your account is inactive. Please contact support to reactivate your account.";
    }
    if (message.includes("database") || message.includes("db")) {
        return "Database access issue. Please contact support.";
    }

    // Fallback to original message if available, otherwise generic error
    return response?.message || "Login failed. Please try again or contact support.";
};

const useLogin = () => {
    const navigate = useNavigate();
    const { toaster } = useToast();
    const { setLoggedInUser } = useAuth();
    const { instance } = useMsal(); // Get MSAL instance

    const [isLoading, setIsLoading] = useState(false);
    const [isMicrosoftLoading, setIsMicrosoftLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [databases, setDatabases] = useState<string[]>([]);

    const toggleShowPassword = () => {
        setShowPassword(!showPassword);
    };

    type LoginSchemaType = {
        username: string;
        password: string;
        db: string;
    };

    const onSubmit = async (data: LoginSchemaType) => {
        setIsLoading(true);
        setError(null);

        // Validate and sanitize input
        const sanitizedUsername = sanitizeInput(data.username);
        const sanitizedDb = sanitizeInput(data.db);

        // Validate username format
        if (!isValidUsername(sanitizedUsername)) {
            setError("Please enter a valid username");
            setIsLoading(false);
            return;
        }

        // Validate database selection (skip validation for placeholder and trust API-provided database names)
        if (!sanitizedDb || sanitizedDb === "Select Database" || sanitizedDb.trim().length === 0) {
            setError("Please select a database");
            setIsLoading(false);
            return;
        }

        const loginData = {
            userName: sanitizedUsername,
            password: data.password, // Don't sanitize password as it may contain special characters
            dataBaseName: sanitizedDb,
        };

        try {
            const response: any = await apiRequest({
                endpoint: "Auth/login",
                method: "POST",
                body: loginData,
            });
            
            if (response.isSuccess === true) {
                toaster.success("Login successful!");
                // Add database info to user object
                const userWithDatabase = {
                    ...response.value,
                    database: data.db
                };
                setLoggedInUser(userWithDatabase);
                navigate("/dashboard");
            } else if (!response.success) {
                const errorMessage = getErrorMessage(response, false);
                toaster.error(errorMessage);
                setError(errorMessage);
            }
        } catch (error) {
            console.error("Login error:", error);
            toaster.error("Network error. Please check your connection and try again.");
            setError("Network error. Please check your connection and try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const onMicrosoftLogin = async (selectedDb: string) => {
        if (!selectedDb || selectedDb === "Select Database") {
            toaster.error("Please select a database first");
            return;
        }

        setIsMicrosoftLoading(true);
        setError(null);

        try {
            // Step 1: Microsoft popup login
            const response = await instance.loginPopup(loginRequest);
            
            // Step 2: Extract email from Microsoft account
            const msalAccount = response.account;
            const email = msalAccount?.idTokenClaims?.email || msalAccount?.username;
            
            if (!email) {
                throw new Error("Email not found in Microsoft account.");
            }

            // Validate email format (Microsoft should always provide valid email)
            if (!isValidEmail(email as string)) {
                throw new Error("Invalid email format from Microsoft account.");
            }

            // Step 3: Send email and database to your backend for authentication
            const backendResponse: any = await apiRequest({
                endpoint: "Auth/microsoft-login", // Backend endpoint created by your team
                method: "POST",
                body: { 
                    email: email,
                    dataBaseName: selectedDb
                },
            });

            if (backendResponse.isSuccess === true) {
                toaster.success("Microsoft sign-in successful!");
                
                // Step 4: Add database info to user object
                const userWithDatabase = {
                    ...backendResponse.value,
                    database: selectedDb
                };
                
                // Step 5: Set logged in user and navigate
                setLoggedInUser(userWithDatabase);
                navigate("/dashboard");
            } else {
                const errorMessage = getErrorMessage(backendResponse, true);
                toaster.error(errorMessage);
                setError(errorMessage);
            }
            
        } catch (error: any) {
            console.error("Microsoft login error:", error);
            
            // Handle specific MSAL errors
            if (error.name === "BrowserAuthError" || error.name === "InteractionRequiredAuthError") {
                const errorMessage = "Microsoft sign-in was cancelled. Please try again.";
                toaster.error(errorMessage);
                setError(errorMessage);
            } else if (error.name === "ServerError") {
                const errorMessage = "Microsoft authentication server error. Please try again later.";
                toaster.error(errorMessage);
                setError(errorMessage);
            } else if (error.message?.includes("Email not found")) {
                const errorMessage = "Unable to retrieve email from Microsoft account. Please try again.";
                toaster.error(errorMessage);
                setError(errorMessage);
            } else if (error.message?.includes("Invalid email format")) {
                const errorMessage = "Invalid email format from Microsoft account. Please contact support.";
                toaster.error(errorMessage);
                setError(errorMessage);
            } else {
                const errorMessage = "Microsoft sign-in failed. Please try again or contact support.";
                toaster.error(errorMessage);
                setError(errorMessage);
            }
        } finally {
            setIsMicrosoftLoading(false);
        }
    };

    const getDatabases = async () => {
        setIsLoading(true);
        
        try {
            const response = await apiRequest({
                endpoint: "Auth/GetDataBases",
                method: "GET",
            });
            
            // Check if response is successful
            if (response && typeof response === 'object') {
                if ('success' in response && response.success === true && 'databases' in response && Array.isArray(response.databases)) {
                    // Handle successful response with databases array
                    setDatabases(["Select Database", ...response.databases]);
                } else if ('success' in response && response.success === false) {
                    // Handle API error response
                    console.error("API Error:", response.message);
                    toaster.error(response.message || "Failed to fetch databases");
                    setDatabases(["Select Database"]);
                } else if (Array.isArray(response)) {
                    // Handle direct array response (fallback for different API format)
                    setDatabases(["Select Database", ...response]);
                } else {
                    // Handle unexpected response format
                    console.error("Unexpected response format:", response);
                    setDatabases(["Select Database"]);
                }
            } else {
                setDatabases(["Select Database"]);
            }
        } catch (error) {
            console.error("error on get databases", error);
            setDatabases(["Select Database"]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        getDatabases();
    }, []);

    return {
        databases,
        showPassword,
        isLoading,
        isMicrosoftLoading,
        error,
        onSubmit,
        toggleShowPassword,
        onMicrosoftLogin,
    };
};

export default useLogin;
