import { MetaData } from "@/components/MetaData";
import { PageTitle } from "@/components/PageTitle";
import SearchInput from "@/components/SearchInput";
import { useState } from "react";

const FormInputPage = () => {
    const [searchValue, setSearchValue] = useState("");
    
    return (
        <>
            <MetaData title="Input - Forms" />
            <PageTitle title="Input" items={[{ label: "Forms" }, { label: "Input", active: true }]} />
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <div className="card card-border bg-base-100">
                    <div className="card-body">
                        <div className="card-title">Default</div>
                        <div className="mt-4 flex flex-col gap-3">
                            <input placeholder="Type here" className="input" type="text" aria-label="Input" />
                            <input
                                className="input"
                                aria-label="Input"
                                type="text"
                                value="I have already written something for you"
                            />
                        </div>
                    </div>
                </div>
                <div className="card card-border bg-base-100">
                    <div className="card-body">
                        <div className="card-title">Disabled</div>
                        <div className="mt-4 flex flex-col gap-3">
                            <input placeholder="Type here" className="input" disabled aria-label="Input" type="text" />
                            <input
                                className="input"
                                aria-label="Input"
                                disabled
                                type="text"
                                value="I have already written something for you"
                            />
                        </div>
                    </div>
                </div>
                <div className="card card-border bg-base-100">
                    <div className="card-body">
                        <div className="card-title">Ghost</div>
                        <div className="mt-4 flex flex-col gap-3">
                            <input
                                placeholder="Touch to write"
                                className="input input-ghost"
                                aria-label="Input"
                                type="text"
                            />
                            <input
                                className="input"
                                aria-label="Input"
                                disabled
                                type="text"
                                value="I'm ghost, you can't touch me 👻"
                            />
                        </div>
                    </div>
                </div>
                <div className="card card-border bg-base-100">
                    <div className="card-body">
                        <div className="card-title">Fieldset</div>
                        <div className="mt-4 flex flex-col gap-3">
                            <fieldset className="fieldset">
                                <legend className="fieldset-legend">What is your name?</legend>
                                <input className="input" aria-label="Input" placeholder="Type here" type="text" />
                                <p className="fieldset-label">* Required</p>
                            </fieldset>
                        </div>
                    </div>
                </div>
                <div className="space-y-5">
                    <div className="card card-border bg-base-100">
                        <div className="card-body">
                            <div className="card-title">Label inside</div>
                            <div className="mt-4 flex flex-col gap-3">
                                <div className="flex items-center justify-center gap-4">
                                    <SearchInput
                                        value={searchValue}
                                        onChange={setSearchValue}
                                        placeholder="Search (Modern Design)"
                                        showResultsCount={true}
                                        resultsCount={searchValue ? 5 : 0}
                                        size="md"
                                    />
                                    <div className="flex gap-1">
                                        <kbd className="kbd kbd-sm">⌘</kbd>
                                        <kbd className="kbd kbd-sm">K</kbd>
                                    </div>
                                </div>
                                <label className="input">
                                    <span className="iconify lucide--search text-base-content/60 size-5"></span>
                                    <input className="grow" placeholder="Search (Legacy Design)" type="search" />
                                </label>
                                <label className="input">
                                    <span className="iconify lucide--file text-base-content/60 size-5"></span>
                                    <input className="grow" placeholder="index.php" type="text" />
                                </label>
                                <label className="input">
                                    Path
                                    <input className="grow" placeholder="src/app/" type="text" />
                                    <span className="badge badge-ghost badge-sm">.tsx</span>
                                </label>
                            </div>
                        </div>
                    </div>
                    <div className="card card-border bg-base-100">
                        <div className="card-body">
                            <div className="card-title">Size</div>
                            <div className="mt-4 flex flex-col gap-3">
                                <input
                                    placeholder="Type here"
                                    aria-label="Input"
                                    className="input input-xs"
                                    type="text"
                                />
                                <input
                                    placeholder="Type here"
                                    aria-label="Input"
                                    className="input input-sm"
                                    type="text"
                                />
                                <input placeholder="Type here" aria-label="Input" className="input" type="text" />
                                <input
                                    placeholder="Type here"
                                    aria-label="Input"
                                    className="input input-lg"
                                    type="text"
                                />
                                <input
                                    placeholder="Type here"
                                    aria-label="Input"
                                    className="input input-xl"
                                    type="text"
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="card card-border bg-base-100">
                    <div className="card-body">
                        <div className="card-title">Color</div>
                        <div className="mt-4 flex flex-col gap-3">
                            <input
                                placeholder="Type here"
                                aria-label="Input"
                                className="input input-primary"
                                type="text"
                            />
                            <input
                                placeholder="Type here"
                                aria-label="Input"
                                className="input input-secondary"
                                type="text"
                            />
                            <input
                                placeholder="Type here"
                                aria-label="Input"
                                className="input input-accent"
                                type="text"
                            />
                            <input
                                placeholder="Type here"
                                aria-label="Input"
                                className="input input-success"
                                type="text"
                            />
                            <input
                                placeholder="Type here"
                                aria-label="Input"
                                className="input input-info"
                                type="text"
                            />
                            <input
                                placeholder="Type here"
                                aria-label="Input"
                                className="input input-warning"
                                type="text"
                            />
                            <input
                                placeholder="Type here"
                                aria-label="Input"
                                className="input input-error"
                                type="text"
                            />
                            <input
                                placeholder="Type here"
                                aria-label="Input"
                                className="input input-neutral"
                                type="text"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default FormInputPage;
