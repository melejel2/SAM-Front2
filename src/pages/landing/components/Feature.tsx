import caseSensitiveIcon from "@iconify/icons-lucide/case-sensitive";
import codeSquareIcon from "@iconify/icons-lucide/code";
import combineIcon from "@iconify/icons-lucide/combine";
import hexagonIcon from "@iconify/icons-lucide/hexagon";
import monitorSmartphoneIcon from "@iconify/icons-lucide/monitor-smartphone";
import pencilLineIcon from "@iconify/icons-lucide/pencil-line";
import pencilRulerIcon from "@iconify/icons-lucide/pencil-ruler";
import sunMoonIcon from "@iconify/icons-lucide/sun-moon";
import wand2Icon from "@iconify/icons-lucide/wand-2";

import Icon from "@/components/Icon";

const features = [
    {
        icon: hexagonIcon,
        title: "Branding",
        description: "Stand out with custom branding that reflects your vision and values",
    },
    {
        icon: combineIcon,
        title: "Enhanced UX",
        description: "We're committed to delivering exceptional user experiences",
    },
    {
        icon: pencilRulerIcon,
        title: "Consistent UI",
        description: "Designs feature clean lines, modern aesthetics, and thoughtful space use",
    },
    {
        icon: monitorSmartphoneIcon,
        title: "Responsive",
        description: "Enjoy a seamless experience on any device",
    },
    {
        icon: caseSensitiveIcon,
        title: "Typography",
        description: "Each font mirrors our brand's personality and values, forging a memorable visual identity",
    },
    {
        icon: pencilLineIcon,
        title: "Customizable",
        description: "With our customization, your imagination sets the only limit",
    },
    {
        icon: sunMoonIcon,
        title: "Color Presets",
        description:
            "Explore our Color Presets, including Dark Mode, for enhanced visual comfort and aesthetic choices",
    },
    {
        icon: codeSquareIcon,
        title: "Easy Development",
        description: "Easily create your React landing page with our intuitive tools",
    },
] as const;

const Feature = () => {
    return (
        <div className="relative z-10">
            <div className="container py-12 2xl:py-24">
                <div className="text-center">
                    <div className="inline-block rounded border border-indigo-500/5 bg-indigo-500/5 p-2.5">
                        <Icon icon={wand2Icon} fontSize={20} className="text-indigo-600" />
                    </div>
                    <p className="mt-2 text-3xl font-semibold">Why you choose</p>
                    <p className="mt-3 inline-block max-w-md text-base-content/80">
                        Explore our captivating landing page with seamless navigation and engaging visuals for an
                        immersive experience
                    </p>
                </div>
                <div className="mt-8 grid grid-cols-2 gap-8 lg:grid-cols-4 2xl:mt-24 2xl:gap-16">
                    {features.map((feature, index) => {
                        return (
                            <div className="text-center" key={index}>
                                <div className="inline-block">
                                    <Icon icon={feature.icon} fontSize={28} />
                                </div>
                                <p className="mt-3 text-lg font-medium">{feature.title}</p>
                                <p className="mt-1 text-sm text-base-content/80">{feature.description}</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default Feature;
