
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import Swal from "sweetalert2";

import "./broadcast-view.css";

import contactService, {
    ContactResponseDto,
} from "@/app/apiservice/contactservice";

import categoryService, {
    CategoryResponseDto,
} from "@/app/apiservice/categoryservice";

export default function BroadcastView() {
    const [broadcastId, setBroadcastId] = useState<number | null>(null);
    const [broadcastIdLoaded, setBroadcastIdLoaded] = useState(false);

    const [contacts, setContacts] = useState<ContactResponseDto[]>([]);
    const [categories, setCategories] = useState<CategoryResponseDto[]>([]);

    const [selectedContacts, setSelectedContacts] = useState<number[]>([]);

    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");

    const [loading, setLoading] = useState(true);
    const [assigning, setAssigning] = useState(false);
    const [error, setError] = useState("");

    // Get broadcast ID from localStorage
    useEffect(() => {
        const storedBroadcastId = localStorage.getItem("broadcastId");

        if (storedBroadcastId) {
            const parsedId = Number(storedBroadcastId);

            if (Number.isInteger(parsedId) && parsedId > 0) {
                setBroadcastId(parsedId);
            } else {
                setError("Invalid broadcast ID in local storage.");
            }
        } else {
            setError("Broadcast ID not found in local storage.");
        }

        setBroadcastIdLoaded(true);
    }, []);

    // Toast notification
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

    // Fetch contacts and categories
    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const [contactResponse, categoryResponse] = await Promise.all([
                contactService.getAllContacts(),
                categoryService.getAllCategories(),
            ]);

            setContacts(contactResponse || []);
            setCategories(categoryResponse || []);
        } catch (err: any) {
            const message =
                err?.response?.data?.message ||
                err?.response?.data ||
                err?.message ||
                "Unable to load contacts.";

            setError(
                typeof message === "string"
                    ? message
                    : "Unable to load contacts."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Filter contacts
    const filteredContacts = useMemo(() => {
        return contacts.filter((contact) => {
            const searchText = search.toLowerCase();

            const matchesSearch =
                contact.name?.toLowerCase().includes(searchText) ||
                contact.phone?.toLowerCase().includes(searchText) ||
                contact.email?.toLowerCase().includes(searchText);

            const matchesCategory =
                selectedCategory === "all" ||
                contact.categoryId.toString() === selectedCategory;

            return matchesSearch && matchesCategory;
        });
    }, [contacts, search, selectedCategory]);

    // Check selection status
    const allFilteredSelected =
        filteredContacts.length > 0 &&
        filteredContacts.every((contact) =>
            selectedContacts.includes(contact.id)
        );

    const someFilteredSelected =
        filteredContacts.some((contact) =>
            selectedContacts.includes(contact.id)
        );

    // Select / deselect individual contact
    const handleContactSelect = (id: number) => {
        setSelectedContacts((previous) =>
            previous.includes(id)
                ? previous.filter((contactId) => contactId !== id)
                : [...previous, id]
        );
    };

    // Select / deselect all filtered contacts
    const handleSelectAll = () => {
        const filteredIds = filteredContacts.map(
            (contact) => contact.id
        );

        if (allFilteredSelected) {
            setSelectedContacts((previous) =>
                previous.filter((id) => !filteredIds.includes(id))
            );
        } else {
            setSelectedContacts((previous) =>
                Array.from(new Set([...previous, ...filteredIds]))
            );
        }
    };

    // Clear selection
    const clearSelection = () => {
        setSelectedContacts([]);
    };

    // Assign selected contacts to broadcast
    const handleAssignContacts = async (
        e: FormEvent<HTMLFormElement>
    ) => {
        e.preventDefault();

        if (!broadcastId) {
            showToast(
                "error",
                "Broadcast ID is missing. Please open a valid broadcast."
            );
            return;
        }

        if (selectedContacts.length === 0) {
            showToast("warning", "Please select at least one contact.");
            return;
        }

        const result = await Swal.fire({
            title: "Assign Contacts?",
            text: `Add ${selectedContacts.length} selected contact(s) to this broadcast?`,
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Yes, Assign",
            cancelButtonText: "Cancel",
            confirmButtonColor: "#064e45",
            cancelButtonColor: "#777777",
            reverseButtons: true,
        });

        if (!result.isConfirmed) return;

        try {
            setAssigning(true);

            await contactService.assignContactsToBroadcast({
                broadcastId,
                contactIds: selectedContacts,
            });

            const assignedCount = selectedContacts.length;

            setSelectedContacts([]);

            showToast(
                "success",
                `${assignedCount} contact(s) assigned successfully!`
            );
        } catch (err: any) {
            const message =
                err?.response?.data?.message ||
                err?.response?.data ||
                err?.message ||
                "Unable to assign contacts.";

            showToast(
                "error",
                typeof message === "string"
                    ? message
                    : "Unable to assign contacts."
            );
        } finally {
            setAssigning(false);
        }
    };

    return (
        <div className="broadcast-view-page">

            {/* Page Header */}
            <div className="broadcast-view-header">
                <div>
                    <div className="broadcast-view-breadcrumb">
                        <span>Dashboard</span>
                        <i className="bi bi-chevron-right"></i>
                        <span>Broadcasts</span>
                        <i className="bi bi-chevron-right"></i>
                        <span>Contacts</span>
                    </div>

                    <h1>Manage Broadcast Contacts</h1>

                    <p>
                        Select contacts by category and assign them to your
                        broadcast list.
                    </p>
                </div>

                <div className="broadcast-view-header-icon">
                    <i className="bi bi-people-fill"></i>
                </div>
            </div>

            {/* Broadcast Information */}
            <div className="broadcast-info-card">
                <div className="broadcast-info-left">
                    <div className="broadcast-info-icon">
                        <i className="bi bi-megaphone-fill"></i>
                    </div>

                    <div>
                        <span>SELECTED BROADCAST</span>

                        <h3>
                            {!broadcastIdLoaded
                                ? "Loading Broadcast..."
                                : broadcastId
                                    ? `Broadcast #${broadcastId}`
                                    : "Broadcast ID Missing"}
                        </h3>

                        <p>
                            Choose contacts to add to this broadcast.
                        </p>
                    </div>
                </div>

                <div className="broadcast-info-total">
                    <span>Available Contacts</span>
                    <strong>{contacts.length}</strong>
                </div>
            </div>

            {/* Selection Statistics */}
            <div className="broadcast-contact-stats">
                <div className="broadcast-contact-stat">
                    <div className="broadcast-contact-stat-icon">
                        <i className="bi bi-people"></i>
                    </div>

                    <div>
                        <span>Total Contacts</span>
                        <h3>{contacts.length}</h3>
                    </div>
                </div>

                <div className="broadcast-contact-stat">
                    <div className="broadcast-contact-stat-icon selected">
                        <i className="bi bi-check2-square"></i>
                    </div>

                    <div>
                        <span>Selected Contacts</span>
                        <h3>{selectedContacts.length}</h3>
                    </div>
                </div>

                <div className="broadcast-contact-stat">
                    <div className="broadcast-contact-stat-icon category">
                        <i className="bi bi-grid"></i>
                    </div>

                    <div>
                        <span>Categories</span>
                        <h3>{categories.length}</h3>
                    </div>
                </div>
            </div>

            {/* Contact Selection */}
            <form onSubmit={handleAssignContacts}>
                <div className="broadcast-contact-container">

                    {/* Contact Header */}
                    <div className="broadcast-contact-header">
                        <div>
                            <h3>
                                <i className="bi bi-person-lines-fill"></i>
                                Add Contacts
                            </h3>

                            <p>
                                Select the contacts you want to include in
                                this broadcast.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="broadcast-contact-refresh"
                            onClick={fetchData}
                            disabled={loading || assigning}
                            title="Refresh contacts"
                        >
                            <i
                                className={`bi bi-arrow-clockwise ${
                                    loading ? "broadcast-view-spin" : ""
                                }`}
                            ></i>
                        </button>
                    </div>

                    {/* Filters */}
                    <div className="broadcast-contact-filters">

                        {/* Search */}
                        <div className="broadcast-contact-search">
                            <i className="bi bi-search"></i>

                            <input
                                type="text"
                                placeholder="Search name, phone or email..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />

                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch("")}
                                >
                                    <i className="bi bi-x-lg"></i>
                                </button>
                            )}
                        </div>

                        {/* Category Filter */}
                        <div className="broadcast-category-filter">
                            <i className="bi bi-funnel"></i>

                            <select
                                value={selectedCategory}
                                onChange={(e) =>
                                    setSelectedCategory(e.target.value)
                                }
                            >
                                <option value="all">
                                    All Categories
                                </option>

                                {categories.map((category) => (
                                    <option
                                        key={category.id}
                                        value={category.id.toString()}
                                    >
                                        {category.categoryName}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Selection Toolbar */}
                    <div className="broadcast-selection-toolbar">
                        <div className="broadcast-select-all">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={allFilteredSelected}
                                    ref={(element) => {
                                        if (element) {
                                            element.indeterminate =
                                                someFilteredSelected &&
                                                !allFilteredSelected;
                                        }
                                    }}
                                    onChange={handleSelectAll}
                                    disabled={
                                        loading ||
                                        filteredContacts.length === 0
                                    }
                                />

                                <span>Select All</span>
                            </label>

                            <span className="broadcast-filtered-count">
                                {filteredContacts.length} contacts found
                            </span>
                        </div>

                        <button
                            type="button"
                            className="broadcast-clear-selection"
                            onClick={clearSelection}
                            disabled={selectedContacts.length === 0}
                        >
                            <i className="bi bi-x-circle"></i>
                            Clear Selection
                        </button>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="broadcast-contact-error">
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

                    {/* Loading and Contacts */}
                    {loading ? (
                        <div className="broadcast-contact-state">
                            <div className="broadcast-view-loader"></div>
                            <p>Loading contacts...</p>
                        </div>
                    ) : filteredContacts.length === 0 ? (
                        <div className="broadcast-contact-empty">
                            <div>
                                <i className="bi bi-person-x"></i>
                            </div>

                            <h3>No Contacts Found</h3>

                            <p>
                                {search || selectedCategory !== "all"
                                    ? "Try changing your search or category filter."
                                    : "Create contacts first to add them to this broadcast."}
                            </p>
                        </div>
                    ) : (
                        <div className="broadcast-contact-table-wrapper">
                            <table className="broadcast-contact-table">
                                <thead>
                                    <tr>
                                        <th className="broadcast-check-column">
                                            Select
                                        </th>
                                        <th>Contact</th>
                                        <th>Phone Number</th>
                                        <th>Email</th>
                                        <th>Category</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredContacts.map((contact) => {
                                        const isSelected =
                                            selectedContacts.includes(
                                                contact.id
                                            );

                                        return (
                                            <tr
                                                key={contact.id}
                                                className={
                                                    isSelected
                                                        ? "broadcast-contact-selected-row"
                                                        : ""
                                                }
                                                onClick={() =>
                                                    handleContactSelect(
                                                        contact.id
                                                    )
                                                }
                                            >
                                                <td>
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() =>
                                                            handleContactSelect(
                                                                contact.id
                                                            )
                                                        }
                                                        onClick={(e) =>
                                                            e.stopPropagation()
                                                        }
                                                    />
                                                </td>

                                                <td>
                                                    <div className="broadcast-contact-name">
                                                        <div className="broadcast-contact-avatar">
                                                            {contact.name
                                                                ?.charAt(0)
                                                                .toUpperCase()}
                                                        </div>

                                                        <div>
                                                            <strong>
                                                                {contact.name}
                                                            </strong>
                                                            <small>
                                                                ID: #{contact.id}
                                                            </small>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td>
                                                    <div className="broadcast-contact-detail">
                                                        <i className="bi bi-telephone"></i>
                                                        {contact.phone}
                                                    </div>
                                                </td>

                                                <td>
                                                    <div className="broadcast-contact-detail">
                                                        <i className="bi bi-envelope"></i>
                                                        {contact.email || "—"}
                                                    </div>
                                                </td>

                                                <td>
                                                    <span className="broadcast-contact-category">
                                                        {contact.categoryName ||
                                                            "Uncategorized"}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="broadcast-contact-footer">
                        <div className="broadcast-footer-selection">
                            <div className="broadcast-footer-check-icon">
                                <i className="bi bi-check2-circle"></i>
                            </div>

                            <div>
                                <strong>
                                    {selectedContacts.length} Contacts Selected
                                </strong>
                                <span>
                                    Ready to add to your broadcast
                                </span>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="broadcast-assign-btn"
                            disabled={
                                assigning ||
                                loading ||
                                selectedContacts.length === 0 ||
                                !broadcastId
                            }
                        >
                            {assigning ? (
                                <>
                                    <span className="broadcast-assign-loader"></span>
                                    Assigning...
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-person-plus-fill"></i>
                                    Assign Contacts
                                    <i className="bi bi-arrow-right"></i>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
