import PageMetaData from "@/components/PageMetaData";
import PageTitle from "@/components/PageTitle";

import SellerTable from "./SellerTable";

const EcommerceSellers = () => {
    return (
        <div>
            <PageMetaData title={"Sellers - Ecommerce"} />

            <PageTitle title={"Sellers"} subMenu={"Ecommerce"} />
            <div className="mt-5">
                <SellerTable />
            </div>
        </div>
    );
};

export default EcommerceSellers;
