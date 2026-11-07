import { ReactNode } from "react";

export default function Modal({ title, onClose, children }:
    { title: string; onClose: () => void; children: ReactNode }) {
    return (
        <div className="wa-modal-backdrop" onClick={onClose}>
            <div className="wa-modal" onClick={(e) => e.stopPropagation()}>
                <div className="wa-modal-head">
                    <h3>{title}</h3>
                    <button className="wa-btn-link" onClick={onClose}>✕</button>
                </div>
                {children}
            </div>
        </div>
    );
}
