/**
 * Document Filename Generation Utility
 *
 * Generates document filenames matching the legacy SAM-Desktop naming conventions.
 *
 * IPC Pattern: {SubcontractorName}-{ContractNumber}-IPC#{Number:000}.{extension}
 * Contract Pattern: {ContractNumber}.{extension}
 * VO Pattern: {ContractNumber}-{VoNumber}.{extension}
 *
 * Examples:
 *   - ACME Construction-CNT-2024-001-IPC#001.xlsx (IPC)
 *   - CS-Test-001.docx (Contract)
 *   - CS-Test-001-VO-001.docx (Variation Order)
 */

import type { SaveIPCVM } from '@/types/ipc';

/**
 * Sanitizes filename to be safe for file systems
 * Replaces invalid characters with hyphens
 */
function sanitizeFileName(filename: string): string {
    return filename
        .replace(/[\/\\:*?"<>|]/g, '-')  // Replace invalid file system characters
        .replace(/\s+/g, ' ')             // Normalize whitespace
        .trim()                           // Remove leading/trailing spaces
        .substring(0, 200);               // Limit length for file systems
}

/**
 * Generates IPC filename matching SAM-Desktop convention
 *
 * @param ipc - IPC data object containing subcontractor name, contract number, and IPC number
 * @param extension - File extension without dot (e.g., 'xlsx', 'pdf', 'zip')
 * @returns Formatted filename with extension
 *
 * @example
 * const filename = generateIPCFileName(ipcData, 'xlsx');
 * // Returns: "ACME Construction-CNT-2024-001-IPC#001.xlsx"
 */
export function generateIPCFileName(ipc: SaveIPCVM | any, extension: 'xlsx' | 'pdf' | 'zip'): string {
    // Extract required fields
    const subcontractorName = ipc.subcontractorName || ipc.contractsDataset?.subcontractor?.name || 'Unknown';
    const contractNumber = ipc.contract || ipc.contractsDataset?.contractNumber || 'Unknown';
    const ipcNumber = ipc.number || 0;

    // Format IPC number with zero-padding to 3 digits (001, 015, 123)
    const formattedNumber = ipcNumber.toString().padStart(3, '0');

    // Construct filename: {SubcontractorName}-{ContractNumber}-IPC#{Number:000}
    const baseFilename = `${subcontractorName}-${contractNumber}-IPC#${formattedNumber}`;

    // Sanitize and add extension
    const sanitizedFilename = sanitizeFileName(baseFilename);

    return `${sanitizedFilename}.${extension}`;
}

/**
 * Generates IPC ZIP filename for document packages
 * Adds "_Documents" suffix to distinguish from single file exports
 *
 * @param ipc - IPC data object
 * @returns Formatted ZIP filename
 *
 * @example
 * const filename = generateIPCZipFileName(ipcData);
 * // Returns: "ACME Construction-CNT-2024-001-IPC#001_Documents.zip"
 */
export function generateIPCZipFileName(ipc: SaveIPCVM | any): string {
    const baseFilename = generateIPCFileName(ipc, 'zip');
    // Insert "_Documents" before the extension
    return baseFilename.replace('.zip', '_Documents.zip');
}

/**
 * Generates preview filename for IPC PDFs (used in modal previews)
 * Same as regular PDF but can be customized if needed
 */
export function generateIPCPreviewFileName(ipc: SaveIPCVM | any): string {
    return generateIPCFileName(ipc, 'pdf');
}

/**
 * Generates contract filename matching SAM-Desktop convention
 * Pattern: {ContractNumber}.{extension}
 *
 * @param contractNumber - Contract number (e.g., 'CS-Test-001')
 * @param extension - File extension without dot (e.g., 'docx', 'pdf')
 * @returns Formatted filename with extension
 *
 * @example
 * const filename = generateContractFileName('CS-Test-001', 'docx');
 * // Returns: "CS-Test-001.docx"
 */
export function generateContractFileName(contractNumber: string, extension: 'docx' | 'pdf'): string {
    const sanitized = sanitizeFileName(contractNumber);
    return `${sanitized}.${extension}`;
}

/**
 * Generates VO (Variation Order) filename matching SAM-Desktop convention
 * Pattern: {ContractNumber}-{VoNumber}.{extension}
 *
 * @param contractNumber - Contract number (e.g., 'CS-Test-001')
 * @param voNumber - VO number (e.g., 'VO-001')
 * @param extension - File extension without dot (e.g., 'docx', 'pdf')
 * @returns Formatted filename with extension
 *
 * @example
 * const filename = generateVOFileName('CS-Test-001', 'VO-001', 'docx');
 * // Returns: "CS-Test-001-VO-001.docx"
 */
export function generateVOFileName(contractNumber: string, voNumber: string, extension: 'docx' | 'pdf' = 'docx'): string {
    const baseFilename = `${contractNumber}-${voNumber}`;
    const sanitized = sanitizeFileName(baseFilename);
    return `${sanitized}.${extension}`;
}
