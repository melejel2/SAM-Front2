import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

import apiRequest from "@/api/api";
import { useAuth } from "@/contexts/auth";
import useToast from "@/hooks/use-toast";

const useLogin = () => {
    const navigate = useNavigate();
    const { toaster } = useToast();
    const { setLoggedInUser } = useAuth();

    const [isLoading, setIsLoading] = useState(false);
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
        const loginData = {
            userName: data.username,
            password: data.password,
            dataBaseName: data.db,
        };
        setError(null);

        try {
            const response: any = await apiRequest({
                endpoint: "Auth/login",
                method: "POST",
                body: loginData,
            });
            
            if (response.isSuccess === true) {
                toaster.success("Login successful...");
                // Add database info to user object
                const userWithDatabase = {
                    ...response.value,
                    database: data.db
                };
                setLoggedInUser(userWithDatabase);
                navigate("/dashboard");
            } else if (!response.success) {
                if (response.status === 404 || response.status === 400) {
                    toaster.error("Invalid username or password");
                    setError("Invalid username or password");
                } else {
                    toaster.error(response.message || "Login failed");
                }
            }
        } catch (error) {
            console.error("error", error);
        } finally {
            setIsLoading(false);
        }
    };

    const onMicrosoftLogin = async () => {};

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
        error,
        onSubmit,
        toggleShowPassword,
        onMicrosoftLogin,
    };
};

export default useLogin;
