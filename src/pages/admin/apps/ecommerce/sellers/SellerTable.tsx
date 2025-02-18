import badgeCheckIcon from "@iconify/icons-lucide/badge-check";
import badgeXIcon from "@iconify/icons-lucide/badge-x";
import chevronLeftIcon from "@iconify/icons-lucide/chevron-left";
import chevronRightIcon from "@iconify/icons-lucide/chevron-right";
import copyPlusIcon from "@iconify/icons-lucide/copy-plus";
import downloadCloudIcon from "@iconify/icons-lucide/download-cloud";
import eyeIcon from "@iconify/icons-lucide/eye";
import pencilIcon from "@iconify/icons-lucide/pencil";
import plusIcon from "@iconify/icons-lucide/plus";
import searchIcon from "@iconify/icons-lucide/search";
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
    Mask,
    Pagination,
    Select,
    SelectOption,
    Table,
    TableBody,
    TableHead,
    TableRow,
} from "@/components/daisyui";

import Icon from "@/components/Icon";
import { getEcommerceSellerData } from "@/data/apps/ecommerce";
import DateUtil from "@/helpers/utils/date";
import { IEcommerceSeller } from "@/types/apps/ecommerce";

const SellerRow = ({ seller, checkedAll }: { seller: IEcommerceSeller; checkedAll: boolean }) => {
    const [checked, setChecked] = useState(checkedAll);
    const { id, name, date, image, shop_name, email, sales, gender, earning, verified, mobile_number } = seller;

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
                    <img
                        src={image}
                        height={40}
                        width={40}
                        className={`size-10 bg-base-content/10 ${Mask.className({ variant: "squircle" })}`}
                        alt="Seller Image"
                    />
                    <div>
                        <div className="font-medium">{name}</div>
                        <div className="text-xs font-medium capitalize text-base-content/70">{gender}</div>
                    </div>
                </div>
                <div className="font-medium">{shop_name}</div>
                <div>{email}</div>
                <div>{mobile_number}</div>
                <div>{sales}</div>
                <div className="text-sm font-medium">${earning}</div>
                {verified ? (
                    <Icon icon={badgeCheckIcon} fontSize={18} className="text-success" />
                ) : (
                    <Icon icon={badgeXIcon} fontSize={18} className="text-error" />
                )}
                <div className="text-sm">{DateUtil.formatted(date)}</div>
                <div className="inline-flex w-fit">
                    <Button color="ghost" size="sm" shape={"square"} aria-label="Dummy edit seller">
                        <Icon icon={pencilIcon} className="text-base-content/70" fontSize={15} />
                    </Button>
                    <Button color="ghost" size="sm" shape={"square"} aria-label="Dummy show seller">
                        <Icon icon={eyeIcon} className="text-base-content/70" fontSize={16} />
                    </Button>
                    <Button
                        color="ghost"
                        className="text-error/70 hover:bg-error/20"
                        size="sm"
                        shape={"square"}
                        aria-label="Dummy delete seller">
                        <Icon icon={trashIcon} className="" fontSize={16} />
                    </Button>
                </div>
            </TableRow>
        </>
    );
};

const SellerTable = () => {
    const [verifiedType, setVerifiedType] = useState("default");
    const [checkedAll, setCheckedAll] = useState(false);

    const data = useMemo(() => getEcommerceSellerData, []);

    return (
        <Card className="bg-base-100">
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
                                value={verifiedType}
                                aria-label="Select category"
                                onChange={(event) => setVerifiedType(event.target.value)}
                                size={"sm"}>
                                <SelectOption value={"default"} disabled>
                                    Verification Status
                                </SelectOption>
                                <SelectOption value={"videos"}>Verified</SelectOption>
                                <SelectOption value={"documents"}>Unverified</SelectOption>
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
                                        Create New Seller
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
                            <span className="text-sm font-medium text-base-content/80">Shop</span>
                            <span className="text-sm font-medium text-base-content/80">Email</span>
                            <span className="text-sm font-medium text-base-content/80">Mobile</span>
                            <span className="text-sm font-medium text-base-content/80">Sales</span>
                            <span className="text-sm font-medium text-base-content/80">Earning</span>
                            <span className="text-sm font-medium text-base-content/80">Verified</span>
                            <span className="text-sm font-medium text-base-content/80">Joined Date</span>
                            <span className="text-sm font-medium text-base-content/80">Action</span>
                        </TableHead>

                        <TableBody>
                            {data.slice(0, 11).map((seller, index) => (
                                <SellerRow seller={seller} checkedAll={checkedAll} key={index} />
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

export default SellerTable;
