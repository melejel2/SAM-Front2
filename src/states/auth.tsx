import React, { useCallback } from "react";
import createHookedContext from "@/hooks/create-hooked-context";
import useSessionStorage from "@/hooks/use-session-storage";
import { IAuthState } from "@/types/auth/state";

interface AuthContextType {
  authState: IAuthState;
  setLoggedInUser: (user: any, token: string) => void;
  isLoggedIn: () => boolean;
  logout: () => void;
  getToken: () => string | null;
}

export const AuthContext = React.createContext<AuthContextType>({
  authState: {
    user: undefined,
    token: undefined,
  },
  setLoggedInUser: () => {},
  isLoggedIn: () => false,
  logout: () => {},
  getToken: () => null,
});

const useHook = () => {
  const [authState, setState] = useSessionStorage<IAuthState>(
    "__SAM_ADMIN_AUTH__",
    {
      user: undefined,
      token: undefined,
    }
  );

  let accessToken: string | null = authState.token ?? null;

  const updateState = (changes: Partial<IAuthState>) => {
    setState((prevState: IAuthState) => ({
      ...prevState,
      ...changes,
    }));
  };

  const setLoggedInUser = (user: any, token: string) => {
    accessToken = token;
    updateState({ user, token });
  };

  const updateSiteId = (newSiteId: number) => {
    setState((prevState: IAuthState) => ({
      ...prevState,
      user: {
        ...prevState.user,
        siteid: newSiteId,
      },
    }));
  };

  const isLoggedIn = useCallback(() => {
    return authState.user != null && accessToken != null;
  }, [authState.user]);

  const logout = () => {
    accessToken = null;
    updateState({
      user: undefined,
      token: undefined,
    });
  };

  const roleId = authState.user?.roleid;

  const getToken: any = () => accessToken;

  return {
    authState,
    setLoggedInUser,
    isLoggedIn,
    logout,
    getToken,
    updateSiteId,
    roleId,
  };
};

const [useAuthContext, AuthContextProvider] = createHookedContext(useHook);

export { useAuthContext, AuthContextProvider };
