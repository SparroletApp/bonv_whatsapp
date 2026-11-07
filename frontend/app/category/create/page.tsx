
"use client";

import { useState } from "react";
import Swal from "sweetalert2";

import "./create-category.css";
import categoryService from "@/app/apiservice/categoryservice";

interface CreateCategoryProps {
    isOpen: boolean;
    onClose: () => void;
    onCategoryCreated: () => void;
}

function CreateCategory({
    isOpen,
    onClose,
    onCategoryCreated,
}: CreateCategoryProps) {

    const [categoryName, setCategoryName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const trimmedName = categoryName.trim();

        if (!trimmedName) {
            setError("Please enter a category name.");
            return;
        }

        try {
            setLoading(true);
            setError("");

            const response = await categoryService.createCategory({
                categoryName: trimmedName,
            });

            console.log("Category created successfully:", response);

            // Close modal immediately after successful API response
            setCategoryName("");
            setError("");
            onClose();

            // Show success toast
            Swal.fire({
                toast: true,
                position: "top-end",
                icon: "success",
                title: `${response.categoryName} created successfully!`,
                showConfirmButton: false,
                timer: 2500,
                timerProgressBar: true,
            });

            // Refresh category list
            onCategoryCreated();

        } catch (err: any) {
            console.error("Category creation error:", err);

            setError(
                err?.response?.data?.message ||
                "Failed to create category. Please try again."
            );

        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        // Allow closing even when API is pending
        setCategoryName("");
        setError("");
        setLoading(false);
        onClose();
    };

    return (
        <div
            className="category-modal-overlay"
            onClick={handleClose}
        >
            <section
                className="create-category-modal"
                onClick={(e) => e.stopPropagation()}
            >

                <div className="category-modal-header">

                    <div className="category-modal-title">
                        <div className="category-modal-icon">
                            <i className="bi bi-folder-plus"></i>
                        </div>

                        <div>
                            <h2>Create Category</h2>
                            <p>Add a new contact category</p>
                        </div>
                    </div>

                    <button
                        type="button"
                        className="category-modal-close"
                        onClick={handleClose}
                    >
                        <i className="bi bi-x-lg"></i>
                    </button>

                </div>

                <form onSubmit={handleSubmit}>

                    <div className="category-modal-body">

                        <label htmlFor="categoryName">
                            Category Name
                            <span className="required-star">*</span>
                        </label>

                        <div className="category-input-wrapper">

                            <i className="bi bi-folder2-open"></i>

                            <input
                                type="text"
                                id="categoryName"
                                placeholder="Enter category name"
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
                            Organize your contacts by creating meaningful categories.
                        </p>

                    </div>

                    <div className="category-modal-footer">

                        <button
                            type="button"
                            className="category-cancel-btn"
                            onClick={handleClose}
                        >
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
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-plus-lg"></i>
                                    Create Category
                                </>
                            )}
                        </button>

                    </div>

                </form>

            </section>
        </div>
    );
}

export default CreateCategory;
