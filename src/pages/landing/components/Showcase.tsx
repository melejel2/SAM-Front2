import avatar1 from "@/assets/images/avatars/1.png";
import avatar2 from "@/assets/images/avatars/2.png";
import avatar3 from "@/assets/images/avatars/3.png";
import cardLandingImg from "@/assets/images/landing/component-card-image.png";
import bgVector1Img from "@/assets/images/landing/section-bg-gradient.png";

import boxIcon from "@iconify/icons-lucide/box";
import chevronDownIcon from "@iconify/icons-lucide/chevron-down";
import chevronRightIcon from "@iconify/icons-lucide/chevron-right";
import infoIcon from "@iconify/icons-lucide/info";
import searchIcon from "@iconify/icons-lucide/search";
import shoppingCartIcon from "@iconify/icons-lucide/shopping-cart";
import uploadIcon from "@iconify/icons-lucide/upload";

import { useState } from "react";
import { Link } from "react-router-dom";

import {
    Alert,
    Avatar,
    AvatarGroup,
    Button,
    Card,
    CardActions,
    CardBody,
    CardTitle,
    Checkbox,
    Dropdown,
    DropdownItem,
    DropdownMenu,
    DropdownToggle,
    FormLabel,
    Input,
    Loading,
    Pagination,
    Progress,
    Radio,
    RadioTab,
    Range,
    Rating,
    RatingItem,
    Tabs,
    Textarea,
    Toast,
    Toggle,
} from "@/components/daisyui";

import Icon from "@/components/Icon";
import routes from "@/services/routes";

