import SAMTable from "@/components/Table";

import useContractsDatabase from "../../../contracts-database/use-contracts-database";

interface IPCContractStepProps {
    onSelectContract?: (contract: any) => void;
}

const IPCContractStep: React.FC<IPCContractStepProps> = ({ onSelectContract }) => {
    const { contractsColumns, contractsData } = useContractsDatabase();

    return (
        <div>
            <SAMTable
                columns={contractsColumns}
                tableData={contractsData}
                title={"Contracts"}
                loading={false}
                onSuccess={() => {}}
                onRowSelect={onSelectContract}
            />
        </div>
    );
};

export default IPCContractStep;
