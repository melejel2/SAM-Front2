import { ReactNode } from "react";
import { Link } from "react-router";

export type IBreadcrumbItem = {
    label: string;
    path?: string;
    active?: boolean;
};

type IPageTitle = {
    items?: IBreadcrumbItem[];
    title: string;
    centerItem?: ReactNode;
};

export const PageTitle = ({ title, items, centerItem }: IPageTitle) => {
    return (
        <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">{title}</h3>
            {centerItem != null && centerItem}
            <>
                {items && (
                    <div className="breadcrumbs hidden p-0 text-sm sm:inline">
                        <ul>
                            <li>
                                <Link to="/dashboard">SAM</Link>
                            </li>
                            {items.map((item, index) => {
                                return (
                                    <li key={index} className={`${item.active ? "opacity-80" : ""}`}>
                                        {item.path ? (
                                            <Link key={index + 1} to={item.path}>
                                                {item.label}
                                            </Link>
                                        ) : (
                                            <>{item.label}</>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}
            </>
        </div>
    );
};
