import mapIcon from "@iconify/icons-lucide/map";
import mapPinIcon from "@iconify/icons-lucide/map-pin";

import { Button, Card, CardBody } from "@/components/daisyui";

import Icon from "@/components/Icon";
import { IEcommerceFullOrder } from "@/types/apps/ecommerce";

const DeliveryAddress = ({ address, pincode, city, country }: IEcommerceFullOrder["address"]) => {
    return (
        <Card className="bg-base-100">
            <CardBody>
                <p className="rounded-box bg-base-content/5 px-3 py-2 text-base font-medium">Delivery Address</p>
                <div className="mt-2 flex gap-3">
                    <Icon icon={mapPinIcon} className="text-base-content/80" fontSize={24} />
                    <div className="grow">
                        <p className="font-medium">{address}</p>
                        <p className="text-sm text-base-content/80">
                            {city} - {country} {pincode}
                        </p>
                    </div>
                </div>
                <div className="text-end">
                    <Button
                        color="ghost"
                        size="sm"
                        className="hover:bg-primary/20 hover:text-primary"
                        startIcon={<Icon icon={mapIcon} fontSize={16} className="" />}>
                        View on Map
                    </Button>
                </div>
            </CardBody>
        </Card>
    );
};

export default DeliveryAddress;
