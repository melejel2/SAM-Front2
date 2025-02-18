import barChart3Icon from "@iconify/icons-lucide/bar-chart-3";
import homeIcon from "@iconify/icons-lucide/home";
import infoIcon from "@iconify/icons-lucide/info";

import { Card, CardBody, CardTitle, Menu, MenuDetails, MenuItem, MenuTitle } from "@/components/daisyui";

import Icon from "@/components/Icon";
import PageMetaData from "@/components/PageMetaData";
import PageTitle from "@/components/PageTitle";

const MenuPage = () => {
    return (
        <div>
            <PageMetaData title={"Menu"} />

            <PageTitle title={"Menu"} subMenu={"UI"} />
            <div className="mt-6">
                <div className="grid gap-6 xl:grid-cols-2">
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Default</CardTitle>
                            <div className="mt-1">
                                <Menu className="w-48 rounded bg-base-200">
                                    <MenuItem>
                                        <a>Item 1</a>
                                    </MenuItem>
                                    <MenuItem>
                                        <a>Item 2</a>
                                    </MenuItem>
                                    <MenuItem disabled>
                                        <a>Item 3</a>
                                    </MenuItem>
                                </Menu>
                            </div>
                        </CardBody>
                    </Card>

                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Icons</CardTitle>
                            <div className="mt-1">
                                <Menu className="w-fit rounded bg-base-200">
                                    <MenuItem>
                                        <a>
                                            <Icon icon={homeIcon} className="size-5" />
                                        </a>
                                    </MenuItem>
                                    <MenuItem>
                                        <a>
                                            <Icon icon={infoIcon} className="size-5" />
                                        </a>
                                    </MenuItem>
                                    <MenuItem disabled>
                                        <a>
                                            <Icon icon={barChart3Icon} className="size-5" />
                                        </a>
                                    </MenuItem>
                                </Menu>
                            </div>
                        </CardBody>
                    </Card>

                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Horizontal</CardTitle>
                            <div className="mt-1">
                                <Menu className="rounded bg-base-200" horizontal>
                                    <MenuItem>
                                        <a>Item 1</a>
                                    </MenuItem>
                                    <MenuItem>
                                        <a>Item 2</a>
                                    </MenuItem>
                                    <MenuItem>
                                        <a>Item 3</a>
                                    </MenuItem>
                                </Menu>
                            </div>
                        </CardBody>
                    </Card>

                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Horizontal Icons</CardTitle>
                            <div className="mt-1">
                                <Menu className="w-fit rounded bg-base-200" horizontal>
                                    <MenuItem>
                                        <a>
                                            <Icon icon={homeIcon} className="size-5" />
                                        </a>
                                    </MenuItem>
                                    <MenuItem>
                                        <a>
                                            <Icon icon={infoIcon} className="size-5" />
                                        </a>
                                    </MenuItem>
                                    <MenuItem disabled>
                                        <a>
                                            <Icon icon={barChart3Icon} className="size-5" />
                                        </a>
                                    </MenuItem>
                                </Menu>
                            </div>
                        </CardBody>
                    </Card>

                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Icons & Label</CardTitle>
                            <div className="mt-1">
                                <Menu className="w-48 rounded bg-base-200">
                                    <MenuItem>
                                        <a>
                                            <Icon icon={homeIcon} className="size-5" />
                                        </a>
                                    </MenuItem>
                                    <MenuItem>
                                        <a>
                                            <Icon icon={infoIcon} className="size-5" />
                                        </a>
                                    </MenuItem>
                                    <MenuItem disabled>
                                        <a>
                                            <Icon icon={barChart3Icon} className="size-5" />
                                        </a>
                                    </MenuItem>
                                </Menu>
                            </div>
                        </CardBody>
                    </Card>
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Title</CardTitle>
                            <div className="mt-1">
                                <Menu className="w-48 rounded bg-base-200">
                                    <MenuTitle>Title</MenuTitle>

                                    <MenuItem>
                                        <a>Item 1</a>
                                    </MenuItem>
                                    <MenuItem>
                                        <a>Item 2</a>
                                    </MenuItem>
                                    <MenuItem disabled>
                                        <a>Item 3</a>
                                    </MenuItem>
                                </Menu>
                            </div>
                        </CardBody>
                    </Card>
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>SubMenu</CardTitle>
                            <div className="mt-1">
                                <Menu className="w-56 rounded bg-base-200">
                                    <MenuItem>
                                        <a>Item 1</a>
                                    </MenuItem>
                                    <MenuItem>
                                        <MenuDetails open={true} label={"Level 2"}>
                                            <MenuItem>
                                                <a>Level 2 item 1</a>
                                            </MenuItem>
                                            <MenuItem>
                                                <a>Level 2 item 2</a>
                                            </MenuItem>
                                            <MenuItem>
                                                <MenuDetails open={true} label={"Level 3"}>
                                                    <MenuItem>
                                                        <a>Level 3 item 1</a>
                                                    </MenuItem>
                                                    <MenuItem>
                                                        <a>Level 3 item 2</a>
                                                    </MenuItem>
                                                </MenuDetails>
                                            </MenuItem>
                                        </MenuDetails>
                                    </MenuItem>
                                    <MenuItem>
                                        <a>Item 3</a>
                                    </MenuItem>
                                </Menu>
                            </div>
                        </CardBody>
                    </Card>
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>SubMenu</CardTitle>
                            <div className="mt-1">
                                <Menu className="rounded bg-base-200" horizontal>
                                    <MenuItem>
                                        <a>Item 1</a>
                                    </MenuItem>
                                    <MenuItem>
                                        <MenuDetails open={true} label={"Level 2"}>
                                            <MenuItem>
                                                <a>Level 2 item 1</a>
                                            </MenuItem>
                                            <MenuItem>
                                                <a>Level 2 item 2</a>
                                            </MenuItem>
                                            <MenuItem>
                                                <MenuDetails open={true} label={"Level 3"} className="w-48">
                                                    <MenuItem>
                                                        <a>Level 3 item 1</a>
                                                    </MenuItem>
                                                    <MenuItem>
                                                        <a>Level 3 item 2</a>
                                                    </MenuItem>
                                                </MenuDetails>
                                            </MenuItem>
                                        </MenuDetails>
                                    </MenuItem>
                                    <MenuItem>
                                        <a>Item 3</a>
                                    </MenuItem>
                                </Menu>
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default MenuPage;
