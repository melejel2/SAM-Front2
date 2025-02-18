import { useEffect, useState } from "react";

import { Card, CardBody, CardTitle, Countdown } from "@/components/daisyui";

import PageMetaData from "@/components/PageMetaData";
import PageTitle from "@/components/PageTitle";

const CountdownPage = () => {
    const [value, setValue] = useState<number>(59);
    useEffect(() => {
        const timer = setTimeout(() => {
            setValue((v) => (v <= 0 ? 59 : v - 1));
        }, 1000);
        return () => {
            clearTimeout(timer);
        };
    }, [value]);

    return (
        <div>
            <PageMetaData title={"Countdown"} />

            <PageTitle title={"Countdown"} subMenu={"UI"} />
            <div className="mt-6">
                <div className="grid gap-6 xl:grid-cols-2">
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Default</CardTitle>
                            <div className="mt-1 space-y-1">
                                <Countdown className="text-2xl" value={value} />
                            </div>
                        </CardBody>
                    </Card>
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Clock</CardTitle>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                                <Countdown value={10} />:
                                <Countdown value={24} />:
                                <Countdown value={value} />
                            </div>
                        </CardBody>
                    </Card>
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Outline</CardTitle>
                            <div className="mt-1 grid auto-cols-max grid-flow-col gap-5 text-center">
                                <div className="flex flex-col">
                                    <Countdown className="text-xl md:text-5xl" value={15} />
                                    days
                                </div>
                                <div className="flex flex-col">
                                    <Countdown className="text-xl md:text-5xl" value={10} />
                                    hours
                                </div>
                                <div className="flex flex-col">
                                    <Countdown className="text-xl md:text-5xl" value={24} />
                                    min
                                </div>
                                <div className="flex flex-col">
                                    <Countdown className="text-xl md:text-5xl" value={value} />
                                    sec
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Boxes</CardTitle>
                            <div className="mt-1 grid auto-cols-max grid-flow-col gap-3 text-center md:gap-5">
                                <div className="flex flex-col rounded-box bg-neutral p-2 text-sm text-neutral-content md:text-base">
                                    <Countdown className="text-lg md:text-5xl" value={15} />
                                    Days
                                </div>
                                <div className="flex flex-col rounded-box bg-neutral p-2 text-sm text-neutral-content md:text-base">
                                    <Countdown className="text-lg md:text-5xl" value={10} />
                                    Hours
                                </div>
                                <div className="flex flex-col rounded-box bg-neutral p-2 text-sm text-neutral-content md:text-base">
                                    <Countdown className="text-lg md:text-5xl" value={24} />
                                    Minutes
                                </div>
                                <div className="flex flex-col rounded-box bg-neutral p-2 text-sm text-neutral-content md:text-base">
                                    <Countdown className="text-lg md:text-5xl" value={value} />
                                    Seconds
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default CountdownPage;
