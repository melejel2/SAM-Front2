import { useState } from "react";
import { Link } from "react-router";

import { MetaData } from "@/components/MetaData";

const ResetPasswordPage = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [isTermsAgreed, setIsTermsAgreed] = useState<boolean>(false);

    return (
        <>
            <MetaData title="Reset Password" />
            {/* Outer container with responsive padding and full viewport height */}
            <div className="flex items-center justify-center px-4 py-12 lg:px-6">
                {/* Card container: full width on mobile, with a responsive max-width */}
                <div className="px-6">
                    <h3 className="text-center text-xl font-semibold">Reset Password</h3>
                    <p className="text-base-content/70 mx-6 mt-2 text-center text-sm">
                        Seamless Access: Your Gateway to your Portal!
                    </p>
                    <form
                        className="mt-8"
                        onSubmit={(e) => {
                            e.preventDefault();
                            // onSubmit();
                        }}>
                        <fieldset className="fieldset">
                            <legend className="fieldset-legend">Password</legend>
                            <label className="input w-full focus:outline-0">
                                <span className="iconify lucide--key-round text-base-content/80 size-5"></span>
                                <input
                                    className="grow focus:outline-0"
                                    placeholder="Password"
                                    type={showPassword ? "text" : "password"}
                                />
                                <button
                                    className="btn btn-xs btn-ghost btn-circle"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label="Password">
                                    {showPassword ? (
                                        <span className="iconify lucide--eye-off size-4" />
                                    ) : (
                                        <span className="iconify lucide--eye size-4" />
                                    )}
                                </button>
                            </label>
                        </fieldset>
                        <fieldset className="fieldset">
                            <legend className="fieldset-legend">Re Password</legend>
                            <label className="input w-full focus:outline-0">
                                <span className="iconify lucide--key-round text-base-content/80 size-5"></span>
                                <input
                                    className="grow focus:outline-0"
                                    placeholder="Re Password"
                                    type={showPassword ? "text" : "password"}
                                />
                                <button
                                    className="btn btn-xs btn-ghost btn-circle"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label="Password">
                                    {showPassword ? (
                                        <span className="iconify lucide--eye-off size-4" />
                                    ) : (
                                        <span className="iconify lucide--eye size-4" />
                                    )}
                                </button>
                            </label>
                        </fieldset>

                        <Link to="/auth/login" className="btn btn-primary btn-wide mt-6 max-w-full gap-3">
                            <span className="iconify lucide--check size-4" />
                            Change Password
                        </Link>

                        <p className="text-base-content/80 mt-4 text-center text-sm md:mt-6">
                            Go to
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

export default ResetPasswordPage;
