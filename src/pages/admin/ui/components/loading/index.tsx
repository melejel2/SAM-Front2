import { Card, CardBody, CardTitle, Loading } from "@/components/daisyui";

import PageMetaData from "@/components/PageMetaData";
import PageTitle from "@/components/PageTitle";

const LoadingPage = () => {
    return (
        <div>
            <PageMetaData title={"Loading"} />

            <PageTitle title={"Loading"} subMenu={"UI"} />
            <div className="mt-6">
                <div className="grid gap-6 xl:grid-cols-2">
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Default</CardTitle>
                            <div className="mt-1 flex ">
                                <Loading />
                            </div>
                        </CardBody>
                    </Card>
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Default</CardTitle>
                            <div className="mt-1 flex flex-wrap items-center gap-3">
                                <Loading />
                                <Loading color="primary" />
                                <Loading color="secondary" />
                                <Loading color="success" />
                                <Loading color="warning" />
                                <Loading color="error" />
                                <Loading color="info" />
                                <Loading color="accent" />
                                <Loading color="ghost" />
                            </div>
                        </CardBody>
                    </Card>
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Variant</CardTitle>
                            <div className="mt-1 flex flex-wrap items-center gap-3">
                                <Loading color={"primary"} />
                                <Loading variant="dots" color={"primary"} />
                                <Loading variant="ring" color={"primary"} />
                                <Loading variant="ball" color={"primary"} />
                                <Loading variant="bars" color={"primary"} />
                                <Loading variant="infinity" color={"primary"} />
                            </div>
                        </CardBody>
                    </Card>
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Size</CardTitle>
                            <div className="mt-1 flex flex-wrap items-center gap-3">
                                <Loading size="xs" />
                                <Loading size="sm" />
                                <Loading size="md" />
                                <Loading size="lg" />
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default LoadingPage;
