import React, { useState } from "react";

import { Select, SelectOption } from "@/components/daisyui";

import useIPCTypes from "./use-type";

interface IPCTypeStepProps {
    onSelectType?: (type: string) => void;
}

const IPCTypeStep: React.FC<IPCTypeStepProps> = ({ onSelectType }) => {
    const [selectedType, setSelectedType] = useState("");

    const { options } = useIPCTypes();

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selected = e.target.value;
        setSelectedType(selected);
        onSelectType?.(selected);
    };

    return (
        <div className="mt-8 flex h-[90%] items-center justify-center">
            <label className="floating-label">
                <span>Type</span>
                <Select
                    className="input input-md w-96"
                    value={selectedType}
                    required
                    onChange={handleChange}
                    onTouchStart={(e) => {
                        if (e.touches.length > 1) {
                            e.preventDefault();
                        }
                    }}>
                    <>
                        <SelectOption value="" disabled hidden>
                            Select Type
                        </SelectOption>
                        {options.map((option) => (
                            <SelectOption key={option} value={option} className="bg-base-100">
                                {option}
                            </SelectOption>
                        ))}
                    </>
                </Select>
            </label>
        </div>
    );
};

export default IPCTypeStep;
