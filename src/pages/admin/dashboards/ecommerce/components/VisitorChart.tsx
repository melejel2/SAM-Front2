import arrowDownIcon from "@iconify/icons-lucide/arrow-down";
import arrowUpIcon from "@iconify/icons-lucide/arrow-up";

import type { ApexOptions } from "apexcharts";
import { useMemo } from "react";
import ApexChart from "react-apexcharts";

import { Card, CardBody } from "@/components/daisyui";

import Icon from "@/components/Icon";
import { getEcommerceDashboardUserInteractionData } from "@/data/dashboards/ecommerce";
import { useLayoutContext } from "@/states/layout";
import { IEcommerceDashboardUserInteraction } from "@/types/dashboards/ecommerce";

const CustomerInteraction = ({ title, amount, percent }: IEcommerceDashboardUserInteraction) => {
    return (
        <div className="text-center">
            <p className="text-base font-medium">{title}</p>
            <p className="mt-1 text-2xl font-semibold">{amount}</p>
            <div className={`mt-1 inline-flex items-center gap-1 ${percent > 0 ? "text-success" : "text-error"}`}>
                {percent >= 0 && <Icon icon={arrowUpIcon} fontSize={16} />}
                {percent < 0 && <Icon icon={arrowDownIcon} fontSize={16} />}
                <p className="text-sm">{percent}%</p>
            </div>
        </div>
    );
};

const VisitorChart = () => {
    const data = useMemo(() => getEcommerceDashboardUserInteractionData, []);

    const { state } = useLayoutContext();

    const options: ApexOptions = useMemo(() => {
        return {
            theme: {
                mode: state.theme,
            },
            chart: {
                height: 270,
                type: "area",
                background: "transparent",
                sparkline: {
                    enabled: true,
                },
                toolbar: {
                    show: false,
                },
            },
            dataLabels: {
                enabled: false,
            },
            grid: {
                show: false,
            },

            stroke: {
                curve: ["smooth", "straight"],
                width: 2,
                dashArray: [0, 6],
            },
            series: [
                {
                    name: "Sessions",
                    type: "area",
                    data: [10, 14, 16, 14, 12, 15, 18, 21, 24, 23, 21, 17, 19, 22],
                },
            ],
            legend: {
                show: false,
            },
            xaxis: {
                categories: [],
                tooltip: {
                    enabled: false,
                },
                axisBorder: {
                    show: false,
                },
                labels: {
                    show: false,
                },
                axisTicks: {
                    show: false,
                },
            },
            yaxis: {
                labels: {
                    show: false,
                },
            },

            fill: {
                type: "gradient",
                opacity: 1,
                gradient: {
                    shadeIntensity: 1,

                    type: "horizontal",
                    colorStops: [
                        {
                            offset: 0,
                            color: "rgba(75,134,255,0.1)",
                            opacity: 1,
                        },
                        {
                            offset: 30,
                            color: "rgba(255,54,54,0.1)",
                            opacity: 1,
                        },
                        {
                            offset: 35,
                            color: "rgba(255,54,138,0.08)",
                            opacity: 1,
                        },
                        {
                            offset: 50,
                            color: "rgba(51,84,250,0.2)",
                            opacity: 1,
                        },
                        {
                            offset: 80,
                            color: "rgba(64,96,255,0.16)",
                            opacity: 1,
                        },
                        {
                            offset: 100,
                            color: "rgba(75,99,255,0.1)",
                            opacity: 1,
                        },
                    ],
                },
            },
        };
    }, [state.theme]);

    return (
        <Card className="bg-base-100">
            <CardBody className="p-0">
                <div className="flex items-center justify-between px-5 pt-4">
                    <span className="font-medium">Customer Acquisition</span>
                </div>
                <div className="mt-2 border-y border-base-content/10  py-2">
                    <div className="grid grid-cols-3 gap-5 divide-x divide-base-content/10">
                        {data.map((interaction, index) => (
                            <CustomerInteraction {...interaction} key={index} />
                        ))}
                    </div>
                </div>

                <div className="p-5">
                    <div className="overflow-hidden rounded-lg">
                        <ApexChart options={options} height={210} type={"area"} series={options.series}></ApexChart>
                    </div>
                </div>
            </CardBody>
        </Card>
    );
};

export default VisitorChart;
