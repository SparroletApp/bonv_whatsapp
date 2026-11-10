
"use client";

import { useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";

import contactService, {
    ContactUpdateDto,
} from "../../apiservice/contactservice";

import categoryService, {
    CategoryResponseDto,
} from "../../apiservice/categoryservice";

import errorService from "../../apiservice/errorservice";

import "./contact-edit.css";

function EditContact() {
    const router = useRouter();

    const [contactId, setContactId] = useState<number | null>(null);
    const [categories, setCategories] = useState<CategoryResponseDto[]>([]);

    const [formData, setFormData] = useState<ContactUpdateDto>({
        id: 0,
        name: "",
        phone: "",
        email: "",
        categoryIds: [],
    });

    const [originalData, setOriginalData] =
        useState<ContactUpdateDto | null>(null);

    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

    const categoryDropdownRef = useRef<HTMLDivElement>(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const storedId = localStorage.getItem("contactId");

        if (
            !storedId ||
            !Number.isInteger(Number(storedId)) ||
            Number(storedId) <= 0
        ) {
            Swal.fire({
                icon: "warning",
                title: "Contact not selected",
                text: "Please select a contact to edit.",
                confirmButtonColor: "#064e45",
            }).then(() => {
                router.push("/contacts");
            });

            return;
        }

        const id = Number(storedId);

        setContactId(id);
        loadData(id);
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

    const loadData = async (id: number) => {
        try {
            setLoading(true);

            const [contact, categoryList] = await Promise.all([
                contactService.getContactById({ id }),
                categoryService.getAllCategories(),
            ]);

            setCategories(categoryList);

            const contactData: ContactUpdateDto = {
                id: contact.id,
                name: contact.name,
                phone: contact.phone,
                email: contact.email || "",
                categoryIds: contact.categoryIds || [],
            };

            setFormData(contactData);
            setOriginalData(contactData);

        } catch (error: unknown) {
            console.error("Contact loading error:", error);

            showToast(
                "error",
                errorService.getErrorMessage(error)
            );

            router.push("/contacts");
        } finally {
            setLoading(false);
        }
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

    const handleReset = () => {
        if (originalData) {
            setFormData({
                ...originalData,
                categoryIds: [...originalData.categoryIds],
            });

            setShowCategoryDropdown(false);
        }
    };

    const handleClose = () => {
        if (saving) return;
        router.push("/contacts");
    };

    const handleSubmit = async (
        event: React.FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        if (!contactId) {
            showToast("error", "Contact ID is missing.");
            return;
        }

        if (formData.categoryIds.length === 0) {
            showToast("warning", "Please select at least one category.");
            return;
        }

        try {
            setSaving(true);

            await contactService.updateContact({
                id: contactId,
                name: formData.name.trim(),
                phone: formData.phone.trim(),
                email: formData.email.trim(),
                categoryIds: formData.categoryIds,
            });

            await Swal.fire({
                icon: "success",
                title: "Contact Updated!",
                text: "Contact details updated successfully.",
                confirmButtonColor: "#064e45",
            });

            localStorage.removeItem("contactId");

            router.push("/contacts");

        } catch (error: unknown) {
            console.error("Contact update error:", error);

            showToast(
                "error",
                errorService.getErrorMessage(error)
            );
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="edit-contact-overlay">
                <div className="edit-contact-drawer">
                    <div className="edit-drawer-loading">
                        <i className="bi bi-arrow-repeat"></i>
                        <p>Loading contact details...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="edit-contact-overlay">

            {/* BACKGROUND OVERLAY */}
            <div
                className="edit-contact-backdrop"
                onClick={handleClose}
            />

            {/* RIGHT SIDE DRAWER */}
            <aside className="edit-contact-drawer">

                {/* DRAWER HEADER */}
                <div className="edit-drawer-header">

                    <div className="edit-drawer-heading">

                        <div className="edit-drawer-icon">
                            <i className="bi bi-person-gear"></i>
                        </div>

                        <div>
                            <h2>Edit Contact</h2>
                            <p>Update contact information and categories</p>
                        </div>

                    </div>

                    <button
                        type="button"
                        className="edit-drawer-close"
                        onClick={handleClose}
                        disabled={saving}
                        aria-label="Close drawer"
                    >
                        <i className="bi bi-x-lg"></i>
                    </button>

                </div>

                {/* DRAWER CONTENT */}
                <form
                    className="edit-drawer-form"
                    onSubmit={handleSubmit}
                >

                    <div className="edit-drawer-body">

                        <div className="edit-drawer-section-title">
                            <h3>Contact Information</h3>
                            <p>Enter the details below to update this contact.</p>
                        </div>

                        <div className="edit-drawer-form-grid">

                            {/* NAME */}
                            <div className="edit-drawer-field">
                                <label>
                                    Full Name <span>*</span>
                                </label>

                                <div className="edit-drawer-input-wrapper">
                                    <i className="bi bi-person"></i>

                                    <input
                                        type="text"
                                        name="name"
                                        placeholder="Enter full name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            {/* PHONE */}
                            <div className="edit-drawer-field">
                                <label>
                                    Phone Number <span>*</span>
                                </label>

                                <div className="edit-drawer-input-wrapper">
                                    <i className="bi bi-telephone"></i>

                                    <input
                                        type="tel"
                                        name="phone"
                                        placeholder="Enter phone number"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            {/* EMAIL */}
                            <div className="edit-drawer-field">
                                <label>Email Address</label>

                                <div className="edit-drawer-input-wrapper">
                                    <i className="bi bi-envelope"></i>

                                    <input
                                        type="email"
                                        name="email"
                                        placeholder="Enter email address"
                                        value={formData.email || ""}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            {/* MULTIPLE CATEGORY SELECT */}
                            <div
                                className="edit-drawer-field edit-drawer-category-field"
                                ref={categoryDropdownRef}
                            >
                                <label>
                                    Categories <span>*</span>
                                </label>

                                <div
                                    className={`edit-category-multi-select ${
                                        showCategoryDropdown ? "active" : ""
                                    }`}
                                    onClick={() =>
                                        setShowCategoryDropdown((previous) => !previous)
                                    }
                                >
                                    <div className="edit-category-selected-tags">

                                        {formData.categoryIds.length === 0 ? (
                                            <span className="edit-category-placeholder">
                                                Select categories
                                            </span>
                                        ) : (
                                            formData.categoryIds.map((id) => {
                                                const category = categories.find(
                                                    (item) => item.id === id
                                                );

                                                if (!category) return null;

                                                return (
                                                    <span
                                                        className="edit-category-selected-tag"
                                                        key={id}
                                                        onClick={(event) =>
                                                            event.stopPropagation()
                                                        }
                                                    >
                                                        {category.categoryName}

                                                        <button
                                                            type="button"
                                                            title={`Remove ${category.categoryName}`}
                                                            onClick={() =>
                                                                removeCategory(id)
                                                            }
                                                        >
                                                            <i className="bi bi-x"></i>
                                                        </button>
                                                    </span>
                                                );
                                            })
                                        )}

                                    </div>

                                    <i
                                        className={`bi bi-chevron-down edit-category-dropdown-arrow ${
                                            showCategoryDropdown ? "rotated" : ""
                                        }`}
                                    ></i>
                                </div>

                                {showCategoryDropdown && (
                                    <div className="edit-category-dropdown-options">

                                        {categories.length === 0 ? (
                                            <div className="edit-category-empty">
                                                No categories available
                                            </div>
                                        ) : (
                                            categories.map((category) => {
                                                const selected =
                                                    formData.categoryIds.includes(
                                                        category.id
                                                    );

                                                return (
                                                    <div
                                                        key={category.id}
                                                        className={`edit-category-option ${
                                                            selected ? "selected" : ""
                                                        }`}
                                                        onClick={() =>
                                                            toggleCategory(category.id)
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
                                    Select one or more categories.
                                </small>
                            </div>

                        </div>

                        {/* INFORMATION NOTE */}
                        <div className="edit-drawer-info">
                            <i className="bi bi-info-circle"></i>
                            <span>
                                Update the contact details and click Save Changes
                                to apply your modifications.
                            </span>
                        </div>

                    </div>

                    {/* FIXED DRAWER FOOTER */}
                    <div className="edit-drawer-footer">

                        <button
                            type="button"
                            className="edit-drawer-cancel-btn"
                            onClick={handleClose}
                            disabled={saving}
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            className="edit-drawer-reset-btn"
                            onClick={handleReset}
                            disabled={saving}
                        >
                            <i className="bi bi-arrow-counterclockwise"></i>
                            Reset
                        </button>

                        <button
                            type="submit"
                            className="edit-drawer-submit-btn"
                            disabled={saving}
                        >
                            {saving ? (
                                <>
                                    <span className="edit-drawer-spinner"></span>
                                    Updating...
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-check-lg"></i>
                                    Save Changes
                                </>
                            )}
                        </button>

                    </div>

                </form>

            </aside>

        </div>
    );
}

export default EditContact;
