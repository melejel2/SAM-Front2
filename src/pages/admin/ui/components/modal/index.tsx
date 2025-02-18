import xIcon from "@iconify/icons-lucide/x";

import { useCallback, useRef } from "react";

import { Button, Card, CardBody, CardTitle, Modal, ModalActions, ModalBody, ModalHeader } from "@/components/daisyui";

import Icon from "@/components/Icon";
import PageMetaData from "@/components/PageMetaData";
import PageTitle from "@/components/PageTitle";

const ModalPage = () => {
    const ref1 = useRef<HTMLDialogElement>(null);
    const ref2 = useRef<HTMLDialogElement>(null);
    const ref3 = useRef<HTMLDialogElement>(null);
    const ref4 = useRef<HTMLDialogElement>(null);

    const handleShow1 = useCallback(() => {
        ref1.current?.showModal();
    }, [ref1]);

    const handleShow2 = useCallback(() => {
        ref2.current?.showModal();
    }, [ref2]);

    const handleShow3 = useCallback(() => {
        ref3.current?.showModal();
    }, [ref3]);
    const handleShow4 = useCallback(() => {
        ref4.current?.showModal();
    }, [ref4]);

    return (
        <div>
            <PageMetaData title={"Modal"} />

            <PageTitle title={"Modal"} subMenu={"UI"} />
            <div className="mt-6">
                <div className="grid gap-6 xl:grid-cols-2">
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Default</CardTitle>
                            <div className="mt-1">
                                <Button onClick={handleShow1}>Open Modal</Button>
                                <Modal ref={ref1}>
                                    <ModalHeader className="font-bold">Hello!</ModalHeader>
                                    <ModalBody>Press ESC key or click the button below to close</ModalBody>
                                    <ModalActions>
                                        <form method="dialog">
                                            <Button>Close</Button>
                                        </form>
                                    </ModalActions>
                                </Modal>
                            </div>
                        </CardBody>
                    </Card>

                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Close Button</CardTitle>
                            <div className="mt-1">
                                <Button onClick={handleShow2}>Open Modal</Button>
                                <Modal ref={ref2}>
                                    <form method="dialog">
                                        <Button
                                            size="sm"
                                            color="ghost"
                                            shape="circle"
                                            className="absolute right-2 top-2">
                                            <Icon icon={xIcon} className="h-4" />
                                        </Button>
                                    </form>
                                    <ModalHeader className="font-bold">Hello!</ModalHeader>
                                    <ModalBody>Press ESC key or click on X button to close</ModalBody>
                                </Modal>
                            </div>
                        </CardBody>
                    </Card>
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Click Outside</CardTitle>
                            <div className="mt-1">
                                <Button onClick={handleShow3}>Open Modal</Button>
                                <Modal ref={ref3} backdrop>
                                    <form method="dialog">
                                        <Button
                                            size="sm"
                                            color="ghost"
                                            shape="circle"
                                            className="absolute right-2 top-2">
                                            <Icon icon={xIcon} className="h-4" />
                                        </Button>
                                    </form>
                                    <ModalHeader className="font-bold">Hello!</ModalHeader>
                                    <ModalBody>Press ESC key or click on X button to close</ModalBody>
                                </Modal>
                            </div>
                        </CardBody>
                    </Card>
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Custom Width</CardTitle>
                            <div className="mt-1">
                                <Button onClick={handleShow4}>Open Modal</Button>
                                <Modal ref={ref4} className="w-11/12 max-w-5xl">
                                    <form method="dialog">
                                        <Button
                                            size="sm"
                                            color="ghost"
                                            shape="circle"
                                            className="absolute right-2 top-2">
                                            <Icon icon={xIcon} className="h-4" />
                                        </Button>
                                    </form>
                                    <ModalHeader className="font-bold">Hello!</ModalHeader>
                                    <ModalBody>Press ESC key or click on X button to close</ModalBody>
                                </Modal>
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default ModalPage;
