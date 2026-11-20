
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

    // SEND OTP
    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email.trim()) {
            Swal.fire("Required", "Please enter your email address", "warning");
            return;
        }

        try {
            setLoading(true);

            await userService.forgotPassword({
                email: email.trim()
            });

            Swal.fire({
                icon: "success",
                title: "OTP Sent",
                text: "A verification OTP has been sent to your email.",
                confirmButtonColor: "#064e45"
            });

            setActiveStep(2);

        } catch (error: any) {
            Swal.fire(
                "Failed",
                error?.response?.data?.message || "Unable to send OTP. Please try again.",
                "error"
            );
        } finally {
            setLoading(false);
        }
    };

    // VERIFY OTP
    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!/^\d{6}$/.test(otp)) {
            Swal.fire("Invalid OTP", "Please enter a valid 6-digit OTP", "warning");
            return;
        }

        try {
            setLoading(true);

            await userService.verifyOtp({
                email: email.trim(),
                otp: otp
            });

            Swal.fire({
                icon: "success",
                title: "OTP Verified",
                text: "Your email has been verified successfully.",
                confirmButtonColor: "#064e45"
            });

            setActiveStep(3);

        } catch (error: any) {
            Swal.fire(
                "Verification Failed",
                error?.response?.data?.message || "Invalid or expired OTP.",
                "error"
            );
        } finally {
            setLoading(false);
        }
    };

    // RESET PASSWORD
    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword.length < 8) {
            Swal.fire("Invalid Password", "Password must contain at least 8 characters.", "warning");
            return;
        }

        if (newPassword !== confirmPassword) {
            Swal.fire("Password Mismatch", "Both passwords must match.", "warning");
            return;
        }

        try {
            setLoading(true);

            await userService.resetPassword({
                email: email.trim(),
                newPassword: newPassword
            });

            await Swal.fire({
                icon: "success",
                title: "Password Reset Successful",
                text: "Your password has been changed successfully. Please login.",
                confirmButtonColor: "#064e45"
            });

            router.push("/");

        } catch (error: any) {
            Swal.fire(
                "Reset Failed",
                error?.response?.data?.message || "Unable to reset password. Please try again.",
                "error"
            );
        } finally {
            setLoading(false);
        }
    };

    // RESEND OTP
    const handleResendOtp = async () => {
        try {
            setLoading(true);

            await userService.forgotPassword({
                email: email.trim()
            });

            setOtp("");

            Swal.fire({
                icon: "success",
                title: "OTP Resent",
                text: "A new OTP has been sent to your email.",
                confirmButtonColor: "#064e45"
            });

        } catch (error: any) {
            Swal.fire(
                "Failed",
                error?.response?.data?.message || "Unable to resend OTP.",
                "error"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="forget-password">

            <div className="forget-password-container">

                {/* LEFT SIDE */}
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

                {/* RIGHT SIDE */}
                <div className="forget-password-right">

                    <div className="forget-form-wrapper">
                        <div className="forget-heading">
                            <span className="forget-heading-icon">
                                <i className="bi bi-key-fill"></i>
                            </span>

                            <h1>Forgot Password?</h1>

                        </div>

                        {/* STEP INDICATOR */}
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

                        {/* STEP 1 - EMAIL */}
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

                        {/* STEP 2 - OTP */}
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

                        {/* STEP 3 - NEW PASSWORD */}
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
