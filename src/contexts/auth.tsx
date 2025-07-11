import { ReactNode, createContext, useCallback, useContext } from "react";

import { useLocalStorage } from "@/hooks/use-local-storage";

type IAuthState = {
    user?: any;
};

const useHook = () => {
    const [authState, setState] = useLocalStorage<IAuthState>("__SAM_ADMIN_AUTH__", {
        user: undefined,
    });

    let accessToken: string | null = authState.user?.token ?? null;

    const updateState = (changes: Partial<IAuthState>) => {
        setState((prevState: IAuthState) => ({
            ...prevState,
            ...changes,
        }));
    };

    const setLoggedInUser = (user: any) => {
        accessToken = user.token;
        updateState({ user });
    };

    const isLoggedIn = useCallback(() => {
        return authState.user != null && accessToken != null;
    }, [accessToken, authState.user]);

    const logout = () => {
        accessToken = null;
        updateState({
            user: undefined,
        });
    };

    const roleId = authState.user?.roleid;
    const getToken = () => accessToken;

    return {
        authState,
        setLoggedInUser,
        isLoggedIn,
        logout,
        getToken,
        roleId,
    };
};

const AuthConfigContext = createContext({} as ReturnType<typeof useHook>);

export const AuthConfigProvider = ({ children }: { children: ReactNode }) => {
    return <AuthConfigContext.Provider value={useHook()}>{children}</AuthConfigContext.Provider>;
};

export const useAuth = () => {
    return useContext(AuthConfigContext);
};
