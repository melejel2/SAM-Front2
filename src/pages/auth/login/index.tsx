import { useState } from "react";
import { Link } from "react-router";

import { MetaData } from "@/components/MetaData";

const LoginPage = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [isTermsAgreed, setIsTermsAgreed] = useState<boolean>(false);

    return (
        <>
            <MetaData title="Login" />
            {/* Outer container with responsive padding and full viewport height */}
            <div className="flex items-center justify-center px-4 py-12 lg:px-6">
                {/* Card container: full width on mobile, with a responsive max-width */}
                <div className="px-6">
                    <h3 className="text-center text-xl font-semibold">Login</h3>
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

                        <div className="text-end">
                            <Link className="label-text text-base-content/80 text-xs" to="/auth/forgot-password">
                                Forgot Password?
                            </Link>
                        </div>

                        <div className="mt-4 flex items-center gap-3 md:mt-6">
                            <input
                                className="checkbox checkbox-xs checkbox-primary"
                                aria-label="Checkbox"
                                type="checkbox"
                                id="agreement"
                                onChange={() => setIsTermsAgreed(!isTermsAgreed)}
                            />
                            <label htmlFor="agreement" className="text-sm">
                                I agree with
                                <span className="text-primary ms-1 cursor-pointer hover:underline">
                                    terms and conditions
                                </span>
                            </label>
                        </div>

                        <Link to="/dashboard" className="btn btn-primary btn-wide mt-2 max-w-full gap-3">
                            <span className="iconify lucide--log-in size-4" />
                            Login
                        </Link>

                        <button className="btn btn-ghost btn-wide border-base-300 max-w-full gap-3">
                            <img
                                src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg"
                                className="size-4.5"
                                alt=""
                            />
                            Sign in with Microsoft
                        </button>

                        <p className="text-base-content/80 mt-4 text-center text-sm md:mt-6">
                            Haven&apos;t account
                            <Link className="text-primary ms-1 hover:underline" to="/auth/register">
                                Create One
                            </Link>
                        </p>
                    </form>
                </div>
            </div>
        </>
    );
};

export default LoginPage;
