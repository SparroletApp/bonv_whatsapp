
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import contactService, {
    ContactResponseDto,
} from "../../apiservice/contactservice";

import categoryService, {
    CategoryResponseDto,
} from "../../apiservice/categoryservice";

import "./broadcastview.css";

function CategoryView() {
    const router = useRouter();

    const [contacts, setContacts] = useState<ContactResponseDto[]>([]);
    const [categories, setCategories] = useState<CategoryResponseDto[]>([]);

    const [broadcastId, setBroadcastId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchContacts = useCallback(async (categoryId: number) => {
        try {
            setLoading(true);
            setError("");

            // Fetch contacts and categories together
            const [contactResponse, categoryResponse] = await Promise.all([
                contactService.getContactsByCategoryId({
                    id: categoryId,
                }),
                categoryService.getAllCategories(),
            ]);

            setContacts(contactResponse);
            setCategories(categoryResponse);

        } catch (err) {
            console.error("Broadcast contacts fetch error:", err);

            setError("Unable to load broadcast contacts.");
            setContacts([]);
            setCategories([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const storedId = localStorage.getItem("broadcastId");

        if (
            !storedId ||
            !Number.isInteger(Number(storedId)) ||
            Number(storedId) <= 0
        ) {
            setError("Invalid broadcast ID. Please select a broadcast.");
            setLoading(false);
            return;
        }

        const id = Number(storedId);

        setBroadcastId(id);
        fetchContacts(id);

    }, [fetchContacts]);

    // Convert category IDs into category names
    const getCategoryNames = (categoryIds: number[]) => {
        if (!categoryIds || categoryIds.length === 0) {
            return [];
        }

        return categoryIds
            .map((id) => {
                const category = categories.find(
                    (item) => item.id === id
                );

                return category?.categoryName;
            })
            .filter((name): name is string => Boolean(name));
    };

    const formatDate = (date: string) => {
        if (!date) return "-";

        return new Date(date).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    return (
        <section className="broadcast-view-page">

            {/* HEADER */}
            <div className="broadcast-view-header">

                <div className="broadcast-view-title">

                    <div className="broadcast-view-icon">
                        <i className="bi bi-broadcast"></i>
                    </div>

                    <div>
                        <h2>Broadcast View</h2>
                        <p>
                            View and manage contacts assigned to this broadcast.
                        </p>
                    </div>

                </div>

                <div className="broadcast-view-header-actions">

                    <button
                        type="button"
                        className="broadcast-view-back-btn"
                        onClick={() => router.back()}
                    >
                        <i className="bi bi-arrow-left"></i>
                        Back
                    </button>

                    <button
                        type="button"
                        className="broadcast-view-refresh-btn"
                        onClick={() => {
                            if (broadcastId) {
                                fetchContacts(broadcastId);
                            }
                        }}
                        disabled={loading || !broadcastId}
                    >
                        <i className="bi bi-arrow-clockwise"></i>
                        Refresh
                    </button>

                </div>

            </div>

            {/* SUMMARY CARDS */}
            <div className="broadcast-view-summary">

                <div className="broadcast-summary-card">

                    <div className="broadcast-summary-icon">
                        <i className="bi bi-people-fill"></i>
                    </div>

                    <div>
                        <span>Total Contacts</span>
                        <h3>{contacts.length}</h3>
                    </div>

                </div>

                <div className="broadcast-summary-card">

                    <div className="broadcast-summary-icon">
                        <i className="bi bi-broadcast-pin"></i>
                    </div>

                    <div>
                        <span>Broadcast ID</span>
                        <h3>{broadcastId ?? "-"}</h3>
                    </div>

                </div>

            </div>

            {/* CONTACT TABLE */}
            <div className="broadcast-view-table-card">

                <div className="broadcast-view-table-heading">

                    <div>
                        <h3>Broadcast Contacts</h3>
                        <p>
                            All contacts assigned to this broadcast category.
                        </p>
                    </div>

                    <span className="broadcast-contact-count">
                        <i className="bi bi-person-check"></i>
                        {contacts.length} Contacts
                    </span>

                </div>

                <div className="broadcast-view-table-wrapper">

                    <table className="broadcast-view-table">

                        <thead>
                            <tr>
                                <th>Contact ID</th>
                                <th>Contact Name</th>
                                <th>Phone Number</th>
                                <th>Email Address</th>
                                <th>Categories</th>
                                <th>Created Date</th>
                            </tr>
                        </thead>

                        <tbody>

                            {loading ? (

                                <tr>
                                    <td
                                        colSpan={6}
                                        className="broadcast-view-message"
                                    >
                                        <div className="broadcast-loading">
                                            <span className="broadcast-spinner"></span>
                                            Loading contacts...
                                        </div>
                                    </td>
                                </tr>

                            ) : error ? (

                                <tr>
                                    <td
                                        colSpan={6}
                                        className="broadcast-view-message broadcast-view-error"
                                    >
                                        <i className="bi bi-exclamation-circle"></i>
                                        {error}
                                    </td>
                                </tr>

                            ) : contacts.length === 0 ? (

                                <tr>
                                    <td
                                        colSpan={6}
                                        className="broadcast-view-message"
                                    >
                                        <div className="broadcast-empty">

                                            <div className="broadcast-empty-icon">
                                                <i className="bi bi-people"></i>
                                            </div>

                                            <h4>No Contacts Found</h4>

                                            <p>
                                                There are no contacts assigned
                                                to this broadcast category.
                                            </p>

                                        </div>
                                    </td>
                                </tr>

                            ) : (

                                contacts.map((contact) => {

                                    const categoryNames = getCategoryNames(
                                        contact.categoryIds || []
                                    );

                                    return (
                                        <tr key={contact.id}>

                                            <td>
                                                <span className="broadcast-contact-id">
                                                    #{contact.id}
                                                </span>
                                            </td>

                                            <td>
                                                <div className="broadcast-contact-name">

                                                    <div className="broadcast-contact-avatar">
                                                        {contact.name
                                                            ?.charAt(0)
                                                            .toUpperCase()}
                                                    </div>

                                                    <span>{contact.name}</span>

                                                </div>
                                            </td>

                                            <td>
                                                <div className="broadcast-phone">
                                                    <i className="bi bi-telephone"></i>
                                                    {contact.phone}
                                                </div>
                                            </td>

                                            <td>
                                                {contact.email || "-"}
                                            </td>

                                            <td>
                                                <div className="broadcast-category-list">

                                                    {categoryNames.length > 0 ? (

                                                        categoryNames.map(
                                                            (categoryName, index) => (
                                                                <span
                                                                    className="broadcast-category-badge"
                                                                    key={`${contact.id}-${index}`}
                                                                >
                                                                    <i className="bi bi-tag"></i>
                                                                    {categoryName}
                                                                </span>
                                                            )
                                                        )

                                                    ) : (

                                                        <span className="broadcast-category-empty">
                                                            No Category
                                                        </span>

                                                    )}

                                                </div>
                                            </td>

                                            <td>
                                                {formatDate(contact.createdAt)}
                                            </td>

                                        </tr>
                                    );
                                })

                            )}

                        </tbody>

                    </table>

                </div>

                {!loading && !error && contacts.length > 0 && (
                    <div className="broadcast-view-footer">
                        Showing {contacts.length} contacts
                    </div>
                )}

            </div>

        </section>
    );
}

export default CategoryView;
