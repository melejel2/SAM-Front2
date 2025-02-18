import { Card, CardBody, CardTitle, Checkbox, Form, FormLabel } from "@/components/daisyui";

import PageMetaData from "@/components/PageMetaData";
import PageTitle from "@/components/PageTitle";

const CheckboxPage = () => {
    return (
        <div>
            <PageMetaData title={"Checkbox - Forms"} />

            <PageTitle title={"Checkbox"} subMenu={"Forms"} />
            <div className="mt-6">
                <div className="grid gap-6 xl:grid-cols-2">
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Default</CardTitle>
                            <div className="mt-1 flex flex-wrap gap-5">
                                <Checkbox />
                                <Checkbox defaultChecked />
                                <Checkbox indeterminate />
                                <Checkbox disabled />
                                <Checkbox disabled checked />
                                <Checkbox indeterminate disabled />
                            </div>
                        </CardBody>
                    </Card>
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Colors</CardTitle>
                            <div className="mt-1 flex flex-wrap gap-5">
                                <Checkbox color="primary" defaultChecked />
                                <Checkbox color="secondary" defaultChecked />
                                <Checkbox color="success" defaultChecked />
                                <Checkbox color="warning" defaultChecked />
                                <Checkbox color="info" defaultChecked />
                                <Checkbox color="error" defaultChecked />
                            </div>
                        </CardBody>
                    </Card>
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Size</CardTitle>
                            <div className="mt-1 flex flex-wrap items-center gap-5">
                                <Checkbox defaultChecked size="lg" />
                                <Checkbox defaultChecked size="md" />
                                <Checkbox defaultChecked size="sm" />
                                <Checkbox defaultChecked size="xs" />
                            </div>
                        </CardBody>
                    </Card>
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Form Control</CardTitle>
                            <Form className="w-64 rounded-lg bg-base-200 p-2 px-4">
                                <FormLabel title="Remember me">
                                    <Checkbox />
                                </FormLabel>
                            </Form>
                        </CardBody>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default CheckboxPage;
