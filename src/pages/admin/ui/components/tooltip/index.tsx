import { Button, Card, CardBody, CardTitle, Tooltip } from "@/components/daisyui";

import PageMetaData from "@/components/PageMetaData";
import PageTitle from "@/components/PageTitle";

const TooltipPage = () => {
    return (
        <div>
            <PageMetaData title={"Tooltip"} />

            <PageTitle title={"Tooltip"} subMenu={"UI"} />
            <div className="mt-6">
                <div className="grid gap-6 xl:grid-cols-2">
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Default</CardTitle>
                            <div className="mt-1 flex flex-wrap gap-3">
                                <Tooltip message="It's tooltip">
                                    <Button>Hover me</Button>
                                </Tooltip>
                                <Tooltip message="I'm never go" open>
                                    <Button>Hover me</Button>
                                </Tooltip>
                            </div>
                        </CardBody>
                    </Card>
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Position</CardTitle>
                            <div className="mt-1 flex flex-wrap gap-3">
                                <Tooltip message="Left" position="left">
                                    <Button>Left</Button>
                                </Tooltip>

                                <Tooltip message="Top" position="top">
                                    <Button>Top</Button>
                                </Tooltip>
                                <Tooltip message="Right" position="right">
                                    <Button>Right</Button>
                                </Tooltip>
                                <Tooltip message="Bottom" position="bottom">
                                    <Button>Bottom</Button>
                                </Tooltip>
                            </div>
                        </CardBody>
                    </Card>
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Color</CardTitle>
                            <div className="mt-1 flex flex-wrap gap-3">
                                <Tooltip message="Primary" color="primary">
                                    <Button color="primary">Primary</Button>
                                </Tooltip>
                                <Tooltip message="Secondary" color="secondary">
                                    <Button color="secondary">Secondary</Button>
                                </Tooltip>
                                <Tooltip message="Success" color="success">
                                    <Button color="success">Success</Button>
                                </Tooltip>
                                <Tooltip message="Warning" color="warning">
                                    <Button color="warning">Warning</Button>
                                </Tooltip>
                                <Tooltip message="Info" color="info">
                                    <Button color="info">Info</Button>
                                </Tooltip>
                                <Tooltip message="Error" color="error">
                                    <Button color="error">Error</Button>
                                </Tooltip>
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default TooltipPage;
