"use client";

import { useState } from "react";
import Swal from "sweetalert2";
import "./create-broadcast.css";

interface CreateBroadcastProps {
    onClose: () => void;
    onSubmit: (name: string) => void;
}

function CreateBroadcast({ onClose, onSubmit }: CreateBroadcastProps) {
    const [name, setName] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) return;

        onSubmit(name.trim());

        // Close popup
        onClose();

        // Show success toast
        Swal.fire({
            toast: true,
            position: "top-end",
            icon: "success",
            title: "Broadcast created successfully!",
            showConfirmButton: false,
            timer: 2500,
            timerProgressBar: true,
        });
    };

    return (
        <div className="create-broadcast-overlay" onClick={onClose}>
            <div
                className="create-broadcast-modal"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="create-broadcast-header">
                    <div className="create-broadcast-heading">
                        <div className="create-broadcast-icon">
                            <i className="bi bi-megaphone-fill"></i>
                        </div>

                        <div>
                            <h3>Create Broadcast</h3>
                            <p>Create a new broadcast list.</p>
                        </div>
                    </div>

                    <button
                        type="button"
                        className="create-broadcast-close"
                        onClick={onClose}
                    >
                        <i className="bi bi-x-lg"></i>
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="create-broadcast-body">
                        <label htmlFor="broadcast-name">
                            Broadcast Name <span>*</span>
                        </label>

                        <input
                            id="broadcast-name"
                            type="text"
                            placeholder="Enter broadcast name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            autoFocus
                            maxLength={100}
                        />
                    </div>

                    <div className="create-broadcast-footer">
                        <button
                            type="button"
                            className="create-broadcast-cancel"
                            onClick={onClose}
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="create-broadcast-submit"
                            disabled={!name.trim()}
                        >
                            <i className="bi bi-plus-lg"></i>
                            Create Broadcast
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CreateBroadcast;