import { Button } from "@/components/daisyui";

import IPCProgressTable from "./components/progressTable";

const IPCProgressStep = () => {
    return (
        <div className="flex h-full flex-col">
            <div className="flex items-center justify-between p-2">
                <div className="flex space-x-2">
                    <Button type="button" size="sm" color="primary">
                        <span className="iconify lucide--import size-4" />
                        <span>Import</span>
                    </Button>
                </div>
                <div className="flex items-center space-x-2">
                    <label className="input input-sm">
                        <span className="label">Date</span>
                        <input type="date" />
                    </label>
                    <label className="input input-sm">
                        <span className="label">From</span>
                        <input type="date" />
                    </label>
                    <label className="input input-sm">
                        <span className="label">To</span>
                        <input type="date" />
                    </label>
                </div>
            </div>
            <div className="h-[92%] p-2">
                <IPCProgressTable />
            </div>
        </div>
    );
};

export default IPCProgressStep;
