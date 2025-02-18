import { Badge, Button, Card, CardBody, CardTitle } from "@/components/daisyui";

import PageMetaData from "@/components/PageMetaData";
import PageTitle from "@/components/PageTitle";

const BadgePage = () => {
    return (
        <div>
            <PageMetaData title={"Badge"} />

            <PageTitle title={"Badge"} subMenu={"UI"} />
            <div className="mt-6">
                <div className="grid gap-6 xl:grid-cols-2">
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Default</CardTitle>
                            <div className="mt-1 space-y-1">
                                <Badge>Badge</Badge>
                            </div>
                        </CardBody>
                    </Card>
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Colors</CardTitle>
                            <div className="mt-1 flex flex-wrap gap-2">
                                <Badge>Default</Badge>
                                <Badge color="primary">Primary</Badge>
                                <Badge color="secondary">Secondary</Badge>
                                <Badge color="success">Success</Badge>
                                <Badge color="warning">Warning</Badge>
                                <Badge color="info">Info</Badge>
                                <Badge color="error">Error</Badge>
                                <Badge color="neutral">Neutral</Badge>
                                <Badge color="ghost">Ghost</Badge>
                            </div>
                        </CardBody>
                    </Card>
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Outline</CardTitle>
                            <div className="mt-1 flex flex-wrap gap-2">
                                <Badge outline color="primary">
                                    Primary
                                </Badge>
                                <Badge outline color="secondary">
                                    Secondary
                                </Badge>
                                <Badge outline color="success">
                                    Success
                                </Badge>
                                <Badge outline color="warning">
                                    Warning
                                </Badge>
                                <Badge outline color="info">
                                    Info
                                </Badge>
                                <Badge outline color="error">
                                    Error
                                </Badge>
                            </div>
                        </CardBody>
                    </Card>
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Sizes</CardTitle>
                            <div className="mt-1 flex flex-wrap items-end gap-2">
                                <Badge outline size="lg">
                                    Large
                                </Badge>

                                <Badge outline size="md">
                                    Medium
                                </Badge>

                                <Badge outline size="sm">
                                    Small
                                </Badge>

                                <Badge outline size="xs">
                                    Tiny
                                </Badge>
                            </div>
                        </CardBody>
                    </Card>
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Empty</CardTitle>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                                <Badge color="primary" size="lg"></Badge>

                                <Badge color="primary" size="md"></Badge>

                                <Badge color="primary" size="sm"></Badge>

                                <Badge color="primary" size="xs"></Badge>
                            </div>
                        </CardBody>
                    </Card>
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Use case</CardTitle>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                                <Button>
                                    Inbox
                                    <Badge>+99</Badge>
                                </Button>
                                <Button>
                                    Inbox
                                    <Badge color="secondary">+99</Badge>
                                </Button>
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default BadgePage;
