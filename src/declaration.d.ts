import {
    ApexForecastDataPoints as ApexForecastDataPointsType,
    type ApexGrid as ApexGridType,
    type ApexStroke as ApexStrokeType,
} from "apexcharts";

declare module "path";

declare module "filepond-plugin-image-preview";
declare module "nice-select2";

declare module "apexcharts" {
    type ApexGrid = ApexGridType & {
        strokeDashArray?: number | number[];
    };

    type ApexStroke = ApexStrokeType & {
        dashArray: number | number[];
    };

    type ApexForecastDataPoints = ApexForecastDataPointsType & {
        dashArray: number | number[];
    };
}

declare global {
    interface Window {
        ApexCharts: any;
    }
}

declare module "react" {
    interface CSSProperties {
        "anchor-name"?: string;
        "position-anchor"?: string;
        "--value"?: string | number;
        "--thickness"?: string | number;
        "--size"?: string | number;
    }
}
