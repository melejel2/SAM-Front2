import { Card, CardBody, CardTitle, Range } from "@/components/daisyui";

import PageMetaData from "@/components/PageMetaData";
import PageTitle from "@/components/PageTitle";

const RangePage = () => {
    return (
        <div>
            <PageMetaData title={"Range - Forms"} />
            <PageTitle title={"Range"} subMenu={"Forms"} />
            <div className="mt-6">
                <div className="grid gap-6 xl:grid-cols-2">
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Default</CardTitle>
                            <div className="mt-1 flex flex-wrap gap-5">
                                <Range />
                            </div>
                        </CardBody>
                    </Card>
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Step</CardTitle>
                            <div className="mt-1 flex flex-wrap gap-5">
                                <Range step={10} />
                            </div>
                        </CardBody>
                    </Card>
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Color</CardTitle>
                            <div className="mt-1 flex flex-col gap-3">
                                <Range color={"primary"} size={"sm"} />
                                <Range color={"secondary"} size={"sm"} />
                                <Range color={"success"} size={"sm"} />
                                <Range color={"warning"} size={"sm"} />
                                <Range color={"info"} size={"sm"} />
                                <Range color={"error"} size={"sm"} />
                            </div>
                        </CardBody>
                    </Card>
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Size</CardTitle>
                            <div className="mt-1 flex flex-col gap-3">
                                <Range size={"xs"} />
                                <Range size={"sm"} />
                                <Range size={"md"} />
                                <Range size={"lg"} />
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default RangePage;
