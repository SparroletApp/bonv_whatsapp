
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
        companyId: number;
        companyName: string;
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
                text: "Please enter email and password.",
            });
            return;
        }

        try {
            setLoading(true);
            const appCompanyId = Number(
                sessionStorage.getItem("companyId")
            );

            if (
                !Number.isInteger(appCompanyId) ||
                appCompanyId <= 0
            ) {
                throw new Error(
                    "Application company ID not found in session storage. Please login again."
                );
            }
            const response = await axios.post<TmsLoginResponse>(
                "https://tmsapi.rayloop.com/api/user/login",
                {
                    email: email.trim(),
                    password: password,
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            const data = response.data;
            const companyTourId = Number(data.user?.companyId);

            if (
                !Number.isInteger(companyTourId) ||
                companyTourId <= 0
            ) {
                throw new Error(
                    "TMS company ID is missing from login response."
                );
            }

            sessionStorage.setItem(
                "tms_access_token",
                data.token
            );

            sessionStorage.setItem(
                "tmsCompanyId",
                String(companyTourId)
            );

            sessionStorage.setItem(
                "tms_user",
                JSON.stringify(data.user)
            );
            await tourConnectService.create({
                companyId: appCompanyId,
                companyTourId: companyTourId,
            });

            sessionStorage.setItem("tms_connected", "true");

            await Swal.fire({
                icon: "success",
                title: "Connected Successfully",
                text: `${data.user.companyName} has been connected successfully.`,
                timer: 1800,
                showConfirmButton: false,
            });

            onClose();

        } catch (error: unknown) {
            let message = "Something went wrong. Please try again.";

            if (axios.isAxiosError(error)) {
                message =
                    error.response?.data?.message ||
                    error.response?.data?.error ||
                    message;
            } else if (error instanceof Error) {
                message = error.message;
            }

            Swal.fire({
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
            onClick={onClose}
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
