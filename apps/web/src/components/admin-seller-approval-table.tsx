"use client";

import { useEffect, useMemo, useState } from "react";
import {
  decideSellerApplication,
  getPendingSellerApplications,
  type SellerApplication
} from "@/lib/api";

type DecisionAction = "approve" | "reject" | "suspend";

export function AdminSellerApprovalTable() {
  const [applications, setApplications] = useState<SellerApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeDecision, setActiveDecision] = useState<{
    application: SellerApplication;
    action: DecisionAction;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;

    getPendingSellerApplications()
      .then((data) => {
        if (isMounted) setApplications(data.items);
      })
      .catch((loadError) => {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : "Pending sellers could not be loaded.");
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const hasApplications = applications.length > 0;

  function replaceApplication(updated: SellerApplication) {
    setApplications((current) => current.filter((application) => application.id !== updated.id));
  }

  return (
    <section style={styles.panel}>
      <div style={styles.panelHeader}>
        <div>
          <p style={styles.eyebrow}>Admin review queue</p>
          <h2 style={styles.heading}>Seller approval requests</h2>
        </div>
        <span style={styles.countBadge}>{applications.length} pending</span>
      </div>

      {isLoading ? <p style={styles.stateText}>Loading pending seller applications...</p> : null}
      {error ? <p role="alert" style={styles.error}>{error}</p> : null}
      {!isLoading && !error && !hasApplications ? (
        <div style={styles.emptyState}>
          <strong>No pending sellers right now.</strong>
          <span>New applications will appear here for admin review.</span>
        </div>
      ) : null}

      {hasApplications ? (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Store</th>
                <th style={styles.th}>Contact</th>
                <th style={styles.th}>Submitted</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((application) => (
                <tr key={application.id}>
                  <td style={styles.td}>
                    <strong>{application.storeName}</strong>
                    <span style={styles.description}>{application.storeDescription}</span>
                  </td>
                  <td style={styles.td}>
                    <span>{application.phone}</span>
                    <span style={styles.description}>{application.address}</span>
                  </td>
                  <td style={styles.td}>{formatDate(application.createdAt)}</td>
                  <td style={styles.td}>
                    <span style={styles.statusBadge}>Awaiting review</span>
                  </td>
                  <td style={styles.actionCell}>
                    <button
                      type="button"
                      style={styles.approveButton}
                      onClick={() => setActiveDecision({ application, action: "approve" })}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      style={styles.rejectButton}
                      onClick={() => setActiveDecision({ application, action: "reject" })}
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      style={styles.suspendButton}
                      onClick={() => setActiveDecision({ application, action: "suspend" })}
                    >
                      Suspend
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {activeDecision ? (
        <DecisionModal
          application={activeDecision.application}
          action={activeDecision.action}
          onClose={() => setActiveDecision(null)}
          onSaved={(application) => {
            replaceApplication(application);
            setActiveDecision(null);
          }}
        />
      ) : null}
    </section>
  );
}

function DecisionModal({
  application,
  action,
  onClose,
  onSaved
}: {
  application: SellerApplication;
  action: DecisionAction;
  onClose: () => void;
  onSaved: (application: SellerApplication) => void;
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const needsReason = action !== "approve";
  const title = useMemo(() => {
    if (action === "approve") return "Approve seller application";
    if (action === "reject") return "Reject seller application";
    return "Suspend seller application";
  }, [action]);

  async function saveDecision() {
    if (needsReason && reason.trim().length < 5) {
      setError("Add a clear reason so the seller knows what happened.");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const result = await decideSellerApplication(application.id, action, reason.trim());
      onSaved(result.application);
    } catch (decisionError) {
      setError(decisionError instanceof Error ? decisionError.message : "Decision could not be saved.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div style={styles.modalBackdrop} role="presentation">
      <div style={styles.modal} role="dialog" aria-modal="true" aria-labelledby="seller-decision-title">
        <p style={styles.eyebrow}>{application.storeName}</p>
        <h3 id="seller-decision-title" style={styles.modalTitle}>{title}</h3>
        <p style={styles.modalCopy}>
          {action === "approve"
            ? "Approved sellers can continue toward store setup and product creation."
            : "The seller will see this reason on their application status."}
        </p>

        {needsReason ? (
          <label style={styles.modalLabel}>
            Decision reason
            <textarea
              value={reason}
              onChange={(event) => {
                setReason(event.target.value);
                setError("");
              }}
              rows={5}
              placeholder="Example: Please provide clearer business documents before approval."
              style={styles.textarea}
            />
          </label>
        ) : null}

        {error ? <p role="alert" style={styles.error}>{error}</p> : null}

        <div style={styles.modalActions}>
          <button type="button" onClick={onClose} style={styles.cancelButton}>
            Cancel
          </button>
          <button
            type="button"
            onClick={saveDecision}
            disabled={isSaving}
            style={action === "approve" ? styles.approveButton : styles.rejectButton}
          >
            {isSaving ? "Saving..." : title}
          </button>
        </div>
      </div>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

const styles = {
  panel: {
    background: "#ffffff",
    border: "1px solid #e7ded2",
    borderRadius: 8,
    boxShadow: "0 18px 50px rgba(23, 33, 29, 0.08)",
    overflow: "hidden"
  },
  panelHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    padding: 24,
    borderBottom: "1px solid #eee4d8"
  },
  eyebrow: {
    margin: 0,
    color: "#1f9d72",
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: 0,
    fontSize: 13
  },
  heading: {
    margin: "8px 0 0",
    fontSize: 24
  },
  countBadge: {
    alignSelf: "start",
    borderRadius: 6,
    padding: "6px 10px",
    background: "#ffedd5",
    color: "#9a3412",
    fontWeight: 800,
    whiteSpace: "nowrap"
  },
  tableWrap: {
    overflowX: "auto"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: 860
  },
  th: {
    padding: "14px 16px",
    textAlign: "left",
    fontSize: 13,
    color: "#6b6259",
    background: "#fff7ed",
    borderBottom: "1px solid #eee4d8"
  },
  td: {
    padding: 16,
    verticalAlign: "top",
    borderBottom: "1px solid #f0e8de"
  },
  description: {
    display: "block",
    maxWidth: 360,
    marginTop: 6,
    color: "#6b6259",
    lineHeight: 1.5,
    fontSize: 14
  },
  actionCell: {
    display: "flex",
    gap: 8,
    padding: 16,
    borderBottom: "1px solid #f0e8de"
  },
  statusBadge: {
    display: "inline-block",
    borderRadius: 6,
    padding: "6px 10px",
    color: "#1e3a8a",
    background: "#eff6ff",
    fontWeight: 800,
    fontSize: 13
  },
  approveButton: {
    border: 0,
    borderRadius: 8,
    padding: "10px 12px",
    color: "#ffffff",
    background: "#1f9d72",
    fontWeight: 800,
    cursor: "pointer"
  },
  rejectButton: {
    border: 0,
    borderRadius: 8,
    padding: "10px 12px",
    color: "#ffffff",
    background: "#b42318",
    fontWeight: 800,
    cursor: "pointer"
  },
  suspendButton: {
    border: "1px solid #fed7aa",
    borderRadius: 8,
    padding: "10px 12px",
    color: "#9a3412",
    background: "#fff7ed",
    fontWeight: 800,
    cursor: "pointer"
  },
  stateText: {
    margin: 0,
    padding: 24,
    color: "#6b6259"
  },
  emptyState: {
    display: "grid",
    gap: 6,
    padding: 24,
    color: "#44403c",
    background: "#f5f5f4"
  },
  error: {
    margin: 0,
    padding: 12,
    color: "#8a1f11",
    background: "#fff0ed",
    borderRadius: 8,
    fontWeight: 700
  },
  modalBackdrop: {
    position: "fixed",
    inset: 0,
    display: "grid",
    placeItems: "center",
    padding: 20,
    background: "rgba(23, 33, 29, 0.52)"
  },
  modal: {
    width: "min(560px, 100%)",
    padding: 24,
    borderRadius: 8,
    background: "#ffffff",
    boxShadow: "0 24px 70px rgba(0, 0, 0, 0.22)"
  },
  modalTitle: {
    margin: "10px 0 0",
    fontSize: 26
  },
  modalCopy: {
    margin: "12px 0 0",
    color: "#5f574f",
    lineHeight: 1.6
  },
  modalLabel: {
    display: "grid",
    gap: 8,
    marginTop: 18,
    fontWeight: 800
  },
  textarea: {
    width: "100%",
    border: "1px solid #d8cec1",
    borderRadius: 8,
    padding: 12,
    resize: "vertical"
  },
  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 20
  },
  cancelButton: {
    border: "1px solid #d8cec1",
    borderRadius: 8,
    padding: "10px 12px",
    background: "#ffffff",
    fontWeight: 800,
    cursor: "pointer"
  }
} as const;
