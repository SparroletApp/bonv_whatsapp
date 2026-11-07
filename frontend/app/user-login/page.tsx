
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

import userService from "@/app/apiservice/userservice";
import "./user-login.css";

function UserLogin() {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!email.trim() || !password.trim()) {
            Swal.fire({
                icon: "warning",
                title: "Missing Fields",
                text: "Please enter your email and password.",
            });
            return;
        }

        try {
            setLoading(true);
            sessionStorage.removeItem("access_token");

            const response = await userService.login({
                email: email.trim(),
                password,
            });

            if (response?.accessToken) {
                sessionStorage.setItem("access_token", response.accessToken);

                await Swal.fire({
                    icon: "success",
                    title: "Login Successful",
                    text: "Welcome to WhatsApp Automation!",
                    timer: 1500,
                    showConfirmButton: false,
                });

                router.push("/dashboard");
            } else {
                Swal.fire({
                    icon: "error",
                    title: "Login Failed",
                    text: "Access token was not received from the server.",
                });
            }

        } catch (error: any) {
            Swal.fire({
                icon: "error",
                title: "Login Failed",
                text:
                    error?.response?.data?.message ||
                    error?.response?.data ||
                    "Invalid email or password.",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="user-login">
            <div className="container">
                <div className="login-container">

                    <div className="login-left">
                        <div className="login-brand">
                            <div className="brand-icon">
                               <i className="bi bi-whatsapp"></i>
                            </div>
                            <span>WhatsApp Automation</span>
                        </div>

                        <div className="login-content">
                            <span className="login-badge">
                                <i className="bi bi-lightning-charge-fill"></i>
                                SMART BUSINESS MESSAGING
                            </span>

                            <h1>
                                Automate your conversations.
                                <span> Grow your business.</span>
                            </h1>

                            <div className="login-features">
                                <div>
                                    <i className="bi bi-check-circle-fill"></i>
                                    Easy WhatsApp integration
                                </div>
                                <div>
                                    <i className="bi bi-check-circle-fill"></i>
                                    Smart message automation
                                </div>
                                <div>
                                    <i className="bi bi-check-circle-fill"></i>
                                    Manage multiple conversations
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="login-right">
                        <div className="login-form-wrapper">

                            <div className="mobile-brand">
                                <i className="bi bi-whatsapp"></i>
                                WhatsApp Automation
                            </div>

                            <div className="form-heading">
                                <span>WELCOME BACK</span>
                                <h2>Sign in to your account</h2>
                                <p>Enter your credentials to access your dashboard.</p>
                            </div>

                            <form onSubmit={handleLogin}>

                                <div className="form-group">
                                    <label htmlFor="email">Email Address</label>
                                    <div className="input-wrapper">
                                        <i className="bi bi-envelope"></i>
                                        <input
                                            type="email"
                                            id="email"
                                            placeholder="Enter your email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="password">Password</label>
                                    <div className="input-wrapper">
                                        <i className="bi bi-lock"></i>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            id="password"
                                            placeholder="Enter your password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                        />

                                        <button
                                            type="button"
                                            className="password-toggle"
                                            onClick={() => setShowPassword(!showPassword)}
                                            aria-label={showPassword ? "Hide password" : "Show password"}
                                        >
                                            <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="login-submit"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <span className="login-spinner"></span>
                                            Signing in...
                                        </>
                                    ) : (
                                        <>
                                            Sign In
                                            <i className="bi bi-arrow-right"></i>
                                        </>
                                    )}
                                </button>

                            </form>

                            <div className="login-security">
                                <i className="bi bi-shield-lock-fill"></i>
                                Your account is protected with secure authentication.
                            </div>

                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}

export default UserLogin;
