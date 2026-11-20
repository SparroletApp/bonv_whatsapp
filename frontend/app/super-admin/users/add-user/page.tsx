
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

import "./add-user.css";
import userService from "@/app/apiservice/userservice";

function AddUser() {
    const router = useRouter();

    const [saving, setSaving] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const [form, setForm] = useState({
        name: "",
        email: "",
        phone: "",
        password: "",
        role: "STAFF"
    });

    const generatePassword = () => {
        const lowercase = "abcdefghijkmnopqrstuvwxyz";
        const uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ";
        const numbers = "23456789";
        const symbols = "@#$!%&*";

        const allCharacters = lowercase + uppercase + numbers + symbols;

        const getRandom = (characters: string) => {
            const randomValues = new Uint32Array(1);
            window.crypto.getRandomValues(randomValues);

            return characters[randomValues[0] % characters.length];
        };

        const passwordCharacters = [
            getRandom(lowercase),
            getRandom(uppercase),
            getRandom(numbers),
            getRandom(symbols)
        ];

        while (passwordCharacters.length < 12) {
            passwordCharacters.push(getRandom(allCharacters));
        }

        for (let i = passwordCharacters.length - 1; i > 0; i--) {
            const randomValues = new Uint32Array(1);
            window.crypto.getRandomValues(randomValues);

            const j = randomValues[0] % (i + 1);

            [passwordCharacters[i], passwordCharacters[j]] =
                [passwordCharacters[j], passwordCharacters[i]];
        }

        setForm(prev => ({
            ...prev,
            password: passwordCharacters.join("")
        }));

        setShowPassword(true);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const storedCompanyId = localStorage.getItem("company_view_id");
        const companyId = Number(storedCompanyId);

        if (
            !storedCompanyId ||
            !Number.isInteger(companyId) ||
            companyId <= 0
        ) {
            Swal.fire({
                icon: "warning",
                title: "Company not selected",
                text: "Please select a company before adding a user."
            });
            return;
        }

        if (
            !form.name.trim() ||
            !form.email.trim() ||
            !form.password.trim() ||
            !form.role
        ) {
            Swal.fire({
                icon: "warning",
                title: "Required fields",
                text: "Please fill in all required fields."
            });
            return;
        }

        try {
            setSaving(true);

            await userService.register({
                name: form.name.trim(),
                email: form.email.trim(),
                password: form.password,
                phone: form.phone.trim(),
                role: form.role,
                companyId
            });

            await Swal.fire({
                toast: true,
                position: "top-end",
                icon: "success",
                title: "User added successfully",
                showConfirmButton: false,
                timer: 2000
            });

            router.push("/super-admin/users");

        } catch (error: any) {
            Swal.fire({
                icon: "error",
                title: "Unable to add user",
                text:
                    error?.response?.data?.message ||
                    "Something went wrong while adding the user."
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <section className="add-user">

            <div className="add-user-header">

                <button
                    type="button"
                    className="add-user-back"
                    onClick={() => router.back()}
                >
                    <i className="bi bi-arrow-left"></i>
                </button>

                <div>
                    <span className="add-user-eyebrow">
                        USER MANAGEMENT
                    </span>

                    <h2>Add User</h2>

                    <p>Create a new manager or staff account.</p>
                </div>

            </div>

            <div className="add-user-card">

                <div className="add-user-card-heading">

                    <div className="add-user-icon">
                        <i className="bi bi-person-plus"></i>
                    </div>

                    <div>
                        <h3>User Information</h3>
                        <p>Enter the details of the new user below.</p>
                    </div>

                </div>

                <form onSubmit={handleSubmit}>

                    <div className="add-user-form-grid">

                        <div className="add-user-field">
                            <label>
                                Full Name <span>*</span>
                            </label>

                            <input
                                type="text"
                                placeholder="Enter full name"
                                value={form.name}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        name: e.target.value
                                    })
                                }
                                required
                            />
                        </div>

                        <div className="add-user-field">
                            <label>
                                Email Address <span>*</span>
                            </label>

                            <input
                                type="email"
                                placeholder="Enter email address"
                                value={form.email}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        email: e.target.value
                                    })
                                }
                                required
                            />
                        </div>

                        <div className="add-user-field">
                            <label>Phone Number</label>

                            <input
                                type="tel"
                                placeholder="Enter phone number"
                                value={form.phone}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        phone: e.target.value
                                    })
                                }
                            />
                        </div>

                        <div className="add-user-field">
                            <label>
                                Password <span>*</span>
                            </label>

                            <div className="add-user-password-wrapper">

                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter or generate password"
                                    value={form.password}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            password: e.target.value
                                        })
                                    }
                                    required
                                    minLength={6}
                                />

                                <button
                                    type="button"
                                    className="add-user-password-toggle"
                                    onClick={() =>
                                        setShowPassword(prev => !prev)
                                    }
                                    title={
                                        showPassword
                                            ? "Hide password"
                                            : "Show password"
                                    }
                                >
                                    <i className={`bi ${
                                        showPassword
                                            ? "bi-eye-slash"
                                            : "bi-eye"
                                    }`}></i>
                                </button>

                                <button
                                    type="button"
                                    className="add-user-generate-btn"
                                    onClick={generatePassword}
                                    disabled={saving}
                                    title="Generate secure password"
                                >
                                    <i className="bi bi-shield-lock"></i>
                                    Generate
                                </button>

                            </div>

                            <small className="add-user-password-hint">
                                Use Generate to create a secure 12-character password.
                            </small>
                        </div>

                        <div className="add-user-field">
                            <label>
                                User Role <span>*</span>
                            </label>

                            <select
                                value={form.role}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        role: e.target.value
                                    })
                                }
                                required
                            >
                                <option value="MANAGER">MANAGER</option>
                                <option value="STAFF">STAFF</option>
                            </select>
                        </div>

                    </div>

                    <div className="add-user-actions">

                        <button
                            type="button"
                            className="add-user-cancel"
                            onClick={() => router.back()}
                            disabled={saving}
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="add-user-submit"
                            disabled={saving}
                        >
                            {saving ? (
                                <>
                                    <span className="add-user-spinner"></span>
                                    Adding User...
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-person-plus"></i>
                                    Add User
                                </>
                            )}
                        </button>

                    </div>

                </form>

            </div>

        </section>
    );
}

export default AddUser;
