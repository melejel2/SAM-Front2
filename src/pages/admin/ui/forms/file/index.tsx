import { Card, CardBody, CardTitle, FileInput } from "@/components/daisyui";

import PageMetaData from "@/components/PageMetaData";
import PageTitle from "@/components/PageTitle";

const FileInputPage = () => {
    return (
        <div>
            <PageMetaData title={"File Input - Forms"} />
            <PageTitle title={"File"} subMenu={"Forms"} />
            <div className="mt-6">
                <div className="grid gap-6 xl:grid-cols-2">
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Default</CardTitle>
                            <div className="mt-1 flex flex-wrap gap-5">
                                <FileInput className=" max-w-64 bg-base-200 sm:max-w-xs" />
                            </div>
                        </CardBody>
                    </Card>

                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Form Control</CardTitle>
                            <div className="form-control w-full max-w-64 sm:max-w-xs">
                                <label className="label">
                                    <span className="label-text">Pick a file</span>
                                    <span className="label-text-alt">From File Manager</span>
                                </label>
                                <FileInput className="bg-base-200" />
                                <label className="label">
                                    <span className="label-text-alt">Required</span>
                                    <span className="label-text-alt">Max 2 MB</span>
                                </label>
                            </div>
                        </CardBody>
                    </Card>

                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Color</CardTitle>
                            <div className="mt-1 flex w-fit  flex-col gap-3">
                                <FileInput className=" max-w-64 bg-base-200  sm:max-w-xs" size={"sm"} color="primary" />
                                <FileInput
                                    className=" max-w-64 bg-base-200  sm:max-w-xs"
                                    size={"sm"}
                                    color="secondary"
                                />
                                <FileInput className=" max-w-64 bg-base-200  sm:max-w-xs" size={"sm"} color="success" />
                                <FileInput className=" max-w-64 bg-base-200  sm:max-w-xs" size={"sm"} color="warning" />
                                <FileInput className=" max-w-64 bg-base-200  sm:max-w-xs" size={"sm"} color="info" />
                                <FileInput className=" max-w-64 bg-base-200  sm:max-w-xs" size={"sm"} color="error" />
                            </div>
                        </CardBody>
                    </Card>
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Size</CardTitle>
                            <div className="mt-1 flex w-fit  flex-col gap-3">
                                <FileInput className=" max-w-64 bg-base-200  sm:max-w-xs" size={"xs"} />
                                <FileInput className=" max-w-64 bg-base-200  sm:max-w-xs" size={"sm"} />
                                <FileInput className=" max-w-64 bg-base-200  sm:max-w-xs" size={"md"} />
                                <FileInput className=" max-w-64 bg-base-200  sm:max-w-xs" size={"lg"} />
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default FileInputPage;
