import bellIcon from "@iconify/icons-lucide/bell";
import xIcon from "@iconify/icons-lucide/x";

import { useEffect, useRef, useState } from "react";

import {
  Button,
  Dropdown,
  DropdownMenu,
  DropdownToggle,
  useDialog,
} from "@/components/daisyui";

import Icon from "@/components/Icon";
import { Loader } from "@/components/Loader";
import DialogComponent from "@/components/Table/Components/Dialog";

const NotificationButton = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [open, setOpen] = useState(false);
  const [selectedNotificationId, setSelectedNotificationId] = useState<
    number | null
  >(null);
  const [showDialog, setShowDialog] = useState<boolean>(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const { dialogRef, handleShow, handleHide } = useDialog();

  const getNotifications = async () => {
    setLoading(true);
    try {
      const res: any[] = [];
      setNotifications(res);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const closeMenu = () => {
    setOpen(false);
  };

  const openDialog = () => {
    setShowDialog(true);
    setTimeout(() => {
      handleShow();
    });
  };

  const handleOpenMenu = async () => {
    setOpen(true);
    await getNotifications();
  };

  const handlePreviewNotification = async (materialId: number) => {
    setSelectedNotificationId(materialId);
    try {
      openDialog();
    } catch (error) {
      console.error(error);
    }
  };

  const handleSuccess = async () => {
    setShowDialog(false);
    handleHide();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        closeMenu();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <>
      <div ref={dropdownRef}>
        <Dropdown vertical={"bottom"} end open={open}>
          <DropdownToggle
            className="btn btn-circle btn-ghost btn-sm indicator"
            button={false}
            onClick={handleOpenMenu}
          >
            {notifications.length > 0 && (
              <span className="indicator-item bg-warning w-1.5 h-1.5 rounded-full mt-1.5 mr-2.5"></span>
            )}
            <Icon icon={bellIcon} fontSize={20} />
          </DropdownToggle>
          <DropdownMenu className="card card-compact m-1 w-96 p-3 shadow">
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
            {loading ? (
              <Loader />
            ) : (
              <>
                <div className="mt-3 h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <span>Your notifications are clean</span>
                  ) : (
                    notifications.map((notification, index) => (
                      <div key={index}>
                        <div
                          className="my-0.5 flex cursor-pointer items-start gap-3 rounded-box p-1.5 transition-all hover:bg-base-content/5 active:scale-[.98]"
                          onClick={() =>
                            handlePreviewNotification(notification.materialId)
                          }
                        >
                          <div className="grow">
                            <p className="text-sm">{notification.message}</p>
                            <p className="text-xs text-base-content/60">Now</p>
                          </div>
                        </div>
                        <hr className="opacity-10" />
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </DropdownMenu>
        </Dropdown>
      </div>

      {showDialog && selectedNotificationId && notifications.length > 0 && (
        <DialogComponent
          handleHide={function (): void {
            throw new Error("Function not implemented.");
          }}
          dialogRef={dialogRef}
          dialogType={"Preview"}
          current={null}
          onSuccess={handleSuccess}
          inputFields={[]}
          title={"Title"}
        />
      )}
    </>
  );
};

export default NotificationButton;
