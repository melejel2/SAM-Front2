import { Button, Card, CardBody, CardTitle, Pagination } from "@/components/daisyui";

import PageMetaData from "@/components/PageMetaData";
import PageTitle from "@/components/PageTitle";

const PaginationPage = () => {
    return (
        <div>
            <PageMetaData title={"Pagination"} />

            <PageTitle title={"Pagination"} subMenu={"UI"} />
            <div className="mt-6">
                <div className="grid gap-6 xl:grid-cols-2">
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Default</CardTitle>
                            <div className="mt-1">
                                <Pagination>
                                    <Button className="join-item">1</Button>
                                    <Button className="join-item" active>
                                        2
                                    </Button>
                                    <Button className="join-item">3</Button>
                                    <Button className="join-item">4</Button>
                                </Pagination>
                            </div>
                        </CardBody>
                    </Card>
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Disabled</CardTitle>
                            <div className="mt-1">
                                <Pagination>
                                    <Button className="join-item">1</Button>
                                    <Button className="join-item">2</Button>
                                    <Button className="join-item" disabled>
                                        ...
                                    </Button>
                                    <Button className="join-item">99</Button>
                                    <Button className="join-item">100</Button>
                                </Pagination>
                            </div>
                        </CardBody>
                    </Card>
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Control</CardTitle>
                            <div className="mt-1">
                                <Pagination>
                                    <Button className="join-item">«</Button>
                                    <Button className="join-item">1</Button>
                                    <Button className="join-item" active>
                                        2
                                    </Button>
                                    <Button className="join-item">3</Button>
                                    <Button className="join-item">4</Button>
                                    <Button className="join-item">»</Button>
                                </Pagination>
                            </div>
                        </CardBody>
                    </Card>
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Control</CardTitle>
                            <div className="mt-1">
                                <Pagination>
                                    <Button className="join-item">Previous</Button>
                                    <Button className="join-item">1</Button>
                                    <Button className="join-item" active>
                                        2
                                    </Button>
                                    <Button className="join-item">3</Button>
                                    <Button className="join-item">Next</Button>
                                </Pagination>
                            </div>
                        </CardBody>
                    </Card>
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Sizes</CardTitle>
                            <div className="mt-1 flex flex-col items-center gap-3">
                                {(["xs", "sm", "md", "lg"] as ("lg" | "md" | "sm" | "xs")[]).map((size, index) => (
                                    <Pagination key={index}>
                                        <Button size={size} className="join-item">
                                            1
                                        </Button>
                                        <Button size={size} className="join-item" active>
                                            2
                                        </Button>
                                        <Button size={size} className="join-item">
                                            3
                                        </Button>
                                        <Button size={size} className="join-item">
                                            4
                                        </Button>
                                    </Pagination>
                                ))}
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default PaginationPage;
