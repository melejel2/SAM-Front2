import hardDriveIcon from "@iconify/icons-lucide/hard-drive";

import { Button, Card, CardBody, Progress, Tab, Tabs } from "@/components/daisyui";

import Icon from "@/components/Icon";

import { useFileManager } from "../use-file-manager";
import Activity from "./Activity";
import UploadProcess from "./UploadProcess";
import { Usages } from "./Usages";

const Overview = () => {
    const { fileInformationTab, setFileInformationTab } = useFileManager();

    return (
        <Card className="rounded-br-none rounded-tl-none border-0 bg-base-100">
            <CardBody className="gap-0">
                <div className="flex items-center justify-between">
                    <p className="font-medium">Storage Overview</p>
                    <Button color="ghost" size="sm" className="text-success hover:bg-success/20">
                        Upgrade Now
                    </Button>
                </div>

                <div className="mt-3 rounded bg-primary/5 p-4">
                    <div className="flex items-center gap-3">
                        <Icon icon={hardDriveIcon} fontSize={18} className="text-primary" />
                        <span className="text-base font-medium text-primary">Your Local</span>
                        <span className="ms-auto text-sm font-semibold text-primary">250 GB</span>
                    </div>
                    <p className="mt-3 text-sm font-medium text-base-content/70">Used of 160GB</p>
                    <Progress max={250} value={160} color={"primary"} className="mt-0 h-1.5  bg-primary/20" />
                </div>
                <p className="mt-6 text-sm font-medium text-base-content/70">In Process</p>
                <div className="mt-3">
                    <UploadProcess />
                </div>
                <div className="mt-6">
                    <Tabs variant="boxed" color={"error"}>
                        <Tab
                            active={fileInformationTab == "detail"}
                            onClick={() => setFileInformationTab("detail")}
                            color={"error"}
                            className={`${fileInformationTab == "detail" && "!bg-secondary !text-secondary-content"}`}>
                            Usages
                        </Tab>
                        <Tab
                            active={fileInformationTab == "activity"}
                            onClick={() => setFileInformationTab("activity")}
                            className={`${fileInformationTab == "activity" && "!bg-secondary !text-secondary-content"}`}>
                            Activity
                        </Tab>
                    </Tabs>
                    <div className="mt-5 overflow-hidden">
                        {fileInformationTab == "detail" && <Usages />}
                        {fileInformationTab == "activity" && <Activity />}
                    </div>
                </div>
            </CardBody>
        </Card>
    );
};

export default Overview;
