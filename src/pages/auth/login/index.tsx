import { useState } from "react";
import eyeIcon from "@iconify/icons-lucide/eye";
import eyeOffIcon from "@iconify/icons-lucide/eye-off";
import keyRoundIcon from "@iconify/icons-lucide/key-round";
import logInIcon from "@iconify/icons-lucide/log-in";
import userIcon from "@iconify/icons-lucide/user-2";
import { Link } from "react-router-dom";
import { Button, Checkbox } from "@/components/daisyui";
import Icon from "@/components/Icon";
import PageMetaData from "@/components/PageMetaData";
import FormInput from "@/components/forms/FormInput";
import routes from "@/services/routes";
import useLogin from "./use-login";

const LoginPage = () => {
  const {
    isLoading,
    control,
    onSubmit,
    showPassword,
    toggleShowPassword,
    onMicrosoftLogin,
  } = useLogin();
  const [isTermsAgreed, setIsTermsAgreed] = useState<boolean>(false);

  return (
    <>
      <PageMetaData title="Login" />
      {/* Outer container with responsive padding and full viewport height */}
      <div className="flex items-center justify-center py-8 px-4 lg:px-6">
        {/* Card container: full width on mobile, with a responsive max-width */}
        <div className="p-6">
          <h3 className="text-center text-xl font-semibold">Login</h3>
          <p className="mt-2 text-center text-sm text-base-content/70 mx-6">
            Seamless Access: Your Gateway to your Portal!
            {/* Seamless Access: Your Gateway to your work Standards! */}
          </p>
          {/* Wrap inputs in a form for semantic grouping */}
          <form
            className="mt-8 space-y-6"
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit();
            }}
          >
            <div className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Email</span>
                </label>
                <FormInput
                  size="sm"
                  startIcon={
                    <Icon
                      icon={userIcon}
                      className="text-base-content/80"
                      fontSize={18}
                    />
                  }
                  control={control}
                  name="username"
                  placeholder=""
                  className="w-full focus:border-transparent focus:outline-0"
                  bordered={false}
                  borderOffset={false}
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Password</span>
                </label>
                <FormInput
                  size="sm"
                  startIcon={
                    <Icon
                      icon={keyRoundIcon}
                      className="text-base-content/80"
                      fontSize={18}
                    />
                  }
                  control={control}
                  name="password"
                  placeholder=""
                  type={showPassword ? "text" : "password"}
                  className="w-full focus:border-transparent focus:outline-0"
                  bordered={false}
                  endIcon={
                    <Button
                      onClick={toggleShowPassword}
                      size="xs"
                      shape="circle"
                      color="ghost"
                      className="hover:bg-base-content/10"
                      type="button"
                    >
                      {showPassword ? (
                        <Icon
                          icon={eyeOffIcon}
                          className="text-base-content/80"
                          fontSize={18}
                        />
                      ) : (
                        <Icon
                          icon={eyeIcon}
                          className="text-base-content/80"
                          fontSize={16}
                        />
                      )}
                    </Button>
                  }
                  borderOffset={false}
                />

                <label className="label">
                  <span className="label-text"></span>
                  <Link
                    className="label-text text-xs text-base-content/80"
                    to={routes.auth.forgotPassword}
                  >
                    Forgot Password?
                  </Link>
                </label>
              </div>
              <div className="flex items-center gap-3">
                <Checkbox
                  size="xs"
                  color="primary"
                  onChange={() => setIsTermsAgreed(!isTermsAgreed)}
                />
                <label className="text-sm">
                  I agree with{" "}
                  <span className="cursor-pointer text-primary underline">
                    terms and conditions
                  </span>
                </label>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                color="primary"
                loading={isLoading}
                type="submit"
                className="gap-3 text-base"
                fullWidth
                startIcon={<Icon icon={logInIcon} fontSize={16} />}
                disabled={!isTermsAgreed || isLoading}
              >
                Login
              </Button>
              <Button
                onClick={onMicrosoftLogin}
                className="gap-3 text-base w-full bg-base-100 border border-base-300 text-base-content hover:bg-base-200"
                type="button"
                disabled={!isTermsAgreed || isLoading}
              >
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg"
                  alt="Microsoft Logo"
                  className="w-5 h-5"
                />
                Sign in with Microsoft
              </Button>
            </div>
            <p className="mt-6 text-center text-sm text-base-content/80">
              Haven&apos;t account?{" "}
              <Link
                className="text-primary hover:underline"
                to={routes.auth.register}
              >
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
