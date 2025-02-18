import cookieIcon from "@iconify/icons-lucide/cookie";
import infoIcon from "@iconify/icons-lucide/info";
import messageSquareDashedIcon from "@iconify/icons-lucide/message-square-dashed";
import trash2Icon from "@iconify/icons-lucide/trash-2";

import { Alert, Button, Card, CardBody, CardTitle } from "@/components/daisyui";

import Icon from "@/components/Icon";
import PageMetaData from "@/components/PageMetaData";
import PageTitle from "@/components/PageTitle";

const AlertPage = () => {
    return (
        <div>
            <PageMetaData title={"Alert"} />

            <PageTitle title={"Alert"} subMenu={"UI"} />
            <div className="mt-6">
                <div className="grid gap-6 xl:grid-cols-2">
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Default</CardTitle>
                            <div className="mt-1 flex ">
                                <Alert icon={<Icon icon={infoIcon} className="text-info" />}>
                                    <span>12 unread messages. Tap to see.</span>
                                </Alert>
                            </div>
                        </CardBody>
                    </Card>
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Button</CardTitle>
                            <div className="mt-1 flex ">
                                <Alert icon={<Icon icon={cookieIcon} className="text-info" />}>
                                    <span>we use cookies for no reason.</span>
                                    <div className="space-x-1">
                                        <Button size="sm">Deny</Button>
                                        <Button size="sm" color="primary">
                                            Accept
                                        </Button>
                                    </div>
                                </Alert>
                            </div>
                        </CardBody>
                    </Card>
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Description</CardTitle>
                            <div className="mt-1 flex ">
                                <Alert icon={<Icon icon={messageSquareDashedIcon} />}>
                                    <div>
                                        <h3 className="font-bold">New message!</h3>
                                        <div className="text-xs">You have 1 unread message</div>
                                    </div>
                                    <Button size="sm">See</Button>
                                </Alert>
                            </div>
                        </CardBody>
                    </Card>
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Use case</CardTitle>
                            <div className="mt-1 flex ">
                                <Alert icon={<Icon icon={trash2Icon} />}>
                                    <div>
                                        <h3 className="font-bold">12.7 MB Saved</h3>
                                        <div className="text-xs">Some file removed</div>
                                    </div>
                                    <div className="space-x-1">
                                        <Button size="sm">Dismiss</Button>
                                        <Button size="sm" color="primary">
                                            Restore
                                        </Button>
                                    </div>
                                </Alert>
                            </div>
                        </CardBody>
                    </Card>
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Colors</CardTitle>
                            <div className="mt-1 space-y-3 ">
                                <Alert icon={<Icon icon={infoIcon} />} status="success">
                                    <span>New software update available.</span>
                                </Alert>
                                <Alert icon={<Icon icon={infoIcon} />} status="warning">
                                    <span>New software update available.</span>
                                </Alert>
                                <Alert icon={<Icon icon={infoIcon} />} status="info">
                                    <span>New software update available.</span>
                                </Alert>
                                <Alert icon={<Icon icon={infoIcon} />} status="error">
                                    <span>New software update available.</span>
                                </Alert>
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default AlertPage;
