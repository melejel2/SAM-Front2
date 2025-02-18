import type { ApexOptions } from "apexcharts";
import { useMemo, useState } from "react";
import ApexChart from "react-apexcharts";

import { Card, CardBody, Tab, Tabs } from "@/components/daisyui";

import { getEcommerceDashboardRevenueStatData } from "@/data/dashboards/ecommerce";
import DateUtil from "@/helpers/utils/date";
import { StringUtil } from "@/helpers/utils/string";
import { useLayoutContext } from "@/states/layout";
import { IEcommerceDashboardRevenueDuration } from "@/types/dashboards/ecommerce";
import { ILayoutThemeMode } from "@/types/layout/admin";

const getOption = (duration: IEcommerceDashboardRevenueDuration = "day", theme: ILayoutThemeMode): ApexOptions => {
    const data = getEcommerceDashboardRevenueStatData[duration].series;
    return {
        theme: {
            mode: theme,
        },
        chart: {
            height: 380,
            type: "bar",
            stacked: true,
            // parentHeightOffset: 0,
            background: "transparent",

            toolbar: {
                show: false,
            },
        },

        plotOptions: {
            bar: {
                borderRadius: 8,
                borderRadiusApplication: "end",
                borderRadiusWhenStacked: "last",
                colors: {
                    backgroundBarColors: ["rgba(127,127,127,0.06)"],
                    backgroundBarRadius: 4,
                },
                columnWidth: "50%",
                barHeight: "100%",
            },
        },
        dataLabels: {
            enabled: false,
        },
        colors: ["#3e60d5", "#3ed5b9"],
        legend: {
            show: true,
            horizontalAlign: "center",
            offsetX: 0,
            offsetY: 6,
        },
        series: [
            {
                name: "Orders",
                data: data.map((r) => r.orders),
            },
            {
                name: "Revenue",
                data: data.map((r) => r.revenues),
            },
        ],
        xaxis: {
            categories: data.map((r) => r.date),
            axisBorder: {
                show: false,
            },
            axisTicks: {
                show: false,
            },
            labels: {
                formatter: (val) => {
                    return DateUtil.formatted(new Date(val), {
                        format: duration == "day" ? "DD MMM" : duration == "month" ? "MMM YY" : "YYYY",
                    });
                },
            },
        },
        yaxis: {
            axisBorder: {
                show: false,
            },
            axisTicks: {
                show: false,
            },
            labels: {
                show: false,
                formatter: function (val, e) {
                    if (e) {
                        if (e.seriesIndex == 0) {
                            return val.toString();
                        }
                        return "$" + StringUtil.convertToFixed(val) + "K";
                    }
                    return val.toString();
                },
            },
        },

        tooltip: {
            enabled: true,
            shared: true,
            intersect: false,
        },
        grid: {
            show: false,
        },
    };
};

const RevenueChart = () => {
    const [overviewDuration, setOverviewDuration] = useState<IEcommerceDashboardRevenueDuration>("year");

    const { state } = useLayoutContext();

    const options = useMemo(() => {
        return getOption(overviewDuration, state.theme);
    }, [overviewDuration, state.theme]);

    const currentStat = useMemo(() => {
        return getEcommerceDashboardRevenueStatData[overviewDuration];
    }, [overviewDuration]);

    return (
        <Card className="bg-base-100">
            <CardBody className="px-0 pb-0">
                <div className="px-6">
                    <div className="flex items-center justify-between">
                        <span className="font-medium">Revenue Statistics</span>
                        <Tabs variant="boxed" size={"sm"}>
                            <Tab onClick={() => setOverviewDuration("day")} active={overviewDuration == "day"}>
                                Day
                            </Tab>
                            <Tab onClick={() => setOverviewDuration("month")} active={overviewDuration == "month"}>
                                Month
                            </Tab>
                            <Tab onClick={() => setOverviewDuration("year")} active={overviewDuration == "year"}>
                                Year
                            </Tab>
                        </Tabs>
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                        <span className="text-4xl/none font-semibold">
                            ${StringUtil.convertToCurrency(currentStat.amount)}K
                        </span>
                        <span className="text-sm font-medium text-success">+{currentStat.percent}%</span>
                    </div>
                    <span className="text-sm text-base-content/70">Total income in this {overviewDuration}</span>
                </div>
                <div className="overflow-hidden rounded-xl">
                    <ApexChart options={options} height={280} type={"bar"} series={options.series}></ApexChart>
                </div>
            </CardBody>
        </Card>
    );
};

export default RevenueChart;
