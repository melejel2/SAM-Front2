import { useState } from "react";

import { Button, Card, CardBody, CardTitle, Drawer, Menu, MenuItem } from "@/components/daisyui";

import PageMetaData from "@/components/PageMetaData";
import PageTitle from "@/components/PageTitle";

const DrawerPage = () => {
    const [visible, setVisible] = useState<number | null>(null);
    const toggleVisible = (index: number) => setVisible(visible == index ? null : index);
    return (
        <div>
            <PageMetaData title={"Drawer"} />

            <PageTitle title={"Drawer"} subMenu={"UI"} />
            <div className="mt-6">
                <div className="grid gap-6 xl:grid-cols-2">
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Default</CardTitle>
                            <div className="mt-1 flex flex-wrap gap-3">
                                <Drawer
                                    open={visible == 0}
                                    onClickOverlay={() => toggleVisible(0)}
                                    sideClassName="z-[50]"
                                    side={
                                        <Menu className="h-full w-80 bg-base-200 p-4 text-base-content">
                                            <MenuItem>
                                                <a>Sidebar Item 1</a>
                                            </MenuItem>
                                            <MenuItem>
                                                <a>Sidebar Item 2</a>
                                            </MenuItem>
                                        </Menu>
                                    }>
                                    <Button color="primary" onClick={() => toggleVisible(0)}>
                                        Open drawer
                                    </Button>
                                </Drawer>
                            </div>
                        </CardBody>
                    </Card>

                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Position</CardTitle>
                            <div className="mt-1 flex flex-wrap gap-3">
                                <Drawer
                                    open={visible == 1}
                                    onClickOverlay={() => toggleVisible(1)}
                                    sideClassName="z-[50]"
                                    end
                                    side={
                                        <Menu className="h-full w-80 bg-base-200 p-4 text-base-content">
                                            <MenuItem>
                                                <a>Sidebar Item 1</a>
                                            </MenuItem>
                                            <MenuItem>
                                                <a>Sidebar Item 2</a>
                                            </MenuItem>
                                        </Menu>
                                    }>
                                    <Button color="primary" onClick={() => toggleVisible(1)}>
                                        Right Drawer
                                    </Button>
                                </Drawer>
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default DrawerPage;
