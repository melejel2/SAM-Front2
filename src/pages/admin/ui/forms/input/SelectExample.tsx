import { useState } from "react";

import { Card, CardBody, CardTitle, Select, SelectOption } from "@/components/daisyui";

const SelectExample = () => {
    const [value, setValue] = useState("default");

    return (
        <>
            <Card className="bg-base-100">
                <CardBody>
                    <CardTitle>Select</CardTitle>
                    <div className="mt-1 flex w-fit flex-col gap-3">
                        <Select value={value} onChange={(event) => setValue(event.target.value)}>
                            <SelectOption value={"default"} disabled>
                                Pick your favorite Simpson
                            </SelectOption>
                            <SelectOption value={"Homer"}>Homer</SelectOption>
                            <SelectOption value={"Marge"}>Marge</SelectOption>
                            <SelectOption value={"Bart"}>Bart</SelectOption>
                            <SelectOption value={"Lisa"}>Lisa</SelectOption>
                            <SelectOption value={"Maggie"}>Maggie</SelectOption>
                        </Select>
                        <Select disabled>
                            <SelectOption value={"default"} disabled>
                                Pick your favorite Simpson
                            </SelectOption>
                        </Select>
                    </div>
                </CardBody>
            </Card>
            <Card className="bg-base-100">
                <CardBody>
                    <CardTitle>Select Control</CardTitle>
                    <div className="form-control w-full max-w-xs">
                        <label className="label">
                            <span className="label-text">Pick the best fantasy franchise</span>
                            <span className="label-text-alt">Pick any 2</span>
                        </label>
                        <Select value={value} onChange={(event) => setValue(event.target.value)}>
                            <SelectOption value={"default"} disabled>
                                Pick your favorite Simpson
                            </SelectOption>
                            <SelectOption value={"Homer"}>Homer</SelectOption>
                            <SelectOption value={"Marge"}>Marge</SelectOption>
                            <SelectOption value={"Bart"}>Bart</SelectOption>
                            <SelectOption value={"Lisa"}>Lisa</SelectOption>
                            <SelectOption value={"Maggie"}>Maggie</SelectOption>
                        </Select>
                        <label className="label">
                            <span className="label-text-alt">* Required</span>
                            <span className="label-text-alt">1 of 5</span>
                        </label>
                    </div>
                </CardBody>
            </Card>
        </>
    );
};

export default SelectExample;
