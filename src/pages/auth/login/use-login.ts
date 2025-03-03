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
                setLoggedInUser(response.value);
                navigate("/dashboard");
            }
            if (response.status === 404 || response.status === 400) {
                toaster.error(response.message);
                setError("Invalid username or password");
            } else {
                toaster.error(response.message);
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
            setDatabases(response);
        } catch (error) {
            console.error("error on get databases", error);
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
