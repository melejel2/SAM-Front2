import { Accordion, AccordionContent, AccordionTitle, Card, CardBody, CardTitle, Join } from "@/components/daisyui";

import PageMetaData from "@/components/PageMetaData";
import PageTitle from "@/components/PageTitle";

const AccordionPage = () => {
    return (
        <div>
            <PageMetaData title={"Accordion"} />

            <PageTitle title={"Accordions"} subMenu={"UI"} />
            <div className="mt-6">
                <div className="grid gap-6 xl:grid-cols-2">
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Default</CardTitle>
                            <div className="mt-1 space-y-1">
                                <Accordion defaultChecked className="bg-base-200">
                                    <AccordionTitle className="text-xl font-medium">Accordion #1</AccordionTitle>
                                    <AccordionContent>
                                        <p>Here are some hidden content, which is now public</p>
                                    </AccordionContent>
                                </Accordion>
                                <Accordion className="bg-base-200">
                                    <AccordionTitle className="text-xl font-medium">Accordion #2</AccordionTitle>
                                    <AccordionContent>
                                        <p>Here are some hidden content, which is now public</p>
                                    </AccordionContent>
                                </Accordion>
                                <Accordion className="bg-base-200">
                                    <AccordionTitle className="text-xl font-medium">Accordion #3</AccordionTitle>
                                    <AccordionContent>
                                        <p>Here are some hidden content, which is now public</p>
                                    </AccordionContent>
                                </Accordion>
                            </div>
                        </CardBody>
                    </Card>
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Arrow</CardTitle>
                            <div className="mt-1  space-y-1">
                                <Accordion className="bg-base-200" icon="arrow">
                                    <AccordionTitle className="text-xl font-medium">Accordion #1</AccordionTitle>
                                    <AccordionContent>
                                        <p>Here are some hidden content, which is now public</p>
                                    </AccordionContent>
                                </Accordion>
                                <Accordion className="bg-base-200" icon="arrow">
                                    <AccordionTitle className="text-xl font-medium">Accordion #2</AccordionTitle>
                                    <AccordionContent>
                                        <p>Here are some hidden content, which is now public</p>
                                    </AccordionContent>
                                </Accordion>
                                <Accordion className="bg-base-200" icon="arrow">
                                    <AccordionTitle className="text-xl font-medium">Accordion #3</AccordionTitle>
                                    <AccordionContent>
                                        <p>Here are some hidden content, which is now public</p>
                                    </AccordionContent>
                                </Accordion>
                            </div>
                        </CardBody>
                    </Card>
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Plus/Minus</CardTitle>
                            <div className="mt-1  space-y-1">
                                <Accordion className="bg-base-200" icon="plus">
                                    <AccordionTitle className="text-xl font-medium">Accordion #1</AccordionTitle>
                                    <AccordionContent>
                                        <p>Here are some hidden content, which is now public</p>
                                    </AccordionContent>
                                </Accordion>
                                <Accordion className="bg-base-200" icon="plus">
                                    <AccordionTitle className="text-xl font-medium">Accordion #2</AccordionTitle>
                                    <AccordionContent>
                                        <p>Here are some hidden content, which is now public</p>
                                    </AccordionContent>
                                </Accordion>
                                <Accordion className="bg-base-200" icon="plus">
                                    <AccordionTitle className="text-xl font-medium">Accordion #3</AccordionTitle>
                                    <AccordionContent>
                                        <p>Here are some hidden content, which is now public</p>
                                    </AccordionContent>
                                </Accordion>
                            </div>
                        </CardBody>
                    </Card>

                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Joined</CardTitle>
                            <Join className="mt-1" vertical>
                                <Accordion className="join-item border border-base-300" icon="plus">
                                    <AccordionTitle className="text-xl font-medium">Accordion #1</AccordionTitle>
                                    <AccordionContent>
                                        <p>Here are some hidden content, which is now public</p>
                                    </AccordionContent>
                                </Accordion>
                                <Accordion className="join-item border border-base-300" icon="plus">
                                    <AccordionTitle className="text-xl font-medium">Accordion #2</AccordionTitle>
                                    <AccordionContent>
                                        <p>Here are some hidden content, which is now public</p>
                                    </AccordionContent>
                                </Accordion>
                                <Accordion className="join-item border border-base-300" icon="plus">
                                    <AccordionTitle className="text-xl font-medium">Accordion #3</AccordionTitle>
                                    <AccordionContent>
                                        <p>Here are some hidden content, which is now public</p>
                                    </AccordionContent>
                                </Accordion>
                            </Join>
                        </CardBody>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default AccordionPage;
