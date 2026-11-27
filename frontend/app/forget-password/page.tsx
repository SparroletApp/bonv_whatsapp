
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

import userService from "@/app/apiservice/userservice";
import "./forget-password.css";

function ForgetPassword() {

    const router = useRouter();

    const [activeStep, setActiveStep] = useState(1);
    const [loading, setLoading] = useState(false);

    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const Toast = Swal.mixin({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        background: "#ffffff",
        color: "#263c38",
        didOpen: (toast) => {
            toast.onmouseenter = Swal.stopTimer;
            toast.onmouseleave = Swal.resumeTimer;
        }
    });
    const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
        Toast.fire({
            icon: "warning",
            title: "Please enter your email address"
        });
        return;
    }

    try {
        setLoading(true);

        await userService.forgotPassword({
            email: email.trim()
        });

        Toast.fire({
            icon: "success",
            title: "OTP sent successfully"
        });

        setActiveStep(2);

    } catch (error: any) {
        Toast.fire({
            icon: "error",
            title: error?.response?.data?.message || "Unable to send OTP"
        });
    } finally {
        setLoading(false);
    }
};

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!/^\d{6}$/.test(otp)) {
            Toast.fire({
                icon: "warning",
                title: "Please enter a valid 6-digit OTP"
            });
            return;
        }

        try {
            setLoading(true);

            await userService.verifyOtp({
                email: email.trim(),
                otp: otp
            });

            Toast.fire({
                icon: "success",
                title: "Email verified successfully"
            });

            setActiveStep(3);

        } catch (error: any) {
            Toast.fire({
                icon: "error",
                title: error?.response?.data?.message || "Invalid or expired OTP"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword.length < 8) {
            Toast.fire({
                icon: "warning",
                title: "Password must contain at least 8 characters"
            });
            return;
        }

        if (newPassword !== confirmPassword) {
            Toast.fire({
                icon: "warning",
                title: "Both passwords must match"
            });
            return;
        }

        try {
            setLoading(true);

            await userService.resetPassword({
                email: email.trim(),
                newPassword: newPassword
            });

            await Toast.fire({
                icon: "success",
                title: "Password reset successful"
            });

            setTimeout(() => {
                router.push("/");
            }, 1500);

        } catch (error: any) {
            Toast.fire({
                icon: "error",
                title: error?.response?.data?.message || "Unable to reset password"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        try {
            setLoading(true);

            await userService.forgotPassword({
                email: email.trim()
            });

            setOtp("");

            Toast.fire({
                icon: "success",
                title: "OTP resent successfully"
            });

        } catch (error: any) {
            Toast.fire({
                icon: "error",
                title: error?.response?.data?.message || "Unable to resend OTP"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="forget-password">

            <div className="forget-password-container">

                <div className="forget-password-left">

                    <div className="forget-brand">
                        <div className="forget-brand-icon">
                            <i className="bi bi-shield-lock-fill"></i>
                        </div>
                        <span>WhatsAppPro</span>
                    </div>

                    <div className="forget-left-content">
                        <div className="forget-illustration">
                            <i className="bi bi-shield-check"></i>
                        </div>

                        <h2>Secure Your Account</h2>

                        <p>
                            Don't worry! We'll help you recover your account
                            securely through email verification.
                        </p>

                        <div className="forget-security-info">
                            <div>
                                <i className="bi bi-check-circle-fill"></i>
                                Secure OTP verification
                            </div>
                            <div>
                                <i className="bi bi-check-circle-fill"></i>
                                Protected password reset
                            </div>
                            <div>
                                <i className="bi bi-check-circle-fill"></i>
                                Quick account recovery
                            </div>
                        </div>
                    </div>

                    <div className="forget-left-footer">
                        © 2026 WhatsAppPro. All rights reserved.
                    </div>

                </div>
                <div className="forget-password-right">

                    <div className="forget-form-wrapper">
                        <div className="forget-heading">
                            <span className="forget-heading-icon">
                                <i className="bi bi-key-fill"></i>
                            </span>

                            <h1>Forgot Password?</h1>

                        </div>
                        <div className="forget-steps">

                            <div className={`forget-step ${activeStep >= 1 ? "active" : ""}`}>
                                <div className="forget-step-circle">
                                    {activeStep > 1 ? <i className="bi bi-check-lg"></i> : "1"}
                                </div>
                                <span>Email</span>
                            </div>

                            <div className={`forget-step-line ${activeStep >= 2 ? "completed" : ""}`}></div>

                            <div className={`forget-step ${activeStep >= 2 ? "active" : ""}`}>
                                <div className="forget-step-circle">
                                    {activeStep > 2 ? <i className="bi bi-check-lg"></i> : "2"}
                                </div>
                                <span>Verify OTP</span>
                            </div>

                            <div className={`forget-step-line ${activeStep >= 3 ? "completed" : ""}`}></div>

                            <div className={`forget-step ${activeStep >= 3 ? "active" : ""}`}>
                                <div className="forget-step-circle">3</div>
                                <span>New Password</span>
                            </div>

                        </div>

                        {activeStep === 1 && (

                            <form onSubmit={handleSendOtp} className="forget-form">


                                <label>Email Address</label>

                                <div className="forget-input-group">
                                    <i className="bi bi-envelope"></i>

                                    <input
                                        type="email"
                                        placeholder="Enter your registered email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="forget-submit-btn"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <span className="forget-spinner"></span>
                                            Sending OTP...
                                        </>
                                    ) : (
                                        <>
                                            Send OTP
                                            <i className="bi bi-arrow-right"></i>
                                        </>
                                    )}
                                </button>

                            </form>

                        )}

                        {activeStep === 2 && (

                            <form onSubmit={handleVerifyOtp} className="forget-form">

                                <div className="forget-step-title">
                                    <h3>Verify your email</h3>
                                    <p>
                                        We've sent a 6-digit OTP to
                                        <strong> {email}</strong>
                                    </p>
                                </div>

                                <label>Verification OTP</label>

                                <div className="forget-input-group">
                                    <i className="bi bi-shield-lock"></i>

                                    <input
                                        type="text"
                                        placeholder="Enter 6-digit OTP"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                        inputMode="numeric"
                                        maxLength={6}
                                        required
                                    />
                                </div>

                                <div className="forget-resend">
                                    Didn't receive the OTP?
                                    <button
                                        type="button"
                                        onClick={handleResendOtp}
                                        disabled={loading}
                                    >
                                        Resend OTP
                                    </button>
                                </div>

                                <button
                                    type="submit"
                                    className="forget-submit-btn"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <span className="forget-spinner"></span>
                                            Verifying...
                                        </>
                                    ) : (
                                        <>
                                            Verify OTP
                                            <i className="bi bi-arrow-right"></i>
                                        </>
                                    )}
                                </button>

                                <button
                                    type="button"
                                    className="forget-secondary-btn"
                                    onClick={() => setActiveStep(1)}
                                >
                                    <i className="bi bi-arrow-left"></i>
                                    Change Email
                                </button>

                            </form>

                        )}

                        {activeStep === 3 && (

                            <form onSubmit={handleResetPassword} className="forget-form">

                                <div className="forget-step-title">
                                    <h3>Create new password</h3>
                                    <p>
                                        Your email is verified. Enter your new password below.
                                    </p>
                                </div>

                                <label>New Password</label>

                                <div className="forget-input-group">
                                    <i className="bi bi-lock"></i>

                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Enter new password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                    />

                                    <button
                                        type="button"
                                        className="forget-password-toggle"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
                                    </button>
                                </div>

                                <label>Confirm New Password</label>

                                <div className="forget-input-group">
                                    <i className="bi bi-lock-fill"></i>

                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        placeholder="Confirm new password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                    />

                                    <button
                                        type="button"
                                        className="forget-password-toggle"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    >
                                        <i className={`bi ${showConfirmPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
                                    </button>
                                </div>

                                <p className="forget-password-hint">
                                    <i className="bi bi-info-circle"></i>
                                    Password must contain at least 8 characters.
                                </p>

                                <button
                                    type="submit"
                                    className="forget-submit-btn"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <span className="forget-spinner"></span>
                                            Resetting Password...
                                        </>
                                    ) : (
                                        <>
                                            Reset Password
                                            <i className="bi bi-check-circle"></i>
                                        </>
                                    )}
                                </button>

                            </form>

                        )}

                        <div className="forget-bottom">
                            Remember your password?
                            <button type="button" onClick={() => router.push("/")}>
                                Login Now
                            </button>
                        </div>

                    </div>

                </div>

            </div>

        </section>
    );
}

export default ForgetPassword;
