import PageMetaData from "@/components/PageMetaData";
import PageTitle from "@/components/PageTitle";

import ProductTable from "./ProductTable";

const EcommerceProducts = () => {
    return (
        <div>
            <PageMetaData title={"Products - Ecommerce"} />

            <PageTitle title={"Products"} subMenu={"Ecommerce"} />
            <div className="mt-5">
                <ProductTable />
            </div>
        </div>
    );
};

export default EcommerceProducts;
