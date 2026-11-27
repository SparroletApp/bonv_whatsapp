
"use client";

import { useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import { useRouter } from "next/navigation";
import "./contacts.css";

import contactService, {
    ContactResponseDto,
} from "../apiservice/contactservice";

import categoryService, {
    CategoryResponseDto,
} from "../apiservice/categoryservice";

import EditContact from "./edit/page";

type ExcelContact = {
    name?: string | null;
    phone: string;
    email?: string | null;
    categoryIds: number[];
};

function Contact() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [contacts, setContacts] = useState<ContactResponseDto[]>([]);
    const [categories, setCategories] = useState<CategoryResponseDto[]>([]);

    const [categoryNameMap, setCategoryNameMap] = useState<
        Record<number, string>
    >({});

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [bulkUploading, setBulkUploading] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(20);

    const [editingContactId, setEditingContactId] = useState<number | null>(
        null
    );

    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
        null
    );

    useEffect(() => {
        fetchContacts();
    }, []);

    const filteredContacts =
        selectedCategoryId === null
            ? contacts
            : contacts.filter((contact) =>
                contact.categoryIds?.includes(selectedCategoryId)
            );

    const totalPages = Math.ceil(
        filteredContacts.length / rowsPerPage
    );

    const startIndex = (currentPage - 1) * rowsPerPage;

    const currentContacts = filteredContacts.slice(
        startIndex,
        startIndex + rowsPerPage
    );

    const fetchContacts = async () => {
        try {
            setLoading(true);
            setError("");

            const storedCompanyId = sessionStorage.getItem("companyId");
            const loggedInCompanyId = Number(storedCompanyId);

            if (
                !storedCompanyId ||
                !Number.isInteger(loggedInCompanyId) ||
                loggedInCompanyId <= 0
            ) {
                setError("Company ID not found. Please login again.");

                setContacts([]);
                setCategories([]);
                setCategoryNameMap({});

                return;
            }

            const [contactResponse, categoryResponse] =
                await Promise.all([
                    contactService.getContactsByCompanyId({
                        companyId: loggedInCompanyId,
                    }),

                    categoryService.getCategoriesByCompanyId({
                        companyId: loggedInCompanyId,
                    }),
                ]);

            setContacts(contactResponse);

            setCategories(categoryResponse);

            const nameMap: Record<number, string> = {};

            categoryResponse.forEach((category) => {
                nameMap[Number(category.id)] = category.categoryName;
            });

            setCategoryNameMap(nameMap);

            setCurrentPage(1);

            setSelectedCategoryId((previous) => {
                if (
                    previous !== null &&
                    !categoryResponse.some(
                        (category) => Number(category.id) === previous
                    )
                ) {
                    return null;
                }

                return previous;
            });

        } catch (err) {
            console.error("Contact/category fetch error:", err);
            setError("Unable to load contacts or categories.");
        } finally {
            setLoading(false);
        }
    };


    const openEditPage = (contact: ContactResponseDto) => {
        setEditingContactId(contact.id);
    };

    const handleRowsChange = (
        event: React.ChangeEvent<HTMLSelectElement>
    ) => {
        setRowsPerPage(Number(event.target.value));
        setCurrentPage(1);
    };

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
            timer: 3000,
            timerProgressBar: true,
        });
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: "Are you sure?",
            text: "Do you want to delete this contact?",
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
            await contactService.deleteContact({ id });

            setContacts((previous) =>
                previous.filter((contact) => contact.id !== id)
            );

            const remainingCount = filteredContacts.length - 1;

            const newTotalPages = Math.ceil(
                remainingCount / rowsPerPage
            );

            if (currentPage > newTotalPages && newTotalPages > 0) {
                setCurrentPage(newTotalPages);
            } else if (newTotalPages === 0) {
                setCurrentPage(1);
            }

            showToast("success", "Contact deleted successfully!");

        } catch (err) {
            console.error("Delete contact error:", err);
            showToast("error", "Unable to delete contact!");
        }
    };

    const formatDate = (date: string | null) => {
        if (!date) return "-";

        return new Date(date).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const downloadExcelTemplate = () => {
        const sampleData = [
            {
                name: "Rahul",
                phone: "9876543210",
                email: "rahul@gmail.com",
                categoryIds: "1,2",
            },
            {
                name: "Anu",
                phone: "9876543211",
                email: "anu@gmail.com",
                categoryIds: "2,3",
            },
        ];

        const worksheet = XLSX.utils.json_to_sheet(sampleData);
        const workbook = XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(
            workbook,
            worksheet,
            "Contacts"
        );

        XLSX.writeFile(
            workbook,
            "contacts_bulk_upload_template.xlsx"
        );
    };

    const handleBulkUpload = async (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0];

        if (!file) return;

        try {
            setBulkUploading(true);

            const storedCompanyId = sessionStorage.getItem("companyId");
            const loggedInCompanyId = Number(storedCompanyId);

            if (
                !storedCompanyId ||
                !Number.isInteger(loggedInCompanyId) ||
                loggedInCompanyId <= 0
            ) {
                showToast("error", "Company ID not found. Please login again.");
                return;
            }
            const buffer = await file.arrayBuffer();

            const workbook = XLSX.read(buffer, {
                type: "array",
            });

            const worksheet =
                workbook.Sheets[workbook.SheetNames[0]];

            if (!worksheet) {
                showToast("error", "Excel sheet is empty.");
                return;
            }

            const rows = XLSX.utils.sheet_to_json<
                Record<string, unknown>
            >(worksheet, {
                defval: "",
            });

            if (rows.length === 0) {
                showToast(
                    "error",
                    "No contact records found in Excel."
                );
                return;
            }
            const availableCategoryIds = new Set(
                categories.map((category) => Number(category.id))
            );

            const validContacts: ExcelContact[] = [];
            const errors: string[] = [];

            rows.forEach((row, index) => {
                const rowNumber = index + 2;

                const name = String(row.name || "").trim();
                const phone = String(row.phone || "").trim();
                const email = String(row.email || "").trim();

                const categoryIds = String(
                    row.categoryIds || ""
                )
                    .split(",")
                    .map((id) => Number(id.trim()))
                    .filter(
                        (id) => Number.isInteger(id) && id > 0
                    );

                if (!phone) {
                    errors.push(
                        `Row ${rowNumber}: Phone number is required.`
                    );
                    return;
                }

                if (
                    name &&
                    !/^[a-zA-Z\s.'-]+$/.test(name)
                ) {
                    errors.push(
                        `Row ${rowNumber}: Invalid name. Only letters, spaces, dots, apostrophes and hyphens are allowed.`
                    );
                    return;
                }

                if (
                    email &&
                    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
                ) {
                    errors.push(
                        `Row ${rowNumber}: Invalid email address.`
                    );
                    return;
                }

                if (!/^\+?[0-9]{7,15}$/.test(phone)) {
                    errors.push(
                        `Row ${rowNumber}: Invalid phone number.`
                    );
                    return;
                }

                if (categoryIds.length === 0) {
                    errors.push(
                        `Row ${rowNumber}: Please provide at least one valid category ID.`
                    );
                    return;
                }

                if (
                    new Set(categoryIds).size !== categoryIds.length
                ) {
                    errors.push(
                        `Row ${rowNumber}: Duplicate category IDs found.`
                    );
                    return;
                }

                const invalidCategoryIds = categoryIds.filter(
                    (id) => !availableCategoryIds.has(id)
                );

                if (invalidCategoryIds.length > 0) {
                    errors.push(
                        `Row ${rowNumber}: Invalid company category IDs: ${invalidCategoryIds.join(", ")}.`
                    );
                    return;
                }

                validContacts.push({
                    name: name || null,
                    phone,
                    email: email || null,
                    categoryIds,
                });
            });
            if (validContacts.length === 0) {
                await Swal.fire({
                    icon: "error",
                    title: "No valid contacts",
                    html: errors
                        .slice(0, 10)
                        .map((item) => `<div>${item}</div>`)
                        .join(""),
                    confirmButtonColor: "#064e45",
                });

                return;
            }
            const confirmation = await Swal.fire({
                title: "Confirm Bulk Upload",
                html: `
                    <div style="text-align:left">
                        <p><strong>Total Excel rows:</strong> ${rows.length}</p>
                        <p><strong>Valid contacts:</strong> ${validContacts.length}</p>
                        <p><strong>Invalid rows:</strong> ${errors.length}</p>
                    </div>
                `,
                icon: "question",
                showCancelButton: true,
                confirmButtonText: "Upload Contacts",
                cancelButtonText: "Cancel",
                confirmButtonColor: "#064e45",
            });

            if (!confirmation.isConfirmed) return;

            let successCount = 0;

            const uploadErrors = [...errors];
            for (const contact of validContacts) {
                try {
                    await contactService.createContact({
                        name: contact.name || "",
                        phone: contact.phone,
                        email: contact.email || "",
                        categoryIds: contact.categoryIds,
                        companyId: loggedInCompanyId,
                    });

                    successCount++;

                } catch (err) {
                    console.error(
                        `Failed to upload contact ${contact.phone}:`,
                        err
                    );

                    uploadErrors.push(
                        `${contact.phone}: Upload failed. It may already exist.`
                    );
                }
            }

            await fetchContacts();

            await Swal.fire({
                icon: successCount > 0 ? "success" : "error",
                title: "Bulk Upload Completed",
                html: `
                    <div style="text-align:left">
                        <p><strong>Successfully uploaded:</strong> ${successCount}</p>
                        <p><strong>Failed:</strong> ${uploadErrors.length}</p>

                        ${uploadErrors.length
                        ? `
                                    <hr/>
                                    <p><strong>Errors:</strong></p>
                                    <div style="max-height:150px;overflow-y:auto;text-align:left">
                                        ${uploadErrors
                            .slice(0, 15)
                            .map(
                                (item) =>
                                    `<div>${item}</div>`
                            )
                            .join("")}
                                    </div>
                                `
                        : ""
                    }
                    </div>
                `,
                confirmButtonColor: "#064e45",
            });

        } catch (err) {
            console.error("Bulk upload error:", err);

            showToast(
                "error",
                "Unable to process Excel file."
            );

        } finally {
            setBulkUploading(false);

            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    return (
        <>
            <section className="category-page">
                <div className="category-header">
                    <div>
                        <h2>Contacts</h2>
                        <p>Manage and organize your contacts</p>
                    </div>
                    <div className="category-header-actions">
                        <div className="category-total-card">
                            <span>Total Contacts</span>
                            <h3>{contacts.length}</h3>
                        </div>
                        <button
                            type="button"
                            className="category-add-btn"
                            onClick={() => router.push("/contacts/add")}
                        >
                            <i className="bi bi-plus-lg"></i>
                            Add Contact
                        </button>
                    </div>
                </div>
                <div className="contact-category-filter-section">
                    <div className="contact-category-filter-heading">
                        <div>
                            <h3>Filter by Category</h3>
                            <p>Select a category to view its contacts</p>
                        </div>
                    </div>
                    <div className="contact-category-filter-list">
                        <button
                            type="button"
                            className={`contact-filter-item ${selectedCategoryId === null ? "active" : ""
                                }`}
                            onClick={() => {
                                setSelectedCategoryId(null);
                                setCurrentPage(1);
                            }}
                        >
                            <span className="contact-filter-name">
                                <i className="bi bi-people"></i>
                                All Contacts
                            </span>
                            <span className="contact-filter-count">
                                {contacts.length}
                            </span>
                        </button>
                        {categories.map((category) => {
                            const count = contacts.filter((contact) =>
                                contact.categoryIds?.includes(
                                    Number(category.id)
                                )
                            ).length;
                            return (
                                <button
                                    type="button"
                                    key={category.id}
                                    className={`contact-filter-item ${selectedCategoryId ===
                                            Number(category.id)
                                            ? "active"
                                            : ""
                                        }`}
                                    onClick={() => {
                                        setSelectedCategoryId(
                                            Number(category.id)
                                        );
                                        setCurrentPage(1);
                                    }}
                                >
                                    <span className="contact-filter-name">
                                        <i className="bi bi-tag"></i>
                                        {category.categoryName}
                                    </span>

                                    <span className="contact-filter-count">
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
                <div className="category-table-card">

                    <div className="category-table-heading">
                        <div>
                            <h3>Contact List</h3>

                            <p>
                                {selectedCategoryId === null
                                    ? "View and manage all your contacts"
                                    : `Showing contacts in ${categories.find(
                                        (category) =>
                                            Number(category.id) ===
                                            selectedCategoryId
                                    )?.categoryName || "selected category"
                                    }`}
                            </p>
                        </div>

                        <div className="contact-header-buttons">

                            <button
                                type="button"
                                className="contact-excel-template-btn"
                                onClick={downloadExcelTemplate}
                            >
                                <i className="bi bi-download"></i>
                                Excel Template
                            </button>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xlsx,.xls"
                                hidden
                                onChange={handleBulkUpload}
                            />

                            <button
                                type="button"
                                className="contact-bulk-upload-btn"
                                onClick={() =>
                                    fileInputRef.current?.click()
                                }
                                disabled={
                                    bulkUploading ||
                                    loading ||
                                    categories.length === 0
                                }
                            >
                                {bulkUploading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2"></span>
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-file-earmark-spreadsheet"></i>
                                        Bulk Upload
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                className="category-refresh-btn"
                                onClick={fetchContacts}
                                disabled={loading}
                            >
                                <i className="bi bi-arrow-clockwise"></i>
                                Refresh
                            </button>
                        </div>
                    </div>
                    <div className="category-table-wrapper">
                        <table className="category-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Contact Name</th>
                                    <th>Phone</th>
                                    <th>Email</th>
                                    <th>Categories</th>
                                    <th>Created Date</th>
                                    <th>Updated Date</th>
                                    <th>Action</th>
                                </tr>
                            </thead>

                            <tbody>

                                {loading ? (
                                    <tr>
                                        <td
                                            colSpan={8}
                                            className="category-message"
                                        >
                                            Loading contacts...
                                        </td>
                                    </tr>
                                ) : error ? (
                                    <tr>
                                        <td
                                            colSpan={8}
                                            className="category-message category-error"
                                        >
                                            {error}
                                        </td>
                                    </tr>
                                ) : currentContacts.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={8}
                                            className="category-message"
                                        >
                                            No contacts found.
                                        </td>
                                    </tr>
                                ) : (
                                    currentContacts.map(
                                        (contact, index) => (
                                            <tr key={contact.id}>

                                                <td className="category-id">
                                                    {startIndex + index + 1}
                                                </td>

                                                <td>
                                                    <div className="category-name-cell">
                                                        <div className="category-icon">
                                                            <i className="bi bi-person"></i>
                                                        </div>

                                                        <span>
                                                            {contact.name}
                                                        </span>
                                                    </div>
                                                </td>

                                                <td>{contact.phone}</td>

                                                <td>
                                                    {contact.email || "-"}
                                                </td>

                                                <td>
                                                    <div className="contact-category-list">

                                                        {contact.categoryIds?.length ? (
                                                            contact.categoryIds.map(
                                                                (categoryId) => (
                                                                    <span
                                                                        className="contact-category-label"
                                                                        key={`${contact.id}-${categoryId}`}
                                                                    >
                                                                        {categoryNameMap[
                                                                            categoryId
                                                                        ] ||
                                                                            `Category ${categoryId}`}
                                                                    </span>
                                                                )
                                                            )
                                                        ) : (
                                                            "-"
                                                        )}

                                                    </div>
                                                </td>

                                                <td>
                                                    {formatDate(
                                                        contact.createdAt
                                                    )}
                                                </td>

                                                <td>
                                                    {formatDate(
                                                        contact.updatedAt
                                                    )}
                                                </td>

                                                <td>
                                                    <div className="category-actions">

                                                        <button
                                                            type="button"
                                                            title="Edit contact"
                                                            className="category-edit-btn"
                                                            onClick={() =>
                                                                openEditPage(
                                                                    contact
                                                                )
                                                            }
                                                        >
                                                            <i className="bi bi-pencil-square"></i>
                                                        </button>

                                                        <button
                                                            type="button"
                                                            title="Delete contact"
                                                            className="category-delete-btn"
                                                            onClick={() =>
                                                                handleDelete(
                                                                    contact.id
                                                                )
                                                            }
                                                        >
                                                            <i className="bi bi-trash3"></i>
                                                        </button>

                                                    </div>
                                                </td>

                                            </tr>
                                        )
                                    )
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
                                    {filteredContacts.length === 0
                                        ? "0 of 0"
                                        : `${startIndex + 1}-${Math.min(
                                            startIndex + rowsPerPage,
                                            filteredContacts.length
                                        )} of ${filteredContacts.length}`}
                                </span>

                            </div>

                            <div className="category-pagination-right">

                                <button
                                    type="button"
                                    className="category-page-arrow"
                                    disabled={
                                        currentPage === 1 ||
                                        totalPages === 0
                                    }
                                    onClick={() =>
                                        setCurrentPage((page) => page - 1)
                                    }
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
                                        className={`category-page-number ${currentPage === page
                                                ? "active"
                                                : ""
                                            }`}
                                        onClick={() =>
                                            setCurrentPage(page)
                                        }
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
                                    onClick={() =>
                                        setCurrentPage((page) => page + 1)
                                    }
                                >
                                    <i className="bi bi-chevron-right"></i>
                                </button>

                            </div>

                        </div>
                    )}

                </div>

            </section>

            {editingContactId !== null && (
                <EditContact
                    contactId={editingContactId}
                    onClose={() => setEditingContactId(null)}
                    onUpdated={fetchContacts}
                />
            )}
        </>
    );
}

export default Contact;
