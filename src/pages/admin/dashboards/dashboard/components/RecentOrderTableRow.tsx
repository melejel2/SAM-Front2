export type IRecentOrderTableRow = {
    image: string;
    name: string;
    price: number;
    date: string;
    status: "delivered" | "on_going" | "confirmed" | "canceled" | "waiting";
};

export const RecentOrderTableRow = ({ image, price, status, date, name }: IRecentOrderTableRow) => {
    return (
        <tr className="hover:bg-base-200">
            <td className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 sm:whitespace-nowrap text-xs sm:text-sm font-medium text-base-content">
                <input aria-label="checked-order" type="checkbox" className="checkbox checkbox-sm" />
            </td>
            <td className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 sm:whitespace-nowrap text-xs sm:text-sm font-medium text-base-content">
                <div className="flex items-center space-x-3">
                    <img alt="order image" className="mask mask-squircle bg-base-200 size-7.5" src={image} />
                    <p>{name}</p>
                </div>
            </td>
            <td className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 sm:whitespace-nowrap text-xs sm:text-sm font-medium text-base-content">${price}</td>
            <td className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 sm:whitespace-nowrap text-xs sm:text-sm font-medium text-base-content">{date}</td>
            <td className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 sm:whitespace-nowrap text-xs sm:text-sm font-medium text-base-content">
                {status == "delivered" && <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-50 text-green-700 border border-green-200">Delivered</span>}
                {status == "on_going" && <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">On Going</span>}
                {status == "confirmed" && <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-50 text-purple-700 border border-purple-200">Confirmed</span>}
                {status == "canceled" && <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-50 text-red-700 border border-red-200">Canceled</span>}
                {status == "waiting" && <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200">Waiting</span>}
            </td>
            <td className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 sm:whitespace-nowrap text-xs sm:text-sm font-medium text-base-content">
                <div className="flex items-center gap-1">
                    <button aria-label="Show product" className="btn btn-square btn-ghost btn-xs">
                        <span className="iconify lucide--eye text-base-content/60 size-4" />
                    </button>
                    <button
                        aria-label="Show product"
                        className="btn btn-square btn-error btn-outline btn-xs border-transparent">
                        <span className="iconify lucide--trash size-4" />
                    </button>
                </div>
            </td>
        </tr>
    );
};
