import { useState } from "react";

const useUsers = () => {
  const [hasActions, _] = useState<boolean>(true);

  const columns = {
    id: "ID",
    name: "Name",
    username: "Username",
    password: "Password",
    site_name: "Site Name",
    type: "Type",
    last_login: "Last Login",
  };
  const tableData = [
    {
      id: "1",
      name: "Ralph BOU JAOUDE",
      username: "raboujaoude",
      password: "***",
      site_name:
        "Passcam Yaounde, Passcam Douala, Maroua CHR, Centre Hospitalier Y, Garoua CHR, Ngaoundere CHR, Bertoua CHR, CM Office",
      type: "Operations Manager",
      last_login: "11/12/2024",
    },
    {
      id: "2",
      name: "Ralph BOU JAOUDE",
      username: "raboujaoude",
      password: "***",
      site_name:
        "Passcam Yaounde, Passcam Douala, Maroua CHR, Centre Hospitalier Y, Garoua CHR, Ngaoundere CHR, Bertoua CHR, CM Office",
      type: "Operations Manager",
      last_login: "11/12/2024",
    },
    {
      id: "3",
      name: "Ralph BOU JAOUDE",
      username: "raboujaoude",
      password: "***",
      site_name:
        "Passcam Yaounde, Passcam Douala, Maroua CHR, Centre Hospitalier Y, Garoua CHR, Ngaoundere CHR, Bertoua CHR, CM Office",
      type: "Operations Manager",
      last_login: "11/12/2024",
    },
  ];

  const inputFields = [
    {
      name: "type",
      label: "Type",
      type: "select",
      required: true,
      options: ["option 1", "option 2", "option 3", "option 4", "option 5"],
    },
    {
      name: "name",
      label: "Name",
      type: "text",
      required: true,
    },
    {
      name: "username",
      label: "Username",
      type: "text",
      required: true,
    },
    {
      name: "password",
      label: "Password",
      type: "text",
      required: true,
    },

    {
      name: "site",
      label: "Site",
      type: "select",
      required: true,
      options: ["option 1", "option 2", "option 3", "option 4", "option 5"],
    },
  ];

  return {
    columns,
    tableData,
    inputFields,
    hasActions,
  };
};

export default useUsers;
