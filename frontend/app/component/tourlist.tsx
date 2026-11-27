
"use client";

import { useEffect, useState } from "react";
import tourConnectService from "@/app/apiservice/tourconnectservice";
import "./tourlist.css";

interface Tour {
    id: number;
    tourCode: string;
    tourName: string;
    description: string;
    durationDays: number;
    durationNights: number;
    minimumTravellers: number;
    maximumTravellers: number;
    currency: string;
    status: string;
    companyId: number;
    companyName: string;
    startDate: string;
    endDate: string;
    coverImageUrl: string;
}

interface TourListProps {
    onClose: () => void;
    onSelect: (tour: Tour) => void;
}

export type { Tour };

export default function TourList({
    onClose,
    onSelect,
}: TourListProps) {
    const [tours, setTours] = useState<Tour[]>([]);
    const [selectedTourId, setSelectedTourId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        const loadTours = async () => {
            try {
                setLoading(true);
                setError("");

                const storedCompanyId = sessionStorage.getItem("companyId");

                if (!storedCompanyId) {
                    throw new Error("Company ID not found. Please login again.");
                }

                const appCompanyId = Number(storedCompanyId);

                if (!Number.isInteger(appCompanyId) || appCompanyId <= 0) {
                    throw new Error("Invalid company ID.");
                }

                const connection =
                    await tourConnectService.getByCompanyId(appCompanyId);

                if (!connection?.companyTourId) {
                    throw new Error(
                        "TMS company connection not found. Please connect TMS."
                    );
                }

                const token = sessionStorage.getItem("tms_access_token");

                if (!token) {
                    throw new Error("TMS session expired. Please connect again.");
                }

                const response = await fetch(
                    "https://tmsapi.rayloop.com/api/tours/get-by-company",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Accept: "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                            companyId: connection.companyTourId,
                        }),
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || "Unable to fetch tours.");
                }

                if (!Array.isArray(data)) {
                    throw new Error("Invalid tours response from TMS.");
                }

                if (!cancelled) {
                    setTours(data);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Unable to load tours."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadTours();

        return () => {
            cancelled = true;
        };
    }, []);

    const handleSelectTour = () => {
        const selectedTour = tours.find(
            (tour) => tour.id === selectedTourId
        );

        if (selectedTour) {
            onSelect(selectedTour);
        }
    };

    return (
        <div className="tour-modal-overlay" onClick={onClose}>
            <section
                className="tour-modal"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="tour-modal-header">
                    <div>
                        <h2>Select Tour</h2>
                        <p>
                            Select one tour from your connected TMS account.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="tour-modal-close"
                        onClick={onClose}
                    >
                        ×
                    </button>
                </div>
                <div className="tour-modal-body">
                    {loading && (
                        <div className="tour-loading">
                            <div className="tour-spinner" />
                            <p>Loading tours...</p>
                        </div>
                    )}

                    {!loading && error && (
                        <div className="tour-error">
                            {error}
                        </div>
                    )}

                    {!loading && !error && tours.length === 0 && (
                        <div className="tour-empty">
                            <i className="bi bi-map" />
                            <h3>No tours found</h3>
                            <p>
                                There are no tours available for this
                                connected company.
                            </p>
                        </div>
                    )}

                    {!loading && !error && tours.length > 0 && (
                        <div className="tour-grid">
                            {tours.map((tour) => (
                                <label
                                    className={`tour-card ${
                                        selectedTourId === tour.id
                                            ? "selected"
                                            : ""
                                    }`}
                                    key={tour.id}
                                >
                                    <div className="tour-card-details">
                                        <span className="tour-code">
                                            {tour.tourCode}
                                        </span>

                                        <h3>{tour.tourName}</h3>
                                    </div>

                                    <div className="tour-radio-wrapper">
                                        <input
                                            type="radio"
                                            name="selectedTour"
                                            value={tour.id}
                                            checked={
                                                selectedTourId === tour.id
                                            }
                                            onChange={() =>
                                                setSelectedTourId(tour.id)
                                            }
                                        />
                                    </div>
                                </label>
                            ))}
                        </div>
                    )}
                </div>

                {!loading && !error && tours.length > 0 && (
                    <div className="tour-modal-footer">
                        <span className="tour-selection-info">
                            {selectedTourId !== null
                                ? "1 tour selected"
                                : "Please select a tour"}
                        </span>

                        <div className="tour-footer-actions">
                            <button
                                type="button"
                                className="tour-cancel-btn"
                                onClick={onClose}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className="tour-confirm-btn"
                                disabled={selectedTourId === null}
                                onClick={handleSelectTour}
                            >
                                Select Tour
                                <i className="bi bi-arrow-right" />
                            </button>
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
}
