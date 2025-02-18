import testimonialPouyaLandingImg from "@/assets/images/landing/testimonial-pouya-avatar.png";
import worldMapLandingImg from "@/assets/images/landing/world-map.png";

import sparklesIcon from "@iconify/icons-lucide/sparkles";
import starIcon from "@iconify/icons-lucide/star";

import Icon from "@/components/Icon";

const Testimonial = () => {
    return (
        <section id="testimonial" className="container relative py-8 lg:py-24">
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-15 dark:opacity-50"
                style={{ backgroundImage: `url(${worldMapLandingImg})` }}></div>
            <div className="relative">
                <div className="text-center">
                    <div className="inline-block rounded border border-orange-500/5 bg-orange-500/5 p-2.5">
                        <Icon icon={sparklesIcon} fontSize={20} className="text-orange-600" />
                    </div>
                    <h2 className="mt-1 text-3xl font-semibold">What People Say</h2>
                </div>

                <div className="mt-16 text-center">
                    <div className="avatar">
                        <div className="mask mask-squircle w-16 bg-base-content/10">
                            <img src={testimonialPouyaLandingImg} alt="testimonial" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center justify-center gap-1">
                        <Icon icon={starIcon} className="text-orange-400 svg-path:fill-orange-400" fontSize={20} />
                        <Icon icon={starIcon} className="text-orange-400 svg-path:fill-orange-400" fontSize={20} />
                        <Icon icon={starIcon} className="text-orange-400 svg-path:fill-orange-400" fontSize={20} />
                        <Icon icon={starIcon} className="text-orange-400 svg-path:fill-orange-400" fontSize={20} />
                        <Icon icon={starIcon} className="text-orange-400 svg-path:fill-orange-400" fontSize={20} />
                    </div>
                    <p className="mt-4 inline-block max-w-[600px] text-center">
                        This is the ultimate admin dashboard for any React project
                    </p>
                    <p className="mt-8 text-lg font-medium">Pouya Saadeghi</p>
                    <p className="text-sm text-base-content/70">Creator of daisyUI</p>
                </div>
            </div>
        </section>
    );
};

export default Testimonial;
