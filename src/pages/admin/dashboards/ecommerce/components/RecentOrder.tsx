import downloadIcon from "@iconify/icons-lucide/download";
import eyeIcon from "@iconify/icons-lucide/eye";
import trashIcon from "@iconify/icons-lucide/trash";

import { useEffect, useMemo, useState } from "react";

import { Button, Card, CardBody, Checkbox, Mask, Table, TableBody, TableHead, TableRow } from "@/components/daisyui";

import Icon from "@/components/Icon";
import { getEcommerceDashboardOrderData } from "@/data/dashboards/ecommerce";
import { cn } from "@/helpers/utils/cn";
import DateUtil from "@/helpers/utils/date";
import { IEcommerceDashboardOrder } from "@/types/dashboards/ecommerce";

const OrderRow = ({ order, checkedAll }: { order: IEcommerceDashboardOrder; checkedAll: boolean }) => {
    const [checked, setChecked] = useState(checkedAll);

    useEffect(() => {
        setChecked(checkedAll);
    }, [checkedAll]);

    return (
        <TableRow className="cursor-pointer" onClick={() => setChecked(!checked)}>
            <Checkbox
                size={"xs"}
                checked={checked}
                aria-label="checked-order"
                onChange={() => setChecked(!checked)}
                id={`checked-order-${order.id}`}
            />

            <div className="flex items-center space-x-3 truncate">
                <img
                    src={order.image}
                    height={32}
                    width={32}
                    alt={"order image"}
                    className={cn("size-8 bg-base-content/10", Mask.className({ variant: "squircle" }))}
                />

                <p className="line-clamp-2 font-medium">{order.name}</p>
            </div>

            <div>
                <div className="font-medium">${order.amount}</div>
            </div>
            <div className="text-nowrap text-xs">{DateUtil.formatted(order.date)}</div>
            <div>
                <StatusWidget status={order.status} />
            </div>
            <div className="flex items-center">
                <Button color="ghost" size="sm" shape={"square"} aria-label="Show product">
                    <Icon icon={eyeIcon} className="text-base-content/70" fontSize={20} />
                </Button>
                <Button
                    color="ghost"
                    className="text-error/70 hover:bg-error/20"
                    size="sm"
                    shape={"square"}
                    aria-label="Delete product">
                    <Icon icon={trashIcon} fontSize={20} />
                </Button>
            </div>
        </TableRow>
    );
};

const StatusWidget = ({ status }: { status: IEcommerceDashboardOrder["status"] }) => {
    if (status == "delivered") {
        return (
            <div className="inline rounded-badge border border-success/50 bg-success/5 px-3 py-1 text-xs font-medium text-success">
                Delivered
            </div>
        );
    } else if (status == "cancelled") {
        return (
            <div className="inline rounded-badge border border-error/50 bg-error/5 px-3 py-1 text-xs font-medium text-error">
                Cancelled
            </div>
        );
    } else if (status == "on_going") {
        return (
            <div className="inline rounded-badge border border-info/50 bg-info/5 px-3 py-1 text-xs font-medium text-info">
                On Going
            </div>
        );
    } else
        return (
            <div className="inline rounded-badge border-base-content/70 bg-base-content/10 px-2 py-1 text-base-content">
                {status}
            </div>
        );
};

const RecentOrder = () => {
    const [checkedAll, setCheckedAll] = useState(false);

    const data = useMemo(() => getEcommerceDashboardOrderData, []);

    return (
        <Card className="bg-base-100">
            <CardBody>
                <div className="flex items-center justify-between">
                    <span className="font-medium">Recent Orders</span>
                    <Button
                        startIcon={<Icon icon={downloadIcon} fontSize={16} />}
                        color="ghost"
                        className={"bg-base-content/5"}
                        size={"sm"}>
                        Report
                    </Button>
                </div>
                <div className="overflow-auto">
                    <Table className="rounded-box">
                        <TableHead>
                            <Checkbox
                                size={"xs"}
                                aria-label="checked-all-order"
                                checked={checkedAll}
                                onChange={() => setCheckedAll(!checkedAll)}
                            />

                            <span className="text-sm font-medium text-base-content/80">Product</span>
                            <span className="text-sm font-medium text-base-content/80">Price</span>
                            <span className="text-sm font-medium text-base-content/80">Date</span>
                            <span className="text-sm font-medium text-base-content/80">Status</span>
                            <span className="text-sm font-medium text-base-content/80">Action</span>
                        </TableHead>

                        <TableBody>
                            {data.map((order, index) => (
                                <OrderRow order={order} checkedAll={checkedAll} key={index} />
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardBody>
        </Card>
    );
};

export default RecentOrder;
