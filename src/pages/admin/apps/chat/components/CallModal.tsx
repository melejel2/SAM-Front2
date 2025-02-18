import bookUserIcon from "@iconify/icons-lucide/book-user";
import discIcon from "@iconify/icons-lucide/disc";
import micOffIcon from "@iconify/icons-lucide/mic-off";
import moreHorizontalIcon from "@iconify/icons-lucide/more-horizontal";
import pauseIcon from "@iconify/icons-lucide/pause";
import phoneIcon from "@iconify/icons-lucide/phone";
import userRoundPlusIcon from "@iconify/icons-lucide/user-plus";

import { Button, Mask, Modal } from "@/components/daisyui";

import Icon from "@/components/Icon";

import { useChat } from "../use-chat";

const CallModal = () => {
    const { selectedChat: chat, callModalRef, endCall } = useChat();

    if (!chat) return <></>;
    return (
        <>
            <Modal ref={callModalRef} backdrop>
                <div className="text-center">
                    <img
                        src={chat.image}
                        className={`inline size-16 bg-base-content/10 p-0.5 ${Mask.className({ variant: "squircle" })}`}
                        alt="avatar"
                    />
                    <p className="mt-1 font-medium">{chat.name}</p>
                    <p className="mt-1 text-sm text-base-content/60">02 : 55 </p>
                </div>
                <div className="mt-8 grid grid-cols-4 text-center">
                    <div className="cursor-pointer rounded bg-transparent py-3 transition-all hover:bg-base-content/10 active:bg-base-content/20">
                        <Icon icon={micOffIcon} className="inline" fontSize={24} />
                        <p className="mt-2">Mute</p>
                    </div>
                    <div className="cursor-pointer rounded bg-transparent py-3 transition-all hover:bg-base-content/10 active:bg-base-content/20">
                        <Icon icon={pauseIcon} className="inline" fontSize={24} />
                        <p className="mt-2">Hold</p>
                    </div>
                    <div className="cursor-pointer rounded bg-transparent py-3 transition-all hover:bg-base-content/10 active:bg-base-content/20">
                        <Icon icon={discIcon} className="inline" fontSize={24} />
                        <p className="mt-2">Record</p>
                    </div>
                    <div className="cursor-pointer rounded bg-transparent py-3 transition-all hover:bg-base-content/10 active:bg-base-content/20">
                        <Icon icon={bookUserIcon} className="inline" fontSize={24} />
                        <p className="mt-2">Contact</p>
                    </div>
                </div>
                <div className="mt-8 grid grid-cols-3 text-center">
                    <div>
                        <Button
                            aria-label="Phone"
                            color={"ghost"}
                            shape={"circle"}
                            startIcon={<Icon icon={userRoundPlusIcon} className="inline" fontSize={28} />}></Button>
                    </div>
                    <form method="dialog">
                        <div className="mt-8">
                            <Button
                                color="error"
                                aria-label="End call"
                                onClick={endCall}
                                shape={"circle"}
                                startIcon={
                                    <Icon icon={phoneIcon} className="rotate-[135deg]" fontSize={24} />
                                }></Button>
                        </div>
                    </form>
                    <div>
                        <Button
                            color={"ghost"}
                            shape={"circle"}
                            aria-label="More option"
                            startIcon={<Icon icon={moreHorizontalIcon} className="inline" fontSize={28} />}></Button>
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default CallModal;
