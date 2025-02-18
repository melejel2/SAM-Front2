import { Card, CardBody, CardTitle, RadioTab, Tab, Tabs } from "@/components/daisyui";

import PageMetaData from "@/components/PageMetaData";
import PageTitle from "@/components/PageTitle";

const TabPage = () => {
    return (
        <div>
            <PageMetaData title={"Tab"} />

            <PageTitle title={"Tab"} subMenu={"UI"} />
            <div className="mt-6">
                <div className="grid gap-6 xl:grid-cols-2">
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Default</CardTitle>
                            <div className="mt-1 flex ">
                                <Tabs variant="bordered">
                                    <Tab>Tab 1</Tab>
                                    <Tab active={true}>Tab 2</Tab>
                                    <Tab>Tab 3</Tab>
                                </Tabs>
                            </div>
                        </CardBody>
                    </Card>
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Boxed</CardTitle>
                            <div className="mt-1 flex ">
                                <Tabs variant="boxed">
                                    <Tab>Tab 1</Tab>
                                    <Tab active={true}>Tab 2</Tab>
                                    <Tab>Tab 3</Tab>
                                </Tabs>
                            </div>
                        </CardBody>
                    </Card>
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Lifted</CardTitle>
                            <div className="mt-1 flex ">
                                <Tabs variant="lifted">
                                    <Tab>Tab 1</Tab>
                                    <Tab active={true}>Tab 2</Tab>
                                    <Tab>Tab 3</Tab>
                                </Tabs>
                            </div>
                        </CardBody>
                    </Card>
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Radio</CardTitle>
                            <div className="mt-1 flex ">
                                <Tabs variant="bordered">
                                    <RadioTab name="my_tabs_1" label="Tab 1" contentClassName="pt-4">
                                        Tab content 1
                                    </RadioTab>
                                    <RadioTab
                                        name="my_tabs_1"
                                        label="Tab 2"
                                        contentClassName="pt-4"
                                        defaultChecked={true}>
                                        Tab content 2
                                    </RadioTab>
                                    <RadioTab name="my_tabs_1" label="Tab 3" contentClassName="pt-4">
                                        Tab content 3
                                    </RadioTab>
                                </Tabs>
                            </div>
                        </CardBody>
                    </Card>
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Sizes</CardTitle>
                            <div className="mt-1 flex flex-col items-center gap-6">
                                <Tabs size="xs" variant="boxed">
                                    <Tab>Tiny</Tab>
                                    <Tab active={true}>Tiny</Tab>
                                    <Tab>Tiny</Tab>
                                </Tabs>

                                <Tabs size="sm" variant="boxed">
                                    <Tab>Small</Tab>
                                    <Tab active={true}>Small</Tab>
                                    <Tab>Small</Tab>
                                </Tabs>

                                <Tabs size="md" variant="boxed">
                                    <Tab>Normal</Tab>
                                    <Tab active={true}>Normal</Tab>
                                    <Tab>Normal</Tab>
                                </Tabs>

                                <Tabs size="lg" variant="boxed">
                                    <Tab>Large</Tab>
                                    <Tab active={true}>Large</Tab>
                                    <Tab>Large</Tab>
                                </Tabs>
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default TabPage;
