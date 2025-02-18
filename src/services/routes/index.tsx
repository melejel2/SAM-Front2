const routes = {
  auth: {
    login: "/auth/login",
    register: "/auth/register",
    forgotPassword: "/auth/forgot-password",
    resetPassword: "/auth/reset-password",
  },
  dashboard: {
    index: "/dashboard",
  },

  adminTools: {
    users: {
      index: "/admin-tools/branch-data/users",
    },
  },

  apps: {
    chat: {
      home: "/apps/chat",
    },
  },
};

export default routes;
