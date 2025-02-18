import { ReactNode } from "react";

import { Breadcrumbs, BreadcrumbsItem } from "@/components/daisyui";

type PageTitleProps = {
  title: string;
  subMenu: string;
  center?: ReactNode;
};

const PageTitle = ({ title, subMenu, center }: PageTitleProps) => {
  return (
    <div className="hidden lg:flex items-center justify-between">
      <h3 className="text-lg font-medium">{title}</h3>

      <Breadcrumbs className="hidden p-0 sm:inline">
        <BreadcrumbsItem className="text-base-content/60">
          {subMenu}
        </BreadcrumbsItem>
        {center ? (
          <>
            <BreadcrumbsItem className="text-base-content/60">
              {center}
            </BreadcrumbsItem>
            <BreadcrumbsItem>{title}</BreadcrumbsItem>
          </>
        ) : (
          <BreadcrumbsItem>{title}</BreadcrumbsItem>
        )}
      </Breadcrumbs>
    </div>
  );
};

export default PageTitle;
