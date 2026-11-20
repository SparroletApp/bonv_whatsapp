
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

import "./companies.css";

import companyService, {
    CompanyResponseDto
} from "@/app/apiservice/companyservice";

function Companies() {

    const router = useRouter();

    const [companies, setCompanies] = useState<CompanyResponseDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedId, setSelectedId] = useState<number | null>(null);

    const [companyName, setCompanyName] = useState("");
    const [saving, setSaving] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    useEffect(() => {
        fetchCompanies();
    }, []);

    const fetchCompanies = async () => {
        try {
            setLoading(true);

            const response = await companyService.getAllCompanies();

            setCompanies(Array.isArray(response) ? response : []);

        } catch (error: any) {
            console.error("Failed to fetch companies:", error);

            Swal.fire({
                icon: "error",
                title: "Unable to load companies",
                text: error?.response?.data?.message || "Please try again."
            });

        } finally {
            setLoading(false);
        }
    };
    const filteredCompanies = useMemo(() => {
        return companies.filter((company) =>
            company.companyName
                ?.toLowerCase()
                .includes(search.toLowerCase().trim())
        );
    }, [companies, search]);

    const totalPages = Math.ceil(filteredCompanies.length / pageSize);

    const paginatedCompanies = filteredCompanies.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [search, pageSize]);

    const handleAdd = () => {
        setEditMode(false);
        setSelectedId(null);
        setCompanyName("");
        setShowModal(true);
    };

    const handleEdit = (company: CompanyResponseDto) => {
        setEditMode(true);
        setSelectedId(company.id);
        setCompanyName(company.companyName);
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const trimmedName = companyName.trim();

        if (!trimmedName) {
            Swal.fire({
                icon: "warning",
                title: "Company name required",
                text: "Please enter a company name."
            });
            return;
        }

        try {
            setSaving(true);

            if (editMode && selectedId !== null) {

                const response = await companyService.updateCompany({
                    id: selectedId,
                    companyName: trimmedName
                });

                setCompanies((prev) =>
                    prev.map((company) =>
                        company.id === selectedId
                            ? { ...company, ...response }
                            : company
                    )
                );

                Swal.fire({
                    toast: true,
                    position: "top-end",
                    icon: "success",
                    title: "Company updated successfully",
                    showConfirmButton: false,
                    timer: 2000
                });

            } else {

                await companyService.createCompany({
                    companyName: trimmedName
                });

                Swal.fire({
                    toast: true,
                    position: "top-end",
                    icon: "success",
                    title: "Company added successfully",
                    showConfirmButton: false,
                    timer: 2000
                });

                await fetchCompanies();
            }

            setShowModal(false);
            setCompanyName("");
            setSelectedId(null);

        } catch (error: any) {
            console.error("Company save failed:", error);

            Swal.fire({
                icon: "error",
                title: "Operation failed",
                text: error?.response?.data?.message || "Unable to save company."
            });

        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (company: CompanyResponseDto) => {

        const result = await Swal.fire({
            title: "Delete Company?",
            text: `Are you sure you want to delete ${company.companyName}?`,
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
            await companyService.deleteCompany({
                id: company.id
            });

            setCompanies((prev) =>
                prev.filter((item) => item.id !== company.id)
            );

            Swal.fire({
                toast: true,
                position: "top-end",
                icon: "success",
                title: "Company deleted successfully",
                showConfirmButton: false,
                timer: 2000
            });

        } catch (error: any) {
            console.error("Company deletion failed:", error);

            Swal.fire({
                icon: "error",
                title: "Delete failed",
                text: error?.response?.data?.message ||
                    "Unable to delete company. It may have associated users."
            });
        }
    };

const handleUsers = (company: CompanyResponseDto) => {
    sessionStorage.setItem("company_view_id", String(company.id));
    router.push("/super-admin/users");
};

    const closeModal = () => {
        if (saving) return;

        setShowModal(false);
        setCompanyName("");
        setSelectedId(null);
    };

    return (
        <section className="companies">

            <div className="companies-header">

                <div>
                    <span className="companies-eyebrow">
                        MANAGEMENT
                    </span>

                    <h2>Companies</h2>

                    <p>
                        Manage and organize your registered companies.
                    </p>
                </div>

                <button
                    className="company-add-btn"
                    onClick={handleAdd}
                >
                    <i className="bi bi-plus-lg"></i>
                    Add Company
                </button>

            </div>

            <div className="companies-summary">

                <div className="companies-summary-card">
                    <div className="companies-summary-icon">
                        <i className="bi bi-buildings"></i>
                    </div>

                    <div>
                        <span>Total Companies</span>
                        <h3>{loading ? "..." : companies.length}</h3>
                    </div>
                </div>

                <div className="companies-summary-card">
                    <div className="companies-summary-icon second">
                        <i className="bi bi-check-circle"></i>
                    </div>

                    <div>
                        <span>Showing Companies</span>
                        <h3>{loading ? "..." : filteredCompanies.length}</h3>
                    </div>
                </div>

            </div>

            <div className="companies-table-card">

                <div className="companies-table-header">

                    <div>
                        <h4>All Companies</h4>
                        <p>View and manage your companies</p>
                    </div>

                    <button
                        className="companies-refresh-btn"
                        onClick={fetchCompanies}
                        disabled={loading}
                        title="Refresh"
                    >
                        <i className={`bi bi-arrow-clockwise ${loading ? "company-spin" : ""}`}></i>
                        Refresh
                    </button>

                </div>

                <div className="companies-toolbar">

                    <div className="companies-search">
                        <i className="bi bi-search"></i>

                        <input
                            type="text"
                            placeholder="Search company name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />

                        {search && (
                            <button
                                onClick={() => setSearch("")}
                                title="Clear search"
                            >
                                <i className="bi bi-x-lg"></i>
                            </button>
                        )}
                    </div>

                    <div className="companies-count">
                        {filteredCompanies.length} companies found
                    </div>

                </div>

                <div className="companies-table-responsive">

                    <table className="companies-table">

                        <thead>
                            <tr>
                                <th className="company-number">#</th>
                                <th>COMPANY NAME</th>
                                <th>CREATED DATE</th>
                                <th className="company-actions-heading">ACTIONS</th>
                            </tr>
                        </thead>

                        <tbody>

                            {loading ? (

                                <tr>
                                    <td colSpan={4} className="company-empty">
                                        <div className="company-loader"></div>
                                        <span>Loading companies...</span>
                                    </td>
                                </tr>

                            ) : paginatedCompanies.length === 0 ? (

                                <tr>
                                    <td colSpan={4} className="company-empty">
                                        <div className="company-empty-icon">
                                            <i className="bi bi-buildings"></i>
                                        </div>

                                        <strong>
                                            {search
                                                ? "No companies found"
                                                : "No companies available"}
                                        </strong>

                                        <span>
                                            {search
                                                ? "Try searching with another company name."
                                                : "Add your first company to get started."}
                                        </span>

                                    </td>
                                </tr>

                            ) : (

                                paginatedCompanies.map((company, index) => (

                                    <tr key={company.id}>

                                        <td className="company-number">
                                            {(currentPage - 1) * pageSize + index + 1}
                                        </td>

                                        <td>
                                            <div className="company-name-cell">

                                                <div className="company-name-icon">
                                                    <i className="bi bi-buildings"></i>
                                                </div>

                                                <span>{company.companyName}</span>

                                            </div>
                                        </td>

                                        <td>
                                            <div className="company-date">
                                                <i className="bi bi-calendar3"></i>

                                                {company.createdAt
                                                    ? new Date(company.createdAt).toLocaleDateString(
                                                        "en-IN",
                                                        {
                                                            day: "2-digit",
                                                            month: "short",
                                                            year: "numeric"
                                                        }
                                                    )
                                                    : "-"}
                                            </div>
                                        </td>

                                        <td>
                                            <div className="company-action-buttons">

                                                <button
                                                    className="company-action-btn users"
                                                    onClick={() => handleUsers(company)}
                                                    title="Users"
                                                    aria-label={`View users of ${company.companyName}`}
                                                >
                                                    <i className="bi bi-people"></i>
                                                </button>

                                                <button
                                                    className="company-action-btn edit"
                                                    onClick={() => handleEdit(company)}
                                                    title="Edit"
                                                    aria-label={`Edit ${company.companyName}`}
                                                >
                                                    <i className="bi bi-pencil-square"></i>
                                                </button>

                                                <button
                                                    className="company-action-btn delete"
                                                    onClick={() => handleDelete(company)}
                                                    title="Delete"
                                                    aria-label={`Delete ${company.companyName}`}
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

                {!loading && filteredCompanies.length > 0 && (

                    <div className="companies-pagination">

                        <div className="companies-page-size">
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

                        <div className="companies-pagination-controls">

                            <span>
                                {(currentPage - 1) * pageSize + 1} -{" "}
                                {Math.min(currentPage * pageSize, filteredCompanies.length)}
                                {" "}of {filteredCompanies.length}
                            </span>

                            <button
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage((prev) => prev - 1)}
                                title="Previous page"
                            >
                                <i className="bi bi-chevron-left"></i>
                            </button>

                            <span className="companies-page-number">
                                {currentPage} / {Math.max(totalPages, 1)}
                            </span>

                            <button
                                disabled={currentPage >= totalPages}
                                onClick={() => setCurrentPage((prev) => prev + 1)}
                                title="Next page"
                            >
                                <i className="bi bi-chevron-right"></i>
                            </button>

                        </div>

                    </div>

                )}

            </div>

            {showModal && (

                <div
                    className="company-modal-overlay"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget) closeModal();
                    }}
                >

                    <div className="company-modal">

                        <div className="company-modal-header">

                            <div className="company-modal-title">

                                <div className="company-modal-icon">
                                    <i className={`bi ${editMode ? "bi-pencil-square" : "bi-buildings"}`}></i>
                                </div>

                                <div>
                                    <h3>
                                        {editMode ? "Edit Company" : "Add Company"}
                                    </h3>

                                    <p>
                                        {editMode
                                            ? "Update company information"
                                            : "Enter the company details below"}
                                    </p>
                                </div>

                            </div>

                            <button
                                type="button"
                                className="company-modal-close"
                                onClick={closeModal}
                                disabled={saving}
                            >
                                <i className="bi bi-x-lg"></i>
                            </button>

                        </div>

                        <form onSubmit={handleSubmit}>

                            <div className="company-modal-body">

                                <label htmlFor="companyName">
                                    Company Name
                                    <span>*</span>
                                </label>

                                <input
                                    id="companyName"
                                    type="text"
                                    placeholder="Enter company name"
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                    maxLength={150}
                                    autoFocus
                                    required
                                />

                            </div>

                            <div className="company-modal-footer">

                                <button
                                    type="button"
                                    className="company-cancel-btn"
                                    onClick={closeModal}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="company-save-btn"
                                    disabled={saving}
                                >
                                    {saving ? (
                                        <>
                                            <span className="company-button-loader"></span>
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-check-lg"></i>
                                            {editMode ? "Update Company" : "Save Company"}
                                        </>
                                    )}
                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}

        </section>
    );
}

export default Companies;
