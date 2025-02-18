import FilePondPluginImagePreview from "filepond-plugin-image-preview";
import "filepond-plugin-image-preview/dist/filepond-plugin-image-preview.min.css";
import "filepond/dist/filepond.css";
import { FilePond, FilePondProps, registerPlugin } from "react-filepond";

registerPlugin(FilePondPluginImagePreview);

const FileUploader = (props: FilePondProps) => {
    return <FilePond {...props} />;
};

export default FileUploader;
