import checkIcon from "@iconify/icons-lucide/check";
import eyeIcon from "@iconify/icons-lucide/eye";
import eyeOffIcon from "@iconify/icons-lucide/eye-off";
import keyRoundIcon from "@iconify/icons-lucide/key-round";

import { Link } from "react-router-dom";

import { Button } from "@/components/daisyui";

import Icon from "@/components/Icon";
import PageMetaData from "@/components/PageMetaData";
import FormInput from "@/components/forms/FormInput";
import routes from "@/services/routes";

import useResetPassword from "./use-reset-password";

const ResetPasswordPage = () => {
  const { isLoading, control, onSubmit, showPassword, toggleShowPassword } =
    useResetPassword();

  return (
    <>
      <PageMetaData title={"Reset Password"} />

      <div className="flex items-center justify-center py-8 px-4 lg:px-6">
        {/* Card container: full width on mobile, with a responsive max-width */}
        <div className="p-6">
          <h3 className="text-center text-xl font-semibold">Reset Password</h3>
          <p className="mt-2 text-center text-sm text-base-content/70 mx-6">
            Seamless Access: Your Gateway to your Portal!
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
                  placeholder="Password"
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

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Re Password</span>
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
                    name="re-password"
                    placeholder="re-password"
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
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                color="primary"
                loading={isLoading}
                type="submit"
                className="gap-3 text-base"
                fullWidth
                startIcon={<Icon icon={checkIcon} fontSize={16} />}
                disabled={isLoading}
              >
                Change Password
              </Button>
            </div>
            <p className="mt-6 text-center text-sm text-base-content/80">
              Go to{" "}
              <Link
                className="text-primary hover:underline"
                to={routes.auth.login}
              >
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
