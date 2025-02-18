import avatar1 from "@/assets/images/avatars/1.png";
import avatar2 from "@/assets/images/avatars/2.png";
import avatar3 from "@/assets/images/avatars/3.png";
import avatar4 from "@/assets/images/avatars/4.png";
import avatar5 from "@/assets/images/avatars/5.png";
import avatar6 from "@/assets/images/avatars/6.png";
import avatar7 from "@/assets/images/avatars/7.png";

import { Avatar, AvatarGroup, Card, CardBody, CardTitle, Mask } from "@/components/daisyui";

import PageMetaData from "@/components/PageMetaData";
import PageTitle from "@/components/PageTitle";
import { cn } from "@/helpers/utils/cn";

const AvatarPage = () => {
    return (
        <div>
            <PageMetaData title={"Avatar"} />

            <PageTitle title={"Avatar"} subMenu={"UI"} />
            <div className="mt-6">
                <div className="grid gap-6 xl:grid-cols-2">
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Default</CardTitle>
                            <div className="mt-1 space-y-1">
                                <Avatar alt="Avatar" src={avatar1} innerClassName={"rounded bg-base-content/10"} />
                            </div>
                        </CardBody>
                    </Card>
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Rounded</CardTitle>
                            <div className="mt-1 flex flex-wrap items-center gap-3 space-y-1">
                                <Avatar
                                    alt="Avatar"
                                    src={avatar1}
                                    size="md"
                                    innerClassName={"rounded-xl bg-base-content/10"}
                                />
                                <Avatar
                                    alt="Avatar"
                                    src={avatar2}
                                    size="md"
                                    innerClassName="bg-base-content/10"
                                    shape="circle"
                                />
                            </div>
                        </CardBody>
                    </Card>
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Sizes</CardTitle>
                            <div className="mt-1 flex flex-wrap items-center gap-3 space-y-1">
                                <Avatar
                                    alt="Avatar"
                                    src={avatar4}
                                    size="lg"
                                    innerClassName={"rounded bg-base-content/10"}
                                />
                                <Avatar
                                    alt="Avatar"
                                    src={avatar3}
                                    size="md"
                                    innerClassName={"rounded bg-base-content/10"}
                                />
                                <Avatar
                                    alt="Avatar"
                                    src={avatar2}
                                    size="sm"
                                    innerClassName={"rounded bg-base-content/10"}
                                />
                                <Avatar
                                    alt="Avatar"
                                    src={avatar1}
                                    size="xs"
                                    innerClassName={"rounded bg-base-content/10"}
                                />
                            </div>
                        </CardBody>
                    </Card>

                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Mask</CardTitle>
                            <div className="mt-1 flex flex-wrap items-center gap-3 space-y-1">
                                <Avatar
                                    alt="Avatar"
                                    src={avatar1}
                                    size="md"
                                    innerClassName={cn(
                                        "bg-base-content/10",
                                        Mask.className({
                                            variant: "squircle",
                                        }),
                                    )}
                                />
                                <Avatar
                                    alt="Avatar"
                                    src={avatar2}
                                    size="md"
                                    innerClassName={cn(
                                        "bg-base-content/10",
                                        Mask.className({
                                            variant: "hexagon-2",
                                        }),
                                    )}
                                />
                                <Avatar
                                    alt="Avatar"
                                    src={avatar3}
                                    size="md"
                                    innerClassName={cn(
                                        "bg-base-content/10",
                                        Mask.className({
                                            variant: "pentagon",
                                        }),
                                    )}
                                />
                            </div>
                        </CardBody>
                    </Card>
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Group</CardTitle>
                            <div className="mt-1 flex flex-wrap items-center gap-3 space-y-1">
                                <AvatarGroup>
                                    <Avatar
                                        alt="Avatar"
                                        src={avatar1}
                                        size="sm"
                                        shape="circle"
                                        innerClassName="bg-base-content/10"
                                    />
                                    <Avatar
                                        alt="Avatar"
                                        src={avatar2}
                                        size="sm"
                                        shape="circle"
                                        innerClassName="bg-base-content/10"
                                    />
                                    <Avatar
                                        alt="Avatar"
                                        src={avatar3}
                                        size="sm"
                                        shape="circle"
                                        innerClassName="bg-base-content/10"
                                    />
                                    <Avatar
                                        alt="Avatar"
                                        src={avatar4}
                                        size="sm"
                                        shape="circle"
                                        innerClassName="bg-base-content/10"
                                    />
                                </AvatarGroup>
                            </div>
                        </CardBody>
                    </Card>
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Counter</CardTitle>
                            <div className="mt-1 flex flex-wrap items-center gap-3 space-y-1">
                                <AvatarGroup>
                                    <Avatar
                                        alt="Avatar"
                                        src={avatar1}
                                        size="sm"
                                        shape="circle"
                                        innerClassName="bg-base-content/10"
                                    />
                                    <Avatar
                                        alt="Avatar"
                                        src={avatar2}
                                        size="sm"
                                        shape="circle"
                                        innerClassName="bg-base-content/10"
                                    />
                                    <Avatar
                                        alt="Avatar"
                                        src={avatar3}
                                        size="sm"
                                        shape="circle"
                                        innerClassName="bg-base-content/10"
                                    />
                                    <Avatar
                                        letters={"+99"}
                                        size={"sm"}
                                        innerClassName="bg-base-200  text-primary font-medium"
                                    />
                                </AvatarGroup>
                            </div>
                        </CardBody>
                    </Card>
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Ring</CardTitle>
                            <div className="mt-1 flex flex-wrap items-center gap-5 space-y-1">
                                <Avatar
                                    src={avatar1}
                                    size="sm"
                                    alt="Avatar"
                                    shape="circle"
                                    innerClassName="bg-base-content/10"
                                    borderColor={"primary"}
                                    border
                                />
                                <Avatar
                                    src={avatar2}
                                    size="sm"
                                    alt="Avatar"
                                    shape="circle"
                                    innerClassName="bg-base-content/10"
                                    borderColor={"secondary"}
                                    border
                                />
                                <Avatar
                                    src={avatar3}
                                    size="sm"
                                    alt="Avatar"
                                    shape="circle"
                                    innerClassName="bg-base-content/10"
                                    borderColor={"success"}
                                    border
                                />
                                <Avatar
                                    src={avatar4}
                                    size="sm"
                                    shape="circle"
                                    alt="Avatar"
                                    innerClassName="bg-base-content/10"
                                    borderColor={"warning"}
                                    border
                                />
                                <Avatar
                                    src={avatar5}
                                    size="sm"
                                    shape="circle"
                                    alt="Avatar"
                                    innerClassName="bg-base-content/10"
                                    borderColor={"info"}
                                    border
                                />
                                <Avatar
                                    src={avatar6}
                                    size="sm"
                                    shape="circle"
                                    alt="Avatar"
                                    innerClassName="bg-base-content/10"
                                    borderColor={"error"}
                                    border
                                />
                                <Avatar
                                    src={avatar7}
                                    size="sm"
                                    alt="Avatar"
                                    shape="circle"
                                    innerClassName="bg-base-content/10"
                                    borderColor={"neutral"}
                                    border
                                />
                            </div>
                        </CardBody>
                    </Card>
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Presence</CardTitle>
                            <div className="mt-1 flex flex-wrap items-center gap-5 space-y-1">
                                <Avatar
                                    alt="Avatar"
                                    src={avatar1}
                                    size="sm"
                                    shape="circle"
                                    innerClassName="bg-base-content/10"
                                    online
                                />
                                <Avatar
                                    src={avatar2}
                                    size="sm"
                                    alt="Avatar"
                                    shape="circle"
                                    innerClassName="bg-base-content/10"
                                    offline
                                />
                            </div>
                        </CardBody>
                    </Card>
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Placeholder</CardTitle>
                            <div className="mt-1 flex flex-wrap items-center gap-5 space-y-1">
                                <Avatar
                                    borderColor="primary"
                                    color="primary"
                                    shape={"circle"}
                                    border
                                    size={"sm"}
                                    letters={"D"}
                                />
                                <Avatar
                                    borderColor="secondary"
                                    color="secondary"
                                    shape={"circle"}
                                    border
                                    size={"sm"}
                                    letters={"A"}
                                />
                                <Avatar
                                    borderColor="success"
                                    color="success"
                                    shape={"circle"}
                                    border
                                    size={"sm"}
                                    letters={"I"}
                                />
                                <Avatar
                                    alt="Avatar"
                                    borderColor="info"
                                    color="info"
                                    shape={"circle"}
                                    size={"sm"}
                                    border
                                    letters={"S"}
                                />
                                <Avatar
                                    borderColor="warning"
                                    color="warning"
                                    shape={"circle"}
                                    size={"sm"}
                                    border
                                    letters={"Y"}
                                />
                                <Avatar
                                    alt="Avatar"
                                    borderColor="error"
                                    color="error"
                                    shape={"circle"}
                                    size={"sm"}
                                    border
                                    letters={"U"}
                                />
                                <Avatar
                                    borderColor="neutral"
                                    color="neutral"
                                    shape={"circle"}
                                    size={"sm"}
                                    border
                                    letters={"I"}
                                />
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default AvatarPage;
