import { Card, CardBody, CardTitle, Form, FormLabel, Radio } from "@/components/daisyui";

import PageMetaData from "@/components/PageMetaData";
import PageTitle from "@/components/PageTitle";

const RadioPage = () => {
    return (
        <div>
            <PageMetaData title={"Radio - Forms"} />
            <PageTitle title={"Radio"} subMenu={"Forms"} />
            <div className="mt-6">
                <div className="grid gap-6 xl:grid-cols-2">
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Default</CardTitle>
                            <div className="mt-1 flex flex-wrap gap-5">
                                <Radio name="radio1" defaultChecked />
                                <Radio name="radio1" />
                                <Radio name="radio1" disabled />
                                <Radio name="radio2" disabled defaultChecked />
                            </div>
                        </CardBody>
                    </Card>
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Colors</CardTitle>
                            <div className="mt-1 flex flex-wrap gap-5">
                                <Radio color="primary" defaultChecked />
                                <Radio color="secondary" defaultChecked />
                                <Radio color="success" defaultChecked />
                                <Radio color="warning" defaultChecked />
                                <Radio color="info" defaultChecked />
                                <Radio color="error" defaultChecked />
                            </div>
                        </CardBody>
                    </Card>
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Form Control</CardTitle>
                            <div className="mt-1 w-64 rounded-lg bg-base-200 p-4">
                                <Form>
                                    <FormLabel title="Red Pill">
                                        <Radio name="radio3" className="checked:bg-red-500" defaultChecked />
                                    </FormLabel>
                                </Form>
                                <Form>
                                    <FormLabel title="Blue Pill">
                                        <Radio name="radio3" className="checked:bg-blue-500" defaultChecked />
                                    </FormLabel>
                                </Form>
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default RadioPage;
