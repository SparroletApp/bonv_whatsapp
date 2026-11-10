
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
            setError("Please enter a Tag name.");
            return;
        }

        try {
            setLoading(true);
            setError("");

            const response = await categoryService.createCategory({
                categoryName: trimmedName,
            });

            console.log("Tag created successfully:", response);

            setCategoryName("");
            setError("");
            onClose();

            Swal.fire({
                toast: true,
                position: "top-end",
                icon: "success",
                title: `${response.categoryName} created successfully!`,
                showConfirmButton: false,
                timer: 2500,
                timerProgressBar: true,
            });

            onCategoryCreated();

        } catch (err: any) {
            console.error("Tag creation error:", err);

            setError(
                err?.response?.data?.message ||
                "Failed to create tag. Please try again."
            );

        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
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
                            <h2>Create Tag</h2>
                            <p>Add a new contact tag</p>
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
                           Tag Name
                            <span className="required-star">*</span>
                        </label>

                        <div className="category-input-wrapper">

                            <i className="bi bi-folder2-open"></i>

                            <input
                                type="text"
                                id="categoryName"
                                placeholder="Enter tag name"
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
                            Organize your contacts by creating meaningful tags.
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
                                    Create Tag
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
