import { useCallback, useEffect, useState } from "react";
import { useMsal } from "@azure/msal-react";

import apiRequest from "@/api/api";
import { useAuth } from "@/contexts/auth";
import useToast from "@/hooks/use-toast";
import { loginRequest } from "@/config/msal";
import { sanitizeInput, isValidEmail, isValidUsername, isValidDatabaseName } from "@/utils/security";

// Helper function to map API errors to user-friendly messages
const getErrorMessage = (response: any, isMicrosoftLogin = false) => {
    const status = response?.status;
    const message = response?.message?.toLowerCase() || "";

    if (isMicrosoftLogin) {
        if (status === 404) return "Email not registered. Please contact support to get access.";
        if (status === 400) return "Invalid request. Please try again.";
        if (status === 403) return "Access denied. Your account may be inactive.";
        if (message.includes("user not found") || message.includes("email not found"))
            return "Email not registered. Please contact support.";
        if (message.includes("inactive") || message.includes("disabled"))
            return "Your account is inactive. Please contact support.";
        return "Microsoft sign-in failed. Please try again.";
    }

    if (status === 404) return "Username not found. Please check your username.";
    if (status === 400) {
        if (message.includes("password") || message.includes("credential"))
            return "Incorrect password. Please try again.";
        return "Invalid username or password.";
    }
    if (status === 401) return "Invalid username or password.";
    if (status === 403) return "Account access denied. Your account may be inactive.";
    if (status === 429) return "Too many attempts. Please wait a few minutes.";
    if (status === 500) return "Server error. Please try again later.";

    return response?.message || "Login failed. Please try again.";
};

interface UseVerifyLoginOptions {
    preselectedDb?: string | null;
}

const useVerifyLogin = ({ preselectedDb }: UseVerifyLoginOptions = {}) => {
    const { toaster } = useToast();
    const { setLoggedInUser } = useAuth();
    const { instance } = useMsal();

    const [isLoading, setIsLoading] = useState(false);
    const [isMicrosoftLoading, setIsMicrosoftLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [databases, setDatabases] = useState<string[]>([]);

    const toggleShowPassword = () => setShowPassword(!showPassword);

    type LoginData = {
        username: string;
        password: string;
        db: string;
    };

    const onSubmit = async (data: LoginData) => {
        setIsLoading(true);
        setError(null);

        const sanitizedUsername = sanitizeInput(data.username);
        const sanitizedDb = sanitizeInput(data.db);

        if (!isValidUsername(sanitizedUsername)) {
            setError("Please enter a valid username");
            setIsLoading(false);
            return;
        }

        if (!sanitizedDb || sanitizedDb === "Select Database" || sanitizedDb.trim().length === 0) {
            setError("Please select a database");
            setIsLoading(false);
            return;
        }

        if (!isValidDatabaseName(sanitizedDb)) {
            setError("Invalid database selection");
            setIsLoading(false);
            return;
        }

        try {
            const response: any = await apiRequest({
                endpoint: "Auth/login",
                method: "POST",
                body: {
                    userName: sanitizedUsername,
                    password: data.password,
                    dataBaseName: sanitizedDb,
                },
            });

            if (response.isSuccess === true) {
                toaster.success("Login successful!");
                const userWithDatabase = {
                    ...response.value,
                    database: data.db,
                };
                setLoggedInUser(userWithDatabase);
                // No navigation — the verification page will re-render and proceed
            } else {
                const errorMessage = getErrorMessage(response, false);
                toaster.error(errorMessage);
                setError(errorMessage);
            }
        } catch {
            const msg = "Network error. Please check your connection.";
            toaster.error(msg);
            setError(msg);
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

        let msalAccount: any = null;

        try {
            const response = await instance.loginPopup({
                ...loginRequest,
                prompt: "select_account",
            });

            msalAccount = response.account;
            const email = msalAccount?.idTokenClaims?.email || msalAccount?.username;

            if (!email) {
                throw new Error("Email not found in Microsoft account.");
            }

            if (!isValidEmail(email as string)) {
                throw new Error("Invalid email format from Microsoft account.");
            }

            const backendResponse: any = await apiRequest({
                endpoint: "Auth/microsoft-login",
                method: "POST",
                body: {
                    email: email,
                    dataBaseName: selectedDb,
                },
            });

            if (backendResponse.isSuccess === true) {
                toaster.success("Microsoft sign-in successful!");
                const userWithDatabase = {
                    ...backendResponse.value,
                    database: selectedDb,
                };
                setLoggedInUser(userWithDatabase);
                // No navigation — the verification page will re-render and proceed
            } else {
                const errorMessage = getErrorMessage(backendResponse, true);
                toaster.error(errorMessage);
                setError(errorMessage);

                if (msalAccount) {
                    instance.setActiveAccount(null);
                    try {
                        await instance.logoutPopup({
                            account: msalAccount,
                            mainWindowRedirectUri: window.location.href,
                        });
                    } catch {
                        // Ignore logout errors
                    }
                }
            }
        } catch (error: any) {
            if (msalAccount) {
                instance.setActiveAccount(null);
            }

            let errorMessage: string;
            if (error.name === "BrowserAuthError" || error.name === "InteractionRequiredAuthError") {
                errorMessage = "Microsoft sign-in was cancelled. Please try again.";
            } else if (error.name === "ServerError") {
                errorMessage = "Microsoft authentication server error. Please try again later.";
            } else if (error.message?.includes("Email not found")) {
                errorMessage = "Unable to retrieve email from Microsoft account.";
            } else if (error.message?.includes("Invalid email format")) {
                errorMessage = "Invalid email format from Microsoft account.";
            } else {
                errorMessage = "Microsoft sign-in failed. Please try again.";
            }

            toaster.error(errorMessage);
            setError(errorMessage);
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

            if (response && typeof response === "object") {
                if ("success" in response && response.success === true && "databases" in response && Array.isArray(response.databases)) {
                    setDatabases(["Select Database", ...response.databases]);
                } else if (Array.isArray(response)) {
                    setDatabases(["Select Database", ...response]);
                } else {
                    setDatabases(["Select Database"]);
                }
            } else {
                setDatabases(["Select Database"]);
            }
        } catch {
            setDatabases(["Select Database"]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        getDatabases();
    }, []);

    // Determine initial selected database: use preselected if it matches available databases
    const getInitialDb = useCallback(() => {
        if (preselectedDb && databases.includes(preselectedDb)) {
            return preselectedDb;
        }
        return databases[0] || "";
    }, [preselectedDb, databases]);

    return {
        databases,
        showPassword,
        isLoading,
        isMicrosoftLoading,
        error,
        onSubmit,
        toggleShowPassword,
        onMicrosoftLogin,
        getInitialDb,
    };
};

export default useVerifyLogin;
