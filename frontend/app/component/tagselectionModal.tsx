
"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import categoryService, {
    CategoryResponseDto,
} from "@/app/apiservice/categoryservice";
import api from "@/app/apiservice/apiservice";
import "./tag-selection-modal.css";

export interface TagContact {
    name: string;
    phone: string;
    email: string;
}

interface SavedContact {
    id: number;
    name?: string;
    phone?: string;
}

interface TagSelectionModalProps {
    isOpen: boolean;
    contacts: TagContact[];
    onClose: () => void;
    onSave: (contactIds: number[], categoryId: number) => void;
}

export default function TagSelectionModal({
    isOpen,
    contacts,
    onClose,
    onSave,
}: TagSelectionModalProps) {
    const [categories, setCategories] = useState<CategoryResponseDto[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [showAddTag, setShowAddTag] = useState(false);
    const [newTagName, setNewTagName] = useState("");
    const [creatingTag, setCreatingTag] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (isOpen) {
            fetchCategories();
        }
    }, [isOpen]);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            setError("");

            const storedCompanyId = sessionStorage.getItem("companyId");

            if (!storedCompanyId) {
                throw new Error("Company ID not found. Please login again.");
            }

            const companyId = Number(storedCompanyId);

            if (!Number.isInteger(companyId) || companyId <= 0) {
                throw new Error("Invalid company ID.");
            }

            const response =
                await categoryService.getCategoriesByCompanyId({
                    companyId,
                });

            setCategories(response || []);

        } catch (err: any) {
            setError(
                err?.response?.data?.message ||
                err?.message ||
                "Unable to load tags."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTag = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const trimmedName = newTagName.trim();

        if (!trimmedName) {
            setError("Please enter a tag name.");
            return;
        }

        const storedCompanyId = sessionStorage.getItem("companyId");
        const companyId = Number(storedCompanyId);

        if (!storedCompanyId || !Number.isInteger(companyId) || companyId <= 0) {
            setError("Company ID not found. Please login again.");
            return;
        }

        try {
            setCreatingTag(true);
            setError("");

            const created = await categoryService.createCategory({
                categoryName: trimmedName,
                companyId,
            });

            setCategories((previous) => [...previous, created]);
            setSelectedCategory(created.id);
            setNewTagName("");
            setShowAddTag(false);

            Swal.fire({
                toast: true,
                position: "top-end",
                icon: "success",
                title: "Tag created successfully!",
                showConfirmButton: false,
                timer: 2000,
            });

        } catch (err: any) {
            setError(
                err?.response?.data?.message ||
                "Unable to create tag."
            );
        } finally {
            setCreatingTag(false);
        }
    };

   const handleSaveContacts = async () => {
    if (!selectedCategory) {
        setError("Please select a tag.");
        return;
    }

    if (contacts.length === 0) {
        setError("No contacts selected.");
        return;
    }

    const storedCompanyId = sessionStorage.getItem("companyId");
    const companyId = Number(storedCompanyId);

    if (
        !storedCompanyId ||
        !Number.isInteger(companyId) ||
        companyId <= 0
    ) {
        setError("Company ID not found. Please login again.");
        return;
    }

    try {
        setSaving(true);
        setError("");

        const savedContactIds: number[] = [];

        for (const contact of contacts) {
            const response = await api.post<SavedContact>(
                "/contacts/create",
                {
                    name: contact.name,
                    phone: contact.phone,
                    email: contact.email || "",
                    categoryIds: [selectedCategory],
                    companyId,
                }
            );

            if (!response?.id) {
                throw new Error(
                    `Contact ${contact.phone} was not saved correctly.`
                );
            }

            savedContactIds.push(response.id);
        }

        // Notify parent component
        onSave(savedContactIds, selectedCategory);

        // Close modal
        onClose();

        // Show success toast
        Swal.fire({
            toast: true,
            position: "top-end",
            icon: "success",
            title: `${savedContactIds.length} contacts saved successfully!`,
            showConfirmButton: false,
            timer: 2500,
            timerProgressBar: true,
        });

    } catch (err: any) {
        console.error("Save contacts error:", err);

        setError(
            err?.response?.data?.message ||
            err?.message ||
            "Unable to save contacts. Please try again."
        );

    } finally {
        setSaving(false);
    }
};

    if (!isOpen) return null;

    return (
        <div
            className="tag-selection-overlay"
            onClick={() => {
                if (!saving && !creatingTag) onClose();
            }}
        >
            <section
                className="tag-selection-modal"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="tag-selection-header">
                    <div className="tag-selection-title">
                        <div className="tag-selection-icon">
                            <i className="bi bi-collection-fill"></i>
                        </div>

                        <div>
                            <h2>Save Contacts to Tag</h2>
                            <p>
                                Select a tag to organize your customers.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving || creatingTag}
                    >
                        <i className="bi bi-x-lg"></i>
                    </button>
                </div>

                 {error && (
                        <div className="tag-selection-error">
                            <i className="bi bi-exclamation-circle"></i>
                            {error}
                        </div>
                    )}

                <div className="tag-selection-body">
                    <div className="tag-contact-summary">
                        <div>
                            <i className="bi bi-people-fill"></i>
                            <span>Selected Contacts</span>
                        </div>

                        <strong>{contacts.length}</strong>
                    </div>

                    <div className="tag-selection-heading">
                        <div>
                            <h3>Select Existing Tag</h3>
                            <p>Choose where these contacts should be saved.</p>
                        </div>

                        <button
                            type="button"
                            className="tag-add-button"
                            onClick={() => {
                                setShowAddTag((previous) => !previous);
                                setError("");
                            }}
                        >
                            <i className="bi bi-plus-lg"></i>
                            Add Tag
                        </button>
                    </div>

                    {showAddTag && (
                        <form
                            className="tag-add-form"
                            onSubmit={handleCreateTag}
                        >
                            <input
                                type="text"
                                placeholder="Enter new tag name"
                                value={newTagName}
                                onChange={(e) => {
                                    setNewTagName(e.target.value);
                                    setError("");
                                }}
                                disabled={creatingTag}
                                autoFocus
                            />

                            <button
                                type="submit"
                                disabled={creatingTag || !newTagName.trim()}
                            >
                                {creatingTag ? "Adding..." : "Create"}
                            </button>
                        </form>
                    )}

                    {loading ? (
                        <div className="tag-selection-loading">
                            <span className="tag-spinner"></span>
                            Loading tags...
                        </div>
                    ) : categories.length === 0 ? (
                        <div className="tag-selection-empty">
                            <i className="bi bi-folder-x"></i>
                            <h4>No tags available</h4>
                            <p>Create a new tag to continue.</p>
                        </div>
                    ) : (
                        <div className="tag-selection-list">
                            {categories.map((category) => (
                                <button
                                    type="button"
                                    key={category.id}
                                    className={`tag-selection-item ${
                                        selectedCategory === category.id
                                            ? "selected"
                                            : ""
                                    }`}
                                    onClick={() => {
                                        setSelectedCategory(category.id);
                                        setError("");
                                    }}
                                    disabled={saving}
                                >
                                    <div className="tag-item-icon">
                                        <i className="bi bi-tag-fill"></i>
                                    </div>

                                    <div className="tag-item-details">
                                        <strong>{category.categoryName}</strong>
                                        <span>Tag #{category.id}</span>
                                    </div>

                                    <i
                                        className={`bi ${
                                            selectedCategory === category.id
                                                ? "bi-check-circle-fill"
                                                : "bi-circle"
                                        }`}
                                    ></i>
                                </button>
                            ))}
                        </div>
                    )}

                   
                </div>

                <div className="tag-selection-footer">
                    <button
                        type="button"
                        className="tag-selection-cancel"
                        onClick={onClose}
                        disabled={saving}
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        className="tag-selection-save"
                        onClick={handleSaveContacts}
                        disabled={
                            saving ||
                            loading ||
                            !selectedCategory ||
                            contacts.length === 0
                        }
                    >
                        {saving ? (
                            <>
                                <span className="tag-button-spinner"></span>
                                Saving Contacts...
                            </>
                        ) : (
                            <>
                                <i className="bi bi-check2-circle"></i>
                                Save Contacts ({contacts.length})
                            </>
                        )}
                    </button>
                </div>
            </section>
        </div>
    );
}
