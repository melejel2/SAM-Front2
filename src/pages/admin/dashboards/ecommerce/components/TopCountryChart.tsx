import eyeIcon from "@iconify/icons-lucide/eye";
import globe2Icon from "@iconify/icons-lucide/globe-2";

import type { ApexOptions } from "apexcharts";
import { useMemo } from "react";
import ApexChart from "react-apexcharts";

import { Button, Card, CardBody } from "@/components/daisyui";

import Icon from "@/components/Icon";
import { useLayoutContext } from "@/states/layout";

const TopCountryChart = () => {
    const { state } = useLayoutContext();

    const options = useMemo<ApexOptions>(() => {
        return {
            theme: {
                mode: state.theme,
            },
            chart: {
                height: 380,
                type: "bar",
                parentHeightOffset: 0,
                background: "transparent",
                toolbar: {
                    show: false,
                },
            },
            plotOptions: {
                bar: {
                    horizontal: true,
                    borderRadius: 4,
                    distributed: true,
                    borderRadiusApplication: "end",
                },
            },
            dataLabels: {
                enabled: true,
                textAnchor: "start",
                style: {
                    colors: ["#fff"],
                },
                formatter: function (val, opt: any) {
                    return opt.w.globals.labels[opt.dataPointIndex] + ":  " + val;
                },
                offsetX: -10,
                dropShadow: {
                    enabled: false,
                },
            },
            series: [
                {
                    data: [10, 15, 14, 18, 25, 16],
                },
            ],
            legend: {
                show: false,
            },
            stroke: {
                width: 0,
                colors: ["#fff"],
            },
            xaxis: {
                categories: ["Turkey", "Canada", "India", "Netherlands", "Italy", "France"],
            },
            yaxis: {
                labels: {
                    show: false,
                },
            },
            grid: {
                borderColor: "transparent",
                padding: {
                    top: -16,
                },
            },

            tooltip: {
                theme: "dark",
                x: {
                    show: false,
                },
                y: {
                    title: {
                        formatter: function () {
                            return "";
                        },
                    },
                },
            },
            colors: [
                "#3e60d5",
                "#47ad77",
                "#fa5c7c",
                "#6c757d",
                "#39afd1",
                "#2b908f",
                "#ffbc00",
                "#90ee7e",
                "#f48024",
                "#212730",
            ],
        };
    }, [state.theme]);

    return (
        <Card className="bg-base-100">
            <CardBody className="gap-0 p-0">
                <div className="flex items-center gap-3 px-5 pt-5">
                    <Icon icon={globe2Icon} className="text-base-content/80" fontSize={16} />
                    <span className="grow font-medium">Top Countries</span>
                    <Button
                        startIcon={<Icon icon={eyeIcon} fontSize={16} />}
                        color="ghost"
                        className={"bg-base-content/5"}
                        size={"sm"}>
                        Overview
                    </Button>
                </div>
                <div className="mb-3 me-5">
                    <ApexChart options={options} height={290} type={"bar"} series={options.series}></ApexChart>
                </div>
            </CardBody>
        </Card>
    );
};

export default TopCountryChart;
