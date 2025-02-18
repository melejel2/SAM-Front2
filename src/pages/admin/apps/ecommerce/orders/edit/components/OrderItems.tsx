import scrollTextIcon from "@iconify/icons-lucide/scroll-text";

import { Button, Card, CardBody, Table, TableBody, TableHead, TableRow } from "@/components/daisyui";

import Icon from "@/components/Icon";
import DateUtil from "@/helpers/utils/date";
import { StringUtil } from "@/helpers/utils/string";
import { IEcommerceFullOrder } from "@/types/apps/ecommerce";

const OrderItemRow = ({ id, name, price, category, sku, image, quantity }: IEcommerceFullOrder["items"][number]) => {
    return (
        <>
            <TableRow className="cursor-pointer hover:bg-base-200/40">
                <div className="font-medium">{id}</div>
                <div className="flex items-center space-x-3 truncate">
                    <img height={40} width={40} src={image} className="size-10 rounded-box" alt="Product Image" />
                    <div>
                        <div className="font-medium">{name}</div>
                        <div className="text-xs font-medium text-base-content/70">#{sku}</div>
                    </div>
                </div>
                <div className="font-medium">{category}</div>
                <div className="text-sm font-medium">${price}</div>
                <div>{quantity}x</div>
                <div className="font-medium">${StringUtil.convertToFixed(quantity * price)}</div>
            </TableRow>
        </>
    );
};

const OrderItems = ({ order }: { order: IEcommerceFullOrder }) => {
    const { items, sub_total, date, tax, discount, total } = order;

    return (
        <Card className="bg-base-100">
            <CardBody className="p-0">
                <div className="px-5 pt-5">
                    <div className="flex justify-between">
                        <div>
                            <p className="text-xl font-medium">Order</p>
                            <div className="space-x-2">
                                <span className="text-xl font-semibold">#1</span>
                                <span className="text-sm text-base-content/70">
                                    {DateUtil.formatted(date)} at {DateUtil.formatted(date, { format: "hh:mm A" })}
                                </span>
                            </div>
                        </div>
                        <Button
                            startIcon={<Icon icon={scrollTextIcon} fontSize={16} />}
                            size="sm"
                            color={"ghost"}
                            className=" border-base-content/20">
                            Invoice
                        </Button>
                    </div>
                </div>
                <div className="mt-5 overflow-auto">
                    <Table className="rounded-box">
                        <TableHead>
                            <span className="text-sm font-medium text-base-content/80">ID</span>
                            <span className="text-sm font-medium text-base-content/80">Name</span>
                            <span className="text-sm font-medium text-base-content/80">Category</span>
                            <span className="text-sm font-medium text-base-content/80">Price</span>
                            <span className="text-sm font-medium text-base-content/80">Quantity</span>
                            <span className="text-sm font-medium text-base-content/80">Amount</span>
                        </TableHead>

                        <TableBody>
                            {items.map((product, index) => (
                                <OrderItemRow {...product} key={index} />
                            ))}
                            <tr className="">
                                <td colSpan={5} className="h-12 text-end font-medium">
                                    Sub Total
                                </td>
                                <td className="font-medium">${sub_total}</td>
                            </tr>
                            <tr className="">
                                <td colSpan={5} className="text-end font-medium">
                                    Tax
                                </td>
                                <td className="font-medium">+ ${tax}</td>
                            </tr>
                            <tr className="">
                                <td colSpan={5} className="text-end font-medium">
                                    Discount
                                </td>
                                <td className="font-medium">- ${discount}</td>
                            </tr>
                            <tr className="">
                                <td colSpan={5} className="text-end text-lg font-semibold">
                                    Total
                                </td>
                                <td className="text-lg font-bold">${total}</td>
                            </tr>
                        </TableBody>
                    </Table>
                </div>
            </CardBody>
        </Card>
    );
};

export default OrderItems;
