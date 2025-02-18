import chevronLeftIcon from "@iconify/icons-lucide/chevron-left";
import chevronRightIcon from "@iconify/icons-lucide/chevron-right";
import copyPlusIcon from "@iconify/icons-lucide/copy-plus";
import downloadCloudIcon from "@iconify/icons-lucide/download-cloud";
import eyeIcon from "@iconify/icons-lucide/eye";
import plusIcon from "@iconify/icons-lucide/plus";
import searchIcon from "@iconify/icons-lucide/search";
import trashIcon from "@iconify/icons-lucide/trash";
import wandIcon from "@iconify/icons-lucide/wand";

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import {
    Badge,
    Button,
    Card,
    CardBody,
    Checkbox,
    Dropdown,
    DropdownItem,
    DropdownMenu,
    DropdownToggle,
    Input,
    Pagination,
    Select,
    SelectOption,
    Table,
    TableBody,
    TableHead,
    TableRow,
} from "@/components/daisyui";

import Icon from "@/components/Icon";
import { getEcommerceOrderData } from "@/data/apps/ecommerce";
import { cn } from "@/helpers/utils/cn";
import DateUtil from "@/helpers/utils/date";
import { StringUtil } from "@/helpers/utils/string";
import routes from "@/services/routes";
import { IEcommerceOrder } from "@/types/apps/ecommerce";

const OrderRow = ({ order, checkedAll }: { order: IEcommerceOrder; checkedAll: boolean }) => {
    const [checked, setChecked] = useState(checkedAll);
    const { id, date, customer, status, payment_status, amount, items_count } = order;

    useEffect(() => {
        setChecked(checkedAll);
    }, [checkedAll]);

    return (
        <>
            <TableRow className="cursor-pointer hover:bg-base-200/40" onChange={() => setChecked(!checked)}>
                <Checkbox
                    size={"xs"}
                    checked={checked}
                    onChange={() => setChecked(!checked)}
                    aria-label="Single check"
                />
                <div className="font-medium">#{id}</div>
                <div className="flex items-center space-x-3 truncate">
                    <div className="font-medium">{items_count} Items</div>
                </div>
                <div className="font-medium">{customer}</div>
                <div className="text-sm font-medium">${amount}</div>

                <div className="flex items-center gap-2">
                    <Badge
                        className={cn("border-0 font-medium capitalize", {
                            "bg-error/10 text-error": payment_status == "unpaid",
                            "bg-success/10 text-success": payment_status == "paid",
                        })}>
                        {payment_status}
                    </Badge>
                </div>
                <div className="text-sm capitalize">{StringUtil.snackToNormal(status)}</div>
                <div className="text-sm">{DateUtil.formatted(date)}</div>
                <div className="inline-flex w-fit">
                    <Link to={routes.apps.ecommerce.orders.show(id)} aria-label={"Show order link"}>
                        <Button color="ghost" size="sm" shape={"square"} aria-label={"Show order"}>
                            <Icon icon={eyeIcon} className="text-base-content/70" fontSize={16} />
                        </Button>
                    </Link>
                    <Button
                        color="ghost"
                        className="text-error/70 hover:bg-error/20"
                        size="sm"
                        shape={"square"}
                        aria-label={"Delete order"}>
                        <Icon icon={trashIcon} className="" fontSize={16} />
                    </Button>
                </div>
            </TableRow>
        </>
    );
};

