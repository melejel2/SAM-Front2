import barChart3Icon from "@iconify/icons-lucide/bar-chart-3";
import boxIcon from "@iconify/icons-lucide/box";
import homeIcon from "@iconify/icons-lucide/home";
import layers2Icon from "@iconify/icons-lucide/layers-2";

import {
    Breadcrumbs,
    BreadcrumbsItem,
    Card,
    CardBody,
    CardTitle,
    Dropdown,
    DropdownItem,
    DropdownMenu,
    DropdownToggle,
} from "@/components/daisyui";

import Icon from "@/components/Icon";
import PageMetaData from "@/components/PageMetaData";
import PageTitle from "@/components/PageTitle";

const BreadcrumbPage = () => {
    return (
        <div>
            <PageMetaData title={"Breadcrumb"} />

            <PageTitle title={"Breadcrumb"} subMenu={"UI"} />
            <div className="mt-6">
                <div className="grid gap-6 xl:grid-cols-2">
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Default</CardTitle>
                            <div className="mt-1 space-y-1">
                                <Breadcrumbs>
                                    <BreadcrumbsItem href="/">Home</BreadcrumbsItem>
                                    <BreadcrumbsItem href="/">Documents</BreadcrumbsItem>
                                    <BreadcrumbsItem href="/">Add Document</BreadcrumbsItem>
                                </Breadcrumbs>
                            </div>
                        </CardBody>
                    </Card>
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>With Icons</CardTitle>
                            <div className="mt-1 space-y-1">
                                <Breadcrumbs>
                                    <BreadcrumbsItem href="/">
                                        <Icon icon={homeIcon} className="me-2 size-3.5" />
                                        Home
                                    </BreadcrumbsItem>
                                    <BreadcrumbsItem href="/">
                                        <Icon icon={homeIcon} className="me-2 size-3.5" />
                                        UI
                                    </BreadcrumbsItem>
                                    <BreadcrumbsItem href="/">
                                        <Icon icon={barChart3Icon} className="me-2 size-3.5" />
                                        Charts
                                    </BreadcrumbsItem>
                                </Breadcrumbs>
                            </div>
                        </CardBody>
                    </Card>
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>With Dropdown</CardTitle>
                            <div className="mt-1 space-y-1">
                                <Breadcrumbs className="overflow-x-visible">
                                    <BreadcrumbsItem href="/">
                                        <Icon icon={homeIcon} className="me-2 size-3.5" />
                                        Home
                                    </BreadcrumbsItem>
                                    <BreadcrumbsItem>
                                        <Dropdown>
                                            <DropdownToggle button={false} className="flex items-center">
                                                <div className="cursor-pointer rounded bg-base-200 px-3 py-0 transition-all hover:bg-base-300">
                                                    •••
                                                </div>
                                            </DropdownToggle>
                                            <DropdownMenu className="w-52">
                                                <DropdownItem>
                                                    <Icon icon={boxIcon} className="size-4" />
                                                    Element
                                                </DropdownItem>

                                                <DropdownItem>
                                                    <Icon icon={layers2Icon} className="size-4" />
                                                    Components
                                                </DropdownItem>
                                            </DropdownMenu>
                                        </Dropdown>
                                    </BreadcrumbsItem>
                                    <BreadcrumbsItem href="/">
                                        <Icon icon={barChart3Icon} className="me-2 size-3.5" />
                                        Charts
                                    </BreadcrumbsItem>
                                </Breadcrumbs>
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default BreadcrumbPage;
