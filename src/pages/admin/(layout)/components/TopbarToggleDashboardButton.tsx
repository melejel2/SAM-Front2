import { Link } from "react-router";

import { useConfig } from "@/contexts/config";

export const TopbarToggleDashboardButton = () => {
    const { toggleDashboard, config } = useConfig();

    return (
        <>
            <Link
                to={config.dashboard ? "/admin-tools/connection" : "/dashboard"}
                className="btn btn-circle btn-ghost"
                onClick={toggleDashboard}>
                {config.dashboard ? (
                    <span className="iconify lucide--user-cog size-4" />
                ) : (
                    <span className="iconify lucide--airplay size-4" />
                )}
            </Link>
        </>
    );
};
