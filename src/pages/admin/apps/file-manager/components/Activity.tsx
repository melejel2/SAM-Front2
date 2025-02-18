import arrowUpFromLineIcon from "@iconify/icons-lucide/arrow-up-from-line";
import folderInputIcon from "@iconify/icons-lucide/folder-input";
import folderPlusIcon from "@iconify/icons-lucide/folder-plus";
import moreHorizontalIcon from "@iconify/icons-lucide/more-horizontal";
import pencilIcon from "@iconify/icons-lucide/pencil";
import trashIcon from "@iconify/icons-lucide/trash";

import { Button, Timeline, TimelineEnd, TimelineItem, TimelineMiddle } from "@/components/daisyui";

import Icon from "@/components/Icon";

const Activity = () => {
    return (
        <Timeline vertical className="timeline-hr-sm -ms-[100%] ps-10">
            <TimelineItem connect="end">
                <TimelineMiddle>
                    <div className="rounded-full bg-primary/10 p-2 text-primary">
                        <Icon icon={pencilIcon} fontSize={14} />
                    </div>
                </TimelineMiddle>
                <TimelineEnd className="w-full border-0 shadow-none">
                    <div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Olivia Duncan</span>
                            <span className="text-xs text-base-content/70">Just Now</span>
                        </div>
                        <p className="text-sm text-base-content/80">Edited package.json in e-commerce</p>
                    </div>
                </TimelineEnd>
            </TimelineItem>
            <TimelineItem connect="both">
                <TimelineMiddle>
                    <div className="rounded-full bg-primary/10 p-2 text-primary">
                        <Icon icon={arrowUpFromLineIcon} fontSize={14} />
                    </div>
                </TimelineMiddle>
                <TimelineEnd className="w-full border-0 shadow-none">
                    <div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Tillie Frank</span>
                            <span className="text-xs text-base-content/70">22 hours</span>
                        </div>

                        <p className="text-sm text-base-content/80">Uploaded app.tsx file in react directory</p>
                    </div>
                </TimelineEnd>
            </TimelineItem>
            <TimelineItem connect="both">
                <TimelineMiddle>
                    <div className="rounded-full bg-error/10 p-2 text-error">
                        <Icon icon={trashIcon} fontSize={14} />
                    </div>
                </TimelineMiddle>
                <TimelineEnd className="w-full border-0 shadow-none">
                    <div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Zaid Pope</span>
                            <span className="text-xs text-base-content/70">3 days</span>
                        </div>
                        <p className="text-sm text-base-content/80">Removed style.css & images folder from root</p>
                    </div>
                </TimelineEnd>
            </TimelineItem>
            <TimelineItem connect="both">
                <TimelineMiddle>
                    <div className="rounded-full bg-primary/10 p-2 text-primary">
                        <Icon icon={folderInputIcon} fontSize={14} />
                    </div>
                </TimelineMiddle>
                <TimelineEnd className="w-full border-0 shadow-none">
                    <div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Grover Russo</span>
                            <span className="text-xs text-base-content/70">week ago</span>
                        </div>
                        <p className="text-sm text-base-content/80">Moved folders to inner directory</p>
                    </div>
                </TimelineEnd>
            </TimelineItem>
            <TimelineItem connect="both">
                <TimelineMiddle>
                    <div className="rounded-full bg-success/10 p-2 text-success">
                        <Icon icon={folderPlusIcon} fontSize={14} />
                    </div>
                </TimelineMiddle>
                <TimelineEnd className="w-full border-0 shadow-none">
                    <div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Qasim Cotton</span>
                            <span className="text-xs text-base-content/70">this month</span>
                        </div>
                        <p className="text-sm text-base-content/80">Created the root project</p>
                    </div>
                </TimelineEnd>
            </TimelineItem>
            <TimelineItem connect="start">
                <TimelineMiddle>
                    <div className="rounded-full bg-base-content/10 p-2">
                        <Icon icon={moreHorizontalIcon} fontSize={14} />
                    </div>
                </TimelineMiddle>
                <TimelineEnd className="w-full border-0 shadow-none">
                    <Button color="ghost" size="sm" className="font-medium hover:bg-primary/10 hover:text-primary">
                        View Full Activity
                    </Button>
                </TimelineEnd>
            </TimelineItem>
        </Timeline>
    );
};

export default Activity;
