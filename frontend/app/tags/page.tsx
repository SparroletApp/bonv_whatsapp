
"use client";

import { useEffect, useState } from "react";
import categoryService, {
    CategoryResponseDto
} from "../apiservice/categoryservice";


import "./category.css";
import CreateCategory from "./create/page";
import EditCategory from "./edit/page";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";

function Category() {
    const [categories, setCategories] = useState<CategoryResponseDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const router = useRouter();
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(20);

    const [showEditCategory, setShowEditCategory] = useState(false);

    const [selectedCategory, setSelectedCategory] =
        useState<CategoryResponseDto | null>(null); const [showCreateCategory, setShowCreateCategory] = useState(false);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await categoryService.getAllCategories();
            setCategories(response);
        } catch (err) {
            console.error("Category fetch error:", err);
            setError("Unable to load categories.");
        } finally {
            setLoading(false);
        }
    };

    const totalPages = Math.ceil(categories.length / rowsPerPage);

    const startIndex = (currentPage - 1) * rowsPerPage;

    const currentCategories = categories.slice(
        startIndex,
        startIndex + rowsPerPage
    );

    const handleRowsChange = (
        event: React.ChangeEvent<HTMLSelectElement>
    ) => {
        setRowsPerPage(Number(event.target.value));
        setCurrentPage(1);
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: "Are you sure?",
            text: "Do you want to delete this Broadcast?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#064e45",
            cancelButtonColor: "#6c7d73",
            confirmButtonText: "Yes, Delete",
            cancelButtonText: "Cancel",
            reverseButtons: true,
            customClass: {
                popup: "category-swal-popup",
                confirmButton: "category-swal-confirm",
                cancelButton: "category-swal-cancel",
            },
        });

        if (!result.isConfirmed) return;

        try {
            await categoryService.deleteCategory({ id });

            setCategories((previous) =>
                previous.filter((category) => category.id !== id)
            );

            const remainingCount = categories.length - 1;
            const newTotalPages = Math.ceil(remainingCount / rowsPerPage);

            if (currentPage > newTotalPages && newTotalPages > 0) {
                setCurrentPage(newTotalPages);
            }

            Swal.fire({
                toast: true,
                position: "top-end",
                icon: "success",
                title: "Broadcast deleted successfully!",
                showConfirmButton: false,
                timer: 2500,
                timerProgressBar: true,
            });

        } catch (err) {
            console.error("Delete broadcast error:", err);

            Swal.fire({
                toast: true,
                position: "top-end",
                icon: "error",
                title: "Unable to delete broadcast!",
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
            });
        }
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
        <section className="category-page">
            <div className="category-header">
                <div>
                    <h2>Tags</h2>
                    <p>Manage and organize your contact tag</p>
                </div>

                <div className="category-header-actions">

                    <div className="category-total-card">
                        <span>Total Broadcasts</span>
                        <h3>{categories.length}</h3>
                    </div>

                    <button
                        type="button"
                        className="category-add-btn"
                        onClick={() => setShowCreateCategory(true)}
                    >
                        <i className="bi bi-plus-lg"></i>
                        Add Tag
                    </button>
                </div>
            </div>
            <div className="category-table-card">

                <div className="category-table-heading">
                    <div>
                        <h3>Tag List</h3>
                        <p>View all your available tags</p>
                    </div>

                    <button
                        type="button"
                        className="category-refresh-btn"
                        onClick={fetchCategories}
                        disabled={loading}
                    >
                        <i className="bi bi-arrow-clockwise"></i>
                        Refresh
                    </button>
                </div>
                <div className="category-table-wrapper">
                    <table className="category-table">

                        <thead>
                            <tr>
                                <th>Tag ID</th>
                                <th>Tag Name</th>
                                <th>Created Date</th>
                                <th>Updated Date</th>
                                <th>Action</th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="category-message">
                                        Loading tags...
                                    </td>
                                </tr>
                            ) : error ? (
                                <tr>
                                    <td colSpan={5} className="category-message category-error">
                                        {error}
                                    </td>
                                </tr>
                            ) : currentCategories.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="category-message">
                                        No broadcast found.
                                    </td>
                                </tr>
                            ) : (
                                currentCategories.map((category, index) => (
                                    <tr key={category.id}>

                                        {/* <td className="category-id">
                                            {startIndex + index + 1}
                                        </td> */}
                                        <td className="category-id-real">
                                            {category.id}

                                        </td>
                                        <td>
                                            <div className="category-name-cell">
                                                <div className="category-icon">
                                                    <i className="bi bi-collection"></i>
                                                </div>

                                                <span>{category.categoryName}</span>
                                            </div>
                                        </td>

                                        <td>
                                            {formatDate(category.createdAt)}
                                        </td>

                                        <td>
                                            {formatDate(category.updatedAt || "")}
                                        </td>

                                        <td>
                                            <div className="category-actions">
                                                <button
                                                    type="button"
                                                    title="View broadcast"
                                                    className="category-view-btn"
                                                    onClick={() => {
                                                        localStorage.setItem(
                                                            "broadcastId",
                                                            category.id.toString()
                                                        );

                                                        router.push("/broadcasts/view");
                                                    }}
                                                >
                                                    <i className="bi bi-eye"></i>
                                                </button>

                                                <button
                                                    type="button"
                                                    title="Edit category"
                                                    className="category-edit-btn"
                                                    onClick={() => {
                                                        setSelectedCategory(category);
                                                        setShowEditCategory(true);
                                                    }}
                                                >
                                                    <i className="bi bi-pencil-square"></i>
                                                </button>

                                                <button
                                                    type="button"
                                                    title="Delete category"
                                                    className="category-delete-btn"
                                                    onClick={() => handleDelete(category.id)}
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
                {!loading && !error && (
                    <div className="category-pagination">

                        <div className="category-pagination-left">

                            <span>Rows per page</span>

                            <select
                                value={rowsPerPage}
                                onChange={handleRowsChange}
                                className="category-pagination-select"
                            >
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                                <option value={200}>200</option>
                            </select>

                            <span className="category-pagination-info">
                                {categories.length === 0
                                    ? "0 of 0"
                                    : `${startIndex + 1}-${Math.min(
                                        startIndex + rowsPerPage,
                                        categories.length
                                    )} of ${categories.length}`}
                            </span>

                        </div>

                        <div className="category-pagination-right">

                            <button
                                type="button"
                                className="category-page-arrow"
                                disabled={currentPage === 1 || totalPages === 0}
                                onClick={() => setCurrentPage((page) => page - 1)}
                            >
                                <i className="bi bi-chevron-left"></i>
                            </button>

                            {Array.from(
                                { length: totalPages },
                                (_, index) => index + 1
                            ).map((page) => (
                                <button
                                    key={page}
                                    type="button"
                                    className={`category-page-number ${currentPage === page ? "active" : ""
                                        }`}
                                    onClick={() => setCurrentPage(page)}
                                >
                                    {page}
                                </button>
                            ))}

                            <button
                                type="button"
                                className="category-page-arrow"
                                disabled={
                                    currentPage === totalPages ||
                                    totalPages === 0
                                }
                                onClick={() => setCurrentPage((page) => page + 1)}
                            >
                                <i className="bi bi-chevron-right"></i>
                            </button>

                        </div>

                    </div>
                )}

            </div>

            <CreateCategory
                isOpen={showCreateCategory}
                onClose={() => setShowCreateCategory(false)}
                onCategoryCreated={fetchCategories}
            />

            <EditCategory
                isOpen={showEditCategory}
                category={selectedCategory}
                onClose={() => {
                    setShowEditCategory(false);
                    setSelectedCategory(null);
                }}
                onCategoryUpdated={fetchCategories}
            />

        </section>
    );
}

export default Category;
