
"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

import "./admin-login.css";
import userService from "@/app/apiservice/userservice";

function AdminLogin() {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!email.trim() || !password.trim()) {
            Swal.fire({
                icon: "warning",
                title: "Required Fields",
                text: "Please enter your email and password."
            });
            return;
        }

        try {
            setLoading(true);

            sessionStorage.removeItem("access_token");
            sessionStorage.removeItem("user");
            sessionStorage.removeItem("role");

            const response = await userService.login({
                email: email.trim(),
                password
            });

            if (!response.user) {
                throw new Error("User details not returned from server.");
            }

            if (response.user.role?.toUpperCase() !== "ADMIN") {
                Swal.fire({
                    icon: "error",
                    title: "Access Denied",
                    text: "You are not authorized to access the admin panel."
                });
                return;
            }

            if (!response.accessToken) {
                throw new Error("Access token not received.");
            }

            sessionStorage.setItem("access_token", response.accessToken);
            sessionStorage.setItem("user", JSON.stringify(response.user));
            sessionStorage.setItem("role", response.user.role);

            await Swal.fire({
                icon: "success",
                title: "Login Successful",
                text: "Welcome to Admin Dashboard!",
                timer: 1500,
                showConfirmButton: false
            });

            router.push("/super-admin/dashboard");

        } catch (error: any) {
            Swal.fire({
                icon: "error",
                title: "Login Failed",
                text:
                    error?.response?.data?.message ||
                    error?.message ||
                    "Invalid email or password."
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-login-page">
            <div className="admin-login-card">

                <div className="admin-login-header">
                    <h2>Rayloop Login</h2>
                    <p>Sign in to access the administration panel</p>
                </div>

                <form onSubmit={handleLogin}>

                    <div className="admin-login-field">
                        <label>Email Address</label>
                        <input
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="admin-login-field">
                        <label>Password</label>
                        <input
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="admin-login-button"
                    >
                        {loading ? "Signing in..." : "Login"}
                    </button>

                </form>

            </div>
        </div>
    );
}

export default AdminLogin;
