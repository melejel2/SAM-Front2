import PageMetaData from "@/components/PageMetaData";
import PageTitle from "@/components/PageTitle";

import CustomerTable from "./CustomerTable";

const EcommerceCustomers = () => {
    return (
        <div>
            <PageMetaData title={"Customers - Ecommerce"} />

            <PageTitle title={"Customers"} subMenu={"E Commerce"} />
            <div className="mt-5">
                <CustomerTable />
            </div>
        </div>
    );
};

export default EcommerceCustomers;
