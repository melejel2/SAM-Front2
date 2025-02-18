import { Card, CardBody, CardTitle, Form, FormLabel, Toggle } from "@/components/daisyui";

import PageMetaData from "@/components/PageMetaData";
import PageTitle from "@/components/PageTitle";

const TogglePage = () => {
    return (
        <div>
            <PageMetaData title={"Toggle - Forms"} />
            <PageTitle title={"Toggle"} subMenu={"Forms"} />
            <div className="mt-6">
                <div className="grid gap-6 xl:grid-cols-2">
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Default</CardTitle>
                            <div className="mt-1 flex flex-wrap gap-5">
                                <Toggle />
                                <Toggle defaultChecked />
                                <Toggle disabled />
                                <Toggle disabled defaultChecked />
                            </div>
                        </CardBody>
                    </Card>
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Color</CardTitle>
                            <div className="mt-1 flex flex-wrap gap-2">
                                <Toggle defaultChecked color="primary" />
                                <Toggle defaultChecked color="secondary" />
                                <Toggle defaultChecked color="success" />
                                <Toggle defaultChecked color="warning" />
                                <Toggle defaultChecked color="info" />
                                <Toggle defaultChecked color="error" />
                            </div>
                        </CardBody>
                    </Card>
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Size</CardTitle>
                            <div className="mt-1 flex flex-col items-center gap-2">
                                <Toggle defaultChecked size="xs" />
                                <Toggle defaultChecked size="sm" />
                                <Toggle defaultChecked size="md" />
                                <Toggle defaultChecked size="lg" />
                            </div>
                        </CardBody>
                    </Card>
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Form Control</CardTitle>
                            <Form className="mt-1 w-fit rounded-lg bg-base-200 p-2 px-4">
                                <FormLabel title="Remember me">
                                    <Toggle className="m-2 ms-4" />
                                </FormLabel>
                            </Form>
                        </CardBody>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default TogglePage;
