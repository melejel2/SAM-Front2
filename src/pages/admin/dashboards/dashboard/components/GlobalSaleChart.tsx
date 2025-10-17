import { memo, useMemo, lazy, Suspense } from 'react';
import { ApexOptions } from "apexcharts";

// Lazy load ApexCharts to reduce initial bundle size
const ApexCharts = lazy(() => import("react-apexcharts"));

// Move static data outside component to prevent recreation
const data = [
    {
        name: "Turkey",
        orders: 9,
    },
    {
        name: "India",
        orders: 12,
    },
    {
        name: "Canada",
        orders: 13,
    },
    {
        name: "US",
        orders: 16,
    },
    {
        name: "Netherlands",
        orders: 14,
    },
    {
        name: "Italy",
        orders: 17,
    },
    {
        name: "Other",
        orders: 19,
    },
];

// Move static chart options outside component
const chartOptions: ApexOptions = {
    chart: {
        height: 344,
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
        formatter: function (val, opt) {
            return opt.w.globals.labels[opt.dataPointIndex] + ":  " + val;
        },
        offsetX: -10,
        dropShadow: {
            enabled: false,
        },
    },
    series: [
        {
            data: data.map((country) => country.orders),
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
        categories: data.map((country) => country.name),
    },
    yaxis: {
        labels: {
            show: false,
        },
    },
    grid: {
        show: false,
    },
    tooltip: {
        theme: "dark",
        x: {
            show: false,
        },
        y: {
            formatter: (val: number) => `${val}%`,
        },
    },
    colors: ["#7179ff", "#4bcd89", "#ff6c88", "#5cb7ff", "#9071ff", "#ff5892", "#ff8b4b"],
};

export const GlobalSaleChart = memo(() => {
    return (
        <Suspense fallback={<div className="h-[344px] flex items-center justify-center"><span className="loading loading-spinner loading-md"></span></div>}>
            <ApexCharts
                options={chartOptions}
                height={chartOptions.chart?.height}
                type={chartOptions.chart?.type}
                series={chartOptions.series}
            />
        </Suspense>
    );
});

GlobalSaleChart.displayName = 'GlobalSaleChart';
