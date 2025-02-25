import { Loader } from "../Loader";
import AccordionComponent from "./Components/Accordion";
import TableComponent from "./Components/Table";

interface SAMTableProps {
    columns: Record<string, string>;
    previewColumns?: Record<string, string>;
    tableData: any[];
    inputFields: Array<{
        name: string;
        label: string;
        type: string;
        required: boolean;
        options?: string[];
    }>;
    actions: boolean;
    title: string;
    loading: boolean;
    dynamicDialog?: boolean;
    openStaticDialog?: (type: "Add" | "Edit" | "Preview" | "Select", Data?: any) => void;
    showAction?: boolean;
    deleteAction?: boolean;
    editAction?: boolean;
    addBtn?: boolean;
    onRowSelect?: (selectedRow: any) => void;

    // These are optional
    showAvailableOnly?: boolean;
    onToggleAvailableOnly?: () => void;

    // Added property for selectable mode
    select?: boolean;
}

const SAMTable: React.FC<SAMTableProps> = ({
    columns,
    previewColumns,
    tableData,
    inputFields,
    actions,
    showAction,
    deleteAction,
    editAction,
    title,
    loading,
    addBtn,
    dynamicDialog,
    openStaticDialog,
    onRowSelect,
    showAvailableOnly,
    onToggleAvailableOnly,
    select, // destructure the new prop
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
                            showAction={showAction}
                            deleteAction={deleteAction}
                            editAction={editAction}
                            previewColumns={previewColumns}
                            addBtn={addBtn}
                            dynamicDialog={dynamicDialog}
                            openStaticDialog={openStaticDialog}
                            onRowSelect={onRowSelect}
                            // Forward optional toggle props (if provided)
                            showAvailableOnly={showAvailableOnly}
                            onToggleAvailableOnly={onToggleAvailableOnly}
                            // Pass the select prop along
                            select={select}
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
                            showAction={showAction}
                            deleteAction={deleteAction}
                            editAction={editAction}
                            previewColumns={previewColumns}
                            addBtn={addBtn}
                            // If needed, forward the select prop to the accordion as well
                            select={select}
                        />
                    </div>
                </>
            )}
        </div>
    );
};

export default SAMTable;
