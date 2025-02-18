import mobileHeroDarkLandingImg from "@/assets/images/landing/mobile-hero-dark.png";
import mobileHeroLandingImg from "@/assets/images/landing/mobile-hero.png";

import shoppingCartIcon from "@iconify/icons-lucide/shopping-cart";

import { Button, Link } from "@/components/daisyui";

import Icon from "@/components/Icon";
import routes from "@/services/routes";

const Footer = () => {
    return (
        <div className="">
            <div className="container py-16">
                <div className="relative grid items-center overflow-hidden rounded-xl bg-primary/5 py-0 lg:grid-cols-3">
                    <div className="col-span-2 p-4 text-center md:p-8">
                        <p className="text-xl font-medium md:text-3xl">Get started with Nexus Today</p>
                        <div className="mt-6 inline-flex items-center gap-3">
                            <Link href={routes.externalLinks.purchase}>
                                <Button color={"primary"} startIcon={<Icon icon={shoppingCartIcon} fontSize={16} />}>
                                    Purchase Now
                                </Button>
                            </Link>
                            <Link href={routes.dashboards.ecommerce}>
                                <Button color={"ghost"}>View Demo</Button>
                            </Link>
                        </div>
                    </div>
                    <div className="-mt-8 hidden h-96 rotate-[15deg] lg:inline">
                        <img src={mobileHeroLandingImg} alt="mobile-landing" className="inline dark:hidden" />
                        <img src={mobileHeroDarkLandingImg} alt="mobile-landing" className="hidden dark:inline" />
                    </div>
                </div>
                <div className="mt-12 text-center">
                    🌼 Made with{" "}
                    <Link className="link-hover link" href={routes.externalLinks.daisyui} target="_blank">
                        daisyUI
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Footer;