const Showcase = () => {
    const [rating, setRating] = useState(4);

    const [toast, setToast] = useState(false);

    const showToast = () => {
        setToast(true);
        setTimeout(() => {
            setToast(false);
        }, 2000);
    };

    return (
        <div className="" id="features">
            <div className="container relative py-24">
                <div
                    className="absolute -start-8 -top-8 size-[350px] bg-cover bg-center bg-no-repeat opacity-20 dark:hidden sm:size-[600px]"
                    style={{ backgroundImage: `url(${bgVector1Img})` }}></div>
                <div className="relative z-10 grid gap-12 lg:grid-cols-7 lg:gap-24">
                    <div className="lg:col-span-3">
                        <div className="inline-block rounded border border-teal-500/5 bg-teal-500/5 p-2.5">
                            <Icon icon={boxIcon} fontSize={20} className="text-teal-600" />
                        </div>
                        <p className="mt-3 text-3xl font-semibold">Components</p>
                        <p className="mt-4 text-base-content/70">
                            Explore our curated collection of popular design elements, including menus, sliders,
                            buttons, and inputs. Dive in and find everything you need!
                        </p>
                        <div className="mt-6">
                            <Link to={routes.ui.components.accordion}>
                                <Button
                                    endIcon={<Icon icon={chevronRightIcon} fontSize={18} />}
                                    variant={"outline"}
                                    size={"sm"}>
                                    View Components
                                </Button>
                            </Link>
                        </div>
                    </div>
                    <div className="lg:col-span-4">
                        <div className="rounded border border-dashed border-base-content/10 p-10 text-center">
                            <div className="flex flex-wrap justify-center gap-6">
                                <Button
                                    color="warning"
                                    size={"sm"}
                                    startIcon={<Icon icon={searchIcon} fontSize={16} />}>
                                    Search
                                </Button>
                                <Button color="ghost" size={"sm"} startIcon={<Icon icon={uploadIcon} fontSize={16} />}>
                                    Upload
                                </Button>
                                <Button
                                    color="primary"
                                    size={"sm"}
                                    shape={"circle"}
                                    startIcon={<Icon icon={shoppingCartIcon} fontSize={16} />}></Button>
                                <Button onClick={showToast} size={"sm"} color="success">
                                    Toast
                                </Button>
                                {toast && (
                                    <Toast vertical={"bottom"} horizontal={"end"} className="z-[100]">
                                        <Alert status="info">New message arrived.</Alert>
                                    </Toast>
                                )}
                                <Dropdown vertical="bottom">
                                    <DropdownToggle size={"sm"} className="items-center">
                                        Dropdown
                                        <Icon icon={chevronDownIcon} fontSize={18} />
                                    </DropdownToggle>
                                    <DropdownMenu className="w-52">
                                        <DropdownItem>Item 1</DropdownItem>
                                        <DropdownItem>Item 2</DropdownItem>
                                    </DropdownMenu>
                                </Dropdown>
                            </div>
                            <div className="mt-10 flex flex-wrap justify-center gap-6">
                                <Tabs variant="bordered" color={"primary"}>
                                    <RadioTab name="my_tabs_1" className="font-medium" label="Tailwind CSS"></RadioTab>
                                    <RadioTab
                                        name="my_tabs_1"
                                        className="font-medium"
                                        label="daisyUI"
                                        defaultChecked></RadioTab>
                                    <RadioTab name="my_tabs_1" className="font-medium" label="React"></RadioTab>
                                </Tabs>
                                <Loading variant="ring" color={"primary"} />
                                <Loading variant="bars" color={"primary"} />
                                <Loading variant="infinity" color={"primary"} />
                            </div>
                            <div className="mt-10 flex flex-wrap items-center justify-center gap-6">
                                <Avatar
                                    src={avatar1}
                                    size="xs"
                                    shape="circle"
                                    innerClassName="bg-base-content/10"
                                    online
                                />
                                <AvatarGroup>
                                    <Avatar
                                        src={avatar1}
                                        size="xs"
                                        shape="circle"
                                        innerClassName="bg-base-content/10"
                                    />
                                    <Avatar
                                        src={avatar2}
                                        size="xs"
                                        shape="circle"
                                        innerClassName="bg-base-content/10"
                                    />
                                    <Avatar
                                        src={avatar3}
                                        size="xs"
                                        shape="circle"
                                        innerClassName="bg-base-content/10"
                                    />
                                    <Avatar
                                        letters={"+99"}
                                        size={"xs"}
                                        innerClassName="bg-base-200  text-primary font-medium"
                                    />
                                </AvatarGroup>

                                <Pagination>
                                    <Button size="sm" className="join-item">
                                        1
                                    </Button>
                                    <Button size="sm" className="join-item" active>
                                        2
                                    </Button>
                                    <Button size="sm" className="join-item">
                                        3
                                    </Button>
                                    <Button size="sm" className="join-item">
                                        4
                                    </Button>
                                </Pagination>
                                <Alert
                                    icon={<Icon icon={infoIcon} fontSize={18} />}
                                    status="info"
                                    className="inline-flex w-fit gap-2 px-2 py-1.5">
                                    <span>New update available.</span>
                                </Alert>
                            </div>
                            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                                <div className="inline-flex gap-2">
                                    <Radio name="showcase_radio" defaultChecked />
                                    <Radio name="showcase_radio" />
                                </div>
                                <div className="inline-flex items-center gap-2">
                                    <Toggle
                                        className="ms-2"
                                        color={"primary"}
                                        size="sm"
                                        id="showcase_toggle"
                                        defaultChecked
                                    />
                                    <FormLabel title={"Toggle"} htmlFor="showcase_toggle" />
                                </div>
                                <div className="inline-flex items-center gap-2">
                                    <Checkbox
                                        className="ms-2"
                                        color={"error"}
                                        size="sm"
                                        id="showcase_checkbox"
                                        defaultChecked
                                    />
                                    <FormLabel title={"Checkbox"} htmlFor="showcase_checkbox" />
                                </div>
                                <div className="inline-flex items-center gap-2">
                                    <Checkbox
                                        className="ms-2"
                                        color={"warning"}
                                        size="sm"
                                        id="showcase_i_checkbox"
                                        indeterminate
                                    />
                                    <FormLabel title={"Checkbox"} htmlFor="showcase_i_checkbox" />
                                </div>
                                <div className="inline-flex items-center gap-2">
                                    <Checkbox
                                        className="ms-2"
                                        size="sm"
                                        id="showcase_d_toggle"
                                        defaultChecked
                                        disabled
                                    />
                                    <FormLabel title={"Disabled"} htmlFor="showcase_d_toggle" />
                                </div>
                            </div>

                            <div className="mt-10 grid gap-6 md:grid-cols-2">
                                <div className="col-span-1">
                                    <div className="mt-1 flex flex-wrap justify-center gap-6">
                                        <Rating value={rating} onChange={setRating} className="gap-1">
                                            <RatingItem name="rating-3" className="mask mask-heart bg-red-500" />
                                            <RatingItem name="rating-3" className="mask mask-heart bg-red-400" />
                                            <RatingItem name="rating-3" className="mask mask-heart bg-orange-400" />
                                            <RatingItem name="rating-3" className="mask mask-heart bg-teal-400" />
                                            <RatingItem name="rating-3" className="mask mask-heart bg-green-500" />
                                        </Rating>
                                    </div>
                                    <div className="form-control mt-4">
                                        <label className="label">
                                            <span className="label-text">What is your name?</span>
                                            <span className="label-text-alt">Mr.</span>
                                        </label>
                                        <Input placeholder="Type Here" size={"sm"} />
                                        <label className="label">
                                            <span className="label-text-alt">* Required</span>
                                            <span className="label-text-alt">0/20</span>
                                        </label>
                                    </div>
                                    <div className="form-control mt-4">
                                        <Textarea placeholder="Bio" />
                                    </div>
                                    <div className="mt-5">
                                        <Range color={"primary"} size={"xs"} />
                                    </div>

                                    <div className="mt-2">
                                        <Progress max={100} className="h-1 w-full" color="success" />
                                    </div>
                                </div>
                                <div className="col-span-1">
                                    <Card className="rounded-xl bg-base-100">
                                        <CardBody>
                                            <CardTitle>
                                                <Avatar
                                                    src={avatar1}
                                                    size="xs"
                                                    shape="circle"
                                                    innerClassName="bg-base-content/10"
                                                />
                                                <div className="text-start">
                                                    <p className="text-base/none">Denish Navadiya</p>
                                                    <p className="mt-1 text-sm/none text-base-content/80">
                                                        Designer & Developer
                                                    </p>
                                                </div>
                                            </CardTitle>
                                            <img src={cardLandingImg} className="mt-1 rounded-xl" alt="card" />
                                            <p className="text-start text-sm italic">Caption goes here</p>
                                            <CardActions>
                                                <Button size="sm" color="primary">
                                                    Action
                                                </Button>
                                                <Button size="sm" color="ghost">
                                                    Cancel
                                                </Button>
                                            </CardActions>
                                        </CardBody>
                                    </Card>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Showcase;
