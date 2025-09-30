import { useState, useEffect } from "react";

import { Select, SelectOption } from "@/components/daisyui";

import useParticularConditions from "./use-particular-conditions";

interface InputField {
    name: string;
    label: string;
    type: string;
    value?: any;
    required?: boolean;
    options?: any[];
    prefix?: string;
}

interface ParticularConditionsStepProps {
    onContractDetailsChange?: (details: Record<string, any>) => void;
}

const ParticularConditionsStep: React.FC<ParticularConditionsStepProps> = ({ onContractDetailsChange }) => {
    const { inputFields } = useParticularConditions();

    const [formData, setFormData] = useState<Record<string, any>>(() => {
        const initialData: Record<string, any> = {};
        inputFields.forEach((field) => {
            initialData[field.name] = field.value || "";
        });
        return initialData;
    });

    // Call the callback when form data changes
    useEffect(() => {
        if (onContractDetailsChange) {
            onContractDetailsChange(formData);
        }
    }, [formData, onContractDetailsChange]);

    const renderInput = (field: InputField) => {
        const { name, type, required, options, label, prefix } = field;
        {
            if (type === "select") {
                return (
                    <label className="floating-label">
                        <span>{label}</span>
                        <Select
                            className="input input-md"
                            onChange={(e) => {
                                setFormData({ ...formData, [name]: e.target.value });
                            }}
                            name={name}
                            value={formData[name]}
                            required={required}
                            onTouchStart={(e) => {
                                if (e.touches.length > 1) {
                                    e.preventDefault();
                                }
                            }}>
                            <>
                                <SelectOption value="" disabled hidden>
                                    Select {label}
                                </SelectOption>
                                {(options ?? []).map((option) => (
                                    <SelectOption key={option} value={option} className="bg-base-100">
                                        {option}
                                    </SelectOption>
                                ))}
                            </>
                        </Select>
                    </label>
                );
            } else {
                return (
                    <label className="floating-label" key={name}>
                        <span>{label.charAt(0).toUpperCase() + label.slice(1)}</span>
                        {prefix ? (
                            <label className="input input-md">
                                <span>{prefix}</span>
                                <input
                                    type={type}
                                    name={name}
                                    className="-ml-2"
                                    value={formData[name]}
                                    required={required}
                                    onChange={(e) => setFormData({ ...formData, [name]: e.target.value })}
                                />
                            </label>
                        ) : (
                            <input
                                type={type}
                                name={name}
                                placeholder={label}
                                className="input input-md"
                                value={formData[name]}
                                required={required}
                                onChange={(e) => setFormData({ ...formData, [name]: e.target.value })}
                            />
                        )}
                    </label>
                );
            }
        }
    };

    return (
        <div className="flex h-full items-center justify-center">
            <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-3">
                {inputFields.map((field) => (
                    <div key={field.name}>{renderInput(field)}</div>
                ))}
            </div>
        </div>
    );
};

export default ParticularConditionsStep;
