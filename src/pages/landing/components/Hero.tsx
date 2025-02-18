import heroDarkLandingImg from "@/assets/images/landing/dashboard-hero-dark.png";
import heroLandingImg from "@/assets/images/landing/dashboard-hero.png";
import heroGradientImg from "@/assets/images/landing/hero-gradient.png";
import daisyuiLandingImg from "@/assets/images/landing/logo-daisyui.svg";
import javascriptLandingImg from "@/assets/images/landing/logo-js.svg";
import nextLandingImg from "@/assets/images/landing/logo-next.svg";
import reactLandingImg from "@/assets/images/landing/logo-react.svg";
import typescriptLandingImg from "@/assets/images/landing/logo-ts.svg";
import viteLandingImg from "@/assets/images/landing/logo-vite.svg";

import airplayIcon from "@iconify/icons-lucide/airplay";
import boxIcon from "@iconify/icons-lucide/box";

import { Link } from "react-router-dom";

import { Button, Tooltip } from "@/components/daisyui";

import Icon from "@/components/Icon";
import routes from "@/services/routes";

const Hero = () => {
    return (
        <div>
            <div
                className=" absolute inset-0 rotate-180 bg-cover bg-center bg-no-repeat opacity-20 dark:hidden"
                style={{ backgroundImage: `url(${heroGradientImg})`, filter: "blur(4px)" }}></div>
            <div className="container relative z-10 py-20 xl:py-40">
                <div className="grid items-center  gap-8 xl:grid-cols-7 xl:gap-20">
                    <div className="order-2 xl:order-1 xl:col-span-3">
                        <p className="text-3xl font-semibold leading-normal">
                            The Ultimate React <br /> Client & Admin Dashboard
                        </p>

                        <p className="mt-8 max-w-[500px]">
                            Begin your next react project with a foundation built on daisyUI, with effortless
                            customization to accelerate development process
                        </p>
                        <div className={"mt-8 inline-flex items-center gap-3"}>
                            <Link to={routes.dashboards.ecommerce}>
                                <Button color={"primary"} startIcon={<Icon icon={airplayIcon} fontSize={18} />}>
                                    Dashboard
                                </Button>
                            </Link>
                            <Link to={routes.ui.components.accordion}>
                                <Button color={"ghost"} startIcon={<Icon icon={boxIcon} fontSize={18} />}>
                                    Components
                                </Button>
                            </Link>
                        </div>
                        <div className="mt-8">
                            <p className="font-medium text-base-content/70">Development Stack</p>
                            <div className="mt-3 flex gap-5">
                                <Tooltip message={"daisyUI - Component Library"}>
                                    <img src={daisyuiLandingImg} className="size-7" width={28} height={28} alt="Next" />
                                </Tooltip>
                                <Tooltip message={"Javascript"}>
                                    <img
                                        src={javascriptLandingImg}
                                        className="size-7"
                                        width={28}
                                        height={28}
                                        alt="Javascript"
                                    />
                                </Tooltip>
                                <Tooltip message={"Typescript"}>
                                    <img
                                        src={typescriptLandingImg}
                                        className="size-7"
                                        width={28}
                                        height={28}
                                        alt="Typescript"
                                    />
                                </Tooltip>
                                <Tooltip message={"React"}>
                                    <img src={reactLandingImg} className="size-7" width={28} height={28} alt="React" />
                                </Tooltip>
                                <Tooltip message={"Vite"}>
                                    <img src={viteLandingImg} className="size-7" width={28} height={28} alt="Vite" />
                                </Tooltip>
                                <Tooltip message={"Next.JS"}>
                                    <img
                                        src={nextLandingImg}
                                        className="size-7 dark:invert"
                                        width={28}
                                        height={28}
                                        alt="Next"
                                    />
                                </Tooltip>
                            </div>
                        </div>
                    </div>
                    <div className="order-1 xl:order-2 xl:col-span-4">
                        <img
                            src={heroLandingImg}
                            className="inline rounded-md shadow-xl dark:hidden"
                            width={1000}
                            alt="hero-landing"
                        />
                        <img
                            src={heroDarkLandingImg}
                            className="hidden rounded-md  shadow-xl dark:inline"
                            width={1000}
                            alt="hero-landing"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Hero;
