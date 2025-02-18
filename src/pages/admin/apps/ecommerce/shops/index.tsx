import PageMetaData from "@/components/PageMetaData";
import PageTitle from "@/components/PageTitle";

import ShopTable from "./ShopTable";

const EcommerceShops = () => {
    return (
        <div>
            <PageMetaData title={"Shops - Ecommerce"} />

            <PageTitle title={"Shops"} subMenu={"E Commerce"} />
            <div className="mt-5">
                <ShopTable />
            </div>
        </div>
    );
};

export default EcommerceShops;
