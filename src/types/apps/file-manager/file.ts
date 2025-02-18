import { IconifyIcon } from "@iconify/react";

export type IFileManagerFile = {
    name: string;
    owner_name: string;
    icon: IconifyIcon;
    size: number;
    last_modified_at: Date;
    shared_with: number | "private" | "public";
};
