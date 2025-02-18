import error404Image from "@/assets/images/landscape/error-404.svg";

import { Link } from "react-router-dom";

import PageMetaData from "@/components/PageMetaData";
import routes from "@/services/routes";

const NotFoundPage = () => {
    return (
        <>
            <PageMetaData title={"Not Found - 404"} />

            <div className="flex h-screen w-screen flex-col items-center justify-center">
                <img src={error404Image} alt="error" className="max-h-[400px]" />
                <Link to={routes.landing} className="btn btn-primary mt-5">
                    Go to Home
                </Link>
            </div>
        </>
    );
};

export default NotFoundPage;
