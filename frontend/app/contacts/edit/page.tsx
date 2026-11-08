
"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";

import contactService, {
    ContactUpdateDto,
    ContactResponseDto,
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
        categoryId: 0,
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const storedId = localStorage.getItem("contactId");

        if (!storedId || !Number.isInteger(Number(storedId)) || Number(storedId) <= 0) {
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

            setFormData({
                id: contact.id,
                name: contact.name,
                phone: contact.phone,
                email: contact.email || "",
                categoryId: contact.categoryId,
            });

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
        event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: name === "categoryId" ? Number(value) : value,
        }));
    };

    const handleSubmit = async (
        event: React.FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        if (!contactId) {
            showToast("error", "Contact ID is missing.");
            return;
        }

        if (!formData.categoryId) {
            showToast("warning", "Please select a category.");
            return;
        }

        try {
            setSaving(true);

            await contactService.updateContact({
                id: contactId,
                name: formData.name.trim(),
                phone: formData.phone.trim(),
                email: formData.email.trim(),
                categoryId: formData.categoryId,
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
            <section className="edit-contact-page">
                <div className="edit-contact-loading">
                    <i className="bi bi-arrow-repeat"></i>
                    <p>Loading contact details...</p>
                </div>
            </section>
        );
    }

    return (
        <section className="edit-contact-page">

            <div className="edit-contact-header">
                <div>
                    <h2>Edit Contact</h2>
                    <p>Update and manage your contact information</p>
                </div>

                <button
                    type="button"
                    className="edit-contact-back-btn"
                    onClick={() => router.push("/contacts")}
                >
                    <i className="bi bi-arrow-left"></i>
                    Back to Contacts
                </button>
            </div>

            <div className="edit-contact-card">

                <div className="edit-contact-card-heading">

                    <div className="edit-contact-heading-icon">
                        <i className="bi bi-person-gear"></i>
                    </div>

                    <div>
                        <h3>Contact Information</h3>
                        <p>Update the details of this contact</p>
                    </div>

                </div>

                <form onSubmit={handleSubmit}>

                    <div className="edit-contact-form-grid">

                        <div className="edit-contact-form-group">
                            <label>
                                Full Name <span>*</span>
                            </label>

                            <input
                                type="text"
                                name="name"
                                placeholder="Enter full name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="edit-contact-form-group">
                            <label>
                                Phone Number <span>*</span>
                            </label>

                            <input
                                type="tel"
                                name="phone"
                                placeholder="Enter phone number"
                                value={formData.phone}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="edit-contact-form-group">
                            <label>Email Address</label>

                            <input
                                type="email"
                                name="email"
                                placeholder="Enter email address"
                                value={formData.email || ""}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="edit-contact-form-group">
                            <label>
                                Category <span>*</span>
                            </label>

                            <select
                                name="categoryId"
                                value={formData.categoryId}
                                onChange={handleChange}
                                required
                            >
                                <option value={0}>
                                    Select Category
                                </option>

                                {categories.map((category) => (
                                    <option
                                        key={category.id}
                                        value={category.id}
                                    >
                                        {category.categoryName}
                                    </option>
                                ))}
                            </select>
                        </div>

                    </div>

                    <div className="edit-contact-form-actions">

                        <button
                            type="button"
                            className="edit-contact-reset-btn"
                            onClick={() => contactId && loadData(contactId)}
                            disabled={saving}
                        >
                            <i className="bi bi-arrow-counterclockwise"></i>
                            Reset
                        </button>

                        <button
                            type="submit"
                            className="edit-contact-submit-btn"
                            disabled={saving}
                        >
                            <i className="bi bi-check-lg"></i>

                            {saving
                                ? "Updating..."
                                : "Update Contact"}
                        </button>

                    </div>

                </form>

            </div>

        </section>
    );
}

export default EditContact;
