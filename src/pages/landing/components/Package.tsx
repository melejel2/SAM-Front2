import javascriptLandingImg from "@/assets/images/landing/logo-js.svg";
import nextLandingImg from "@/assets/images/landing/logo-next.svg";
import reactLandingImg from "@/assets/images/landing/logo-react.svg";
import typescriptLandingImg from "@/assets/images/landing/logo-ts.svg";

import checkIcon from "@iconify/icons-lucide/check";
import dollarSignIcon from "@iconify/icons-lucide/dollar-sign";
import xCircleIcon from "@iconify/icons-lucide/x-circle";

import { Link } from "react-router-dom";

import { Tooltip } from "@/components/daisyui";

import Icon from "@/components/Icon";
import routes from "@/services/routes";

const Package = () => {
    return (
        <div className="">
            <div className="container py-24">
                <div className="text-center">
                    <div className="inline-block rounded border border-green-500/5 bg-green-500/5 p-2.5">
                        <Icon icon={dollarSignIcon} fontSize={20} className="text-green-600" />
                    </div>
                    <p className="mt-1 text-3xl font-semibold">Packages</p>
                    <p className="mt-3 inline-block max-w-sm text-base-content/70">
                        Discover clear, flexible pricing options to fit any budget, with no hidden fees
                    </p>
                </div>
                <div className="mt-8 grid gap-6 lg:grid-cols-3 xl:gap-12">
                    <div className="rounded border border-base-content/10 p-6">
                        <div className="inline rounded bg-primary/5 px-3 py-1 text-sm font-medium text-primary">
                            Base
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                            <p className="text-xl font-medium">Starter</p>
                            <p className="text-2xl font-semibold">$29</p>
                        </div>
                        <div className="mt-3 flex items-center gap-3">
                            <Tooltip message={"Javascript"}>
                                <img src={javascriptLandingImg} width={20} height={20} alt="Javascript" />
                            </Tooltip>
                            <Tooltip message={"Typescript"}>
                                <img src={typescriptLandingImg} width={20} height={20} alt="Typescript" />
                            </Tooltip>
                            <Tooltip message={"React"}>
                                <img src={reactLandingImg} width={20} height={20} alt="React" />
                            </Tooltip>
                        </div>
                        <p className="mt-8 text-sm text-base-content/70">What&apos;s Included:</p>
                        <div className="mt-3 space-y-2">
                            <div className="flex items-center gap-3">
                                <Icon icon={checkIcon} fontSize={16} className="text-green-500" />
                                <p>React Version</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <Icon icon={xCircleIcon} fontSize={16} className="text-base-content/40" />
                                <p>Next.JS Version</p>
                            </div>
                            <div className="">
                                <div className="my-3 block border border-dashed  border-base-content/10" />
                            </div>
                            <div className="flex items-center gap-3">
                                <Icon icon={checkIcon} fontSize={16} className="text-green-500" />
                                <p>Ecommerce Dashboard</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <Icon icon={xCircleIcon} fontSize={16} className="text-base-content/40" />
                                <p>Apps</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <Icon icon={xCircleIcon} fontSize={16} className="text-base-content/40" />
                                <p>Components</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <Icon icon={xCircleIcon} fontSize={16} className="text-base-content/40" />
                                <p>Authentication</p>
                            </div>

                            <div className="flex items-center gap-3">
                                <Icon icon={xCircleIcon} fontSize={16} className="text-base-content/40" />
                                <p>Extra Pages</p>
                            </div>
                        </div>
                        <Link
                            className="btn btn-ghost btn-block mt-10 border-base-content/10"
                            to={routes.externalLinks.purchase}
                            target={"_blank"}>
                            Buy Now
                        </Link>
                    </div>
                    <div className="rounded border border-base-content/10 p-6">
                        <div className="inline rounded bg-primary px-3 py-1 text-sm font-medium text-primary-content">
                            Most Popular
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                            <p className="text-xl font-medium">Standard</p>
                            <p className="text-2xl font-semibold">$59</p>
                        </div>
                        <div className="mt-3 flex items-center gap-3">
                            <img
                                src={javascriptLandingImg}
                                className="size-5"
                                width={20}
                                height={20}
                                alt="Javascript"
                            />
                            <img
                                src={typescriptLandingImg}
                                className="size-5"
                                width={20}
                                height={20}
                                alt="Typescript"
                            />
                            <Tooltip message={"React"}>
                                <img src={reactLandingImg} width={20} height={20} alt="React" />
                            </Tooltip>
                        </div>
                        <p className="mt-8 text-sm text-base-content/70">What&apos;s Included:</p>
                        <div className="mt-3 space-y-2">
                            <div className="flex items-center gap-3">
                                <Icon icon={checkIcon} fontSize={16} className="text-green-500" />
                                <p>React Version</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <Icon icon={xCircleIcon} fontSize={16} className="text-base-content/40" />
                                <p>Next.JS Version</p>
                            </div>
                            <div className="">
                                <div className="my-3 block border border-dashed border-base-content/10" />
                            </div>
                            <div className="flex items-center gap-3">
                                <Icon icon={checkIcon} fontSize={16} className="text-green-500" />
                                <p>Dashboard</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <Icon icon={checkIcon} fontSize={16} className="text-green-500" />
                                <p>3 Apps</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <Icon icon={checkIcon} fontSize={16} className="text-green-500" />
                                <p>26 Components</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <Icon icon={checkIcon} fontSize={16} className="text-green-500" />
                                <p>4 Auth Pages</p>
                            </div>

                            <div className="flex items-center gap-3">
                                <Icon icon={checkIcon} fontSize={16} className="text-green-500" />
                                <p>Extra Pages</p>
                            </div>
                        </div>
                        <Link
                            className="btn btn-primary btn-block mt-10 border-base-content/10"
                            to={routes.externalLinks.purchase}
                            target={"_blank"}>
                            Buy Now
                        </Link>
                    </div>
                    <div className="rounded border border-base-content/10 p-6">
                        <div className="inline rounded bg-purple-500/10 px-3 py-1 text-sm font-medium text-purple-600">
                            Enhanced Version
                        </div>

                        <div className="mt-2 flex items-center justify-between">
                            <p className="text-xl font-medium">Pro</p>
                            <p className="text-2xl font-semibold">$119</p>
                        </div>
                        <div className="mt-3 flex items-center gap-3">
                            <img
                                src={javascriptLandingImg}
                                className="size-5"
                                width={20}
                                height={20}
                                alt="Javascript"
                            />
                            <img
                                src={typescriptLandingImg}
                                className="size-5"
                                width={20}
                                height={20}
                                alt="Typescript"
                            />
                            <Tooltip message={"React"}>
                                <img src={reactLandingImg} width={20} height={20} alt="React" />
                            </Tooltip>
                            <img
                                src={nextLandingImg}
                                className="size-5  dark:invert"
                                width={20}
                                height={20}
                                alt="Next"
                            />
                        </div>
                        <p className="mt-8 text-sm text-base-content/70">What&apos;s Included:</p>
                        <div className="mt-3 space-y-2">
                            <div className="flex items-center gap-3">
                                <Icon icon={checkIcon} fontSize={16} className="text-green-500" />
                                <p>React Version</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <Icon icon={checkIcon} fontSize={16} className="text-green-500" />
                                <p>Next.JS Version</p>
                            </div>
                            <div className="">
                                <div className="my-3 block border border-dashed border-base-content/10" />
                            </div>
                            <div className="flex items-center gap-3">
                                <Icon icon={checkIcon} fontSize={16} className="text-green-500" />
                                <p>Dashboard</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <Icon icon={checkIcon} fontSize={16} className="text-green-500" />
                                <p>3 Apps</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <Icon icon={checkIcon} fontSize={16} className="text-green-500" />
                                <p>26 Components</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <Icon icon={checkIcon} fontSize={16} className="text-green-500" />
                                <p>4 Auth Pages</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <Icon icon={checkIcon} fontSize={16} className="text-green-500" />
                                <p>Extra Pages</p>
                            </div>
                        </div>

                        <Link
                            className="btn btn-ghost btn-outline btn-block mt-10 border-base-content/10"
                            to={routes.externalLinks.purchase}
                            target={"_blank"}>
                            Buy Now
                        </Link>
                    </div>
                </div>

                <div className="">
                    <p className="mt-3">
                        You can check full details:{" "}
                        <Link to={"/docs/package"} className="text-primary">
                            Packages
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Package;
