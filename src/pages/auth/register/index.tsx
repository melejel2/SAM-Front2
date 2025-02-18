import { useState } from "react";
import { Link } from "react-router-dom";

import mailIcon from "@iconify/icons-lucide/mail";
import userIcon from "@iconify/icons-lucide/user";
import userPlusIcon from "@iconify/icons-lucide/user-plus";

import { Button, Checkbox } from "@/components/daisyui";
import Icon from "@/components/Icon";
import PageMetaData from "@/components/PageMetaData";
import FormInput from "@/components/forms/FormInput";
import routes from "@/services/routes";
import useRegister from "./use-register";

const RegisterPage = () => {
  const { isLoading, control, onSubmit } = useRegister();

  const [isTermsAgreed, setIsTermsAgreed] = useState<boolean>(false);

  return (
    <>
      <PageMetaData title={"Register"} />
      <div className="flex items-center justify-center py-8 px-4 lg:px-6">
        {/* Card container: full width on mobile, with a responsive max-width */}
        <div className="p-6">
          <h3 className="text-center text-xl font-semibold">Register</h3>
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
                  <span className="label-text">Name</span>
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
                  placeholder="Name"
                  className="w-full focus:border-transparent focus:outline-0"
                  bordered={false}
                  borderOffset={false}
                />
              </div>
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
            </div>

            <div className="flex flex-col gap-3">
              <Button
                color="primary"
                loading={isLoading}
                type="submit"
                className="gap-3 text-base"
                fullWidth
                startIcon={<Icon icon={userPlusIcon} fontSize={16} />}
                disabled={!isTermsAgreed || isLoading}
              >
                Register
              </Button>
            </div>
            <p className="mt-6 text-center text-sm text-base-content/80">
              Already have an account?{" "}
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

export default RegisterPage;
