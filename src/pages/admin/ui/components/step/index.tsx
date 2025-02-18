import { Card, CardBody, CardTitle, Step, Steps } from "@/components/daisyui";

import PageMetaData from "@/components/PageMetaData";
import PageTitle from "@/components/PageTitle";

const StepPage = () => {
    return (
        <div>
            <PageMetaData title={"Step"} />

            <PageTitle title={"Step"} subMenu={"UI"} />
            <div className="mt-6">
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                    <Card className="overflow-auto bg-base-100">
                        <CardBody>
                            <CardTitle>Default</CardTitle>
                            <div className="mt-1 overflow-auto">
                                <Steps className="overflow-auto">
                                    <Step color="primary">Register</Step>
                                    <Step color="primary">Choose plan</Step>
                                    <Step>Purchase</Step>
                                    <Step>Receive Product</Step>
                                </Steps>
                            </div>
                        </CardBody>
                    </Card>
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Responsive</CardTitle>
                            <div className="mt-1">
                                <Steps className="lg:steps-horizontal" vertical>
                                    <Step color="primary">Register</Step>
                                    <Step color="primary">Choose plan</Step>
                                    <Step>Purchase</Step>
                                    <Step>Receive Product</Step>
                                </Steps>
                            </div>
                        </CardBody>
                    </Card>
                    <Card className="overflow-auto bg-base-100">
                        <CardBody>
                            <CardTitle>Contents</CardTitle>
                            <div className="mt-1">
                                <Steps>
                                    <Step value="?" color="neutral">
                                        Step 1
                                    </Step>
                                    <Step value="!" color="neutral">
                                        Step 2
                                    </Step>
                                    <Step value="✓" color="neutral">
                                        Step 3
                                    </Step>
                                    <Step value="✕" color="neutral">
                                        Step 4
                                    </Step>
                                    <Step value="!" color="neutral">
                                        Step 5
                                    </Step>
                                    <Step value="" color="neutral">
                                        Step 6
                                    </Step>
                                    <Step value="●" color="neutral">
                                        Step 7
                                    </Step>
                                </Steps>
                            </div>
                        </CardBody>
                    </Card>
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Color</CardTitle>
                            <div className="mt-1">
                                <Steps>
                                    <Step color="info">Fly to moon</Step>
                                    <Step color="info">Shrink the moon</Step>
                                    <Step color="info">Grab the moon</Step>
                                    <Step value="?" color="error">
                                        Sit on toilet
                                    </Step>
                                </Steps>
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default StepPage;
