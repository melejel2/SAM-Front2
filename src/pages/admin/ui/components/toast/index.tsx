import { useState } from "react";

import { Alert, Button, Card, CardBody, CardTitle, Toast } from "@/components/daisyui";

import PageMetaData from "@/components/PageMetaData";
import PageTitle from "@/components/PageTitle";

type ToastIds = "default" | "alert" | "multiple";

const ToastPage = () => {
    const [showToast, setShowToast] = useState<ToastIds | null>(null);

    return (
        <div>
            <PageMetaData title={"Toast"} />

            <PageTitle title={"Toast"} subMenu={"UI"} />
            <div className="mt-6">
                <div className="grid gap-6 xl:grid-cols-2">
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Default</CardTitle>
                            <div className="mt-1 flex ">
                                <Button onClick={() => setShowToast("default")}>Show Default</Button>

                                {showToast == "default" && (
                                    <Toast vertical={"bottom"} horizontal={"end"}>
                                        Default toast
                                    </Toast>
                                )}
                            </div>
                        </CardBody>
                    </Card>
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Alert</CardTitle>
                            <div className="mt-1 flex ">
                                <Button onClick={() => setShowToast("alert")}>Show Alert</Button>

                                {showToast == "alert" && (
                                    <Toast vertical={"bottom"} horizontal={"end"}>
                                        <Alert status="info">New message arrived.</Alert>
                                    </Toast>
                                )}
                            </div>
                        </CardBody>
                    </Card>
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Multiple</CardTitle>
                            <div className="mt-1 flex ">
                                <Button onClick={() => setShowToast("multiple")}>Show Multiple</Button>

                                {showToast == "multiple" && (
                                    <Toast vertical={"bottom"} horizontal={"end"}>
                                        <Alert status="info">New message arrived.</Alert>
                                        <Alert status="success">Message sent successfully.</Alert>
                                    </Toast>
                                )}
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default ToastPage;
