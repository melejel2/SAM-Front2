import { Helmet } from "react-helmet-async";

type PageMetaDataProps = {
  title: string;
};

const PageMetaData = ({ title }: PageMetaDataProps) => {
  return (
    <Helmet>
      <title> {title} | SAM, Subcontracts Administrative Management</title>
    </Helmet>
  );
};

export default PageMetaData;
