import { type ReactNode, Suspense } from "react";

import { Logo } from "@/components/Logo";
import { ThemeToggleDropdown } from "@/components/ThemeToggleDropdown";

const AuthLayout = ({ children }: { children: ReactNode }) => {
    return (
        <div className="bg-base-200 flex h-screen w-screen flex-col items-center justify-center space-y-2 sm:space-y-6">
            <div className="flex w-full max-w-[26rem] items-center justify-between p-4 sm:p-0">
                <Logo />
                <ThemeToggleDropdown
                    triggerClass="btn btn-sm btn-circle btn-ghost"
                    iconClass="size-6"
                />
            </div>
            <div className="bg-base-100 rounded-box flex h-auto w-full max-w-[26rem] items-center justify-start shadow-lg">
                <Suspense>{children}</Suspense>
            </div>
        </div>
    );
};

export default AuthLayout;
