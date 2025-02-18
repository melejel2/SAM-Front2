import messagesSquareIcon from "@iconify/icons-lucide/messages-square";

import { useMemo } from "react";
import { Link } from "react-router-dom";

import { Button, Card, CardBody, Mask } from "@/components/daisyui";

import Icon from "@/components/Icon";
import { getEcommerceDashboardMessageData } from "@/data/dashboards/ecommerce";
import { cn } from "@/helpers/utils/cn";
import DateUtil from "@/helpers/utils/date";
import routes from "@/services/routes";

const QuickChat = () => {
    const data = useMemo(() => getEcommerceDashboardMessageData, []);

    return (
        <Card className="bg-base-100">
            <CardBody>
                <div className="flex items-center gap-3">
                    <Icon icon={messagesSquareIcon} className="text-base-content/80" fontSize={16} />
                    <span className="font-medium">Quick Chat</span>
                </div>
                <div className="mt-2">
                    {data.slice(0, 4).map((chat, index) => (
                        <div
                            key={index}
                            className="flex cursor-pointer gap-4 rounded-box bg-transparent p-2.5 transition-all hover:bg-base-content/10 active:scale-[.98] active:bg-base-content/15">
                            <img
                                src={chat.image}
                                alt={"chat image"}
                                height={40}
                                width={40}
                                className={cn(
                                    "size-10 bg-base-content/10 p-0.5",
                                    Mask.className({ variant: "squircle" }),
                                )}
                            />

                            <div className="grow">
                                <div className="flex">
                                    <p className="grow font-medium">{chat.name}</p>
                                    <span className="text-xs text-base-content/60">
                                        {" "}
                                        {DateUtil.formatted(chat.date, { format: "hh:mm A" })}
                                    </span>
                                </div>
                                <p className="line-clamp-1 text-ellipsis text-sm/none text-base-content/80">
                                    {chat.message}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="mt-2 text-center">
                    <Link to={routes.apps.chat.home}>
                        <Button variant={"outline"} color={"ghost"} size={"sm"}>
                            Go To Chat
                        </Button>
                    </Link>
                </div>
            </CardBody>
        </Card>
    );
};

export default QuickChat;
