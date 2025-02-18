import { ReactNode, createContext, useContext, useEffect, useRef, useState } from "react";

import { chatData } from "@/data/apps/chat";
import { IChat } from "@/types/apps/chat";

const useChatHook = () => {
    const [selectedChat, setSelectedChat] = useState<IChat | undefined>(undefined);
    const [hasOnCall, setHasOnCall] = useState<boolean>(false);
    const callModalRef = useRef<HTMLDialogElement>(null);

    const sendMessage = (message: string) => {
        if (selectedChat) {
            selectedChat.messages.push({
                message,
                send_at: new Date(),
                from_me: true,
            });
            setSelectedChat({ ...selectedChat });
        }
    };

    useEffect(() => {
        chatData.length != 0 && setSelectedChat(chatData[0]);
    }, []);

    const startCall = () => {
        callModalRef.current?.showModal();
        setHasOnCall(true);
    };

    const endCall = () => {
        setHasOnCall(false);
    };

    return {
        chats: chatData,
        selectedChat,
        setSelectedChat,
        hasOnCall,
        callModalRef,
        sendMessage,
        startCall,
        endCall,
    };
};

type HookReturnType = ReturnType<typeof useChatHook>;

const Context = createContext({} as HookReturnType);

export const ChatContextProvider = ({ children }: { children: ReactNode }) => {
    return <Context.Provider value={useChatHook()}>{children}</Context.Provider>;
};
export const useChat = () => useContext(Context);
