import arrowDownToLineIcon from "@iconify/icons-lucide/arrow-down-to-line";
import uploadIcon from "@iconify/icons-lucide/upload";
import xIcon from "@iconify/icons-lucide/x";

import { Button, Modal } from "@/components/daisyui";

import Icon from "@/components/Icon";
import FileUploader from "@/components/forms/FileUploader";

import { useFileManager } from "../use-file-manager";

const UploadButton = () => {
    const { uploadModalRef, showUploadModal, uploadFileProcess } = useFileManager();

    return (
        <>
            <Button
                onClick={showUploadModal}
                startIcon={<Icon icon={uploadIcon} className="size-4" />}
                size="sm"
                aria-label="Upload file"
                color={"ghost"}
                className=" border-base-content/20">
                Upload
            </Button>
            <Modal ref={uploadModalRef} backdrop>
                <div className="flex items-center justify-between">
                    <p className="font-medium">Upload Files</p>
                    <form method="dialog">
                        <Button
                            color="ghost"
                            size={"sm"}
                            aria-label="Close upload file modal"
                            shape={"circle"}
                            startIcon={<Icon icon={xIcon} className="size-5" />}></Button>
                    </form>
                </div>
                <div className="mt-4">
                    <FileUploader allowMultiple={true} maxFiles={3} server={{ process: uploadFileProcess }} />
                    <div className="mt-8 text-end">
                        <Button
                            color="primary"
                            size={"sm"}
                            startIcon={<Icon icon={arrowDownToLineIcon} className="size-4" />}>
                            Import
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default UploadButton;
