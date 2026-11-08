
"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import contactService from "../apiservice/contactservice";
import categoryService, {
    CategoryResponseDto,
} from "../apiservice/categoryservice";
import { useRouter } from "next/navigation";

type ContactResponseDto = {
    id: number;
    name: string;
    phone: string;
    email: string | null;
    categoryId: number;
    categoryName: string;
    createdAt: string;
    updatedAt: string | null;
};

type ContactFormData = {
    name: string;
    phone: string;
    email: string;
    categoryId: number;
};

const emptyForm: ContactFormData = {
    name: "",
    phone: "",
    email: "",
    categoryId: 0,
};

function Contact() {
    const [contacts, setContacts] = useState<ContactResponseDto[]>([]);
    const [categories, setCategories] = useState<CategoryResponseDto[]>([]);
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(20);

    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedContact, setSelectedContact] =
        useState<ContactResponseDto | null>(null);

    const [formData, setFormData] =
        useState<ContactFormData>(emptyForm);

    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchContacts();
        fetchCategories();
    }, []);
    const openEditPage = (contact: ContactResponseDto) => {
        localStorage.setItem("contactId", String(contact.id));
        router.push("/contacts/edit");
    };
    const fetchContacts = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await contactService.getAllContacts();
            setContacts(response);
        } catch (err) {
            console.error("Contact fetch error:", err);
            setError("Unable to load contacts.");
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await categoryService.getAllCategories();
            setCategories(response);
        } catch (err) {
            console.error("Category fetch error:", err);
        }
    };

    const totalPages = Math.ceil(contacts.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;

    const currentContacts = contacts.slice(
        startIndex,
        startIndex + rowsPerPage
    );

    const handleRowsChange = (
        event: React.ChangeEvent<HTMLSelectElement>
    ) => {
        setRowsPerPage(Number(event.target.value));
        setCurrentPage(1);
    };

    const showToast = (
        icon: "success" | "error",
        title: string
    ) => {
        Swal.fire({
            toast: true,
            position: "top-end",
            icon,
            title,
            showConfirmButton: false,
            timer: 2500,
            timerProgressBar: true,
        });
    };

    const openCreateModal = () => {
        setIsEditing(false);
        setSelectedContact(null);
        setFormData(emptyForm);
        setShowModal(true);
    };

    const openEditModal = (contact: ContactResponseDto) => {
        setIsEditing(true);
        setSelectedContact(contact);

        setFormData({
            name: contact.name,
            phone: contact.phone,
            email: contact.email || "",
            categoryId: contact.categoryId,
        });

        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedContact(null);
        setFormData(emptyForm);
    };

    const handleInputChange = (
        event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]:
                name === "categoryId" ? Number(value) : value,
        }));
    };

    const handleSubmit = async (
        event: React.FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        if (!formData.categoryId) {
            showToast("error", "Please select a category.");
            return;
        }

        try {
            setSaving(true);

            if (isEditing && selectedContact) {
                await contactService.updateContact({
                    id: selectedContact.id,
                    name: formData.name,
                    phone: formData.phone,
                    email: formData.email,
                    categoryId: formData.categoryId,
                });

                showToast("success", "Contact updated successfully!");
            } else {
                await contactService.createContact({
                    name: formData.name,
                    phone: formData.phone,
                    email: formData.email,
                    categoryId: formData.categoryId,
                });

                showToast("success", "Contact created successfully!");
            }

            closeModal();
            await fetchContacts();

        } catch (err) {
            console.error("Save contact error:", err);
            showToast(
                "error",
                isEditing
                    ? "Unable to update contact!"
                    : "Unable to create contact!"
            );
        } finally {
            setSaving(false);
        }
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

            const remainingCount = contacts.length - 1;
            const newTotalPages = Math.ceil(remainingCount / rowsPerPage);

            if (currentPage > newTotalPages && newTotalPages > 0) {
                setCurrentPage(newTotalPages);
            }

            Swal.fire({
                toast: true,
                position: "top-end",
                icon: "success",
                title: "Contact deleted successfully!",
                showConfirmButton: false,
                timer: 2500,
                timerProgressBar: true,
            });

        } catch (err) {
            console.error("Delete contact error:", err);

            Swal.fire({
                toast: true,
                position: "top-end",
                icon: "error",
                title: "Unable to delete contact!",
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
            });
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

    return (
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
            <div className="category-table-card">

                <div className="category-table-heading">
                    <div>
                        <h3>Contact List</h3>
                        <p>View and manage all your contacts</p>
                    </div>

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

                <div className="category-table-wrapper">
                    <table className="category-table">

                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Contact Name</th>
                                <th>Phone</th>
                                <th>Email</th>
                                <th>Category</th>
                                <th>Created Date</th>
                                <th>Updated Date</th>
                                <th>Action</th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="category-message">
                                        Loading contacts...
                                    </td>
                                </tr>
                            ) : error ? (
                                <tr>
                                    <td colSpan={8} className="category-message category-error">
                                        {error}
                                    </td>
                                </tr>
                            ) : currentContacts.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="category-message">
                                        No contacts found.
                                    </td>
                                </tr>
                            ) : (
                                currentContacts.map((contact, index) => (
                                    <tr key={contact.id}>

                                        <td className="category-id">
                                            {startIndex + index + 1}
                                        </td>

                                        <td>
                                            <div className="category-name-cell">
                                                <div className="category-icon">
                                                    <i className="bi bi-person"></i>
                                                </div>
                                                <span>{contact.name}</span>
                                            </div>
                                        </td>

                                        <td>{contact.phone}</td>

                                        <td>{contact.email || "-"}</td>

                                        <td>
                                            <span className="contact-category-label">
                                                {contact.categoryName || "-"}
                                            </span>
                                        </td>

                                        <td>
                                            {formatDate(contact.createdAt)}
                                        </td>

                                        <td>
                                            {formatDate(contact.updatedAt)}
                                        </td>

                                        <td>
                                            <div className="category-actions">

                                                <button
                                                    type="button"
                                                    title="Edit contact"
                                                    className="category-edit-btn"
                                                    onClick={() => openEditPage(contact)}
                                                >
                                                    <i className="bi bi-pencil-square"></i>
                                                </button>

                                                <button
                                                    type="button"
                                                    title="Delete contact"
                                                    className="category-delete-btn"
                                                    onClick={() =>
                                                        handleDelete(contact.id)
                                                    }
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
                                {contacts.length === 0
                                    ? "0 of 0"
                                    : `${startIndex + 1}-${Math.min(
                                        startIndex + rowsPerPage,
                                        contacts.length
                                    )} of ${contacts.length}`}
                            </span>

                        </div>

                        <div className="category-pagination-right">

                            <button
                                type="button"
                                className="category-page-arrow"
                                disabled={
                                    currentPage === 1 || totalPages === 0
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
    );
}

export default Contact;
