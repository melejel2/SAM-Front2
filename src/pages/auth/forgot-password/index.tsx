import mailIcon from "@iconify/icons-lucide/mail";
import mailPlusIcon from "@iconify/icons-lucide/mail-plus";

import { Link } from "react-router-dom";

import { Button, Checkbox } from "@/components/daisyui";

import Icon from "@/components/Icon";
import PageMetaData from "@/components/PageMetaData";
import FormInput from "@/components/forms/FormInput";
import routes from "@/services/routes";

import useForgotPassword from "./use-forgot-password";
import { useState } from "react";

const ForgotPasswordPage = () => {
  const [isTermsAgreed, setIsTermsAgreed] = useState<boolean>(false);
  const { isLoading, control, onSubmit } = useForgotPassword();

  return (
    <>
      <PageMetaData title={"Forgot Password"} />
      <div className="flex items-center justify-center py-8 px-4 lg:px-6">
        {/* Card container: full width on mobile, with a responsive max-width */}
        <div className="p-6">
          <h3 className="text-center text-xl font-semibold">Forgot Password</h3>
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
            <div className="form-control">
              <label className="label">
                <span className="label-text">Email Address</span>
              </label>
              <FormInput
                size="sm"
                startIcon={
                  <Icon
                    icon={mailIcon}
                    className="text-base-content/80"
                    fontSize={18}
                  />
                }
                control={control}
                name="email"
                placeholder="Email Address"
                className="w-full focus:border-transparent focus:outline-0"
                bordered={false}
                borderOffset={false}
              />
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

            <div className="flex flex-col gap-3">
              <Button
                color="primary"
                loading={isLoading}
                type="submit"
                className="gap-3 text-base"
                fullWidth
                startIcon={<Icon icon={mailPlusIcon} fontSize={16} />}
                disabled={!isTermsAgreed || isLoading}
              >
                Send a reset link
              </Button>
            </div>
            <p className="mt-6 text-center text-sm text-base-content/80">
              I have already to{" "}
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

export default ForgotPasswordPage;
