type IMetaData = {
    title?: string;
    noIndex?: boolean;
};

export const MetaData = ({ title, noIndex }: IMetaData) => {
    return (
        <>
            <title>{`${title ? title + " |" : ""} SAM, Subcontracts Administrative Management`}</title>

            {noIndex && <meta name="robots" content="noindex" data-rh="true" />}
        </>
    );
};
