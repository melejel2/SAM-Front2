import { useEffect, useMemo } from "react";

import { useTheme as daisyUseTheme } from "@/components/daisyui";

import createHookedContext from "@/hooks/create-hooked-context";
import useLocalStorage from "@/hooks/use-local-storage";
import { ILayoutState } from "@/types/layout/admin";
import routes from "@/services/routes";
import { useNavigate } from "react-router-dom";

const INIT_STATE: ILayoutState = {
  theme: "light",
  leftbar: {
    hide: false,
    drawerOpen: false,
    dashboard: true,
  },
};

const useHook = () => {
  const [state, setState] = useLocalStorage<ILayoutState>(
    "__SAM_REACT_ADMIN_LAYOUT__",
    INIT_STATE
  );
  const { setTheme } = daisyUseTheme();
  const navigate = useNavigate();

  useEffect(() => {
    setTheme(state.theme);
    if (htmlRef) {
      if (state.theme == "dark") {
        htmlRef.classList.add("dark");
      } else {
        htmlRef.classList.remove("dark");
      }
    }
  }, [state.theme]);

  const htmlRef = useMemo(() => {
    return document.querySelector("html");
  }, []);

  const toggleLeftbarDrawer = (open: boolean) => {
    updateState({
      leftbar: {
        ...state.leftbar,
        drawerOpen: open,
        hide: open,
      },
    });
  };

  const toggleDashboard = () => {
    updateState({
      leftbar: {
        ...state.leftbar,
        dashboard: !state.leftbar.dashboard,
      },
    });
    if (state.leftbar.dashboard) {
      navigate(routes.adminTools.users.index);
    } else {
      navigate(routes.dashboard.index);
    }
  };

  const resetDashboard = () => {
    updateState({
      leftbar: {
        ...state.leftbar,
        dashboard: true,
      },
    });
  };

  const updateState = (newState: Partial<ILayoutState>) => {
    setState({ ...state, ...newState });
  };

  const changeTheme = (theme: ILayoutState["theme"]) => {
    updateState({
      theme,
    });
  };

  const reset = () => {
    setState(INIT_STATE);
  };

  return {
    state,
    toggleLeftbarDrawer,
    toggleDashboard,
    changeTheme,
    reset,
    resetDashboard,
  };
};

const [useLayoutContext, LayoutContextProvider] = createHookedContext(useHook);

export { useLayoutContext, LayoutContextProvider };
