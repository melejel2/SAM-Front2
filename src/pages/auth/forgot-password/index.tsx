import { useState } from "react";
import { Link } from "react-router";

import Icon from "@/components/Icon";
import { MetaData } from "@/components/MetaData";
import { Button } from "@/components/daisyui";

const ForgotPasswordPage = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [isTermsAgreed, setIsTermsAgreed] = useState<boolean>(false);

    return (
        <>
            <MetaData title="Forgot Password" />
            {/* Outer container with responsive padding and full viewport height */}
            <div className="flex items-center justify-center px-4 py-12 lg:px-6">
                {/* Card container: full width on mobile, with a responsive max-width */}
                <div className="px-6">
                    <h3 className="text-center text-xl font-semibold">Reset Password</h3>
                    <p className="text-base-content/70 mx-6 mt-2 text-center text-sm">
                        Seamless Access: Your Gateway to your Portal!
                    </p>
                    <form
                        className="mt-8 space-y-4"
                        onSubmit={(e) => {
                            e.preventDefault();
                            // onSubmit();
                        }}>
                        <fieldset className="fieldset">
                            <legend className="fieldset-legend">Email</legend>
                            <label className="input w-full focus:outline-0">
                                <span className="iconify lucide--user-2 text-base-content/80 size-5"></span>
                                <input className="grow focus:outline-0" placeholder="Email Address" type="email" />
                            </label>
                        </fieldset>

                        <div className="mt-4 flex items-center gap-3 md:mt-6">
                            <input
                                className="checkbox checkbox-xs checkbox-primary"
                                aria-label="Checkbox"
                                type="checkbox"
                                onChange={() => setIsTermsAgreed(!isTermsAgreed)}
                            />
                            <label className="text-sm">
                                I agree with
                                <span className="text-primary ms-1 cursor-pointer hover:underline">
                                    terms and conditions
                                </span>
                            </label>
                        </div>

                        <Button color="primary" className="btn-wide mt-2 max-w-full" disabled={!isTermsAgreed}>
                            <Link to="/auth/reset-password" className="btn btn-wide btn-ghost max-w-full gap-3">
                                <Icon icon={"mail-plus"} />
                                Send a reset link
                            </Link>
                        </Button>

                        <p className="text-base-content/80 mt-4 text-center text-sm md:mt-6">
                            I have already to
                            <Link className="text-primary ms-1 hover:underline" to="/auth/login">
                                Login
                            </Link>
                        </p>
                    </form>
                </div>
            </div>
        </>
    );
};

export default ForgotPasswordPage;
