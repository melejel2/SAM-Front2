import pencilIcon from "@iconify/icons-lucide/pencil";
import plusIcon from "@iconify/icons-lucide/plus";
import trashIcon from "@iconify/icons-lucide/trash";
import previewIcon from "@iconify/icons-lucide/eye";

import { useState } from "react";

import { Button, useDialog } from "@/components/daisyui";

import Icon from "@/components/Icon";
import DialogComponent from "./Dialog";

interface AccordionProps {
  rowData: object;
  actions: boolean;
  showAction?: boolean;
  deleteAction?: boolean;
  editAction?: boolean;
  onEdit?: (data: any) => void;
  onDelete?: (id: number) => void;
  onShow?: (data: any) => void;
  title: string;
  // Added property for selectable mode
  select?: boolean;
}

interface AccordionsProps {
  accordionData: any[];
  columns: Record<string, string>;
  previewColumns?: Record<string, string>;
  actions: boolean;
  showAction?: boolean;
  deleteAction?: boolean;
  editAction?: boolean;
  inputFields: Array<{
    name: string;
    label: string;
    type: string;
    required: boolean;
  }>;
  title: string;
  addBtn?: boolean;
  // Added property for selectable mode
  select?: boolean;
}

const Accordion: React.FC<AccordionProps> = ({
  onDelete,
  onEdit,
  onShow,
  title,
  rowData,
  actions,
  showAction,
  deleteAction,
  editAction,
  select, // now destructured and used
}) => {
  const handleDelete = () => {
    if (onDelete) {
      onDelete(0); // Replace 0 with appropriate id if needed
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(rowData);
    }
  };

  return (
    <div className="collapse collapse-arrow bg-base-200">
      <input type="radio" name="my-accordion-2" />
      <div className="collapse-title text-xl font-medium">{title}</div>
      <div className="collapse-content text-lg space-y-2">
        {/* If select mode is enabled, show a checkbox */}
        {select && (
          <div className="flex items-center mb-2">
            <input type="checkbox" className="checkbox" />
            <span className="ml-2 text-sm">Select</span>
          </div>
        )}
        {Object.entries(rowData).map(([key, value], index) => (
          <span key={index} className="block">
            {key}: {value}
          </span>
        ))}
        {actions && (
          <div className="w-full flex justify-end items-center">
            {showAction && (
              <Button
                color="ghost"
                size="sm"
                shape={"square"}
                aria-label="Preview"
                onClick={() => {
                  if (onShow) onShow(rowData);
                }}
              >
                <Icon
                  icon={previewIcon}
                  className="text-base-content/70"
                  fontSize={15}
                />
              </Button>
            )}
            {editAction && (
              <Button
                color="ghost"
                size="sm"
                shape={"square"}
                aria-label="Edit"
                onClick={handleEdit}
              >
                <Icon
                  icon={pencilIcon}
                  className="text-base-content/70"
                  fontSize={15}
                />
              </Button>
            )}
            {deleteAction && (
              <Button
                color="ghost"
                className="text-error/70 hover:bg-error/20"
                size="sm"
                shape={"square"}
                aria-label="Delete"
                onClick={handleDelete}
              >
                <Icon icon={trashIcon} fontSize={16} />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const AccordionComponent: React.FC<AccordionsProps> = ({
  actions,
  accordionData,
  inputFields,
  title,
  showAction,
  deleteAction,
  editAction,
  addBtn,
  select, // destructured here as well
}) => {
  const { dialogRef, handleShow, handleHide } = useDialog();
  const [dialogType, setDialogType] = useState<"Add" | "Edit" | "Preview">(
    "Add"
  );
  const [currentRow, setCurrentRow] = useState<any | null>(null);

  const openDialog = () => {
    setDialogType("Add");
    setCurrentRow(null);
    handleShow();
  };

  const openEditDialog = (data: any) => {
    setDialogType("Edit");
    setCurrentRow(data);
    handleShow();
  };

  const openPreviewDialog = (data: any) => {
    setDialogType("Preview");
    setCurrentRow(data);
    handleShow();
  };

  const handleDelete = (id: number) => {
    console.log(`Delete row with ID: ${id}`);
  };

  const handleSuccess = () => {
    console.log("Dialog action completed!");
    handleHide();
  };

  return (
    <>
      {addBtn && (
        <Button
          onClick={openDialog}
          className="btn btn-ghost btn-xs h-8 border border-base-content/20 mb-4"
        >
          <Icon icon={plusIcon} fontSize={16} />
          New {title}
        </Button>
      )}
      <div className="w-full space-y-4">
        {accordionData.map((data, index) => (
          <Accordion
            rowData={data}
            key={index}
            onEdit={openEditDialog}
            onDelete={handleDelete}
            onShow={openPreviewDialog}
            title={"title"}
            actions={actions}
            showAction={showAction}
            editAction={editAction}
            deleteAction={deleteAction}
            select={select} // pass the prop to each Accordion
          />
        ))}
      </div>

      {(addBtn || actions) && (
        <DialogComponent
          dialogRef={dialogRef}
          handleHide={handleHide}
          dialogType={dialogType}
          current={currentRow}
          onSuccess={handleSuccess}
          inputFields={inputFields}
          title={title}
        />
      )}
    </>
  );
};

export default AccordionComponent;
