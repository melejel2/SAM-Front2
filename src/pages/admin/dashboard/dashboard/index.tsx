import PageMetaData from "@/components/PageMetaData";
import PageTitle from "@/components/PageTitle";

import CounterWidget from "./components/CounterWidget";
import QuickChat from "./components/QuickChat";
import RecentOrder from "./components/RecentOrder";
import RevenueChart from "./components/RevenueChart";
import TopCountryChart from "./components/TopCountryChart";
import VisitorChart from "./components/VisitorChart";

const EcommerceDashboardPage = () => {
    return (
        <div>
            <PageMetaData title={"Dashboard - Ecommerce"} />
            <PageTitle title={"Overview"} subMenu={"Dashboard"} />
            <div className="mt-6">
                <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-4">
                    <CounterWidget />
                </div>
                <div className="mt-6 grid gap-6 xl:grid-cols-12">
                    <div className="xl:col-span-7">
                        <RevenueChart />
                    </div>
                    <div className="xl:col-span-5">
                        <VisitorChart />
                    </div>
                </div>
                <div className="mt-6 grid gap-6 lg:grid-cols-5 2xl:grid-cols-12">
                    {/*TODO: Hide recent order in small screen due to responsive issue*/}
                    <div className="hidden sm:block lg:col-span-3 2xl:col-span-5">
                        <RecentOrder />
                    </div>
                    <div className="lg:order-3 lg:col-span-3 2xl:col-span-4">
                        <TopCountryChart />
                    </div>
                    <div className="lg:order-2 lg:col-span-2 2xl:col-span-3">
                        <QuickChat />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EcommerceDashboardPage;
