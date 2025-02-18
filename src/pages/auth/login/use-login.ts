import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useMsal } from "@azure/msal-react";

import useToast from "@/hooks/use-toast";
import routes from "@/services/routes";
import { useAuthContext } from "@/states/auth";
import apiRequest from "@/services/api/api";

const useLogin = () => {
  const navigate = useNavigate();
  const { toaster } = useToast();
  const { setLoggedInUser } = useAuthContext();

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // MSAL instance for Microsoft login
  const { instance } = useMsal();

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const loginSchema = z.object({
    username: z.string().nonempty("Username is required"),
    password: z.string().nonempty("Password is required"),
  });

  type LoginSchemaType = z.infer<typeof loginSchema>;

  const { control, handleSubmit } = useForm<LoginSchemaType>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = handleSubmit(async (data) => {
    setIsLoading(true);

    const loginData = {
      email: data.username,
      password: data.password,
    };

    try {
      const response: any = await apiRequest(
        "Login/login",
        "POST",
        "",
        loginData
      );
      toaster.success("Login successful...");
      localStorage.setItem("authToken", response.token);

      // Update authentication and layout contexts.
      setLoggedInUser(response, response.token);
      navigate(routes.dashboard.index);
    } catch (error) {
      if (error instanceof Error) {
        const message = error.message;
        // Check if the message contains "status: " before splitting
        const statusPart = message.split("status: ")?.[1];
        if (statusPart) {
          const statusCode = parseInt(statusPart, 10);
          if (statusCode === 401) {
            toaster.error("Incorrect username or password");
            console.error("Unauthorized:", error);
          } else {
            toaster.error("An error occurred. Please try again.");
            console.error("Error during login flow:", error);
          }
        } else {
          toaster.error("An error occurred. Please try again.");
          console.error("Error during login flow:", error);
        }
      } else {
        toaster.error("An error occurred. Please try again.");
        console.error("Error during login flow:", error);
      }
    } finally {
      setIsLoading(false);
    }
  });

  // Microsoft login flow using the new email-based authentication.
  const onMicrosoftLogin = async () => {
    setIsLoading(true);
    try {
      const loginRequest = { scopes: ["openid", "profile", "email"] };
      const response = await instance.loginPopup(loginRequest);
      const msalAccount = response.account;
      const email = msalAccount?.idTokenClaims?.email || msalAccount?.username;
      if (!email) {
        throw new Error("Email not found in MSAL account.");
      }

      // Call the new backend endpoint. We send { UserEmail: email }
      const backendResponse: any = await apiRequest(
        "Login/loginbyinitial",
        "POST",
        "",
        { UserEmail: email }
      );

      localStorage.setItem("authToken", backendResponse.token);
      toaster.success("Microsoft Login successful!");

      setLoggedInUser(backendResponse, backendResponse.token);

      navigate(routes.dashboard.index);
    } catch (error: any) {
      console.error("Microsoft Login error:", error);
      const errorMsg =
        error?.response?.data || "Microsoft Login failed. Please try again.";
      toaster.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    showPassword,
    isLoading,
    control,
    onSubmit,
    toggleShowPassword,
    onMicrosoftLogin,
  };
};

export default useLogin;
