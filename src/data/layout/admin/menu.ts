import airplayIcon from "@iconify/icons-lucide/airplay";
import bookOpenTextIcon from "@iconify/icons-lucide/book-open-text";
import fileIcon from "@iconify/icons-lucide/file";
import fileTextIcon from "@iconify/icons-lucide/file-text";
import messagesSquareIcon from "@iconify/icons-lucide/messages-square";
import packageIcon from "@iconify/icons-lucide/package";
import serverIcon from "@iconify/icons-lucide/server";
import shieldCheckIcon from "@iconify/icons-lucide/shield-check";

import routes from "@/services/routes";
import { IMenuItem } from "@/types/layout/admin";

export const adminMenuItems: IMenuItem[] = [
    {
        key: "dashboard",
        icon: airplayIcon,
        label: "Dashboard",
        url: routes.dashboards.ecommerce,
    },
    {
        key: "apps-label",
        isTitle: true,
        label: "Apps",
    },
    {
        key: "apps-ecommerce",
        icon: packageIcon,
        label: "Ecommerce",
        children: [
            {
                key: "apps-ecommerce-orders",
                label: "Orders",
                url: routes.apps.ecommerce.orders.index,
            },
            {
                key: "apps-ecommerce-order-detail",
                label: "Order Detail",
                url: routes.apps.ecommerce.orders.show(1),
            },
            {
                key: "apps-ecommerce-products",
                label: "Products",
                url: routes.apps.ecommerce.products.index,
            },
            {
                key: "apps-ecommerce-sellers",

                label: "Sellers",
                url: routes.apps.ecommerce.sellers.index,
            },
            {
                key: "apps-ecommerce-customers",

                label: "Customers",
                url: routes.apps.ecommerce.customers.index,
            },
            {
                key: "apps-ecommerce-shops",
                label: "Shops",
                url: routes.apps.ecommerce.shops.index,
            },
        ],
    },
    {
        key: "apps-file-manager",
        icon: serverIcon,
        label: "File Manager",
        url: routes.apps.fileManager.home,
    },
    {
        key: "apps-chat",
        icon: messagesSquareIcon,
        label: "Chat",
        url: routes.apps.chat.home,
    },

    {
        key: "label-pages",
        isTitle: true,
        label: "Pages",
    },
    {
        key: "landing",
        icon: fileIcon,
        label: "Landing",
        url: routes.landing,
    },
    {
        key: "auth",
        icon: shieldCheckIcon,
        label: "Auth",
        children: [
            {
                key: "auth-login",
                label: "Login",
                url: routes.auth.login,
            },
            {
                key: "auth-register",
                label: "Register",
                url: routes.auth.register,
            },
            {
                key: "auth-forgot-password",
                label: "Forgot Password",
                url: routes.auth.forgotPassword,
            },
            {
                key: "auth-reset-password",
                label: "Reset Password",
                url: routes.auth.resetPassword,
            },
        ],
    },
    {
        key: "label-ui-showcase",
        isTitle: true,
        label: "UI Showcase",
    },
    {
        key: "components",
        icon: packageIcon,
        label: "Components",
        children: [
            {
                key: "components-accordion",
                label: "Accordion",
                url: routes.ui.components.accordion,
            },
            {
                key: "components-alert",
                label: "Alert",
                url: routes.ui.components.alert,
            },
            {
                key: "components-avatar",
                label: "Avatar",
                url: routes.ui.components.avatar,
            },
            {
                key: "components-badge",
                label: "Badge",
                url: routes.ui.components.badge,
            },
            {
                key: "components-breadcrumb",
                label: "Breadcrumb",
                url: routes.ui.components.breadcrumb,
            },
            {
                key: "components-button",
                label: "Button",
                url: routes.ui.components.button,
            },
            {
                key: "components-countdown",
                label: "Countdown",
                url: routes.ui.components.countdown,
            },
            {
                key: "components-drawer",
                label: "Drawer",
                url: routes.ui.components.drawer,
            },
            {
                key: "components-dropdown",
                label: "Dropdown",
                url: routes.ui.components.dropdown,
            },

            {
                key: "components-loading",
                label: "Loading",
                url: routes.ui.components.loading,
            },
            {
                key: "components-menu",
                label: "Menu",
                url: routes.ui.components.menu,
            },
            {
                key: "components-modal",
                label: "Modal",
                url: routes.ui.components.modal,
            },

            {
                key: "components-pagination",
                label: "Pagination",
                url: routes.ui.components.pagination,
            },
            {
                key: "components-progress",
                label: "Progress",
                url: routes.ui.components.progress,
            },
            {
                key: "components-step",
                label: "Step",
                url: routes.ui.components.step,
            },
            {
                key: "components-tab",
                label: "Tab",
                url: routes.ui.components.tab,
            },
            {
                key: "components-timeline",
                label: "Timeline",
                url: routes.ui.components.timeline,
            },
            {
                key: "components-toast",
                label: "Toast",
                url: routes.ui.components.toast,
            },

            {
                key: "components-tooltip",
                label: "Tooltip",
                url: routes.ui.components.tooltip,
            },
        ],
    },
    {
        key: "ui-forms",
        icon: fileTextIcon,
        label: "Forms",
        children: [
            {
                key: "ui-forms-checkbox",
                label: "Checkbox",
                url: routes.ui.forms.checkbox,
            },

            {
                key: "ui-forms-file",
                label: "File",
                url: routes.ui.forms.file,
            },

            {
                key: "ui-forms-input",
                label: "Input",
                url: routes.ui.forms.input,
            },

            {
                key: "ui-forms-radio",
                label: "Radio",
                url: routes.ui.forms.radio,
            },

            {
                key: "ui-forms-range",
                label: "Range",
                url: routes.ui.forms.range,
            },

            {
                key: "ui-forms-rating",
                label: "Rating",
                url: routes.ui.forms.rating,
            },

            {
                key: "ui-forms-toggle",
                label: "Toggle",
                url: routes.ui.forms.toggle,
            },
        ],
    },
    {
        key: "label-other",
        isTitle: true,
        label: "Other",
    },
    {
        key: "docs",
        icon: bookOpenTextIcon,
        label: "Documentation",
        url: routes.docs,
    },
];
