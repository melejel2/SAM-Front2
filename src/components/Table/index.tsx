import { Loader } from "../Loader";
import AccordionComponent from "./Components/Accordion";
import TableComponent from "./Components/Table";

interface SAMTableProps {
    columns: Record<string, string>;
    previewColumns?: Record<string, string>;
    tableData: any[];
    inputFields?: Array<{
        name: string;
        label: string;
        type: string;
        required: boolean;
        options?: string[];
    }>;
    actions?: boolean;
    title: string;
    loading: boolean;
    onSuccess: () => void;

    dynamicDialog?: boolean;
    openStaticDialog?: (type: "Add" | "Edit" | "Delete" | "Preview" | "Select", Data?: any) => void | Promise<void>;
    previewAction?: boolean;
    deleteAction?: boolean;
    editAction?: boolean;
    exportAction?: boolean;
    generateAction?: boolean;

    rowActions?: (row: any) => {
        generateAction?: boolean;
        editAction?: boolean;
        deleteAction?: boolean;
    };

    addBtn?: boolean;
    addBtnText?: string;
    onRowSelect?: (selectedRow: any) => void;

    showAvailableOnly?: boolean;
    onToggleAvailableOnly?: () => void;

    select?: boolean;

    editEndPoint?: string;
    createEndPoint?: string;
    deleteEndPoint?: string;
    hasSheets?: boolean;
    sheets?: any[];
    rowsPerPage?: number;
    previewLoadingRowId?: string | null;
}

const SAMTable: React.FC<SAMTableProps> = ({
    columns,
    previewColumns,
    tableData,
    inputFields,
    actions = false,
    previewAction,
    deleteAction,
    editAction,
    generateAction,
    exportAction,
    rowActions,
    title,
    loading,
    onSuccess,
    addBtn,
    addBtnText,
    dynamicDialog,
    openStaticDialog,
    onRowSelect,
    select,
    editEndPoint,
    createEndPoint,
    deleteEndPoint,
    hasSheets = false,
    sheets = [],
    rowsPerPage,
    previewLoadingRowId,
}) => {
    return (
        <div className="mt-5">
            {loading ? (
                <Loader />
            ) : (
                <>
                    <div className="hidden md:block">
                        <TableComponent
                            columns={columns}
                            tableData={tableData}
                            actions={actions}
                            inputFields={inputFields}
                            title={title}
                            previewAction={previewAction}
                            deleteAction={deleteAction}
                            editAction={editAction}
                            previewColumns={previewColumns}
                            addBtn={addBtn}
                            addBtnText={addBtnText}
                            dynamicDialog={dynamicDialog}
                            openStaticDialog={openStaticDialog}
                            onRowSelect={onRowSelect}
                            // Forward optional toggle props (if provided)
                            // Pass the select prop along
                            select={select}
                            editEndPoint={editEndPoint}
                            createEndPoint={createEndPoint}
                            deleteEndPoint={deleteEndPoint}
                            onSuccess={onSuccess}
                            hasSheets={hasSheets}
                            sheets={sheets}
                            rowsPerPage={rowsPerPage}
                            exportAction={exportAction}
                            generateAction={generateAction}
                            rowActions={rowActions}
                            previewLoadingRowId={previewLoadingRowId}
                        />
                    </div>

                    {/* Mobile Accordion */}
                    <div className="block md:hidden">
                        <AccordionComponent
                            columns={columns}
                            accordionData={tableData}
                            actions={actions}
                            inputFields={inputFields}
                            title={title}
                            previewAction={previewAction}
                            deleteAction={deleteAction}
                            editAction={editAction}
                            previewColumns={previewColumns}
                            addBtn={addBtn}
                            addBtnText={addBtnText}
                            dynamicDialog={dynamicDialog}
                            openStaticDialog={openStaticDialog}
                            // If needed, forward the select prop to the accordion as well
                            select={select}
                            previewLoadingRowId={previewLoadingRowId}
                        />
                    </div>
                </>
            )}
        </div>
    );
};

export default SAMTable;
