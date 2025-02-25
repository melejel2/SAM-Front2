const Icon = ({ icon, fontSize = 4, className = "" }: { icon: string; fontSize?: number; className?: string }) => {
    return <span className={`iconify lucide--${icon} size-${fontSize} ${className}`} />;
};

export default Icon;
