interface CloseBtnProps {
    handleClose: () => void;
}

const CloseBtn: React.FC<CloseBtnProps> = ({ handleClose }) => {
    return (
        <button
            type="button"
            className="btn btn-sm btn-circle btn-ghost absolute top-2 right-2"
            onClick={handleClose}
            aria-label="Close">
            ✕
        </button>
    );
};

export default CloseBtn;