const OrderTable = () => {
    const [category, setCategory] = useState("default");
    const [checkedAll, setCheckedAll] = useState(false);

    const data = useMemo(() => getEcommerceOrderData, []);

    return (
        <Card className="mt-5 bg-base-100">
            <CardBody className={"p-0"}>
                <div className="flex items-center justify-between px-5 pt-5">
                    <div className="inline-flex items-center gap-3">
                        <div className="form-control flex flex-row items-center rounded-box border border-base-content/20 px-2">
                            <Icon icon={searchIcon} className="text-base-content/60" fontSize={15} />
                            <Input
                                size="sm"
                                placeholder="Search along files"
                                bordered={false}
                                borderOffset={false}
                                className="w-full focus:border-transparent focus:outline-0"></Input>
                        </div>
                        <div className="hidden sm:block">
                            <Select
                                aria-label="Select category"
                                value={category}
                                onChange={(event) => setCategory(event.target.value)}
                                size={"sm"}>
                                <SelectOption value={"default"} disabled>
                                    Category
                                </SelectOption>
                                <SelectOption value={"videos"}>Fashion</SelectOption>
                                <SelectOption value={"documents"}>Daily Need</SelectOption>
                                <SelectOption value={"archives"}>Cosmetic</SelectOption>
                                <SelectOption value={"other"}>Electronics</SelectOption>
                                <SelectOption value={"other"}>Other</SelectOption>
                            </Select>
                        </div>
                    </div>
                    <div className="inline-flex items-center gap-3">
                        <Button color="ghost" size="sm" className="hidden border-base-content/20 md:flex">
                            <Icon icon={wandIcon} fontSize={16} />
                            <span>Bulk Actions</span>
                        </Button>
                        <Dropdown horizontal="left" vertical="bottom">
                            <DropdownToggle
                                button={false}
                                className="btn btn-ghost btn-xs h-8 border border-base-content/20">
                                <Icon icon={plusIcon} fontSize={16} />
                            </DropdownToggle>
                            <DropdownMenu className="w-52 text-sm ">
                                <DropdownItem anchor={false}>
                                    <div>
                                        <Icon icon={plusIcon} fontSize={16} className="" />
                                        Add Dummy Order
                                    </div>
                                </DropdownItem>
                                <hr className="-mx-2 my-1 border-base-content/10" />
                                <DropdownItem anchor={false}>
                                    <div>
                                        <Icon icon={downloadCloudIcon} fontSize={16} className="" />
                                        Import from Store
                                    </div>
                                </DropdownItem>
                                <DropdownItem anchor={false}>
                                    <div>
                                        <Icon icon={copyPlusIcon} fontSize={16} className="" />
                                        Create from Existing
                                    </div>
                                </DropdownItem>
                            </DropdownMenu>
                        </Dropdown>
                    </div>
                </div>
                <div className="overflow-auto">
                    <Table className="mt-2 rounded-box">
                        <TableHead>
                            <Checkbox
                                size={"xs"}
                                checked={checkedAll}
                                onChange={() => setCheckedAll(!checkedAll)}
                                aria-label="Check all"
                            />
                            <span className="text-sm font-medium text-base-content/80">ID</span>
                            <span className="text-sm font-medium text-base-content/80">Name</span>
                            <span className="text-sm font-medium text-base-content/80">Customer</span>
                            <span className="text-sm font-medium text-base-content/80">Price</span>
                            <span className="text-sm font-medium text-base-content/80">Payment</span>
                            <span className="text-sm font-medium text-base-content/80">Status</span>
                            <span className="text-sm font-medium text-base-content/80">Ordered At</span>
                            <span className="text-sm font-medium text-base-content/80">Action</span>
                        </TableHead>

                        <TableBody>
                            {data.map((order, index) => (
                                <OrderRow order={order} checkedAll={checkedAll} key={index} />
                            ))}
                        </TableBody>
                    </Table>
                </div>
                <div className="flex items-center justify-end px-5 pb-5 pt-3">
                    <Pagination>
                        <Button
                            size="sm"
                            aria-label="pagination-prev"
                            className="join-item"
                            startIcon={<Icon icon={chevronLeftIcon} fontSize={16} />}></Button>
                        <Button size="sm" className="join-item" active color="primary" aria-label="pagination-1">
                            1
                        </Button>
                        <Button size="sm" className="join-item" aria-label="pagination-2">
                            2
                        </Button>
                        <Button
                            size="sm"
                            aria-label="pagination-next"
                            className="join-item"
                            startIcon={<Icon icon={chevronRightIcon} fontSize={16} />}></Button>
                    </Pagination>
                </div>
            </CardBody>
        </Card>
    );
};

export default OrderTable;
