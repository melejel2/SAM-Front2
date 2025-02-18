import PageMetaData from "@/components/PageMetaData";
import PageTitle from "@/components/PageTitle";
import SAMTable from "@/components/Table/Components/Table";
import useUsers from "./use-users";

const Users = () => {
  const { columns, tableData, inputFields, hasActions } = useUsers();

  return (
    <div>
      <PageMetaData title={"Users"} />

      <PageTitle title={"Users"} subMenu={"Admin tools"} />
      <div>
        <SAMTable
          columns={columns}
          tableData={tableData}
          inputFields={inputFields}
          actions={hasActions}
          title={"Users"}
          loading={false}
        />
      </div>
    </div>
  );
};

export default Users;
