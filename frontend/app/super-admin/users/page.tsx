
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

import "./users.css";

import userService, {
    UserResponseDto
} from "@/app/apiservice/userservice";

function UsersList() {

    const router = useRouter();

    const [users, setUsers] = useState<UserResponseDto[]>([]);
    const [companyId, setCompanyId] = useState<number | null>(null);
    const [companyName, setCompanyName] = useState("");

    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [selectedUser, setSelectedUser] =
        useState<UserResponseDto | null>(null);

    const [form, setForm] = useState({
        name: "",
        email: "",
        phone: "",
        role: ""
    });

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    useEffect(() => {
        const storedId = localStorage.getItem("company_view_id");

        if (!storedId || !Number.isInteger(Number(storedId)) || Number(storedId) <= 0) {
            setLoading(false);

            Swal.fire({
                icon: "warning",
                title: "Company not selected",
                text: "Please select a company first."
            }).then(() => {
                router.push("/companies");
            });

            return;
        }

        setCompanyId(Number(storedId));
    }, [router]);

    useEffect(() => {
        if (companyId !== null) {
            fetchUsers();
        }
    }, [companyId]);

    const fetchUsers = async () => {
        if (companyId === null) return;

        try {
            setLoading(true);

            const response = await userService.getUsersByCompanyId({
                companyId
            });

            const userList = Array.isArray(response) ? response : [];

            setUsers(userList);

            if (userList.length > 0) {
                setCompanyName(userList[0].companyName || "");
            }

        } catch (error: any) {
            console.error("Failed to load users:", error);

            Swal.fire({
                icon: "error",
                title: "Unable to load users",
                text: error?.response?.data?.message ||
                    "Something went wrong while fetching users."
            });

        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = useMemo(() => {
        const value = search.toLowerCase().trim();

        return users.filter((user) =>
            [
                user.name,
                user.email,
                user.phone,
                user.role
            ].some((item) =>
                item?.toLowerCase().includes(value)
            )
        );
    }, [users, search]);

    const totalPages = Math.ceil(filteredUsers.length / pageSize);

    const paginatedUsers = filteredUsers.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [search, pageSize]);

    const handleEdit = (user: UserResponseDto) => {

        setSelectedUser(user);

        setForm({
            name: user.name || "",
            email: user.email || "",
            phone: user.phone || "",
            role: user.role || ""
        });

        setShowModal(true);
    };

    const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!selectedUser || companyId === null) return;

        if (!form.name.trim() || !form.email.trim() || !form.role.trim()) {
            Swal.fire({
                icon: "warning",
                title: "Required fields",
                text: "Name, email and role are required."
            });
            return;
        }

        try {
            setSaving(true);

            const updatedUser = await userService.updateUser({
                id: selectedUser.id,
                name: form.name.trim(),
                email: form.email.trim(),
                phone: form.phone.trim(),
                role: form.role.trim(),
                companyId
            });

            setUsers((prev) =>
                prev.map((user) =>
                    user.id === selectedUser.id
                        ? { ...user, ...updatedUser }
                        : user
                )
            );

            setShowModal(false);
            setSelectedUser(null);

            Swal.fire({
                toast: true,
                position: "top-end",
                icon: "success",
                title: "User updated successfully",
                showConfirmButton: false,
                timer: 2000
            });

        } catch (error: any) {
            Swal.fire({
                icon: "error",
                title: "Update failed",
                text: error?.response?.data?.message ||
                    "Unable to update user."
            });

        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (user: UserResponseDto) => {

        const result = await Swal.fire({
            title: "Delete User?",
            text: `Are you sure you want to delete ${user.name}?`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#dc3545",
            cancelButtonColor: "#6c757d",
            confirmButtonText: "Yes, delete",
            cancelButtonText: "Cancel",
            reverseButtons: true
        });

        if (!result.isConfirmed) return;

        try {
            await userService.deleteUser({
                id: user.id
            });

            setUsers((prev) =>
                prev.filter((item) => item.id !== user.id)
            );

            Swal.fire({
                toast: true,
                position: "top-end",
                icon: "success",
                title: "User deleted successfully",
                showConfirmButton: false,
                timer: 2000
            });

        } catch (error: any) {
            Swal.fire({
                icon: "error",
                title: "Delete failed",
                text: error?.response?.data?.message ||
                    "Unable to delete user."
            });
        }
    };

    const closeModal = () => {
        if (saving) return;

        setShowModal(false);
        setSelectedUser(null);
    };

    const handleBack = () => {
        router.push("/companies");
    };

    return (
        <section className="user-lists">


            <div className="users-header-actions">
                <button
                    className="users-add-btn"
                    onClick={() => router.push("/super-admin/users/add-user")}
                    disabled={companyId === null}
                >
                    <i className="bi bi-plus-lg"></i>
                    Add User
                </button>

                <button
                    className="users-refresh-btn"
                    onClick={fetchUsers}
                    disabled={loading || companyId === null}
                >
                    <i className={`bi bi-arrow-clockwise ${loading ? "users-spin" : ""}`}></i>
                    Refresh
                </button>
            </div>

            <div className="users-summary">

                <div className="users-summary-card">

                    <div className="users-summary-icon">
                        <i className="bi bi-people"></i>
                    </div>

                    <div>
                        <span>Total Users</span>
                        <h3>{loading ? "..." : users.length}</h3>
                    </div>

                </div>

                <div className="users-summary-card">

                    <div className="users-summary-icon active">
                        <i className="bi bi-person-check"></i>
                    </div>

                    <div>
                        <span>Active Users</span>
                        <h3>
                            {loading
                                ? "..."
                                : users.filter(user => user.status === true).length}
                        </h3>
                    </div>

                </div>

                <div className="users-summary-card">

                    <div className="users-summary-icon inactive">
                        <i className="bi bi-person-x"></i>
                    </div>

                    <div>
                        <span>Inactive Users</span>
                        <h3>
                            {loading
                                ? "..."
                                : users.filter(user => user.status === false).length}
                        </h3>
                    </div>

                </div>

            </div>

            <div className="users-table-card">

                <div className="users-table-header">

                    <div>
                        <h4>All Users</h4>
                        <p>Users associated with this company</p>
                    </div>

                </div>

                <div className="users-toolbar">

                    <div className="users-search">
                        <i className="bi bi-search"></i>

                        <input
                            type="text"
                            placeholder="Search name, email, phone or role..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />

                        {search && (
                            <button onClick={() => setSearch("")}>
                                <i className="bi bi-x-lg"></i>
                            </button>
                        )}
                    </div>

                    <span className="users-count">
                        {filteredUsers.length} users found
                    </span>

                </div>

                <div className="users-table-responsive">

                    <table className="users-table">

                        <thead>
                            <tr>
                                <th>#</th>
                                <th>USER</th>
                                <th>EMAIL</th>
                                <th>PHONE</th>
                                <th>ROLE</th>
                                <th>STATUS</th>
                                <th>ACTIONS</th>
                            </tr>
                        </thead>

                        <tbody>

                            {loading ? (

                                <tr>
                                    <td colSpan={7} className="users-empty">
                                        <div className="users-loader"></div>
                                        Loading users...
                                    </td>
                                </tr>

                            ) : paginatedUsers.length === 0 ? (

                                <tr>
                                    <td colSpan={7} className="users-empty">

                                        <div className="users-empty-icon">
                                            <i className="bi bi-people"></i>
                                        </div>

                                        <strong>
                                            {search ? "No users found" : "No users available"}
                                        </strong>

                                        <span>
                                            {search
                                                ? "Try another search."
                                                : "There are no users registered under this company."}
                                        </span>

                                    </td>
                                </tr>

                            ) : (

                                paginatedUsers.map((user, index) => (

                                    <tr key={user.id}>

                                        <td>
                                            {(currentPage - 1) * pageSize + index + 1}
                                        </td>

                                        <td>
                                            <div className="users-name-cell">

                                                <div className="users-avatar">
                                                    {user.name?.charAt(0)?.toUpperCase() || "U"}
                                                </div>

                                                <span>{user.name}</span>

                                            </div>
                                        </td>

                                        <td>{user.email}</td>

                                        <td>{user.phone || "-"}</td>

                                        <td>
                                            <span className="users-role">
                                                {user.role}
                                            </span>
                                        </td>

                                        <td>
                                            <span className={`users-status ${user.status ? "enabled" : "disabled"}`}>
                                                <span></span>
                                                {user.status ? "Active" : "Inactive"}
                                            </span>
                                        </td>

                                        <td>
                                            <div className="users-action-buttons">

                                                <button
                                                    className="users-action-btn edit"
                                                    title="Edit user"
                                                    onClick={() => handleEdit(user)}
                                                >
                                                    <i className="bi bi-pencil-square"></i>
                                                </button>

                                                <button
                                                    className="users-action-btn delete"
                                                    title="Delete user"
                                                    onClick={() => handleDelete(user)}
                                                >
                                                    <i className="bi bi-trash3"></i>
                                                </button>

                                            </div>
                                        </td>

                                    </tr>

                                ))

                            )}

                        </tbody>

                    </table>

                </div>

                {!loading && filteredUsers.length > 0 && (

                    <div className="users-pagination">

                        <div className="users-page-size">
                            <span>Rows per page</span>

                            <select
                                value={pageSize}
                                onChange={(e) => setPageSize(Number(e.target.value))}
                            >
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                        </div>

                        <div className="users-pagination-controls">

                            <span>
                                {(currentPage - 1) * pageSize + 1} -{" "}
                                {Math.min(currentPage * pageSize, filteredUsers.length)}
                                {" "}of {filteredUsers.length}
                            </span>

                            <button
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(prev => prev - 1)}
                            >
                                <i className="bi bi-chevron-left"></i>
                            </button>

                            <span className="users-page-number">
                                {currentPage} / {Math.max(totalPages, 1)}
                            </span>

                            <button
                                disabled={currentPage >= totalPages}
                                onClick={() => setCurrentPage(prev => prev + 1)}
                            >
                                <i className="bi bi-chevron-right"></i>
                            </button>

                        </div>

                    </div>

                )}

            </div>

            {showModal && (

                <div
                    className="users-modal-overlay"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget) closeModal();
                    }}
                >

                    <div className="users-modal">

                        <div className="users-modal-header">

                            <div>
                                <h3>Edit User</h3>
                                <p>Update user information</p>
                            </div>

                            <button
                                type="button"
                                onClick={closeModal}
                                disabled={saving}
                            >
                                <i className="bi bi-x-lg"></i>
                            </button>

                        </div>

                        <form onSubmit={handleUpdate}>

                            <div className="users-modal-body">

                                <label>Name *</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm({
                                        ...form,
                                        name: e.target.value
                                    })}
                                    required
                                />

                                <label>Email *</label>
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => setForm({
                                        ...form,
                                        email: e.target.value
                                    })}
                                    required
                                />

                                <label>Phone</label>
                                <input
                                    type="text"
                                    value={form.phone}
                                    onChange={(e) => setForm({
                                        ...form,
                                        phone: e.target.value
                                    })}
                                />
                                <label>Role *</label>
                                <select
                                    value={form.role}
                                    onChange={(e) => setForm({
                                        ...form,
                                        role: e.target.value
                                    })}
                                    required
                                >
                                    <option value="" disabled>
                                        Select user role
                                    </option>
                                    <option value="MANAGER">MANAGER</option>
                                    <option value="STAFF">STAFF</option>
                                </select>

                            </div>

                            <div className="users-modal-footer">

                                <button
                                    type="button"
                                    className="users-cancel-btn"
                                    onClick={closeModal}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="users-save-btn"
                                    disabled={saving}
                                >
                                    {saving ? "Saving..." : "Update User"}
                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}

        </section>
    );
}

export default UsersList;
