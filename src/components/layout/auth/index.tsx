import { Card } from "@/components/daisyui";
import Logo from "@/components/Logo";
import ThemeToggle from "@/pages/auth/components/ThemeToggle";
import { type ReactNode, Suspense } from "react";

const AuthLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="h-screen w-screen flex flex-col justify-center items-center space-y-2 sm:space-y-6 bg-base-200">
      <div className="flex items-center justify-between w-full max-w-[26rem] p-4 sm:p-0">
        <Logo />
        <ThemeToggle />
      </div>
      <Card className="h-auto w-full max-w-[26rem] flex items-center justify-start bg-base-100 shadow-lg rounded-lg">
        <Suspense>{children}</Suspense>
      </Card>
    </div>
  );
};

export default AuthLayout;
