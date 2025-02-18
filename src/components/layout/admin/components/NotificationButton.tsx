import avatar1Img from "@/assets/images/avatars/1.png";
import avatar2Img from "@/assets/images/avatars/2.png";
import avatar3Img from "@/assets/images/avatars/3.png";
import avatar4Img from "@/assets/images/avatars/4.png";
import avatar5Img from "@/assets/images/avatars/5.png";

import bellIcon from "@iconify/icons-lucide/bell";
import xIcon from "@iconify/icons-lucide/x";

import { useState } from "react";

import { Button, Dropdown, DropdownMenu, DropdownToggle, Mask } from "@/components/daisyui";

import Icon from "@/components/Icon";

const NotificationButton = () => {
    const [open, setOpen] = useState(false);

    const closeMenu = () => {
        //TODO: Need to change close logic
        setOpen(true);
        setTimeout(() => {
            setOpen(false);
        }, 1);
    };

    return (
        <div>
            <Dropdown vertical={"bottom"} end open={open}>
                <DropdownToggle className="btn btn-circle btn-ghost btn-sm" button={false}>
                    <Icon icon={bellIcon} fontSize={20} />
                </DropdownToggle>
                <DropdownMenu className="card card-compact m-1 w-96  p-3 shadow">
                    <div className="flex items-center justify-between px-2">
                        <p className="text-base font-medium">Notification</p>
                        <Button
                            size={"sm"}
                            shape={"circle"}
                            color={"ghost"}
                            startIcon={<Icon icon={xIcon} fontSize={16} />}
                            onClick={closeMenu}
                        />
                    </div>
                    <div className="flex items-center justify-center">
                        <div className=" rounded-full border  border-base-content/10 px-3 text-center">
                            <p className="text-xs  text-base-content/80">Today</p>
                        </div>
                    </div>
                    <div className="mt-3">
                        <div className="my-0.5 flex cursor-pointer items-center gap-3 rounded-box p-1.5 transition-all hover:bg-base-content/5 active:scale-[.98]">
                            <img
                                src={avatar4Img}
                                className={`size-9 bg-base-content/10 p-0.5 ${Mask.className({ variant: "circle" })}`}
                                alt=""
                            />
                            <div className="grow">
                                <p className="text-sm">{"Customer has requested a return for item"}</p>
                                <p className="text-xs text-base-content/60">1 Hour ago</p>
                            </div>
                        </div>
                        <div className="my-0.5 flex cursor-pointer items-center gap-3 rounded-box p-1.5 transition-all hover:bg-base-content/5 active:scale-[.98]">
                            <img
                                src={avatar5Img}
                                className={`size-9 bg-base-content/10 p-0.5 ${Mask.className({ variant: "circle" })}`}
                                alt=""
                            />
                            <div className="grow">
                                <p className="text-sm">{"A new review has been submitted for product"}</p>
                                <p className="text-xs text-base-content/60">1 Hour ago</p>
                            </div>
                        </div>
                    </div>
                    <div className="mt-2 flex items-center justify-center">
                        <div className="rounded-full border  border-base-content/10 px-3 text-center">
                            <p className="text-xs  text-base-content/80">Yesterday</p>
                        </div>
                    </div>
                    <div className="mt-3">
                        <div className="my-0.5 flex cursor-pointer items-center gap-3 rounded-box p-1.5 transition-all hover:bg-base-content/5 active:scale-[.98]">
                            <img
                                src={avatar1Img}
                                className={`size-9 bg-base-content/10 p-0.5 ${Mask.className({ variant: "circle" })}`}
                                alt=""
                            />
                            <div className="grow">
                                <p className="text-sm">{"Prepare for the upcoming weekend promotion "}</p>
                                <p className="text-xs text-base-content/60">1 Hour ago</p>
                            </div>
                        </div>
                        <div className="my-0.5 flex cursor-pointer items-center gap-3 rounded-box p-1.5 transition-all hover:bg-base-content/5 active:scale-[.98]">
                            <img
                                src={avatar2Img}
                                className={`size-9 bg-base-content/10 p-0.5 ${Mask.className({ variant: "circle" })}`}
                                alt=""
                            />
                            <div className="grow">
                                <p className="text-sm">{"Product 'ABC123' is running low in stock."}</p>
                                <p className="text-xs text-base-content/60">1 Hour ago</p>
                            </div>
                        </div>
                        <div className="my-0.5 flex cursor-pointer items-center gap-3 rounded-box p-1.5 transition-all hover:bg-base-content/5 active:scale-[.98]">
                            <img
                                src={avatar3Img}
                                className={`size-9 bg-base-content/10 p-0.5 ${Mask.className({ variant: "circle" })}`}
                                alt=""
                            />
                            <div className="grow">
                                <p className="text-sm">{"Payment received for Order ID: #67890"}</p>
                                <p className="text-xs text-base-content/60">1 Hour ago</p>
                            </div>
                        </div>
                    </div>
                    <hr className="-mx-2 mt-2 border-base-content/10" />
                    <div className="flex items-center justify-between pt-2">
                        <Button size={"sm"} color={"ghost"} className="text-primary hover:bg-primary/10">
                            View All
                        </Button>
                        <Button size={"sm"} color={"ghost"} className="text-base-content/80 hover:bg-base-content/10">
                            Mark as read
                        </Button>
                    </div>
                </DropdownMenu>
            </Dropdown>
        </div>
    );
};

export default NotificationButton;
