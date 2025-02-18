import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";

import useToast from "@/hooks/use-toast";
import routes from "@/services/routes";
import apiRequest from "@/services/api/api";

const useForgotPassword = () => {
  const navigate = useNavigate();
  const { toaster } = useToast();

  const [isLoading, setIsLoading] = useState(false);

  const formSchema = z.object({
    email: z.string().email(),
  });

  type FormSchemaType = z.infer<typeof formSchema>;

  const { control, handleSubmit, setError } = useForm<FormSchemaType>({
    resolver: zodResolver(formSchema),
  });

  const transformErrorToForm = (errors: Record<string, any>) => {
    Object.entries(errors).forEach(([key, value]: any[]) =>
      setError(key, { message: value })
    );
  };

  const onSubmit = handleSubmit(async (data) => {
    setIsLoading(true);
    try {
      await apiRequest("/api/any/success/", "POST", "", data);
      toaster.success("The reset password link has been sent");
      navigate(routes.auth.resetPassword);
    } catch (e: any) {
      transformErrorToForm(e.response.data);
    }
    setIsLoading(false);
  });

  return {
    isLoading,
    control,
    onSubmit,
  };
};

export default useForgotPassword;
