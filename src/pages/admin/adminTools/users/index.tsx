import { memo, useCallback, useEffect, useState, useMemo } from "react";
import { Icon } from "@iconify/react";
import arrowLeftIcon from "@iconify/icons-lucide/arrow-left";
import plusIcon from "@iconify/icons-lucide/plus";
import pencilIcon from "@iconify/icons-lucide/pencil";
import trashIcon from "@iconify/icons-lucide/trash-2";

import { Spreadsheet } from "@/components/Spreadsheet";
import type { SpreadsheetColumn } from "@/components/Spreadsheet";
import { Loader } from "@/components/Loader";
import { usePermissions } from "@/hooks/use-permissions";
import { useTopbarContent } from "@/contexts/topbar-content";
import { useNavigationBlocker } from "@/contexts/navigation-blocker";

import useUsers, { User, USER_ROLES, USER_ROLE_LABELS, UserRole } from "./use-users";

const Users = memo(() => {
    const {
        tableData,
        loading,
        saving,
        getUsers,
        createUser,
        updateUser,
        deleteUser,
    } = useUsers();

    const { canManageUsers } = usePermissions();
    const { setLeftContent, clearContent } = useTopbarContent();
    const { tryNavigate } = useNavigationBlocker();

    // Modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        userName: "",
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        password: "",
        userRole: "" as UserRole | "",
    });

    useEffect(() => {
        getUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleBackToAdminTools = useCallback(() => {
        tryNavigate("/admin-tools");
    }, [tryNavigate]);

    const leftTopbarContent = useMemo(() => (
        <button
            onClick={handleBackToAdminTools}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-base-200 hover:bg-base-300 transition-colors"
            title="Back to Admin Tools"
        >
            <Icon icon={arrowLeftIcon} className="w-5 h-5" />
        </button>
    ), [handleBackToAdminTools]);

    useEffect(() => {
        setLeftContent(leftTopbarContent);
    }, [leftTopbarContent, setLeftContent]);

    useEffect(() => {
        return () => {
            clearContent();
        };
    }, [clearContent]);

    // Handlers
    const handleAdd = useCallback(() => {
        setFormData({
            userName: "",
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            password: "",
            userRole: "",
        });
        setShowAddModal(true);
    }, []);

    const handleEdit = useCallback((user: User) => {
        setSelectedUser(user);
        setFormData({
            userName: user.userName || "",
            firstName: user.firstName || "",
            lastName: user.lastName || "",
            email: user.email || "",
            phone: user.phone || "",
            password: "", // Don't populate password for editing
            userRole: user.userRole || "",
        });
        setShowEditModal(true);
    }, []);

    const handleDelete = useCallback((user: User) => {
        setSelectedUser(user);
        setShowDeleteModal(true);
    }, []);

    const handleAddSubmit = useCallback(async () => {
        if (!formData.userRole) return;
        const result = await createUser({
            userName: formData.userName,
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            password: formData.password,
            userRole: formData.userRole as UserRole,
        });
        if (result.success) {
            setShowAddModal(false);
            setFormData({
                userName: "",
                firstName: "",
                lastName: "",
                email: "",
                phone: "",
                password: "",
                userRole: "",
            });
        }
    }, [createUser, formData]);

    const handleEditSubmit = useCallback(async () => {
        if (!selectedUser || !formData.userRole) return;
        const userData: User = {
            id: selectedUser.id,
            userName: formData.userName,
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            userRole: formData.userRole as UserRole,
        };
        // Only include password if it was changed
        if (formData.password) {
            userData.password = formData.password;
        }
        const result = await updateUser(userData);
        if (result.success) {
            setShowEditModal(false);
            setSelectedUser(null);
            setFormData({
                userName: "",
                firstName: "",
                lastName: "",
                email: "",
                phone: "",
                password: "",
                userRole: "",
            });
        }
    }, [updateUser, selectedUser, formData]);

    const handleDeleteConfirm = useCallback(async () => {
        if (!selectedUser) return;
        const result = await deleteUser(selectedUser.id);
        if (result.success) {
            setShowDeleteModal(false);
            setSelectedUser(null);
        }
    }, [deleteUser, selectedUser]);

    // Spreadsheet columns
    const columns = useMemo(
        (): SpreadsheetColumn<User>[] => [
            {
                key: "firstName",
                label: "First Name",
                width: 150,
                align: "left",
                editable: false,
                sortable: true,
                filterable: true,
            },
            {
                key: "lastName",
                label: "Last Name",
                width: 150,
                align: "left",
                editable: false,
                sortable: true,
                filterable: true,
            },
            {
                key: "userName",
                label: "Username",
                width: 150,
                align: "left",
                editable: false,
                sortable: true,
                filterable: true,
            },
            {
                key: "email",
                label: "Email",
                width: 250,
                align: "left",
                editable: false,
                sortable: true,
                filterable: true,
            },
            {
                key: "phone",
                label: "Phone",
                width: 150,
                align: "left",
                editable: false,
                sortable: true,
                filterable: true,
            },
            {
                key: "userRole",
                label: "Role",
                width: 200,
                align: "left",
                editable: false,
                sortable: true,
                filterable: true,
                render: (value: UserRole) => USER_ROLE_LABELS[value] || value,
            },
        ],
        []
    );

    // Row actions
    const renderActions = useCallback(
        (row: User) => {
            if (!canManageUsers) return null;

            return (
                <div className="flex items-center gap-1">
                    <button
                        className="btn btn-ghost btn-xs text-info hover:bg-info/20"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(row);
                        }}
                        title="Edit"
                    >
                        <Icon icon={pencilIcon} className="w-4 h-4" />
                    </button>
                    <button
                        className="btn btn-ghost btn-xs text-error hover:bg-error/20"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(row);
                        }}
                        title="Delete"
                    >
                        <Icon icon={trashIcon} className="w-4 h-4" />
                    </button>
                </div>
            );
        },
        [canManageUsers, handleEdit, handleDelete]
    );

    // Toolbar
    const toolbar = useMemo(() => {
        if (!canManageUsers) return null;

        return (
            <div className="flex items-center justify-end w-full px-4 py-2">
                <button
                    onClick={handleAdd}
                    className="btn btn-sm bg-green-600 text-white hover:bg-green-700 flex items-center gap-2"
                >
                    <Icon icon={plusIcon} className="size-4" />
                    <span>New User</span>
                </button>
            </div>
        );
    }, [canManageUsers, handleAdd]);

    // Check if form is valid for add
    const isAddFormValid = useMemo(() => {
        return (
            formData.userName.trim() !== "" &&
            formData.firstName.trim() !== "" &&
            formData.lastName.trim() !== "" &&
            formData.email.trim() !== "" &&
            formData.password.trim() !== "" &&
            formData.userRole !== ""
        );
    }, [formData]);

    // Check if form is valid for edit (password is optional)
    const isEditFormValid = useMemo(() => {
        return (
            formData.userName.trim() !== "" &&
            formData.firstName.trim() !== "" &&
            formData.lastName.trim() !== "" &&
            formData.email.trim() !== "" &&
            formData.userRole !== ""
        );
    }, [formData]);

    if (loading) {
        return (
            <Loader
                icon="users"
                subtitle="Loading: Users"
                description="Preparing user data..."
            />
        );
    }

    return (
        <div className="h-full flex flex-col overflow-hidden">
            <div className="flex-1 min-h-0">
                <Spreadsheet<User>
                    data={tableData}
                    columns={columns}
                    mode="view"
                    loading={loading}
                    emptyMessage="No users found"
                    persistKey="admin-users-spreadsheet"
                    rowHeight={40}
                    actionsRender={canManageUsers ? renderActions : undefined}
                    actionsColumnWidth={100}
                    onRowDoubleClick={canManageUsers ? handleEdit : undefined}
                    getRowId={(row) => row.id}
                    toolbar={toolbar}
                    allowKeyboardNavigation
                    allowColumnResize
                    allowSorting
                    allowFilters
                />
            </div>

            {/* Add Modal */}
            {showAddModal && (
                <div className="modal modal-open">
                    <div className="modal-box max-w-lg">
                        <h3 className="font-bold text-lg mb-4">Add New User</h3>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">First Name *</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="input input-bordered w-full"
                                        value={formData.firstName}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                firstName: e.target.value,
                                            }))
                                        }
                                        placeholder="Enter first name"
                                    />
                                </div>
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">Last Name *</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="input input-bordered w-full"
                                        value={formData.lastName}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                lastName: e.target.value,
                                            }))
                                        }
                                        placeholder="Enter last name"
                                    />
                                </div>
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Username *</span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered w-full"
                                    value={formData.userName}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            userName: e.target.value,
                                        }))
                                    }
                                    placeholder="Enter username"
                                />
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Email *</span>
                                </label>
                                <input
                                    type="email"
                                    className="input input-bordered w-full"
                                    value={formData.email}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            email: e.target.value,
                                        }))
                                    }
                                    placeholder="Enter email address"
                                />
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Phone</span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered w-full"
                                    value={formData.phone}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            phone: e.target.value,
                                        }))
                                    }
                                    placeholder="Enter phone number"
                                />
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Password *</span>
                                </label>
                                <input
                                    type="password"
                                    className="input input-bordered w-full"
                                    value={formData.password}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            password: e.target.value,
                                        }))
                                    }
                                    placeholder="Enter password"
                                />
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Role *</span>
                                </label>
                                <select
                                    className="select select-bordered w-full"
                                    value={formData.userRole}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            userRole: e.target.value as UserRole,
                                        }))
                                    }
                                >
                                    <option value="">Select a role</option>
                                    {USER_ROLES.map((role) => (
                                        <option key={role} value={role}>
                                            {USER_ROLE_LABELS[role]}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="modal-action">
                            <button
                                className="btn btn-ghost"
                                onClick={() => setShowAddModal(false)}
                                disabled={saving}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleAddSubmit}
                                disabled={saving || !isAddFormValid}
                            >
                                {saving ? (
                                    <>
                                        <span className="loading loading-spinner loading-xs"></span>
                                        <span>Creating...</span>
                                    </>
                                ) : (
                                    <span>Create User</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && selectedUser && (
                <div className="modal modal-open">
                    <div className="modal-box max-w-lg">
                        <h3 className="font-bold text-lg mb-4">Edit User</h3>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">First Name *</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="input input-bordered w-full"
                                        value={formData.firstName}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                firstName: e.target.value,
                                            }))
                                        }
                                        placeholder="Enter first name"
                                    />
                                </div>
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">Last Name *</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="input input-bordered w-full"
                                        value={formData.lastName}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                lastName: e.target.value,
                                            }))
                                        }
                                        placeholder="Enter last name"
                                    />
                                </div>
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Username *</span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered w-full"
                                    value={formData.userName}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            userName: e.target.value,
                                        }))
                                    }
                                    placeholder="Enter username"
                                />
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Email *</span>
                                </label>
                                <input
                                    type="email"
                                    className="input input-bordered w-full"
                                    value={formData.email}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            email: e.target.value,
                                        }))
                                    }
                                    placeholder="Enter email address"
                                />
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Phone</span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered w-full"
                                    value={formData.phone}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            phone: e.target.value,
                                        }))
                                    }
                                    placeholder="Enter phone number"
                                />
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">
                                        Password (leave blank to keep current)
                                    </span>
                                </label>
                                <input
                                    type="password"
                                    className="input input-bordered w-full"
                                    value={formData.password}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            password: e.target.value,
                                        }))
                                    }
                                    placeholder="Enter new password"
                                />
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Role *</span>
                                </label>
                                <select
                                    className="select select-bordered w-full"
                                    value={formData.userRole}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            userRole: e.target.value as UserRole,
                                        }))
                                    }
                                >
                                    <option value="">Select a role</option>
                                    {USER_ROLES.map((role) => (
                                        <option key={role} value={role}>
                                            {USER_ROLE_LABELS[role]}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="modal-action">
                            <button
                                className="btn btn-ghost"
                                onClick={() => {
                                    setShowEditModal(false);
                                    setSelectedUser(null);
                                }}
                                disabled={saving}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleEditSubmit}
                                disabled={saving || !isEditFormValid}
                            >
                                {saving ? (
                                    <>
                                        <span className="loading loading-spinner loading-xs"></span>
                                        <span>Saving...</span>
                                    </>
                                ) : (
                                    <span>Save Changes</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {showDeleteModal && selectedUser && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg text-error mb-4">Delete User</h3>
                        <p className="mb-4">
                            Are you sure you want to delete the user{" "}
                            <strong>
                                {selectedUser.firstName} {selectedUser.lastName}
                            </strong>{" "}
                            ({selectedUser.userName})?
                        </p>
                        <p className="text-sm text-base-content/70 mb-4">
                            This action cannot be undone.
                        </p>
                        <div className="modal-action">
                            <button
                                className="btn btn-ghost"
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setSelectedUser(null);
                                }}
                                disabled={saving}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-error text-white"
                                onClick={handleDeleteConfirm}
                                disabled={saving}
                            >
                                {saving ? (
                                    <>
                                        <span className="loading loading-spinner loading-xs"></span>
                                        <span>Deleting...</span>
                                    </>
                                ) : (
                                    <span>Delete User</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});

Users.displayName = "Users";

export default Users;
