
"use client";

import { useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";
import Swal from "sweetalert2";
import errorService from "../../apiservice/errorservice";
import "./add-contacts.css";

import contactService, {
    ContactCreateDto,
} from "../../apiservice/contactservice";

import categoryService, {
    CategoryResponseDto,
} from "../../apiservice/categoryservice";

import { useRouter } from "next/navigation";

type ExcelContact = {
    name?: string | null;
    phone: string;
    email?: string | null;
    categoryIds: number[];
};

function AddContact() {
    const [categories, setCategories] = useState<CategoryResponseDto[]>([]);
    const router = useRouter();

    const [formData, setFormData] = useState<Omit<ContactCreateDto, "companyId">>({
        name: "",
        phone: "",
        email: "",
        categoryIds: [],
    });

    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    const categoryDropdownRef = useRef<HTMLDivElement>(null);

    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [excelContacts, setExcelContacts] = useState<ExcelContact[]>([]);
    const [excelErrors, setExcelErrors] = useState<string[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const getCompanyId = (): number | null => {
        const storedCompanyId = sessionStorage.getItem("companyId");
        const companyId = Number(storedCompanyId);

        if (
            !storedCompanyId ||
            !Number.isInteger(companyId) ||
            companyId <= 0
        ) {
            return null;
        }

        return companyId;
    };

    useEffect(() => {
        loadCategories();
    }, []);

    useEffect(() => {
        const handleOutsideClick = (event: MouseEvent) => {
            if (
                categoryDropdownRef.current &&
                !categoryDropdownRef.current.contains(event.target as Node)
            ) {
                setShowCategoryDropdown(false);
            }
        };

        document.addEventListener("mousedown", handleOutsideClick);

        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
        };
    }, []);

    const loadCategories = async () => {
        try {
            const companyId = getCompanyId();

            if (!companyId) {
                showToast(
                    "error",
                    "Company ID not found. Please login again."
                );
                return;
            }

            const response =
                await categoryService.getCategoriesByCompanyId({
                    companyId,
                });

            setCategories(response);

        } catch (error: unknown) {
            console.error("Category loading error:", error);
            showToast("error", errorService.getErrorMessage(error));
        }
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

    const handleChange = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    const toggleCategory = (categoryId: number) => {
        setFormData((previous) => ({
            ...previous,
            categoryIds: previous.categoryIds.includes(categoryId)
                ? previous.categoryIds.filter((id) => id !== categoryId)
                : [...previous.categoryIds, categoryId],
        }));
    };

    const removeCategory = (categoryId: number) => {
        setFormData((previous) => ({
            ...previous,
            categoryIds: previous.categoryIds.filter(
                (id) => id !== categoryId
            ),
        }));
    };

    const resetForm = () => {
        setFormData({
            name: "",
            phone: "",
            email: "",
            categoryIds: [],
        });
    };

    const handleManualSubmit = async (
        event: React.FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        if (formData.categoryIds.length === 0) {
            showToast("warning", "Please select at least one category.");
            return;
        }

        const companyId = getCompanyId();

        if (!companyId) {
            showToast(
                "error",
                "Company ID not found. Please login again."
            );
            return;
        }

        try {
            setSaving(true);

            await contactService.createContact({
                ...formData,
                companyId,
            });

            showToast("success", "Contact added successfully!");

            resetForm();

        } catch (error: unknown) {
            console.error("Create contact error:", error);
            showToast("error", errorService.getErrorMessage(error));

        } finally {
            setSaving(false);
        }
    };

    const downloadTemplate = () => {
        const firstCategoryId = categories[0]?.id || 1;

        const sampleData = [
            {
                name: "John Smith",
                phone: "9876543210",
                email: "john@example.com",
                categoryIds: `${firstCategoryId}`,
            },
            {
                name: "Jane Smith",
                phone: "9876543211",
                email: "jane@example.com",
                categoryIds: `${firstCategoryId}`,
            },
        ];

        const worksheet = XLSX.utils.json_to_sheet(sampleData);
        const workbook = XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(
            workbook,
            worksheet,
            "Contacts"
        );

        XLSX.writeFile(workbook, "contacts-template.xlsx");
    };

    const handleFileChange = async (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0];

        if (!file) return;

        const companyId = getCompanyId();

        if (!companyId) {
            showToast(
                "error",
                "Company ID not found. Please login again."
            );
            event.target.value = "";
            return;
        }

        if (categories.length === 0) {
            showToast(
                "warning",
                "No company categories available. Please create a category first."
            );
            event.target.value = "";
            return;
        }

        const extension = file.name.split(".").pop()?.toLowerCase();

        if (!["xlsx", "xls"].includes(extension || "")) {
            showToast(
                "error",
                "Please upload an Excel file (.xlsx or .xls)."
            );
            event.target.value = "";
            return;
        }

        try {
            const buffer = await file.arrayBuffer();

            const workbook = XLSX.read(buffer, {
                type: "array",
                raw: false,
            });

            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

            if (!firstSheet) {
                showToast("error", "Excel sheet is empty.");
                return;
            }

            const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
                firstSheet,
                { defval: "" }
            );

            if (rows.length === 0) {
                showToast(
                    "error",
                    "No contact records found in Excel."
                );
                return;
            }

            const parsedContacts: ExcelContact[] = [];
            const errors: string[] = [];

            const availableCategoryIds = new Set(
                categories.map((category) => Number(category.id))
            );

            rows.forEach((row, index) => {
                const rowNumber = index + 2;

                const name = String(row.name || "").trim();
                const phone = String(row.phone || "").trim();
                const email = String(row.email || "").trim();

                const categoryIds = String(row.categoryIds || "")
                    .split(",")
                    .map((id) => Number(id.trim()))
                    .filter((id) => Number.isInteger(id) && id > 0);

                if (!phone) {
                    errors.push(
                        `Row ${rowNumber}: Phone number is required.`
                    );
                    return;
                }

                if (name && !/^[a-zA-Z\s.'-]+$/.test(name)) {
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

                if (new Set(categoryIds).size !== categoryIds.length) {
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

                parsedContacts.push({
                    name: name || null,
                    phone,
                    email: email || null,
                    categoryIds,
                });
            });

            setSelectedFile(file);
            setExcelContacts(parsedContacts);
            setExcelErrors(errors);

            if (parsedContacts.length === 0) {
                showToast(
                    "error",
                    "No valid contacts found in Excel."
                );
            } else {
                showToast(
                    "success",
                    `${parsedContacts.length} valid contacts ready to upload.`
                );
            }

        } catch (error) {
            console.error("Excel reading error:", error);
            showToast("error", "Unable to read Excel file.");
        }
    };

    const handleBulkUpload = async () => {
        if (excelContacts.length === 0) {
            showToast(
                "warning",
                "Please select a valid Excel file."
            );
            return;
        }

        const companyId = getCompanyId();

        if (!companyId) {
            showToast(
                "error",
                "Company ID not found. Please login again."
            );
            return;
        }

        const result = await Swal.fire({
            title: "Confirm Bulk Upload",
            text: `Do you want to upload ${excelContacts.length} contacts?`,
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "#064e45",
            cancelButtonColor: "#6c7d73",
            confirmButtonText: "Yes, Upload",
            cancelButtonText: "Cancel",
        });

        if (!result.isConfirmed) return;

        setUploading(true);

        let successCount = 0;
        let failedCount = 0;

        try {
            for (const contact of excelContacts) {
                try {
                    await contactService.createContact({
                        name: contact.name || "",
                        phone: contact.phone,
                        email: contact.email || "",
                        categoryIds: contact.categoryIds,
                        companyId,
                    });

                    successCount++;

                } catch (error: unknown) {
                    failedCount++;

                    const message = errorService.getErrorMessage(error);

                    console.error(
                        `Failed contact: ${contact.phone}`,
                        message
                    );
                }
            }
        } finally {
            setUploading(false);
        }

        setSelectedFile(null);
        setExcelContacts([]);
        setExcelErrors([]);

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }

        if (failedCount === 0) {
            showToast(
                "success",
                `${successCount} contacts added successfully!`
            );
        } else if (successCount > 0) {
            showToast(
                "warning",
                `${successCount} added successfully. ${failedCount} failed.`
            );
        } else {
            showToast(
                "error",
                `All ${failedCount} contacts failed to upload.`
            );
        }
    };

    const clearExcel = () => {
        setSelectedFile(null);
        setExcelContacts([]);
        setExcelErrors([]);

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <section className="add-contact">

            <div className="add-contact-header">
                <div>
                    <h2>Add Contacts</h2>
                    <p>
                        Add individual contacts or import multiple contacts using Excel
                    </p>
                </div>

                <button
                    type="button"
                    className="add-contact-back-btn"
                    onClick={() => router.push("/contacts")}
                >
                    <i className="bi bi-arrow-left"></i>
                    Back
                </button>
            </div>

            <div className="add-contact-card">

                <div className="add-contact-card-heading">
                    <div className="add-contact-heading-icon">
                        <i className="bi bi-person-plus"></i>
                    </div>

                    <div>
                        <h3>Add Single Contact</h3>
                        <p>Enter contact details manually</p>
                    </div>
                </div>

                <form onSubmit={handleManualSubmit}>

                    <div className="add-contact-form-grid">

                        <div className="add-contact-form-group">
                            <label>Full Name</label>

                            <input
                                type="text"
                                name="name"
                                placeholder="Enter full name"
                                value={formData.name || ""}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="add-contact-form-group">
                            <label>Phone Number <span>*</span></label>

                            <input
                                type="tel"
                                name="phone"
                                placeholder="Enter phone number"
                                value={formData.phone}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="add-contact-form-group">
                            <label>Email Address</label>

                            <input
                                type="email"
                                name="email"
                                placeholder="Enter email address"
                                value={formData.email || ""}
                                onChange={handleChange}
                            />
                        </div>

                        <div
                            className="add-contact-form-group category-multi-group"
                            ref={categoryDropdownRef}
                        >
                            <label>
                                Tags <span>*</span>
                            </label>

                            <div
                                className={`category-multi-select ${
                                    showCategoryDropdown ? "active" : ""
                                }`}
                                onClick={() =>
                                    setShowCategoryDropdown((previous) => !previous)
                                }
                            >
                                <div className="category-selected-tags">
                                    {formData.categoryIds.length === 0 ? (
                                        <span className="category-placeholder">
                                            Select tags
                                        </span>
                                    ) : (
                                        formData.categoryIds.map((id) => {
                                            const category = categories.find(
                                                (item) => Number(item.id) === id
                                            );

                                            if (!category) return null;

                                            return (
                                                <span
                                                    className="category-selected-tag"
                                                    key={id}
                                                    onClick={(event) =>
                                                        event.stopPropagation()
                                                    }
                                                >
                                                    {category.categoryName}

                                                    <button
                                                        type="button"
                                                        title={`Remove ${category.categoryName}`}
                                                        onClick={() => removeCategory(id)}
                                                    >
                                                        <i className="bi bi-x-lg"></i>
                                                    </button>
                                                </span>
                                            );
                                        })
                                    )}
                                </div>

                                <i
                                    className={`bi bi-chevron-down category-dropdown-arrow ${
                                        showCategoryDropdown ? "rotated" : ""
                                    }`}
                                ></i>
                            </div>

                            {showCategoryDropdown && (
                                <div className="category-dropdown-options">

                                    {categories.length === 0 ? (
                                        <div className="category-empty">
                                            No Tags available
                                        </div>
                                    ) : (
                                        categories.map((category) => {
                                            const categoryId = Number(category.id);

                                            const selected =
                                                formData.categoryIds.includes(categoryId);

                                            return (
                                                <div
                                                    key={category.id}
                                                    className={`category-option ${
                                                        selected ? "selected" : ""
                                                    }`}
                                                    onClick={() =>
                                                        toggleCategory(categoryId)
                                                    }
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={selected}
                                                        readOnly
                                                    />

                                                    <span>
                                                        {category.categoryName}
                                                    </span>

                                                    {selected && (
                                                        <i className="bi bi-check2"></i>
                                                    )}
                                                </div>
                                            );
                                        })
                                    )}

                                </div>
                            )}

                            <small>
                                Select one or more categories. Click × to remove.
                            </small>
                        </div>

                    </div>

                    <div className="add-contact-form-actions">

                        <button
                            type="button"
                            className="add-contact-reset-btn"
                            onClick={resetForm}
                        >
                            <i className="bi bi-arrow-counterclockwise"></i>
                            Reset
                        </button>

                        <button
                            type="submit"
                            className="add-contact-submit-btn"
                            disabled={saving}
                        >
                            <i className="bi bi-plus-lg"></i>
                            {saving ? "Saving..." : "Add Contact"}
                        </button>

                    </div>

                </form>
            </div>

            <div className="add-contact-card">

                <div className="add-contact-card-heading">
                    <div className="add-contact-heading-icon excel-icon">
                        <i className="bi bi-file-earmark-spreadsheet"></i>
                    </div>

                    <div>
                        <h3>Bulk Contact Upload</h3>
                        <p>Import multiple contacts using an Excel file</p>
                    </div>
                </div>

                <div className="add-contact-excel-info">
                    <div>
                        <i className="bi bi-info-circle"></i>
                        <span>
                            Download the Excel template and fill in your contact details.
                            For multiple categories, enter IDs separated by commas (example: 1,2,3).
                        </span>
                    </div>

                    <button
                        type="button"
                        className="add-contact-template-btn"
                        onClick={downloadTemplate}
                    >
                        <i className="bi bi-download"></i>
                        Download Template
                    </button>
                </div>

                <div
                    className="add-contact-upload-area"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <div className="add-contact-upload-icon">
                        <i className="bi bi-cloud-arrow-up"></i>
                    </div>

                    <h4>Upload Excel File</h4>

                    <p>Click here to select your Excel file</p>

                    <span>Supported formats: .xlsx, .xls</span>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xls"
                        hidden
                        onChange={handleFileChange}
                    />
                </div>

                {selectedFile && (
                    <div className="add-contact-selected-file">

                        <div className="add-contact-file-info">
                            <i className="bi bi-file-earmark-excel"></i>

                            <div>
                                <strong>{selectedFile.name}</strong>
                                <span>
                                    {excelContacts.length} valid contacts found
                                </span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={clearExcel}
                            title="Remove file"
                        >
                            <i className="bi bi-x-lg"></i>
                        </button>

                    </div>
                )}

                {excelErrors.length > 0 && (
                    <div className="add-contact-excel-errors">
                        <strong>
                            <i className="bi bi-exclamation-triangle"></i>
                            {excelErrors.length} invalid rows found
                        </strong>

                        <ul>
                            {excelErrors.slice(0, 10).map((error, index) => (
                                <li key={index}>{error}</li>
                            ))}
                        </ul>

                        {excelErrors.length > 10 && (
                            <p>
                                And {excelErrors.length - 10} more errors.
                            </p>
                        )}
                    </div>
                )}

                {excelContacts.length > 0 && (
                    <div className="add-contact-upload-actions">

                        <div>
                            <strong>{excelContacts.length} contacts ready</strong>

                            <span>
                                {excelErrors.length > 0
                                    ? `${excelErrors.length} rows will be skipped`
                                    : "All rows are valid"}
                            </span>
                        </div>

                        <button
                            type="button"
                            className="add-contact-submit-btn"
                            onClick={handleBulkUpload}
                            disabled={uploading}
                        >
                            <i className="bi bi-cloud-upload"></i>
                            {uploading
                                ? "Uploading..."
                                : "Upload All Contacts"}
                        </button>

                    </div>
                )}

            </div>

        </section>
    );
}

export default AddContact;
