import pauseIcon from "@iconify/icons-lucide/pause";
import playIcon from "@iconify/icons-lucide/play";
import xCircleIcon from "@iconify/icons-lucide/x-circle";

import { Progress } from "@/components/daisyui";

import Icon from "@/components/Icon";
import { StringUtil } from "@/helpers/utils/string";
import { IFileManagerUploadProcess } from "@/types/apps/file-manager";

import { useFileManager } from "../use-file-manager";

const SingleProcess = ({ process }: { process: IFileManagerUploadProcess }) => {
    const { name, percent, size, state } = process;
    return (
        <div>
            <div className="flex items-center justify-between">
                <span className="font-medium">{name}</span>
                <div className="inline-flex gap-2">
                    {state == "play" && <Icon icon={pauseIcon} fontSize={14} />}
                    {state == "pause" && <Icon icon={playIcon} fontSize={14} />}
                    <Icon icon={xCircleIcon} fontSize={14} className="text-error" />
                </div>
            </div>
            <div className="mt-1 flex items-center justify-between">
                <span className="text-sm text-base-content/70">{percent}%</span>
                <span className="text-xs text-base-content/70">{StringUtil.convertToStorageUnits(size)}</span>
            </div>
            <Progress
                className="mt-0 h-1 bg-base-content/10 align-super"
                color={state == "play" ? "success" : "error"}
                max={100}
                value={percent}
            />
        </div>
    );
};

const UploadProcess = () => {
    const { uploadData } = useFileManager();
    return (
        <div className="space-y-2 rounded-box border border-base-content/20 px-4 pb-2 pt-3">
            {uploadData.map((process, index) => (
                <SingleProcess process={process} key={index} />
            ))}
        </div>
    );
};
export default UploadProcess;
