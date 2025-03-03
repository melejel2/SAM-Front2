import { useState } from "react";
import { Link } from "react-router";

import Icon from "@/components/Icon";
import { MetaData } from "@/components/MetaData";
import { Button, Checkbox, Select, SelectOption } from "@/components/daisyui";

import useLogin from "./use-login";

const LoginPage = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [isTermsAgreed, setIsTermsAgreed] = useState<boolean>(false);

    const { onSubmit, databases, isLoading, error } = useLogin();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [selectedDb, setSelectedDb] = useState(databases[0] ?? "");

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
                            onSubmit({
                                username: email,
                                password: password,
                                db: selectedDb,
                            });
                        }}>
                        <fieldset className="fieldset">
                            <legend className="fieldset-legend">Database</legend>
                            <label className="input w-full focus:outline-0">
                                <Icon icon={"server"} fontSize={5} className="text-base-content/40" />
                                <Select
                                    className="w-full border-none bg-transparent focus:ring-0 focus:outline-none"
                                    value={selectedDb}
                                    required
                                    onChange={(e) => setSelectedDb(e.target.value)}>
                                    {databases.map((db) => (
                                        <SelectOption
                                            key={db}
                                            value={db}
                                            className="bg-base-100"
                                            hidden={db === databases[0]}>
                                            {db}
                                        </SelectOption>
                                    ))}
                                </Select>
                            </label>

                            <legend className="fieldset-legend">Email</legend>
                            <label className="input w-full focus:outline-0">
                                <Icon icon={"user-2"} fontSize={5} className="text-base-content/40" />
                                <input
                                    disabled={!selectedDb || selectedDb === databases[0]}
                                    className="grow focus:outline-0"
                                    placeholder="Email Address"
                                    type="text"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </label>

                            <legend className="fieldset-legend">Password</legend>
                            <label className="input w-full focus:outline-0">
                                <Icon icon={"key-round"} fontSize={5} className="text-base-content/40" />
                                <input
                                    disabled={!selectedDb || selectedDb === databases[0]}
                                    className="grow focus:outline-0"
                                    placeholder="Password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    className="btn btn-xs btn-ghost btn-circle"
                                    onClick={() => setShowPassword(!showPassword)}
                                    type="button">
                                    {showPassword ? <Icon icon={"eye-off"} /> : <Icon icon={"eye"} />}
                                </button>
                            </label>
                            {error && <div className="text-error">{error}</div>}

                            <div className="text-end">
                                <Link className="label-text text-base-content/80 text-xs" to="/auth/forgot-password">
                                    Forgot Password?
                                </Link>
                            </div>
                        </fieldset>
                        <div className="mt-4 flex items-center gap-3 md:mt-6">
                            <Checkbox
                                color="primary"
                                size="xs"
                                aria-label="agreement"
                                onChange={() => setIsTermsAgreed(!isTermsAgreed)}
                            />
                            <label className="text-sm">
                                I agree with
                                <span className="text-primary ms-1 cursor-pointer hover:underline">
                                    terms and conditions
                                </span>
                            </label>
                        </div>
                        <Button
                            color="primary"
                            className="btn-wide mt-2 max-w-full"
                            disabled={!isTermsAgreed || isLoading}>
                            {isLoading ? "Logging in..." : "Login"}
                        </Button>
                        <Button
                            color="ghost"
                            className="btn-wide border-base-300 max-w-full gap-3"
                            disabled={!isTermsAgreed}>
                            <img
                                src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg"
                                className="size-4.5"
                                alt="Microsoft Logo"
                            />
                            Sign in with Microsoft
                        </Button>
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
