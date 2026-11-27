
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

import companyService, {
    CompanyRequestDto,
} from "@/app/apiservice/companyservice";

import "./create-companies.css";

const initialForm: CompanyRequestDto = {
    companyName: "",
    mailUsername: "",
    mailPassword: "",
    whatsappAccessToken: "",
    whatsappApiVersion: "",
    whatsappAppId: "",
    whatsappBusinessAccountId: "",
    whatsappPhoneNumberId: "",
    whatsappVerifyToken: "",
    whatsappAppSecret: "",
};

function CreateCompany() {
    const router = useRouter();
    const [formData, setFormData] = useState<CompanyRequestDto>(initialForm);

    const [saving, setSaving] = useState(false);

    const showToast = (
        icon: "success" | "error" | "warning" | "info",
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
            customClass: {
                popup: "company-toast",
            },
        });
    };
    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (
        e: React.FormEvent<HTMLFormElement>
    ) => {
        e.preventDefault();

        if (!formData.companyName.trim()) {
            showToast("warning", "Company name is required");
            return;
        }

        try {
            setSaving(true);

            const payload: CompanyRequestDto = {
                ...formData,
                companyName: formData.companyName.trim(),
            };

            await companyService.createCompany(payload);

            showToast("success", "Company created successfully");

            setTimeout(() => {
                router.push("/super-admin/companies");
            }, 1000);

        } catch (error: any) {
            console.error("Company creation failed:", error);

            showToast(
                "error",
                error?.response?.data?.message ||
                "Unable to create company"
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <section className="create-company-page">

            <div className="create-company-header">

                <div className="create-company-heading">
                    <span className="create-company-eyebrow">
                        MANAGEMENT / COMPANIES
                    </span>

                    <h2>Create Company</h2>

                    <p>
                        Register a new company and configure its
                        email and WhatsApp integration details.
                    </p>
                </div>

                <button
                    type="button"
                    className="create-company-back"
                    onClick={() => router.back()}
                    disabled={saving}
                >
                    <i className="bi bi-arrow-left"></i>
                    Back
                </button>

            </div>

            <form
                className="create-company-form"
                onSubmit={handleSubmit}
            >
                <div className="create-company-card">

                    <div className="create-company-section-header">
                        <div className="create-company-section-icon">
                            <i className="bi bi-buildings"></i>
                        </div>

                        <div>
                            <h3>Company Information</h3>
                            <p>Enter the basic company details.</p>
                        </div>
                    </div>

                    <div className="create-company-grid">

                        <div className="create-company-field full-width">
                            <label htmlFor="companyName">
                                Company Name <span>*</span>
                            </label>

                            <input
                                id="companyName"
                                name="companyName"
                                type="text"
                                placeholder="Enter company name"
                                value={formData.companyName}
                                onChange={handleChange}
                                maxLength={150}
                                required
                            />
                        </div>

                    </div>
                </div>
                <div className="create-company-card">

                    <div className="create-company-section-header">
                        <div className="create-company-section-icon email-icon">
                            <i className="bi bi-envelope"></i>
                        </div>

                        <div>
                            <h3>Email Configuration</h3>
                            <p>Configure the company's email credentials.</p>
                        </div>
                    </div>

                    <div className="create-company-grid">

                        <div className="create-company-field">
                            <label htmlFor="mailUsername">
                                Mail Username
                            </label>

                            <input
                                id="mailUsername"
                                name="mailUsername"
                                type="email"
                                placeholder="Enter email username"
                                value={formData.mailUsername}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="create-company-field">
                            <label htmlFor="mailPassword">
                                Mail Password
                            </label>

                            <input
                                id="mailPassword"
                                name="mailPassword"
                                type="password"
                                placeholder="Enter mail password"
                                value={formData.mailPassword}
                                onChange={handleChange}
                                autoComplete="new-password"
                            />
                        </div>

                    </div>
                </div>
                <div className="create-company-card">

                    <div className="create-company-section-header">
                        <div className="create-company-section-icon whatsapp-icon">
                            <i className="bi bi-whatsapp"></i>
                        </div>

                        <div>
                            <h3>WhatsApp Configuration</h3>
                            <p>
                                Configure Meta WhatsApp Business API credentials.
                            </p>
                        </div>
                    </div>

                    <div className="create-company-grid">

                        <div className="create-company-field full-width">
                            <label htmlFor="whatsappAccessToken">
                                WhatsApp Access Token
                            </label>

                            <input
                                id="whatsappAccessToken"
                                name="whatsappAccessToken"
                                type="password"
                                placeholder="Enter WhatsApp access token"
                                value={formData.whatsappAccessToken}
                                onChange={handleChange}
                                autoComplete="new-password"
                            />
                        </div>

                        <div className="create-company-field">
                            <label htmlFor="whatsappApiVersion">
                                WhatsApp API Version
                            </label>

                            <input
                                id="whatsappApiVersion"
                                name="whatsappApiVersion"
                                type="text"
                                placeholder="Example: v23.0"
                                value={formData.whatsappApiVersion}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="create-company-field">
                            <label htmlFor="whatsappAppId">
                                WhatsApp App ID
                            </label>

                            <input
                                id="whatsappAppId"
                                name="whatsappAppId"
                                type="text"
                                placeholder="Enter WhatsApp App ID"
                                value={formData.whatsappAppId}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="create-company-field">
                            <label htmlFor="whatsappBusinessAccountId">
                                WhatsApp Business Account ID
                            </label>

                            <input
                                id="whatsappBusinessAccountId"
                                name="whatsappBusinessAccountId"
                                type="text"
                                placeholder="Enter Business Account ID"
                                value={formData.whatsappBusinessAccountId}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="create-company-field">
                            <label htmlFor="whatsappPhoneNumberId">
                                WhatsApp Phone Number ID
                            </label>

                            <input
                                id="whatsappPhoneNumberId"
                                name="whatsappPhoneNumberId"
                                type="text"
                                placeholder="Enter Phone Number ID"
                                value={formData.whatsappPhoneNumberId}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="create-company-field">
                            <label htmlFor="whatsappVerifyToken">
                                WhatsApp Verify Token
                            </label>

                            <input
                                id="whatsappVerifyToken"
                                name="whatsappVerifyToken"
                                type="password"
                                placeholder="Enter webhook verify token"
                                value={formData.whatsappVerifyToken}
                                onChange={handleChange}
                                autoComplete="new-password"
                            />
                        </div>

                        <div className="create-company-field">
                            <label htmlFor="whatsappAppSecret">
                                WhatsApp App Secret
                            </label>

                            <input
                                id="whatsappAppSecret"
                                name="whatsappAppSecret"
                                type="password"
                                placeholder="Enter WhatsApp App Secret"
                                value={formData.whatsappAppSecret}
                                onChange={handleChange}
                                autoComplete="new-password"
                            />
                        </div>

                    </div>
                </div>
                <div className="create-company-actions">

                    <button
                        type="button"
                        className="create-company-cancel"
                        onClick={() => router.back()}
                        disabled={saving}
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        className="create-company-submit"
                        disabled={saving}
                    >
                        {saving ? (
                            <>
                                <span className="create-company-spinner"></span>
                                Creating...
                            </>
                        ) : (
                            <>
                                <i className="bi bi-check-lg"></i>
                                Create Company
                            </>
                        )}
                    </button>

                </div>

            </form>
        </section>
    );
}

export default CreateCompany;
