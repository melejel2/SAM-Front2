import mailIcon from "@iconify/icons-lucide/mail";
import phoneIcon from "@iconify/icons-lucide/phone";

import { Button, Card, CardBody, Mask } from "@/components/daisyui";

import Icon from "@/components/Icon";
import { IEcommerceFullOrder } from "@/types/apps/ecommerce";

const CustomerDetail = ({ image, name, email }: IEcommerceFullOrder["customer"]) => {
    return (
        <Card className="bg-base-100">
            <CardBody>
                <p className="rounded-box bg-base-content/5 px-3 py-2 text-base font-medium">Customer Profile</p>
                <div className="mt-2 flex items-center gap-3">
                    <img
                        src={image}
                        height={40}
                        width={40}
                        className={`size-10 bg-base-content/10 ${Mask.className({ variant: "squircle" })}`}
                        alt=""
                    />
                    <div className="grow">
                        <p className="text-sm font-medium">{name}</p>
                        <p className="text-sm text-base-content/80">{email}</p>
                    </div>
                </div>
                <div className="flex justify-end gap-2">
                    <Button
                        color="ghost"
                        shape={"circle"}
                        size="sm"
                        aria-label="call a customer"
                        className="hover:bg-primary/20 hover:text-primary"
                        startIcon={<Icon icon={phoneIcon} fontSize={18} />}
                    />
                    <Button
                        color="ghost"
                        shape={"circle"}
                        size="sm"
                        aria-label="mail to customer"
                        className="hover:bg-primary/20 hover:text-primary"
                        startIcon={<Icon icon={mailIcon} fontSize={18} />}
                    />
                </div>
            </CardBody>
        </Card>
    );
};

export default CustomerDetail;
