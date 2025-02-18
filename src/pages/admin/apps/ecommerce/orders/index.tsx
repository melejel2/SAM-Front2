import PageMetaData from "@/components/PageMetaData";
import PageTitle from "@/components/PageTitle";

import OrderTable from "./OrderTable";

const EcommerceOrders = () => {
    return (
        <div>
            <PageMetaData title={"Orders - Ecommerce"} />

            <PageTitle title={"Orders"} subMenu={"E Commerce"} />
            <div className="mt-5">
                <OrderTable />
            </div>
        </div>
    );
};

export default EcommerceOrders;
