import alarmClockIcon from "@iconify/icons-lucide/alarm-clock";
import banIcon from "@iconify/icons-lucide/ban";

import { Button, Card, CardBody, CardTitle } from "@/components/daisyui";

import Icon from "@/components/Icon";
import PageMetaData from "@/components/PageMetaData";
import PageTitle from "@/components/PageTitle";

const ButtonPage = () => {
    return (
        <div>
            <PageMetaData title={"Buttons"} />

            <PageTitle title={"Buttons"} subMenu={"UI"} />
            <div className="mt-6">
                <div className="grid gap-6 xl:grid-cols-2">
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Default</CardTitle>
                            <div className="mt-1 flex flex-wrap gap-3">
                                <Button color="primary">Primary</Button>
                                <Button color="secondary">Secondary</Button>
                                <Button color="success">Success</Button>
                                <Button color="warning">Warning</Button>
                                <Button color="info">Info</Button>
                                <Button color="error">Error</Button>
                            </div>
                        </CardBody>
                    </Card>
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Outlined</CardTitle>
                            <div className="mt-1 flex flex-wrap gap-3">
                                <Button color="primary" variant="outline">
                                    Primary
                                </Button>
                                <Button color="secondary" variant="outline">
                                    Secondary
                                </Button>
                                <Button color="success" variant="outline">
                                    Success
                                </Button>
                                <Button color="warning" variant="outline">
                                    Warning
                                </Button>
                                <Button color="info" variant="outline">
                                    Info
                                </Button>
                                <Button color="error" variant="outline">
                                    Error
                                </Button>
                            </div>
                        </CardBody>
                    </Card>
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Rounded</CardTitle>
                            <div className="mt-1 flex flex-wrap items-center gap-3">
                                <Button color="primary" size="lg">
                                    Large
                                </Button>
                                <Button color="primary" size="md">
                                    Medium
                                </Button>

                                <Button color="primary" size="sm">
                                    Small
                                </Button>
                                <Button color="primary" size="xs">
                                    Very Small
                                </Button>
                            </div>
                        </CardBody>
                    </Card>
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Icon</CardTitle>
                            <div className="mt-1 flex flex-wrap items-center gap-3">
                                <Button color="primary" startIcon={<Icon icon={alarmClockIcon} fontSize={18} />}>
                                    Alarm
                                </Button>
                                <Button color="error" startIcon={<Icon icon={banIcon} fontSize={18} />}>
                                    Cancel
                                </Button>
                            </div>
                        </CardBody>
                    </Card>
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Loading</CardTitle>
                            <div className="mt-1 flex flex-wrap items-center gap-3">
                                <Button color="primary" loading>
                                    Loading
                                </Button>
                                <Button color="primary" loading disabled>
                                    Disabled
                                </Button>
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default ButtonPage;
