import { useState } from "react";

import {
    Card,
    CardBody,
    CardTitle,
    FormLabel,
    Timeline,
    TimelineEnd,
    TimelineItem,
    TimelineMiddle,
    TimelineStart,
    Toggle,
} from "@/components/daisyui";

import PageMetaData from "@/components/PageMetaData";
import PageTitle from "@/components/PageTitle";

const TimelinePage = () => {
    const [vertical, setVertical] = useState(false);

    return (
        <>
            <PageMetaData title={"Timeline"} />

            <PageTitle
                title={"Timeline"}
                subMenu={"UI"}
                center={
                    <>
                        <div className="">
                            <FormLabel title="Verical" className="p-0">
                                <Toggle
                                    className="ms-2"
                                    checked={vertical}
                                    onChange={() => setVertical(!vertical)}
                                    size="sm"
                                    color="primary"
                                />
                            </FormLabel>
                        </div>
                    </>
                }
            />
            <div className="mt-6 grid gap-6 xl:grid-cols-2">
                <Card className="bg-base-100">
                    <CardBody>
                        <CardTitle>Default</CardTitle>
                        <div className="mt-1 space-y-1 overflow-auto">
                            <Timeline vertical={vertical}>
                                <TimelineItem connect="end">
                                    <TimelineStart>1984</TimelineStart>
                                    <TimelineMiddle />
                                    <TimelineEnd>First Macintosh computer</TimelineEnd>
                                </TimelineItem>
                                <TimelineItem connect="both">
                                    <TimelineStart>1998</TimelineStart>
                                    <TimelineMiddle />
                                    <TimelineEnd>iMac</TimelineEnd>
                                </TimelineItem>
                                <TimelineItem connect="both">
                                    <TimelineStart>2001</TimelineStart>
                                    <TimelineMiddle />
                                    <TimelineEnd>iPod</TimelineEnd>
                                </TimelineItem>
                                <TimelineItem connect="both">
                                    <TimelineStart>2007</TimelineStart>
                                    <TimelineMiddle />
                                    <TimelineEnd>iPhone</TimelineEnd>
                                </TimelineItem>
                                <TimelineItem connect="start">
                                    <TimelineStart>2015</TimelineStart>
                                    <TimelineMiddle />
                                    <TimelineEnd>Apple Watch</TimelineEnd>
                                </TimelineItem>
                            </Timeline>
                        </div>
                    </CardBody>
                </Card>

                <Card className="bg-base-100">
                    <CardBody>
                        <CardTitle>Bottom Side</CardTitle>
                        <div className="mt-1 space-y-1  overflow-auto">
                            <Timeline vertical={vertical}>
                                <TimelineItem connect="end">
                                    <TimelineMiddle />
                                    <TimelineEnd>First Macintosh computer</TimelineEnd>
                                </TimelineItem>
                                <TimelineItem connect="both">
                                    <TimelineMiddle />
                                    <TimelineEnd>iMac</TimelineEnd>
                                </TimelineItem>
                                <TimelineItem connect="both">
                                    <TimelineMiddle />
                                    <TimelineEnd>iPod</TimelineEnd>
                                </TimelineItem>
                                <TimelineItem connect="both">
                                    <TimelineMiddle />
                                    <TimelineEnd>iPhone</TimelineEnd>
                                </TimelineItem>
                                <TimelineItem connect="start">
                                    <TimelineMiddle />
                                    <TimelineEnd>Apple Watch</TimelineEnd>
                                </TimelineItem>
                            </Timeline>
                        </div>
                    </CardBody>
                </Card>
                <Card className="bg-base-100">
                    <CardBody>
                        <CardTitle>Top Side</CardTitle>
                        <div className="mt-1 space-y-1  overflow-auto">
                            <Timeline vertical={vertical}>
                                <TimelineItem connect="end">
                                    <TimelineStart box>First Macintosh computer</TimelineStart>
                                    <TimelineMiddle />
                                </TimelineItem>
                                <TimelineItem connect="both">
                                    <TimelineStart box>iMac</TimelineStart>
                                    <TimelineMiddle />
                                </TimelineItem>
                                <TimelineItem connect="both">
                                    <TimelineStart box>iPod</TimelineStart>
                                    <TimelineMiddle />
                                </TimelineItem>
                                <TimelineItem connect="both">
                                    <TimelineStart box>iPhone</TimelineStart>
                                    <TimelineMiddle />
                                </TimelineItem>
                                <TimelineItem connect="start">
                                    <TimelineStart box>Apple Watch</TimelineStart>
                                    <TimelineMiddle />
                                </TimelineItem>
                            </Timeline>
                        </div>
                    </CardBody>
                </Card>
                <Card className="bg-base-100">
                    <CardBody>
                        <CardTitle>Different Side</CardTitle>
                        <div className="mt-1 space-y-1  overflow-auto">
                            <Timeline vertical={vertical}>
                                <TimelineItem connect="end">
                                    <TimelineStart box>First Macintosh computer</TimelineStart>
                                    <TimelineMiddle />
                                </TimelineItem>
                                <TimelineItem connect="both">
                                    <TimelineMiddle />
                                    <TimelineEnd>iMac</TimelineEnd>
                                </TimelineItem>
                                <TimelineItem connect="both">
                                    <TimelineStart box>iPod</TimelineStart>
                                    <TimelineMiddle />
                                </TimelineItem>
                                <TimelineItem connect="both">
                                    <TimelineMiddle />
                                    <TimelineEnd>iPhone</TimelineEnd>
                                </TimelineItem>
                                <TimelineItem connect="start">
                                    <TimelineStart box>Apple Watch</TimelineStart>
                                    <TimelineMiddle />
                                </TimelineItem>
                            </Timeline>
                        </div>
                    </CardBody>
                </Card>
                <Card className="bg-base-100">
                    <CardBody>
                        <CardTitle>Color</CardTitle>
                        <div className="mt-1 space-y-1  overflow-auto">
                            <Timeline vertical={vertical}>
                                <TimelineItem connect="end" endClassName="bg-primary">
                                    <TimelineStart box>First Macintosh computer</TimelineStart>
                                    <TimelineMiddle className="text-primary" />
                                </TimelineItem>
                                <TimelineItem connect="both" startClassName="bg-primary" endClassName="bg-primary">
                                    <TimelineMiddle className="text-primary" />
                                    <TimelineEnd>iMac</TimelineEnd>
                                </TimelineItem>
                                <TimelineItem connect="both" startClassName="bg-primary">
                                    <TimelineStart box>iPod</TimelineStart>
                                    <TimelineMiddle className="text-primary" />
                                </TimelineItem>
                                <TimelineItem connect="both">
                                    <TimelineMiddle />
                                    <TimelineEnd>iPhone</TimelineEnd>
                                </TimelineItem>
                                <TimelineItem connect="start">
                                    <TimelineStart box>Apple Watch</TimelineStart>
                                    <TimelineMiddle />
                                </TimelineItem>
                            </Timeline>
                        </div>
                    </CardBody>
                </Card>
                <Card className="bg-base-100">
                    <CardBody>
                        <CardTitle>Without Icon</CardTitle>
                        <div className="mt-1 space-y-1  overflow-auto">
                            <Timeline vertical={vertical}>
                                <TimelineItem connect="end">
                                    <TimelineStart box>First Macintosh computer</TimelineStart>
                                </TimelineItem>
                                <TimelineItem connect="both">
                                    <TimelineEnd>iMac</TimelineEnd>
                                </TimelineItem>
                                <TimelineItem connect="both">
                                    <TimelineStart box>iPod</TimelineStart>
                                </TimelineItem>
                                <TimelineItem connect="both">
                                    <TimelineEnd>iPhone</TimelineEnd>
                                </TimelineItem>
                                <TimelineItem connect="start">
                                    <TimelineStart box>Apple Watch</TimelineStart>
                                </TimelineItem>
                            </Timeline>
                        </div>
                    </CardBody>
                </Card>
            </div>
        </>
    );
};

export default TimelinePage;
