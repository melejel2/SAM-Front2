import plusIcon from "@iconify/icons-lucide/plus";
import searchIcon from "@iconify/icons-lucide/search";
import usersIcon from "@iconify/icons-lucide/users";

import { Badge, Button, Card, CardBody, Input, Mask, Tooltip } from "@/components/daisyui";

import Icon from "@/components/Icon";
import { cn } from "@/helpers/utils/cn";
import DateUtil from "@/helpers/utils/date";
import { IChat } from "@/types/apps/chat";

import { useChat } from "../use-chat";

const SingleChat = ({ chat, selected }: { chat: IChat; selected: boolean }) => {
    const { image, name, messages, unreads } = chat;
    const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;

    return (
        <div
            className={cn(
                "my-0.5 flex cursor-pointer items-center gap-3 rounded-box p-2 px-3 transition-all hover:bg-base-content/5 active:scale-[.98]",
                {
                    "bg-base-content/10 hover:bg-base-content/15": selected,
                },
            )}>
            <img
                src={image}
                className={`size-11 bg-base-content/10 p-0.5 ${Mask.className({ variant: "squircle" })}`}
                alt="avatar"
            />
            <div className="grow">
                <div className="flex justify-between">
                    <p className="text-sm font-medium">{name}</p>
                    {lastMessage && (
                        <span className="text-xs text-base-content/60">
                            {DateUtil.formatted(lastMessage.send_at, { format: "hh:mm A" })}
                        </span>
                    )}
                </div>
                <div className="flex justify-between gap-3">
                    <p className="line-clamp-1 text-sm  text-base-content/80">
                        {lastMessage?.message ?? "Tap to message"}
                    </p>
                    {unreads && (
                        <Badge size="xs" className="px-1 py-1.5 text-xs" color="success">
                            {unreads}
                        </Badge>
                    )}
                </div>
            </div>
        </div>
    );
};

export const ChatList = () => {
    const { chats, setSelectedChat, selectedChat } = useChat();

    return (
        <Card className="bg-base-100">
            <CardBody>
                <div className="flex items-center gap-3">
                    <div className="form-control flex grow flex-row items-center rounded-box border border-base-content/20 px-2">
                        <Icon icon={searchIcon} className="text-base-content/60" fontSize={15} />
                        <Input
                            size="sm"
                            placeholder="Search along files"
                            className="w-full focus:border-transparent focus:outline-0"
                            bordered={false}
                            borderOffset={false}></Input>
                    </div>
                    <Tooltip message="New Contact">
                        <Button
                            color={"ghost"}
                            aria-label="New contact"
                            size={"sm"}
                            className="border border-base-content/20 p-2"
                            startIcon={<Icon icon={plusIcon} fontSize={14} />}></Button>
                    </Tooltip>
                </div>

                <div className="mt-2">
                    {chats.map((chat, index) => (
                        <div onClick={() => setSelectedChat(chat)} key={index}>
                            <SingleChat chat={chat} selected={selectedChat?.id == chat.id} />
                        </div>
                    ))}
                </div>
                <div className="mt-2 text-center">
                    <Button
                        color={"ghost"}
                        size={"sm"}
                        className="text-primary hover:bg-primary/10"
                        startIcon={<Icon icon={usersIcon} fontSize={14} />}>
                        Join a Community
                    </Button>
                </div>
            </CardBody>
        </Card>
    );
};
