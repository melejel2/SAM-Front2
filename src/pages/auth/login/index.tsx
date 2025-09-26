import { useEffect, useState } from "react";
import { Link } from "react-router";

import Icon from "@/components/Icon";
import { MetaData } from "@/components/MetaData";
import { Button, Checkbox, Select, SelectOption } from "@/components/daisyui";

import useLogin from "./use-login";

const LoginPage = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [isTermsAgreed, setIsTermsAgreed] = useState<boolean>(false);

    const { onSubmit, databases, isLoading, isMicrosoftLoading, error, onMicrosoftLogin } = useLogin();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [selectedDb, setSelectedDb] = useState("");

    useEffect(() => {
        if (databases.length > 0 && !selectedDb) {
            setSelectedDb(databases[0]);
        }
    }, [databases, selectedDb]);

    return (
        <>
            <MetaData title="Login" />
            <div className="w-full px-8 py-6">
                <h3 className="text-center text-xl font-semibold">Login</h3>
                <p className="text-base-content/70 mt-2 text-center text-sm">
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
                                <Icon icon={"database"} fontSize={5} className="text-base-content/40" />
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

                            <legend className="fieldset-legend">Username</legend>
                            <label className="input w-full focus:outline-0">
                                <Icon icon={"user-2"} fontSize={5} className="text-base-content/40" />
                                <input
                                    disabled={!selectedDb || selectedDb === databases[0]}
                                    className="grow focus:outline-0"
                                    placeholder="Username"
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
                            {error && <div className="text-error">{String(error)}</div>}

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
                            disabled={!isTermsAgreed || isLoading || !selectedDb || !email || !password}>
                            {isLoading ? "Logging in..." : "Login"}
                        </Button>
                        <Button
                            color="ghost"
                            className="btn-wide border-base-300 max-w-full gap-3"
                            type="button"
                            disabled={!isTermsAgreed || isLoading || isMicrosoftLoading || !selectedDb || selectedDb === "Select Database"}
                            onClick={() => onMicrosoftLogin(selectedDb)}>
                            {isMicrosoftLoading ? (
                                <>
                                    <span className="loading loading-spinner loading-sm"></span>
                                    <span>Signing in...</span>
                                </>
                            ) : (
                                <>
                                    <img
                                        src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg"
                                        className="size-4.5"
                                        alt="Microsoft Logo"
                                    />
                                    <span>Sign in with Microsoft</span>
                                </>
                            )}
                        </Button>
                        <p className="text-base-content/80 mt-4 text-center text-sm md:mt-6">
                            Haven&apos;t account
                            <Link className="text-primary ms-1 hover:underline" to="/auth/register">
                                Create One
                            </Link>
                        </p>
                    </form>
                </div>
        </>
    );
};

export default LoginPage;
