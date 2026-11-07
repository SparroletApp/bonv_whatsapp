"use client"

import { useEffect, useState } from "react";
import categoryInsightService, { CategoryDetails, CategorySummary } from "../apiservice/categoryinsightservice";


export default function CategoriesPage() {
    const [cats, setCats] = useState<CategorySummary[]>([]);
    const [details, setDetails] = useState<CategoryDetails | null>(null);

    useEffect(() => { categoryInsightService.list().then(setCats); }, []);

    return (
        <div className="wa-page wa-grid-2">
            <div>
                <h2>Categories</h2>
                {cats.map((c) => (
                    <div key={c.id} className={`wa-card wa-click ${details?.id === c.id ? "on" : ""}`}
                         onClick={() => categoryInsightService.details(c.id).then(setDetails)}>
                        <strong>{c.name}</strong>
                        <div><small>{c.contactCount} contact(s)</small></div>
                    </div>
                ))}
            </div>
            <div>
                {details ? (
                    <>
                        <h2>{details.name} <small>({details.contactCount})</small></h2>
                        <table className="wa-table">
                            <thead><tr><th>Name</th><th>Phone</th><th>Email</th></tr></thead>
                            <tbody>
                            {details.contacts.map((c) => (
                                <tr key={c.id}><td>{c.name}</td><td>{c.phone}</td><td>{c.email || "-"}</td></tr>
                            ))}
                            </tbody>
                        </table>
                    </>
                ) : <p>Select a category to see its contacts.</p>}
            </div>
        </div>
    );
}