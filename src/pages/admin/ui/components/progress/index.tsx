import { Card, CardBody, CardTitle, Progress, RadialProgress } from "@/components/daisyui";

import PageMetaData from "@/components/PageMetaData";
import PageTitle from "@/components/PageTitle";

const ProgressPage = () => {
    return (
        <div>
            <PageMetaData title={"Progress"} />

            <PageTitle title={"Progress"} subMenu={"UI"} />
            <div className="mt-6">
                <div className="mt-6 grid gap-6 lg:grid-cols-2">
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Default</CardTitle>
                            <div className="mt-1 flex flex-col gap-y-2">
                                <Progress max={100} className="w-56" value={0} />
                                <Progress max={100} className="w-56" value={30} />
                                <Progress max={100} className="w-56" value={40} />
                                <Progress max={100} className="w-56" value={75} />
                                <Progress max={100} className="w-56" value={100} />
                                <Progress max={100} className="w-56" color="primary" />
                            </div>
                        </CardBody>
                    </Card>
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Colors</CardTitle>
                            <div className="mt-1 flex flex-col gap-y-2">
                                <Progress max={100} className="w-56" value={20} color={"primary"} />
                                <Progress max={100} className="w-56" value={30} color={"secondary"} />
                                <Progress max={100} className="w-56" value={40} color={"success"} />
                                <Progress max={100} className="w-56" value={60} color={"warning"} />
                                <Progress max={100} className="w-56" value={75} color={"info"} />
                                <Progress max={100} className="w-56" value={90} color={"error"} />
                            </div>
                        </CardBody>
                    </Card>
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Radial</CardTitle>
                            <div className="mt-1 flex flex-wrap gap-4">
                                <RadialProgress value={72}>72%</RadialProgress>
                                <RadialProgress
                                    value={72}
                                    className="border-4 border-primary bg-primary text-primary-content">
                                    72%
                                </RadialProgress>
                            </div>
                        </CardBody>
                    </Card>
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Radial Color</CardTitle>
                            <div className="mt-1 flex flex-wrap gap-4">
                                <RadialProgress value={72} color="primary">
                                    72%
                                </RadialProgress>
                                <RadialProgress value={72} color="secondary">
                                    65%
                                </RadialProgress>
                                <RadialProgress value={72} color="success">
                                    85%
                                </RadialProgress>
                                <RadialProgress value={72} color="info">
                                    57%
                                </RadialProgress>
                                <RadialProgress value={72} color="warning">
                                    20%
                                </RadialProgress>
                                <RadialProgress value={72} color="error">
                                    40%
                                </RadialProgress>
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default ProgressPage;
