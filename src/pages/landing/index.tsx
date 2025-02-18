import PageMetaData from "@/components/PageMetaData";
import ThemeToggleButton from "@/components/ThemeToggleButton";

import FAQ from "./components/FAQ";
import Feature from "./components/Feature";
import Footer from "./components/Footer";
import Hero from "./components/Hero";
import Package from "./components/Package";
import Showcase from "./components/Showcase";
import Testimonial from "./components/Testimonial";
import Topbar from "./components/Topbar";

const LandingPage = () => {
    return (
        <>
            <PageMetaData title={"Landing"} />

            <Topbar />
            <Hero />
            <Feature />
            <Showcase />
            <Testimonial />
            <Package />
            <FAQ />
            <Footer />

            <div className="fixed bottom-5 end-5 z-10 ">
                <ThemeToggleButton
                    shape="circle"
                    color="ghost"
                    className={"border border-base-content/10 text-base-content/70 hover:bg-base-content/10"}
                />
            </div>
        </>
    );
};

export default LandingPage;
