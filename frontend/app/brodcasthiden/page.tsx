
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import "./broadcast.css";

import broadcastService, {
    BroadcastResponse,
} from "@/app/apiservice/broadcastservice";

import CreateBroadcast from "./create/page";

export default function Broadcast() {
    const router = useRouter();

    const [broadcasts, setBroadcasts] = useState<BroadcastResponse[]>([]);
    const [name, setName] = useState("");
    const [search, setSearch] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [showCreateBroadcast, setShowCreateBroadcast] = useState(false);

    const [editingId, setEditingId] = useState<number | null>(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    // View broadcast: save ID and navigate to broadcast/view
    const handleViewBroadcast = (broadcast: BroadcastResponse) => {
        localStorage.setItem("broadcastId", String(broadcast.id));

        router.push("/broadcasts/view");
    };

    // SweetAlert toast
    const showToast = (
        icon: "success" | "error" | "warning",
        title: string
    ) => {
        Swal.fire({
            toast: true,
            position: "top-end",
            icon,
            title,
            showConfirmButton: false,
            timer: 2500,
            timerProgressBar: true,
        });
    };

    // Fetch broadcasts
    const fetchBroadcasts = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await broadcastService.getAllBroadcasts();
            setBroadcasts(response || []);
        } catch (err: any) {
            const message =
                err?.response?.data?.message ||
                err?.response?.data ||
                err?.message ||
                "Unable to load broadcasts.";

            setError(
                typeof message === "string"
                    ? message
                    : "Unable to load broadcasts."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBroadcasts();
    }, []);

    // Filter broadcasts
    const filteredBroadcasts = useMemo(() => {
        return broadcasts.filter((broadcast) =>
            broadcast.name?.toLowerCase().includes(search.toLowerCase())
        );
    }, [broadcasts, search]);

    // Open create popup
    const openCreateModal = () => {
        setError("");
        setShowCreateBroadcast(true);
    };

    // Open edit popup
    const openEditModal = (broadcast: BroadcastResponse) => {
        setName(broadcast.name);
        setEditingId(broadcast.id);
        setError("");
        setShowModal(true);
    };

    // Close edit popup
    const closeModal = () => {
        if (saving) return;

        setShowModal(false);
        setName("");
        setEditingId(null);
        setError("");
    };

    // Create broadcast
    const handleCreate = async (broadcastName: string) => {
        try {
            setSaving(true);
            setError("");

            await broadcastService.createBroadcast({
                name: broadcastName,
            });

            setShowCreateBroadcast(false);

            await fetchBroadcasts();

            showToast("success", "Broadcast created successfully!");
        } catch (err: any) {
            const message =
                err?.response?.data?.message ||
                err?.response?.data ||
                err?.message ||
                "Unable to create broadcast.";

            showToast(
                "error",
                typeof message === "string"
                    ? message
                    : "Unable to create broadcast."
            );
        } finally {
            setSaving(false);
        }
    };

    // Update broadcast
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const trimmedName = name.trim();

        if (!trimmedName) {
            setError("Please enter a broadcast name.");
            return;
        }

        try {
            setSaving(true);
            setError("");

            if (editingId !== null) {
                await broadcastService.updateBroadcast({
                    id: editingId,
                    name: trimmedName,
                });
            }

            setShowModal(false);
            setName("");
            setEditingId(null);

            await fetchBroadcasts();

            showToast("success", "Broadcast updated successfully!");
        } catch (err: any) {
            const message =
                err?.response?.data?.message ||
                err?.response?.data ||
                err?.message ||
                "Unable to update broadcast.";

            setError(
                typeof message === "string"
                    ? message
                    : "Unable to update broadcast."
            );
        } finally {
            setSaving(false);
        }
    };

    // Delete broadcast
    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: "Delete Broadcast?",
            text: "Are you sure you want to delete this broadcast?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, Delete",
            cancelButtonText: "Cancel",
            confirmButtonColor: "#064e45",
            cancelButtonColor: "#777777",
            reverseButtons: true,
        });

        if (!result.isConfirmed) return;

        try {
            await broadcastService.deleteBroadcast(id);

            setBroadcasts((prev) =>
                prev.filter((broadcast) => broadcast.id !== id)
            );

            if (editingId === id) {
                setShowModal(false);
                setEditingId(null);
            }

            showToast("success", "Broadcast deleted successfully!");
        } catch (err: any) {
            const message =
                err?.response?.data?.message ||
                err?.response?.data ||
                err?.message ||
                "Unable to delete broadcast.";

            showToast(
                "error",
                typeof message === "string"
                    ? message
                    : "Unable to delete broadcast."
            );
        }
    };

    return (
        <>
            <div className="broadcast-page">

                {/* Page Header */}
                <div className="broadcast-header">
                    <div className="broadcast-header-content">
                        <div className="broadcast-breadcrumb">
                            <span>Dashboard</span>
                            <i className="bi bi-chevron-right"></i>
                            <span>Broadcasts</span>
                        </div>

                        <h1>Broadcasts</h1>

                        <p>
                            Manage your broadcast lists and organize your
                            contacts for WhatsApp messaging.
                        </p>
                    </div>

                    <button
                        className="broadcast-create-btn"
                        onClick={openCreateModal}
                        type="button"
                    >
                        <i className="bi bi-plus-lg"></i>
                        Create Broadcast
                    </button>
                </div>

                {/* Error Message */}
                {error && !showModal && (
                    <div className="broadcast-error-message">
                        <i className="bi bi-exclamation-circle-fill"></i>
                        {error}

                        <button
                            type="button"
                            onClick={() => setError("")}
                        >
                            <i className="bi bi-x-lg"></i>
                        </button>
                    </div>
                )}

                {/* Statistics */}
                <div className="broadcast-stats">
                    <div className="broadcast-stat-card">
                        <div className="broadcast-stat-icon">
                            <i className="bi bi-megaphone-fill"></i>
                        </div>

                        <div>
                            <span>Total Broadcasts</span>
                            <h2>{broadcasts.length}</h2>
                        </div>
                    </div>

                    <div className="broadcast-stat-card">
                        <div className="broadcast-stat-icon secondary">
                            <i className="bi bi-collection-fill"></i>
                        </div>

                        <div>
                            <span>Matching Results</span>
                            <h2>{filteredBroadcasts.length}</h2>
                        </div>
                    </div>
                </div>

                {/* Broadcast Table Container */}
                <div className="broadcast-list-container">

                    <div className="broadcast-list-header">
                        <div>
                            <h3>Broadcast Lists</h3>
                            <p>View and manage all your broadcasts.</p>
                        </div>

                        <div className="broadcast-list-tools">
                            <div className="broadcast-search">
                                <i className="bi bi-search"></i>

                                <input
                                    type="text"
                                    placeholder="Search broadcasts..."
                                    value={search}
                                    onChange={(e) =>
                                        setSearch(e.target.value)
                                    }
                                />

                                {search && (
                                    <button
                                        type="button"
                                        onClick={() => setSearch("")}
                                    >
                                        <i className="bi bi-x"></i>
                                    </button>
                                )}
                            </div>

                            <button
                                type="button"
                                className="broadcast-refresh-btn"
                                onClick={fetchBroadcasts}
                                disabled={loading}
                                title="Refresh broadcasts"
                            >
                                <i
                                    className={`bi bi-arrow-clockwise ${
                                        loading ? "broadcast-spin" : ""
                                    }`}
                                ></i>
                            </button>
                        </div>
                    </div>

                    {/* Loading */}
                    {loading ? (
                        <div className="broadcast-state">
                            <div className="broadcast-loader"></div>
                            <p>Loading broadcasts...</p>
                        </div>
                    ) : filteredBroadcasts.length === 0 ? (
                        <div className="broadcast-empty">
                            <div className="broadcast-empty-icon">
                                <i className="bi bi-megaphone"></i>
                            </div>

                            <h3>
                                {search
                                    ? "No broadcasts found"
                                    : "No broadcasts created yet"}
                            </h3>

                            <p>
                                {search
                                    ? "Try searching with a different name."
                                    : "Create your first broadcast list to get started."}
                            </p>

                            {!search && (
                                <button
                                    type="button"
                                    onClick={openCreateModal}
                                    className="broadcast-empty-btn"
                                >
                                    <i className="bi bi-plus-lg"></i>
                                    Create Your First Broadcast
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="broadcast-table-wrapper">
                            <table className="broadcast-table">
                                <thead>
                                    <tr>
                                        <th className="broadcast-number-col">
                                            #
                                        </th>
                                        <th>Broadcast Name</th>
                                        <th>Type</th>
                                        <th className="broadcast-action-heading">
                                            Action
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredBroadcasts.map(
                                        (broadcast, index) => (
                                            <tr key={broadcast.id}>
                                                <td className="broadcast-number">
                                                    {index + 1}
                                                </td>

                                                <td>
                                                    <div className="broadcast-name-cell">
                                                        <div className="broadcast-table-icon">
                                                            <i className="bi bi-megaphone-fill"></i>
                                                        </div>

                                                        <span>
                                                            {broadcast.name}
                                                        </span>
                                                    </div>
                                                </td>

                                                <td>
                                                    <span className="broadcast-type-badge">
                                                        Broadcast
                                                    </span>
                                                </td>

                                                <td>
                                                    <div className="broadcast-action-buttons">

                                                        {/* View */}
                                                        <button
                                                            type="button"
                                                            className="broadcast-view-btn"
                                                            title="View"
                                                            onClick={() =>
                                                                handleViewBroadcast(
                                                                    broadcast
                                                                )
                                                            }
                                                        >
                                                            <i className="bi bi-eye"></i>
                                                        </button>

                                                        {/* Edit */}
                                                        <button
                                                            type="button"
                                                            className="broadcast-edit-btn"
                                                            title="Edit"
                                                            onClick={() =>
                                                                openEditModal(
                                                                    broadcast
                                                                )
                                                            }
                                                        >
                                                            <i className="bi bi-pencil-square"></i>
                                                        </button>

                                                        {/* Delete */}
                                                        <button
                                                            type="button"
                                                            className="broadcast-delete-btn"
                                                            title="Delete"
                                                            onClick={() =>
                                                                handleDelete(
                                                                    broadcast.id
                                                                )
                                                            }
                                                        >
                                                            <i className="bi bi-trash3"></i>
                                                        </button>

                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {!loading && filteredBroadcasts.length > 0 && (
                        <div className="broadcast-list-footer">
                            Showing{" "}
                            <strong>{filteredBroadcasts.length}</strong> of{" "}
                            <strong>{broadcasts.length}</strong> broadcasts
                        </div>
                    )}
                </div>
            </div>

            {/* Create Broadcast Popup */}
            {showCreateBroadcast && (
                <CreateBroadcast
                    onClose={() => setShowCreateBroadcast(false)}
                    onSubmit={handleCreate}
                />
            )}

            {/* Edit Broadcast Popup */}
            {showModal && (
                <div
                    className="broadcast-modal-overlay"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget) closeModal();
                    }}
                >
                    <div className="broadcast-modal">

                        <div className="broadcast-modal-header">
                            <div className="broadcast-modal-title">
                                <div className="broadcast-modal-icon">
                                    <i className="bi bi-megaphone-fill"></i>
                                </div>

                                <div>
                                    <h3>Edit Broadcast</h3>
                                    <p>Update your broadcast list name.</p>
                                </div>
                            </div>

                            <button
                                type="button"
                                className="broadcast-modal-close"
                                onClick={closeModal}
                                disabled={saving}
                            >
                                <i className="bi bi-x-lg"></i>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="broadcast-modal-body">

                                <label htmlFor="broadcast-name">
                                    Broadcast Name <span>*</span>
                                </label>

                                <input
                                    id="broadcast-name"
                                    type="text"
                                    placeholder="e.g. Customer Updates"
                                    value={name}
                                    onChange={(e) => {
                                        setName(e.target.value);
                                        setError("");
                                    }}
                                    maxLength={100}
                                    autoFocus
                                />

                                <small>
                                    Give your broadcast list a clear and
                                    recognizable name.
                                </small>

                                {error && (
                                    <div className="broadcast-modal-error">
                                        <i className="bi bi-exclamation-circle"></i>
                                        {error}
                                    </div>
                                )}
                            </div>

                            <div className="broadcast-modal-footer">
                                <button
                                    type="button"
                                    className="broadcast-modal-cancel"
                                    onClick={closeModal}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="broadcast-modal-submit"
                                    disabled={saving || !name.trim()}
                                >
                                    {saving ? (
                                        <>
                                            <span className="broadcast-btn-loader"></span>
                                            Updating...
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-check-lg"></i>
                                            Update Broadcast
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
