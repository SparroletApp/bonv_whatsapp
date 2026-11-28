
"use client";

import { useEffect, useState } from "react";
import "./formSubmissionList.css";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import TagSelectionModal, { TagContact } from "./tagselectionModal";

interface PublishedForm {
    id: number;
    formTitle: string;
    formDescription: string | null;
    publicToken: string;
    status: string;
    slug: string;
    allowMultipleSubmissions: boolean;
    expiryDate: string | null;
    companyId: number;
    createdAt: string;
    updatedAt: string;
    packageIds: number[];
    tourPackageNames: string[];
}

interface FormSubmission {
    id: number;
    formId: number;
    formTitle: string;
    packageId: number;
    respondentName: string | null;
    couponCode: string | null;
    discountPercentage: number | null;
    respondentEmail: string | null;
    respondentPhone: string | null;
    status: string;
    submittedAt: string | null;
    createdAt: string;
}

interface FormSubmissionListProps {
    tourCode: string;
    onClose: () => void;
}

export default function FormSubmissionList({
    tourCode,
    onClose,
}: FormSubmissionListProps) {
    const [form, setForm] = useState<PublishedForm | null>(null);
    const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
    const [showSubmissionModal, setShowSubmissionModal] = useState(true);
    const [loading, setLoading] = useState(true);
    const [submissionsLoading, setSubmissionsLoading] = useState(false);

    const [error, setError] = useState("");
    const [submissionError, setSubmissionError] = useState("");

    const [selectedRecipients, setSelectedRecipients] = useState<number[]>([]);
    const [showTagModal, setShowTagModal] = useState(false);
    const [pendingContacts, setPendingContacts] = useState<TagContact[]>([]);

    const router = useRouter();

    const validSubmissions = submissions.filter(
        (item) => item.respondentPhone?.trim()
    );

    const toggleRecipient = (id: number) => {
        setSelectedRecipients((current) =>
            current.includes(id)
                ? current.filter((item) => item !== id)
                : [...current, id]
        );
    };

    const toggleAllRecipients = (checked: boolean) => {
        setSelectedRecipients(
            checked ? validSubmissions.map((item) => item.id) : []
        );
    };

    const createCampaign = () => {
        const recipients: TagContact[] = submissions
            .filter((item) => selectedRecipients.includes(item.id))
            .filter((item) => item.respondentPhone?.trim())
            .map((item) => ({
                name: item.respondentName?.trim() || "Customer",
                phone: item.respondentPhone!.trim(),
                email: item.respondentEmail?.trim() || "",
            }));

        if (recipients.length === 0) {
            setSubmissionError(
                "Please select at least one customer with a phone number."
            );
            return;
        }

        setSubmissionError("");
        setPendingContacts(recipients);
        setShowSubmissionModal(false);
        setShowTagModal(true);
    };

const handleContactsSaved = (
    contactIds: number[],
    categoryId: number
) => {
    setShowTagModal(false);
    setPendingContacts([]);
    setSelectedRecipients([]);
};


    useEffect(() => {
        let cancelled = false;

        const loadData = async () => {
            try {
                setLoading(true);
                setError("");
                setSubmissionError("");
                setForm(null);
                setSubmissions([]);
                setSelectedRecipients([]);

                const token = sessionStorage.getItem("tms_access_token");

                if (!token) {
                    throw new Error(
                        "TMS session expired. Please connect again."
                    );
                }

                if (!tourCode) {
                    throw new Error("Tour code is required.");
                }

                const formResponse = await fetch(
                    "https://tmsapi.rayloop.com/api/forms/get-published-by-tour-code",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Accept: "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({ tourCode }),
                    }
                );

                const formData = await formResponse.json();

                if (!formResponse.ok) {
                    throw new Error(
                        formData.message ||
                        "Unable to fetch published form."
                    );
                }

                if (
                    !formData ||
                    typeof formData !== "object" ||
                    Array.isArray(formData)
                ) {
                    throw new Error("Invalid published form response.");
                }

                const publishedForm = formData as PublishedForm;

                if (cancelled) return;

                setForm(publishedForm);
                setLoading(false);

                const packageIds = publishedForm.packageIds || [];

                if (packageIds.length === 0) {
                    setSubmissions([]);
                    return;
                }

                setSubmissionsLoading(true);

                const submissionResponses = await Promise.all(
                    packageIds.map(async (packageId) => {
                        const response = await fetch(
                            "https://tmsapi.rayloop.com/api/form-submissions/get-by-package",
                            {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                    Accept: "application/json",
                                    Authorization: `Bearer ${token}`,
                                },
                                body: JSON.stringify({ packageId }),
                            }
                        );

                        const data = await response.json();

                        if (!response.ok) {
                            throw new Error(
                                data.message ||
                                `Unable to fetch submissions for package ${packageId}.`
                            );
                        }

                        return Array.isArray(data)
                            ? (data as FormSubmission[])
                            : [];
                    })
                );

                if (cancelled) return;

                const allSubmissions = submissionResponses.flat();

                const uniqueSubmissions = Array.from(
                    new Map(
                        allSubmissions.map((item) => [item.id, item])
                    ).values()
                );

                uniqueSubmissions.sort((a, b) => {
                    const dateA = new Date(
                        a.submittedAt || a.createdAt
                    ).getTime();

                    const dateB = new Date(
                        b.submittedAt || b.createdAt
                    ).getTime();

                    return dateB - dateA;
                });

                setSubmissions(uniqueSubmissions);

            } catch (err) {
                if (!cancelled) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Unable to load form details."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                    setSubmissionsLoading(false);
                }
            }
        };

        loadData();

        return () => {
            cancelled = true;
        };
    }, [tourCode]);

    const formatDate = (date: string | null) => {
        if (!date) return "-";

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return date;
        }

        return parsedDate.toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <>
            {showSubmissionModal && (
        <div className="form-submission-overlay">
                <section
                    className="form-submission-modal"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="form-submission-header">
                        <div>
                            <h2>Form Submissions</h2>
                            <p>
                                Tour Code: <strong>{tourCode}</strong>
                            </p>
                        </div>

                        <button
                            type="button"
                            className="form-submission-close"
                            onClick={onClose}
                        >
                            ×
                        </button>
                    </div>

                    <div className="form-submission-body">
                        {loading && (
                            <div className="form-submission-loading">
                                <div className="form-submission-spinner" />
                                <p>Loading published form...</p>
                            </div>
                        )}

                        {!loading && error && (
                            <div className="form-submission-error">
                                <i className="bi bi-exclamation-circle" />
                                <span>{error}</span>
                            </div>
                        )}

                        {!loading && !error && form && (
                            <>
                                <div className="published-form-card">






                                    {form.tourPackageNames?.length > 0 && (
                                        <div className="published-package-list">
                                            <span>Related Packages</span>
                                            <div>
                                                {form.tourPackageNames.map(
                                                    (packageName, index) => (
                                                        <span key={index}>
                                                            {packageName}
                                                        </span>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="submission-list-section">
                                    <div className="submission-list-heading">
                                        <div>
                                            <h3>Submissions</h3>
                                            <p>
                                                Submitted customer details
                                            </p>
                                        </div>

                                        <span className="submission-count">
                                            {submissions.length} Records
                                        </span>
                                    </div>

                                    {submissionError && (
                                        <div className="form-submission-error">
                                            <i className="bi bi-exclamation-circle" />
                                            <span>{submissionError}</span>
                                        </div>
                                    )}

                                    {submissionsLoading ? (
                                        <div className="form-submission-loading">
                                            <div className="form-submission-spinner" />
                                            <p>
                                                Loading customer submissions...
                                            </p>
                                        </div>
                                    ) : submissions.length === 0 ? (
                                        <div className="submission-empty">
                                            <i className="bi bi-inbox" />
                                            <h4>No submissions available</h4>
                                            <p>
                                                No customers have submitted this
                                                form yet.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="submission-table-wrapper">
                                            <table className="submission-table">
                                                <thead>
                                                    <tr>
                                                        <th>
                                                            <input
                                                                type="checkbox"
                                                                checked={
                                                                    validSubmissions.length > 0 &&
                                                                    validSubmissions.every(
                                                                        (item) =>
                                                                            selectedRecipients.includes(
                                                                                item.id
                                                                            )
                                                                    )
                                                                }
                                                                onChange={(e) =>
                                                                    toggleAllRecipients(
                                                                        e.target.checked
                                                                    )
                                                                }
                                                            />
                                                        </th>
                                                        <th>#</th>
                                                        <th>Name</th>
                                                        <th>Email</th>
                                                        <th>Phone Number</th>
                                                    </tr>
                                                </thead>

                                                <tbody>
                                                    {submissions.map(
                                                        (submission, index) => (
                                                            <tr key={submission.id}>
                                                                <td>
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={selectedRecipients.includes(
                                                                            submission.id
                                                                        )}
                                                                        disabled={
                                                                            !submission.respondentPhone?.trim()
                                                                        }
                                                                        onChange={() =>
                                                                            toggleRecipient(
                                                                                submission.id
                                                                            )
                                                                        }
                                                                    />
                                                                </td>

                                                                <td>{index + 1}</td>

                                                                <td>
                                                                    {submission.respondentName ||
                                                                        "-"}
                                                                </td>

                                                                <td>
                                                                    {submission.respondentEmail ||
                                                                        "-"}
                                                                </td>

                                                                <td>
                                                                    {submission.respondentPhone ||
                                                                        "-"}
                                                                </td>
                                                            </tr>
                                                        )
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    <div className="form-submission-footer">
                        <button
                            type="button"
                            className="create-whatsapp-campaign-btn"
                            disabled={
                                selectedRecipients.length === 0 ||
                                loading ||
                                submissionsLoading
                            }
                            onClick={createCampaign}
                        >
                            <i className="bi bi-whatsapp" />
                            Save Contacts ({selectedRecipients.length})
                        </button>

                        <button type="button" onClick={onClose}>
                            Close
                        </button>
                    </div>
                </section>
                    </div>
    )}

            <TagSelectionModal
                isOpen={showTagModal}
                contacts={pendingContacts}
                onClose={() => setShowTagModal(false)}
                onSave={handleContactsSaved}
            />
            
        </>
    );
}
