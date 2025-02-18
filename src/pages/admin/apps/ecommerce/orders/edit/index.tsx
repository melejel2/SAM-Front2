import { useMemo } from "react";

import { Card, CardBody } from "@/components/daisyui";

import PageMetaData from "@/components/PageMetaData";
import { getEcommerceFullOrderData } from "@/data/apps/ecommerce";

import CustomerDetail from "./components/CustomerDetail";
import DeliveryAddress from "./components/DeliveryAddress";
import DeliveryPartner from "./components/DeliveryPartner";
import OrderItems from "./components/OrderItems";
import PaymentDetail from "./components/PaymentDetail";
import TrackOrder from "./components/TrackOrder";

const EcommerceOrderDetail = () => {
    const order = useMemo(() => getEcommerceFullOrderData, []);

    return (
        <div>
            <PageMetaData title={"Order Detail - Ecommerce"} />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                <div className="lg:col-span-8 2xl:col-span-9">
                    <OrderItems order={order} />
                    <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2 2xl:grid-cols-3">
                        <div>
                            <PaymentDetail {...order.payment} />
                        </div>
                        <div>
                            <CustomerDetail {...order.customer} />
                        </div>
                        <div>
                            <DeliveryAddress {...order.address} />
                        </div>
                    </div>
                </div>
                <div className="lg:col-span-4 2xl:col-span-3">
                    <Card className="bg-base-100">
                        <CardBody className="gap-0">
                            <p className="rounded-box bg-base-content/5 px-3 py-2 font-medium">Track Order</p>
                            <div className="mt-2">
                                <TrackOrder />
                            </div>
                            <p className="mt-3 rounded-box bg-base-content/5 px-3 py-2 font-medium">Delivery Partner</p>
                            <div className="mt-3">
                                <DeliveryPartner {...order.delivery_partner} />
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default EcommerceOrderDetail;
