
"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";

import "./edit-category.css";
import categoryService, {
    CategoryResponseDto
} from "@/app/apiservice/categoryservice";

interface EditCategoryProps {
    isOpen: boolean;
    category: CategoryResponseDto | null;
    onClose: () => void;
    onCategoryUpdated: () => void;
}

function EditCategory({
    isOpen,
    category,
    onClose,
    onCategoryUpdated,
}: EditCategoryProps) {

    const [categoryName, setCategoryName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (isOpen && category) {
            setCategoryName(category.categoryName);
            setError("");
        }
    }, [isOpen, category]);

    if (!isOpen || !category) return null;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const trimmedName = categoryName.trim();

        if (!trimmedName) {
            setError("Please enter a broadcast name.");
            return;
        }

        try {
            setLoading(true);
            setError("");

            const response = await categoryService.updateCategory({
                id: category.id,
                categoryName: trimmedName,
            });

            console.log("Category updated:", response);

            setCategoryName("");
            onClose();
            onCategoryUpdated();

            Swal.fire({
                toast: true,
                position: "top-end",
                icon: "success",
                title: "Broadcast updated successfully!",
                showConfirmButton: false,
                timer: 2500,
                timerProgressBar: true,
            });

        } catch (err: any) {
            console.error("Broadcast update error:", err);

            setError(
                err?.response?.data?.message ||
                "Failed to update broadcast. Please try again."
            );

        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (loading) return;

        setCategoryName("");
        setError("");
        onClose();
    };

    return (
        <div
            className="category-modal-overlay"
            onClick={handleClose}
        >

            <section
                className="edit-category-modal"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="category-modal-header">

                    <div className="category-modal-title">

                        <div className="category-modal-icon">
                            <i className="bi bi-pencil-square"></i>
                        </div>

                        <div>
                            <h2>Edit Broadcast</h2>
                            <p>Update your contact broadcast</p>
                        </div>

                    </div>

                    <button
                        type="button"
                        className="category-modal-close"
                        onClick={handleClose}
                        disabled={loading}
                    >
                        <i className="bi bi-x-lg"></i>
                    </button>

                </div>
                <form onSubmit={handleSubmit}>

                    <div className="category-modal-body">

                        <label htmlFor="editCategoryName">
                           Broadcast Name
                            <span className="required-star">*</span>
                        </label>
                        <div className="category-input-wrapper">
                            <i className="bi bi-folder2-open"></i>
                            <input
                                type="text"
                                id="editCategoryName"
                                placeholder="Enter broadcast name"
                                value={categoryName}
                                onChange={(e) => {
                                    setCategoryName(e.target.value);
                                    setError("");
                                }}
                                disabled={loading}
                                autoFocus
                            />
                        </div>
                        {error && (
                            <p className="category-error">
                                <i className="bi bi-exclamation-circle"></i>
                                {error}
                            </p>
                        )}
                        <p className="category-input-hint">
                            Update the broadcast name to organize your contacts.
                        </p>
                    </div>
                    <div className="category-modal-footer">
                        <button
                            type="button"
                            className="category-cancel-btn"
                            onClick={handleClose}
                            disabled={loading}>
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="category-submit-btn"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="category-spinner"></span>
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
            </section>
        </div>
    );
}

export default EditCategory;
