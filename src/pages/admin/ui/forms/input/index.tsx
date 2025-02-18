import { Card, CardBody, CardTitle, Input, Textarea } from "@/components/daisyui";

import PageMetaData from "@/components/PageMetaData";
import PageTitle from "@/components/PageTitle";

import SelectExample from "./SelectExample";

const FormInputPage = () => {
    return (
        <div>
            <PageMetaData title={"Input - Forms"} />
            <PageTitle title={"Input"} subMenu={"Forms"} />
            <div className="mt-6">
                <div className="grid gap-6 xl:grid-cols-2">
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Default</CardTitle>
                            <div className="mt-1 flex w-fit flex-col gap-3">
                                <Input placeholder="Type here" />
                                <Input placeholder="Type here" disabled />
                            </div>
                        </CardBody>
                    </Card>
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Form Control</CardTitle>
                            <div className="form-control mt-1 w-full max-w-xs">
                                <label className="label">
                                    <span className="label-text">What is your name?</span>
                                    <span className="label-text-alt">Mr.</span>
                                </label>
                                <Input placeholder="Type Here" />
                                <label className="label">
                                    <span className="label-text-alt">* Required</span>
                                    <span className="label-text-alt">0/20</span>
                                </label>
                            </div>
                        </CardBody>
                    </Card>
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Text Area</CardTitle>
                            <div className="mt-1 flex w-fit flex-col gap-3">
                                <Textarea placeholder="Bio" />
                                <Textarea placeholder="Bio" disabled size="sm" className="h-10" />
                            </div>
                        </CardBody>
                    </Card>
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Area Control</CardTitle>
                            <div className="form-control w-fit">
                                <label className="label">
                                    <span className="label-text">Your bio</span>
                                    <span className="label-text-alt">Alt label</span>
                                </label>
                                <Textarea placeholder="Bio" />
                                <label className="label">
                                    <span className="label-text-alt">Your bio</span>
                                    <span className="label-text-alt">0/150</span>
                                </label>
                            </div>
                        </CardBody>
                    </Card>
                    <SelectExample />
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Color</CardTitle>
                            <div className="mt-1 flex w-fit flex-col gap-3">
                                <Input placeholder="Type here" size="sm" color="primary" />
                                <Input placeholder="Type here" size="sm" color="secondary" />
                                <Input placeholder="Type here" size="sm" color="success" />
                                <Input placeholder="Type here" size="sm" color="warning" />
                                <Input placeholder="Type here" size="sm" color="info" />
                                <Input placeholder="Type here" size="sm" color="error" />
                            </div>
                        </CardBody>
                    </Card>
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Size</CardTitle>
                            <div className="mt-1 flex w-fit flex-col gap-3">
                                <Input placeholder="Type here" size="xs" />
                                <Input placeholder="Type here" size="sm" />
                                <Input placeholder="Type here" size="md" />
                                <Input placeholder="Type here" size="lg" />
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default FormInputPage;
