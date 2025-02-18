import clipboardIcon from "@iconify/icons-lucide/clipboard";
import clipboardCheckIcon from "@iconify/icons-lucide/clipboard-check";
import packageCheckIcon from "@iconify/icons-lucide/package-check";
import packageOpenIcon from "@iconify/icons-lucide/package-open";
import starsIcon from "@iconify/icons-lucide/stars";
import truckIcon from "@iconify/icons-lucide/truck";

import { Button, Timeline, TimelineEnd, TimelineItem, TimelineMiddle } from "@/components/daisyui";

import Icon from "@/components/Icon";

const TrackOrder = () => {
    return (
        <Timeline vertical className="timeline-hr-sm -ms-[100%] ps-10">
            <TimelineItem connect="end">
                <TimelineMiddle>
                    <div className="rounded-full bg-primary/10 p-2 text-primary">
                        <Icon icon={clipboardIcon} fontSize={20} />
                    </div>
                </TimelineMiddle>

                <TimelineEnd className="w-full border-0 shadow-none">
                    <div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Ordered</span>
                            <span className="text-xs text-base-content/70">4 days </span>
                        </div>
                        <p className="text-sm text-base-content/80">Samuel E. Clark ordered it via app</p>
                    </div>
                </TimelineEnd>
            </TimelineItem>
            <TimelineItem connect="both">
                <TimelineMiddle>
                    <div className="rounded-full bg-primary/10 p-2 text-primary">
                        <Icon icon={clipboardCheckIcon} fontSize={20} />
                    </div>
                </TimelineMiddle>
                <TimelineEnd className="w-full border-0 shadow-none">
                    <div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Accepted</span>
                            <span className="text-xs text-base-content/70">3 days</span>
                        </div>

                        <p className="text-sm text-base-content/80">Cafe day&apos;s accept order</p>
                    </div>
                </TimelineEnd>
            </TimelineItem>
            <TimelineItem connect="both">
                <TimelineMiddle>
                    <div className="rounded-full bg-primary/10 p-2 text-primary">
                        <Icon icon={packageCheckIcon} fontSize={20} />
                    </div>
                </TimelineMiddle>
                <TimelineEnd className="w-full border-0 shadow-none">
                    <div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Ready to dispatch</span>
                            <span className="text-xs text-base-content/70">23 hours</span>
                        </div>
                        <p className="text-sm text-base-content/80">Packaging done with instructions</p>
                    </div>
                </TimelineEnd>
            </TimelineItem>
            <TimelineItem connect="both">
                <TimelineMiddle>
                    <div className="rounded-full bg-primary/10 p-2 text-primary">
                        <Icon icon={truckIcon} fontSize={20} />
                    </div>
                </TimelineMiddle>
                <TimelineEnd className="w-full border-0 shadow-none">
                    <div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">On the Way</span>
                            <span className="text-xs text-base-content/70">2 hours</span>
                        </div>
                        <p className="text-sm text-base-content/80">Way&apos;s truck goes for delivery</p>
                    </div>
                </TimelineEnd>
            </TimelineItem>
            <TimelineItem connect="both">
                <TimelineMiddle>
                    <div className="rounded-full bg-success/10 p-2 text-success">
                        <Icon icon={packageOpenIcon} fontSize={20} />
                    </div>
                </TimelineMiddle>
                <TimelineEnd className="w-full border-0 shadow-none">
                    <div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Delivered</span>
                            <span className="text-xs text-base-content/70">24 minutes</span>
                        </div>
                        <p className="text-sm text-base-content/80">Order put your door at snap</p>
                    </div>
                </TimelineEnd>
            </TimelineItem>
            <TimelineItem connect="start">
                <TimelineMiddle>
                    <div className="rounded-full bg-base-content/5 p-2 text-orange-500">
                        <Icon icon={starsIcon} fontSize={20} />
                    </div>
                </TimelineMiddle>
                <TimelineEnd className="w-full border-0 shadow-none">
                    <Button color="ghost" size="sm" className="font-medium hover:bg-primary/10 hover:text-primary">
                        See the Rating
                    </Button>
                </TimelineEnd>
            </TimelineItem>
        </Timeline>
    );
};

export default TrackOrder;
