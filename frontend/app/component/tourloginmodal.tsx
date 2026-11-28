
"use client";

import { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import tourConnectService from "@/app/apiservice/tourconnectservice";
import "./tour-login.css";

interface TourLoginProps {
    onClose: () => void;
}

interface TmsLoginResponse {
    message: string;
    token: string;
    user: {
        companyId: number | null;
        companyName: string | null;
        createdAt: string;
        email: string;
        id: number;
        name: string;
        phone: string;
        role: string;
        status: boolean;
    };
}

export default function TourLogin({ onClose }: TourLoginProps) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async (
        e: React.FormEvent<HTMLFormElement>
    ) => {
        e.preventDefault();

        if (!email.trim() || !password.trim()) {
            Swal.fire({
                icon: "warning",
                title: "Required Fields",
                text: "Please enter your email and password.",
                confirmButtonColor: "#064e45",
            });
            return;
        }

        try {
            setLoading(true);

            // WhatsAppPro company ID
            const appCompanyId = Number(
                sessionStorage.getItem("companyId")
            );

            if (
                !Number.isInteger(appCompanyId) ||
                appCompanyId <= 0
            ) {
                throw new Error(
                    "WhatsAppPro company ID not found. Please login again."
                );
            }

            // TMS login
            const response = await axios.post<TmsLoginResponse>(
                "https://tmsapi.rayloop.com/api/user/login",
                {
                    email: email.trim(),
                    password,
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                    timeout: 30000,
                }
            );

            const data = response.data;

            if (!data.token || !data.user) {
                throw new Error(
                    "Invalid login response received from TMS."
                );
            }

            if (!data.user.status) {
                throw new Error(
                    "Your TMS account is inactive. Please contact the administrator."
                );
            }

            // Save TMS credentials separately.
            // Do not overwrite WhatsAppPro companyId or access_token.
            sessionStorage.setItem(
                "tms_access_token",
                data.token
            );

            sessionStorage.setItem(
                "tms_user",
                JSON.stringify(data.user)
            );

            sessionStorage.setItem(
                "tms_connected",
                "false"
            );

            // TMS company ID can be null for ADMIN.
            const companyTourId = data.user.companyId;

            if (
                companyTourId !== null &&
                Number.isInteger(Number(companyTourId)) &&
                Number(companyTourId) > 0
            ) {
                // Save TMS company ID separately.
                sessionStorage.setItem(
                    "tmsCompanyId",
                    String(companyTourId)
                );

                // Create WhatsAppPro <-> TMS company mapping.
                await tourConnectService.create({
                    companyId: appCompanyId,
                    companyTourId: Number(companyTourId),
                });

                sessionStorage.setItem(
                    "tms_connected",
                    "true"
                );

                await Swal.fire({
                    icon: "success",
                    title: "Connected Successfully",
                    text: `${data.user.companyName || "TMS company"} has been connected successfully.`,
                    timer: 1800,
                    showConfirmButton: false,
                });

                onClose();
                return;
            }

            // ADMIN account without an assigned company.
            // Login succeeded, but no company mapping can be created yet.
            sessionStorage.removeItem("tmsCompanyId");

            await Swal.fire({
                icon: "info",
                title: "TMS Login Successful",
                html: `
                    <p>Your TMS account was authenticated successfully.</p>
                    <p><strong>Account:</strong> ${data.user.name}</p>
                    <p><strong>Role:</strong> ${data.user.role}</p>
                    <p>Your account does not have a TMS company assigned.</p>
                    <p>Please assign a company or select a company to continue.</p>
                `,
                confirmButtonText: "OK",
                confirmButtonColor: "#064e45",
            });

        } catch (error: unknown) {
            let message = "Something went wrong. Please try again.";

            if (axios.isAxiosError(error)) {
                message =
                    error.response?.data?.message ||
                    error.response?.data?.error ||
                    error.message ||
                    message;
            } else if (error instanceof Error) {
                message = error.message;
            }

            await Swal.fire({
                icon: "error",
                title: "Login Failed",
                text: message,
                confirmButtonColor: "#064e45",
            });

        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="tour-login-overlay"
            onClick={() => {
                if (!loading) onClose();
            }}
        >
            <div
                className="tour-login-modal"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    type="button"
                    className="tour-login-close"
                    onClick={onClose}
                    disabled={loading}
                >
                    <i className="bi bi-x-lg"></i>
                </button>

                <div className="tour-login-right">
                    <div className="tour-login-form-header">
                        <span className="tour-login-tag">
                            TMS INTEGRATION
                        </span>

                        <h2>Welcome Back</h2>

                        <p>
                            Login with your Tour Management
                            account credentials.
                        </p>
                    </div>

                    <form onSubmit={handleLogin}>
                        <div className="tour-login-field">
                            <label>Email Address</label>

                            <div className="tour-login-input-wrap">
                                <i className="bi bi-envelope"></i>

                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) =>
                                        setEmail(e.target.value)
                                    }
                                    required
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div className="tour-login-field">
                            <label>Password</label>

                            <div className="tour-login-input-wrap">
                                <i className="bi bi-lock"></i>

                                <input
                                    type={
                                        showPassword
                                            ? "text"
                                            : "password"
                                    }
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    required
                                    disabled={loading}
                                />

                                <button
                                    type="button"
                                    className="tour-login-password-toggle"
                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }
                                    disabled={loading}
                                >
                                    <i
                                        className={
                                            showPassword
                                                ? "bi bi-eye-slash"
                                                : "bi bi-eye"
                                        }
                                    ></i>
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="tour-login-submit"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="tour-login-spinner"></span>
                                    Connecting...
                                </>
                            ) : (
                                <>
                                    Connect Account
                                    <i className="bi bi-arrow-right"></i>
                                </>
                            )}
                        </button>
                    </form>

                    <div className="tour-login-security">
                        <i className="bi bi-shield-check"></i>
                        Your account credentials are securely
                        transmitted.
                    </div>
                </div>
            </div>
        </div>
    );
}
