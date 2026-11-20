
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

import companyService, {
    CompanyRequestDto,
    CompanyResponseDto,
} from "@/app/apiservice/companyservice";

import "./edit-companies.css";

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

function EditCompany() {
    const router = useRouter();

    const [companyId, setCompanyId] = useState<number | null>(null);
    const [formData, setFormData] =
        useState<CompanyRequestDto>(initialForm);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Fetch company ID from localStorage and load company details
    useEffect(() => {
        const loadCompany = async () => {
            const storedId = localStorage.getItem("company_edit_id");

            if (
                !storedId ||
                !Number.isInteger(Number(storedId)) ||
                Number(storedId) <= 0
            ) {
                setLoading(false);

                await Swal.fire({
                    icon: "warning",
                    title: "Company not selected",
                    text: "Please select a company to edit.",
                });

                router.replace("/super-admin/companies");
                return;
            }

            const id = Number(storedId);
            setCompanyId(id);

            try {
                setLoading(true);

                const response: CompanyResponseDto =
                    await companyService.getCompanyById({ id });

                setFormData({
                    companyName: response.companyName || "",
                    mailUsername: response.mailUsername || "",
                    mailPassword: response.mailPassword || "",
                    whatsappAccessToken:
                        response.whatsappAccessToken || "",
                    whatsappApiVersion:
                        response.whatsappApiVersion || "",
                    whatsappAppId: response.whatsappAppId || "",
                    whatsappBusinessAccountId:
                        response.whatsappBusinessAccountId || "",
                    whatsappPhoneNumberId:
                        response.whatsappPhoneNumberId || "",
                    whatsappVerifyToken:
                        response.whatsappVerifyToken || "",
                    whatsappAppSecret:
                        response.whatsappAppSecret || "",
                });
            } catch (error: any) {
                await Swal.fire({
                    icon: "error",
                    title: "Unable to load company",
                    text:
                        error?.response?.data?.message ||
                        "Unable to fetch company details.",
                });

                router.replace("/super-admin/companies");
            } finally {
                setLoading(false);
            }
        };

        loadCompany();
    }, [router]);

    // Handle input changes
    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // Update company
    const handleSubmit = async (
        e: React.FormEvent<HTMLFormElement>
    ) => {
        e.preventDefault();

        if (!companyId) {
            Swal.fire({
                icon: "error",
                title: "Invalid company",
                text: "Company ID is missing.",
            });
            return;
        }

        if (!formData.companyName.trim()) {
            Swal.fire({
                icon: "warning",
                title: "Company name required",
                text: "Please enter the company name.",
            });
            return;
        }

        try {
            setSaving(true);

            const payload = {
                id: companyId,
                ...formData,
                companyName: formData.companyName.trim(),
            };

            await companyService.updateCompany(payload);

            await Swal.fire({
                toast: true,
                position: "top-end",
                icon: "success",
                title: "Company updated successfully",
                showConfirmButton: false,
                timer: 2000,
            });

            localStorage.removeItem("company_edit_id");

            router.push("/super-admin/companies");
        } catch (error: any) {
            Swal.fire({
                icon: "error",
                title: "Update failed",
                text:
                    error?.response?.data?.message ||
                    "Unable to update company. Please try again.",
            });
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        router.push("/super-admin/companies");
    };

    if (loading) {
        return (
            <div className="edit-company-loading">
                <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <p>Loading company details...</p>
            </div>
        );
    }

    return (
        <div className="edit-company-page">
            <div className="edit-company-header">
                <div>
                    <h2>Edit Company</h2>
                    <p>Update company and integration details</p>
                </div>

                <button
                    type="button"
                    className="edit-company-back-btn"
                    onClick={handleCancel}
                >
                    <i className="bi bi-arrow-left"></i>
                    Back to Companies
                </button>
            </div>

            <form
                className="edit-company-form"
                onSubmit={handleSubmit}
            >
                {/* Company Details */}
                <div className="edit-company-section">
                    <div className="edit-company-section-title">
                        <i className="bi bi-building"></i>
                        <div>
                            <h5>Company Details</h5>
                            <p>Basic company information</p>
                        </div>
                    </div>

                    <div className="edit-company-grid">
                        <div className="edit-company-field">
                            <label htmlFor="companyName">
                                Company Name <span>*</span>
                            </label>
                            <input
                                id="companyName"
                                type="text"
                                name="companyName"
                                value={formData.companyName}
                                onChange={handleChange}
                                placeholder="Enter company name"
                                required
                            />
                        </div>
                    </div>
                </div>

                {/* Mail Configuration */}
                <div className="edit-company-section">
                    <div className="edit-company-section-title">
                        <i className="bi bi-envelope"></i>
                        <div>
                            <h5>Mail Configuration</h5>
                            <p>Email account credentials</p>
                        </div>
                    </div>

                    <div className="edit-company-grid">
                        <div className="edit-company-field">
                            <label htmlFor="mailUsername">
                                Mail Username
                            </label>
                            <input
                                id="mailUsername"
                                type="text"
                                name="mailUsername"
                                value={formData.mailUsername}
                                onChange={handleChange}
                                placeholder="Enter mail username"
                            />
                        </div>

                        <div className="edit-company-field">
                            <label htmlFor="mailPassword">
                                Mail Password
                            </label>
                            <input
                                id="mailPassword"
                                type="password"
                                name="mailPassword"
                                value={formData.mailPassword}
                                onChange={handleChange}
                                placeholder="Enter mail password"
                                autoComplete="new-password"
                            />
                        </div>
                    </div>
                </div>

                {/* WhatsApp Configuration */}
                <div className="edit-company-section">
                    <div className="edit-company-section-title">
                        <i className="bi bi-whatsapp"></i>
                        <div>
                            <h5>WhatsApp Configuration</h5>
                            <p>Meta WhatsApp Business API credentials</p>
                        </div>
                    </div>

                    <div className="edit-company-grid">
                        <div className="edit-company-field">
                            <label htmlFor="whatsappApiVersion">
                                WhatsApp API Version
                            </label>
                            <input
                                id="whatsappApiVersion"
                                type="text"
                                name="whatsappApiVersion"
                                value={formData.whatsappApiVersion}
                                onChange={handleChange}
                                placeholder="Example: v23.0"
                            />
                        </div>

                        <div className="edit-company-field">
                            <label htmlFor="whatsappAppId">
                                WhatsApp App ID
                            </label>
                            <input
                                id="whatsappAppId"
                                type="text"
                                name="whatsappAppId"
                                value={formData.whatsappAppId}
                                onChange={handleChange}
                                placeholder="Enter Meta App ID"
                            />
                        </div>

                        <div className="edit-company-field">
                            <label htmlFor="whatsappBusinessAccountId">
                                WhatsApp Business Account ID
                            </label>
                            <input
                                id="whatsappBusinessAccountId"
                                type="text"
                                name="whatsappBusinessAccountId"
                                value={formData.whatsappBusinessAccountId}
                                onChange={handleChange}
                                placeholder="Enter Business Account ID"
                            />
                        </div>

                        <div className="edit-company-field">
                            <label htmlFor="whatsappPhoneNumberId">
                                WhatsApp Phone Number ID
                            </label>
                            <input
                                id="whatsappPhoneNumberId"
                                type="text"
                                name="whatsappPhoneNumberId"
                                value={formData.whatsappPhoneNumberId}
                                onChange={handleChange}
                                placeholder="Enter Phone Number ID"
                            />
                        </div>

                        <div className="edit-company-field edit-company-full">
                            <label htmlFor="whatsappAccessToken">
                                WhatsApp Access Token
                            </label>
                            <input
                                id="whatsappAccessToken"
                                type="password"
                                name="whatsappAccessToken"
                                value={formData.whatsappAccessToken}
                                onChange={handleChange}
                                placeholder="Enter WhatsApp access token"
                                autoComplete="new-password"
                            />
                        </div>

                        <div className="edit-company-field">
                            <label htmlFor="whatsappVerifyToken">
                                WhatsApp Verify Token
                            </label>
                            <input
                                id="whatsappVerifyToken"
                                type="password"
                                name="whatsappVerifyToken"
                                value={formData.whatsappVerifyToken}
                                onChange={handleChange}
                                placeholder="Enter webhook verify token"
                                autoComplete="new-password"
                            />
                        </div>

                        <div className="edit-company-field">
                            <label htmlFor="whatsappAppSecret">
                                WhatsApp App Secret
                            </label>
                            <input
                                id="whatsappAppSecret"
                                type="password"
                                name="whatsappAppSecret"
                                value={formData.whatsappAppSecret}
                                onChange={handleChange}
                                placeholder="Enter Meta App Secret"
                                autoComplete="new-password"
                            />
                        </div>
                    </div>
                </div>

                {/* Form Actions */}
                <div className="edit-company-actions">
                    <button
                        type="button"
                        className="edit-company-cancel-btn"
                        onClick={handleCancel}
                        disabled={saving}
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        className="edit-company-save-btn"
                        disabled={saving}
                    >
                        {saving ? (
                            <>
                                <span className="spinner-border spinner-border-sm"></span>
                                Updating...
                            </>
                        ) : (
                            <>
                                <i className="bi bi-check-circle"></i>
                                Update Company
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default EditCompany;
