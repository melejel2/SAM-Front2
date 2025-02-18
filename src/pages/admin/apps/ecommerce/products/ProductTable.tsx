import chevronLeftIcon from "@iconify/icons-lucide/chevron-left";
import chevronRightIcon from "@iconify/icons-lucide/chevron-right";
import copyPlusIcon from "@iconify/icons-lucide/copy-plus";
import downloadCloudIcon from "@iconify/icons-lucide/download-cloud";
import eyeIcon from "@iconify/icons-lucide/eye";
import pencilIcon from "@iconify/icons-lucide/pencil";
import plusIcon from "@iconify/icons-lucide/plus";
import searchIcon from "@iconify/icons-lucide/search";
import starIcon from "@iconify/icons-lucide/star";
import trashIcon from "@iconify/icons-lucide/trash";
import wandIcon from "@iconify/icons-lucide/wand";

import { useEffect, useMemo, useState } from "react";

import {
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
import { getEcommerceProductData } from "@/data/apps/ecommerce";
import { cn } from "@/helpers/utils/cn";
import DateUtil from "@/helpers/utils/date";
import { IEcommerceProduct } from "@/types/apps/ecommerce";

const ProductRow = ({ product, checkedAll }: { product: IEcommerceProduct; checkedAll: boolean }) => {
    const [checked, setChecked] = useState(checkedAll);
    const { id, name, date, price, stock, category, sku, image, ratings, ratings_count, orders } = product;

    useEffect(() => {
        setChecked(checkedAll);
    }, [checkedAll]);
    return (
        <>
            <TableRow className="cursor-pointer hover:bg-base-200/40" onClick={() => setChecked(!checked)}>
                <Checkbox
                    size={"xs"}
                    checked={checked}
                    onChange={() => setChecked(!checked)}
                    aria-label="Single check"
                />
                <div className="font-medium">{id}</div>
                <div className="flex items-center space-x-3 truncate">
                    <img src={image} height={40} width={40} className="size-10 rounded-box" alt="Product Image" />
                    <div>
                        <div className="font-medium">{name}</div>
                        <div className="text-xs font-medium text-base-content/70">#{sku}</div>
                    </div>
                </div>
                <div className="font-medium">{category}</div>
                <div className="text-sm font-medium">${price}</div>
                <div className="flex items-center gap-2">
                    <Icon
                        icon={starIcon}
                        fontSize={16}
                        className={cn({
                            "text-error": ratings > 0,
                            "text-warning": ratings > 3,
                            "text-success": ratings > 4,
                        })}
                    />
                    {ratings} <span className="text-sm text-base-content/70">({ratings_count})</span>
                </div>
                <div>{orders}</div>
                <div>
                    {stock > 20 ? (
                        <span className="text-success">Available</span>
                    ) : stock > 0 ? (
                        <span className="text-warning">Low</span>
                    ) : (
                        <span className="text-error">Out of Stock</span>
                    )}
                </div>
                <div className="text-sm">{DateUtil.formatted(date)}</div>
                <div className="inline-flex w-fit">
                    <Button color="ghost" size="sm" shape={"square"} aria-label="Dummy edit product">
                        <Icon icon={pencilIcon} className="text-base-content/70" fontSize={15} />
                    </Button>
                    <Button color="ghost" size="sm" shape={"square"} aria-label="Dummy show product">
                        <Icon icon={eyeIcon} className="text-base-content/70" fontSize={16} />
                    </Button>
                    <Button
                        color="ghost"
                        className="text-error/70 hover:bg-error/20"
                        size="sm"
                        shape={"square"}
                        aria-label="Dummy delete product">
                        <Icon icon={trashIcon} className="" fontSize={16} />
                    </Button>
                </div>
            </TableRow>
        </>
    );
};

const ProductTable = () => {
    const [category, setCategory] = useState("default");
    const [checkedAll, setCheckedAll] = useState(false);

    const data = useMemo(() => getEcommerceProductData, []);

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
                                value={category}
                                aria-label="Select category"
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
                                        Create New Product
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
                            <span className="text-sm font-medium text-base-content/80">Category</span>
                            <span className="text-sm font-medium text-base-content/80">Price</span>
                            <span className="text-sm font-medium text-base-content/80">Ratings</span>
                            <span className="text-sm font-medium text-base-content/80">Orders</span>
                            <span className="text-sm font-medium text-base-content/80">Stock</span>
                            <span className="text-sm font-medium text-base-content/80">Created At</span>
                            <span className="text-sm font-medium text-base-content/80">Action</span>
                        </TableHead>

                        <TableBody>
                            {data.slice(0, 11).map((product, index) => (
                                <ProductRow product={product} checkedAll={checkedAll} key={index} />
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

export default ProductTable;
