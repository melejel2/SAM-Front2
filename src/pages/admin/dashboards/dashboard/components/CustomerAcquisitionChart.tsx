import { ApexOptions } from "apexcharts";
import ApexCharts from "react-apexcharts";

const chartOptions: ApexOptions = {
    chart: {
        height: 356,
        sparkline: {
            enabled: false,
        },
        toolbar: {
            show: false,
        },
        zoom: {
            enabled: false,
        },
        background: "transparent",
    },
    forecastDataPoints: {
        count: 2,
        dashArray: [6, 4],
    },
    grid: {
        show: false,
    },
    yaxis: {
        show: false,
        min: 125,
        max: 181,
    },
    xaxis: {
        categories: Array.from({ length: 15 }, (_, index) => index + 1),
    },
    tooltip: {
        y: {
            formatter: (val) => val.toString(),
        },
    },
    stroke: {
        curve: "stepline",
        width: [2, 1.5],
    },
    colors: ["#167bff", "rgba(150,150,150,0.3)"],
    series: [
        {
            name: "Customer",
            data: [144, 150, 146, 154, 150, 155, 160, 155, 140, 155, 160, 180, 170, 165, 165],
        },
        {
            name: "Advertise",
            data: [140, 142, 142, 140, 146, 148, 150, 136, 130, 133, 145, 148, 158, 150, 150],
        },
    ],
};

export const CustomerAcquisitionChart = () => {
    return (
        <ApexCharts
            options={chartOptions}
            height={chartOptions.chart?.height}
            type="line"
            series={chartOptions.series}></ApexCharts>
    );
};
