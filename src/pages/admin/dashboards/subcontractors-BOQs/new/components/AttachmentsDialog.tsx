import React, { useState } from 'react';
import { FilePond, registerPlugin } from 'react-filepond';
import 'filepond/dist/filepond.min.css';
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type';

registerPlugin(FilePondPluginFileValidateType);

export enum AttachmentsType {
  Plans = 0,
  PlansHSE = 1,
  UnitePrice = 2,
  BoqAtt = 3,
  PrescriptionTechniques = 4,
  Other = 5,
  DocumentsJuridiques = 6
}

interface ContractAttachment {
  id?: number;
  type: AttachmentsType;
  file?: File;
  hasExistingFile?: boolean;
  fileName?: string;
  uploadDate?: string;
}

interface AttachmentsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  attachments: ContractAttachment[];
  onChange: (attachments: ContractAttachment[]) => void;
}

const ATTACHMENT_CATEGORIES = [
  { value: AttachmentsType.Plans, label: 'Technical Plans', annexe: 'Annexe F' },
  { value: AttachmentsType.BoqAtt, label: 'BOQ Attachment', annexe: 'Annexe D' },
  { value: AttachmentsType.PrescriptionTechniques, label: 'Technical Specifications', annexe: 'Annexe E' },
  { value: AttachmentsType.PlansHSE, label: 'HSE Plans', annexe: 'Annexe H' },
  { value: AttachmentsType.UnitePrice, label: 'Unit Price', annexe: 'Annexe I' },
  { value: AttachmentsType.DocumentsJuridiques, label: 'Legal Documents', annexe: 'Annexe J' },
  { value: AttachmentsType.Other, label: 'Other Documents', annexe: 'Annexe 1' }
];

export const AttachmentsDialog: React.FC<AttachmentsDialogProps> = ({ 
  isOpen, 
  onClose, 
  attachments, 
  onChange 
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const getAttachmentByType = (type: AttachmentsType): ContractAttachment | undefined => {
    return attachments.find(att => att.type === type);
  };

  const handleFileAdd = (type: AttachmentsType, files: File[]) => {
    if (files.length === 0) return;
    
    const file = files[0];
    const newAttachment: ContractAttachment = {
      type,
      file,
      fileName: file.name,
      uploadDate: new Date().toISOString()
    };

    const updatedAttachments = attachments.filter(att => att.type !== type);
    updatedAttachments.push(newAttachment);
    onChange(updatedAttachments);
  };

  const handleFileRemove = (type: AttachmentsType) => {
    const updatedAttachments = attachments.filter(att => att.type !== type);
    onChange(updatedAttachments);
  };

  const getButtonText = (category: any): string => {
    const attachment = getAttachmentByType(category.value);
    if (attachment) {
      return `Delete ${category.label}`;
    }
    return `${category.annexe}: ${category.label}`;
  };


  const getUploadedCount = () => attachments.length;
  const getRequiredCount = () => ATTACHMENT_CATEGORIES.filter(cat => cat.required).length;
  const getRequiredUploadedCount = () => {
    const requiredTypes = ATTACHMENT_CATEGORIES.filter(cat => cat.required).map(cat => cat.value);
    return attachments.filter(att => requiredTypes.includes(att.type)).length;
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box w-11/12 max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-lg">Contract Attachments</h3>
          <button className="btn btn-sm btn-circle btn-ghost" onClick={onClose}>✕</button>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm text-base-content/70">
            <span className="font-medium">{getUploadedCount()}</span> of {ATTACHMENT_CATEGORIES.length} attachments
          </div>
          <div className="text-xs text-base-content/50">
            PDF files only
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {ATTACHMENT_CATEGORIES.map((category) => {
            const attachment = getAttachmentByType(category.value);
            
            return (
              <div key={category.value} className="border border-base-300 rounded-lg p-4 bg-base-50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`badge badge-sm ${
                      attachment ? 'badge-success' : 'badge-ghost'
                    }`}>
                      {category.annexe}
                    </span>
                    <span className="font-medium text-sm">{category.label}</span>
                  </div>
                  {attachment && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs text-base-content/60 hover:text-error"
                      onClick={() => handleFileRemove(category.value)}
                    >
                      ✕
                    </button>
                  )}
                </div>
                
                {attachment ? (
                  <div className="flex items-center gap-3 p-3 bg-success/5 border border-success/20 rounded">
                    <span className="text-success">📄</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-success text-sm truncate">{attachment.fileName}</div>
                      <div className="text-xs text-base-content/60">
                        {new Date(attachment.uploadDate!).toLocaleDateString()}
                      </div>
                    </div>
                    <span className="text-success text-sm">✓</span>
                  </div>
                ) : (
                  <FilePond
                    acceptedFileTypes={['application/pdf']}
                    allowMultiple={false}
                    maxFiles={1}
                    name="attachment"
                    labelIdle='Drag & drop PDF or <span class="filepond--label-action">Browse</span>'
                    onupdatefiles={(files) => {
                      if (files.length > 0) {
                        handleFileAdd(category.value, files.map(f => f.file as File));
                      }
                    }}
                    className="filepond-compact"
                    stylePanelLayout="compact"
                  />
                )}
              </div>
            );
          })}
        </div>


        <div className="modal-action">
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};