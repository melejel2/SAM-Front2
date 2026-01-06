import { Loader } from "../Loader";
import AccordionComponent from "./Components/Accordion";
import TableComponent from "./Components/Table";

interface SAMTableProps {
    columns: Record<string, any>;
    previewColumns?: Record<string, any>;
    tableData: any[];
    inputFields?: Array<{
        name: string;
        label: string;
        type: string;
        required: boolean;
        placeholder?: string;
        options?: string[];
    }>;
    actions?: boolean;
    title: string;
    loading: boolean;
    onSuccess: () => void;

    dynamicDialog?: boolean;
    openStaticDialog?: (type: "Add" | "Edit" | "Delete" | "Preview" | "Details" | "Select" | "Terminate" | "Export" | "Generate" | "Unissue", Data?: any, extraData?: any) => void | Promise<void>;
    previewAction?: boolean;
    deleteAction?: boolean;
    editAction?: boolean;
    detailsAction?: boolean;
    exportAction?: boolean;
    generateAction?: boolean;
    unissueAction?: boolean;

    rowActions?: (row: any) => {
        generateAction?: boolean;
        editAction?: boolean;
        deleteAction?: boolean;
        terminateAction?: boolean;
        exportAction?: boolean;
        unissueAction?: boolean;
    };

    addBtn?: boolean;
    addBtnText?: string;
    onRowSelect?: (selectedRow: any) => void;
    selectedRowId?: number | null;

    showAvailableOnly?: boolean;
    onToggleAvailableOnly?: () => void;

    select?: boolean;

    editEndPoint?: string;
    createEndPoint?: string;
    deleteEndPoint?: string;
    hasSheets?: boolean;
    sheets?: any[];
    activeSheetId?: number;
    onSheetSelect?: (sheetId: number) => void;
    customHeaderContent?: React.ReactNode;
    rowsPerPage?: number;
    previewLoadingRowId?: string | null;
    exportingRowId?: string | null;
    onItemUpdate?: (item: any) => void | Promise<void>;
    onItemCreate?: (item: any) => void | Promise<void>;
    onItemDelete?: (item: any) => void | Promise<void>;
    inlineEditable?: boolean;
    onInlineEdit?: (rowId: any, field: string, value: any) => void;

    // Added for VO editing
    contractIdentifier?: string; // Identifier for navigation
    contractId?: string; // Actual contract ID
    isNested?: boolean;

    // Virtualization options for large lists
    virtualized?: boolean; // Enable virtualization for large datasets
    rowHeight?: number; // Height of each row in pixels (default: 40)
    overscan?: number; // Number of rows to render outside viewport (default: 10)
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
    unissueAction,
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
    activeSheetId,
    onSheetSelect,
    customHeaderContent,
    rowsPerPage,
    previewLoadingRowId,
    exportingRowId,
    selectedRowId,
    onItemUpdate,
    onItemCreate,
    onItemDelete,
    inlineEditable,
    onInlineEdit,
    contractIdentifier,
    contractId,
    isNested,
    // Virtualization props
    virtualized,
    rowHeight,
    overscan,
}) => {
    return (
        <div className="mt-5 flex h-full w-full flex-col" style={{ minHeight: 0 }}>
            {loading ? (
                <Loader />
            ) : (
                <>
                    <div className="hidden w-full md:block" style={{ flex: 1, minHeight: 0 }}>
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
                            activeSheetId={activeSheetId}
                            onSheetSelect={onSheetSelect}
                            customHeaderContent={customHeaderContent}
                            rowsPerPage={rowsPerPage}
                            exportAction={exportAction}
                            generateAction={generateAction}
                            unissueAction={unissueAction}
                            rowActions={rowActions}
                            previewLoadingRowId={previewLoadingRowId}
                            exportingRowId={exportingRowId}
                            selectedRowId={selectedRowId}
                            onItemUpdate={onItemUpdate}
                            onItemCreate={onItemCreate}
                            onItemDelete={onItemDelete}
                            inlineEditable={inlineEditable}
                            onInlineEdit={onInlineEdit}
                            contractIdentifier={contractIdentifier}
                            contractId={contractId}
                            isNested={isNested}
                            virtualized={virtualized}
                            rowHeight={rowHeight}
                            overscan={overscan}
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
