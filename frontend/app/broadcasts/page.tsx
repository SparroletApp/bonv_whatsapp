
"use client";

import { useEffect, useMemo, useState } from "react";
import "./broadcast.css";

import broadcastService, {
    BroadcastResponse,
} from "@/app/apiservice/broadcastservice";

export default function Broadcast() {
    const [broadcasts, setBroadcasts] = useState<BroadcastResponse[]>([]);
    const [name, setName] = useState("");
    const [search, setSearch] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [showCreateBroadcast, setShowCreateBroadcast] = useState(false);
    const fetchBroadcasts = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await broadcastService.getAllBroadcasts();
            setBroadcasts(response || []);
        } catch (err: any) {
            setError(
                err?.response?.data?.message ||
                err?.response?.data ||
                err?.message ||
                "Unable to load broadcasts."
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

    // Open create modal
    const openCreateModal = () => {
        setName("");
        setEditingId(null);
        setError("");
        setSuccess("");
        setShowModal(true);
    };

    // Open edit modal
    const openEditModal = (broadcast: BroadcastResponse) => {
        setName(broadcast.name);
        setEditingId(broadcast.id);
        setError("");
        setSuccess("");
        setShowModal(true);
    };

    // Close modal
    const closeModal = () => {
        if (saving) return;

        setShowModal(false);
        setName("");
        setEditingId(null);
        setError("");
    };

    // Create / Update broadcast
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
                setSuccess("Broadcast updated successfully.");
            } else {
                await broadcastService.createBroadcast({
                    name: trimmedName,
                });
                setSuccess("Broadcast created successfully.");
            }

            setShowModal(false);
            setName("");
            setEditingId(null);

            await fetchBroadcasts();
        } catch (err: any) {
            setError(
                err?.response?.data?.message ||
                err?.response?.data ||
                err?.message ||
                "Something went wrong. Please try again."
            );
        } finally {
            setSaving(false);
        }
    };

    // Delete broadcast
    const handleDelete = async (id: number) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this broadcast?"
        );

        if (!confirmed) return;

        try {
            setError("");
            setSuccess("");

            await broadcastService.deleteBroadcast(id);

            setSuccess("Broadcast deleted successfully.");

            if (editingId === id) {
                setShowModal(false);
                setEditingId(null);
            }

            await fetchBroadcasts();
        } catch (err: any) {
            setError(
                err?.response?.data?.message ||
                err?.response?.data ||
                err?.message ||
                "Unable to delete broadcast."
            );
        }
    };

    return (
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
                        Manage your broadcast lists and organize your contacts
                        for WhatsApp messaging.
                    </p>
                </div>

                <button
                    className="broadcast-create-btn"
                    onClick={() => setShowCreateBroadcast(true)}
                    type="button"
                >
                    <i className="bi bi-plus-lg"></i>
                    Create Broadcast
                </button>
            </div>

            {success && (
                <div className="broadcast-success-message">
                    <i className="bi bi-check-circle-fill"></i>
                    {success}
                    <button
                        type="button"
                        onClick={() => setSuccess("")}
                    >
                        <i className="bi bi-x-lg"></i>
                    </button>
                </div>
            )}

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

            {/* Broadcast List */}
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
                                onChange={(e) => setSearch(e.target.value)}
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
                            <i className={`bi bi-arrow-clockwise ${loading ? "broadcast-spin" : ""}`}></i>
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

                    /* Empty State */
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

                    /* Broadcast Cards */
                    <div className="broadcast-grid">
                        {filteredBroadcasts.map((broadcast) => (
                            <div
                                className="broadcast-card"
                                key={broadcast.id}
                            >
                                <div className="broadcast-card-top">
                                    <div className="broadcast-card-icon">
                                        <i className="bi bi-megaphone-fill"></i>
                                    </div>

                                    <div className="broadcast-card-menu">
                                        <button
                                            type="button"
                                            title="Edit broadcast"
                                            onClick={() =>
                                                openEditModal(broadcast)
                                            }
                                        >
                                            <i className="bi bi-pencil-square"></i>
                                        </button>

                                        <button
                                            type="button"
                                            title="Delete broadcast"
                                            className="broadcast-card-delete"
                                            onClick={() =>
                                                handleDelete(broadcast.id)
                                            }
                                        >
                                            <i className="bi bi-trash3"></i>
                                        </button>
                                    </div>
                                </div>

                                <div className="broadcast-card-info">
                                    <span className="broadcast-card-label">
                                        BROADCAST LIST
                                    </span>

                                    <h4>{broadcast.name}</h4>

                                    <p>
                                        Broadcast ID: #{broadcast.id}
                                    </p>
                                </div>

                                <div className="broadcast-card-bottom">
                                    <span>
                                        <i className="bi bi-folder2-open"></i>
                                        Broadcast
                                    </span>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            openEditModal(broadcast)
                                        }
                                    >
                                        Edit Details
                                        <i className="bi bi-arrow-right"></i>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!loading && filteredBroadcasts.length > 0 && (
                    <div className="broadcast-list-footer">
                        Showing <strong>{filteredBroadcasts.length}</strong> of{" "}
                        <strong>{broadcasts.length}</strong> broadcasts
                    </div>
                )}
            </div>

            {/* Create / Edit Modal */}
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
                                    <h3>
                                        {editingId !== null
                                            ? "Edit Broadcast"
                                            : "Create Broadcast"}
                                    </h3>
                                    <p>
                                        {editingId !== null
                                            ? "Update your broadcast list name."
                                            : "Create a new broadcast list."}
                                    </p>
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
                                    Broadcast Name
                                    <span>*</span>
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
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <i className={`bi ${editingId !== null
                                                ? "bi-check-lg"
                                                : "bi-plus-lg"
                                                }`}></i>

                                            {editingId !== null
                                                ? "Update Broadcast"
                                                : "Create Broadcast"}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
