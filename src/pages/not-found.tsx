import { Link } from "react-router";

import { MetaData } from "@/components/MetaData";

const NotFoundPage = () => {
    return (
        <>
            <MetaData title="Not Found - 404" noIndex />

            <div className="flex h-screen w-screen flex-col items-center justify-center">
                <img src="/images/landscape/error-404.svg" alt="error" className="max-h-[400px]" />
                <Link to="/" className="btn btn-primary mt-5">
                    Go to Home
                </Link>
            </div>
        </>
    );
};

export default NotFoundPage;
