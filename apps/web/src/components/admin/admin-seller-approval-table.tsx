"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import {
  AdminSellerApplication,
  SellerDecision,
  decideSellerApplication,
  getPendingSellerApplications,
  statusTone
} from "@/lib/admin-seller-applications";

type DecisionState = {
  application: AdminSellerApplication;
  decision: SellerDecision;
};

const decisionLabels: Record<SellerDecision, string> = {
  approve: "Approve",
  reject: "Reject",
  suspend: "Suspend"
};

export function AdminSellerApprovalTable() {
  const { accessToken, user } = useAuth();
  const [applications, setApplications] = useState<AdminSellerApplication[]>([]);
  const [decisionState, setDecisionState] = useState<DecisionState | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    if (!accessToken || !isAdmin) {
      setIsLoading(false);
      return;
    }

    getPendingSellerApplications(accessToken)
      .then(setApplications)
      .catch((caughtError) => {
        setError(
          caughtError instanceof Error ? caughtError.message : "Pending applications could not load."
        );
      })
      .finally(() => setIsLoading(false));
  }, [accessToken, isAdmin]);

  const selectedStoreName = useMemo(
    () => decisionState?.application.storeName ?? "this application",
    [decisionState]
  );

  function openDecision(application: AdminSellerApplication, decision: SellerDecision) {
    setDecisionState({ application, decision });
    setReason("");
    setError("");
  }

  async function submitDecision(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!decisionState || !accessToken) {
      return;
    }

    if (decisionState.decision !== "approve" && reason.trim().length < 5) {
      setError("A reason of at least 5 characters is required.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await decideSellerApplication(
        decisionState.application.id,
        decisionState.decision,
        accessToken,
        reason.trim() || undefined
      );
      setApplications((current) =>
        current.filter((application) => application.id !== decisionState.application.id)
      );
      setDecisionState(null);
      setReason("");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Decision could not be saved.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isAdmin) {
    return (
      <section className="empty-state">
        <p className="eyebrow">Admin only</p>
        <h2>Seller approvals are restricted</h2>
        <p>Use an admin account to review and decide seller applications.</p>
      </section>
    );
  }

  if (isLoading) {
    return <p className="muted-text">Loading pending seller applications...</p>;
  }

  return (
    <>
      {error && !decisionState ? <p className="form-error">{error}</p> : null}
      <section className="table-panel">
        <div className="table-header">
          <div>
            <p className="eyebrow">Pending sellers</p>
            <h2>{applications.length} application{applications.length === 1 ? "" : "s"}</h2>
          </div>
        </div>
        {applications.length === 0 ? (
          <div className="empty-state inline-empty">
            <p className="eyebrow">Queue clear</p>
            <h2>No pending applications</h2>
            <p>New seller applications will appear here when buyers submit them.</p>
          </div>
        ) : (
          <div className="responsive-table">
            <table className="approval-table">
              <thead>
                <tr>
                  <th>Store</th>
                  <th>Applicant</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  <th>Decision</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((application) => (
                  <tr key={application.id}>
                    <td>
                      <strong>{application.storeName}</strong>
                      <span>{application.storeDescription}</span>
                    </td>
                    <td>
                      <strong>{application.user.fullName}</strong>
                      <span>{application.user.email}</span>
                    </td>
                    <td>{new Date(application.createdAt).toLocaleDateString()}</td>
                    <td>
                      <span className={`status-badge ${statusTone(application.status)}`}>
                        {application.status}
                      </span>
                    </td>
                    <td>
                      <div className="decision-actions">
                        <button
                          className="small-button approve-button"
                          onClick={() => openDecision(application, "approve")}
                          type="button"
                        >
                          Approve
                        </button>
                        <button
                          className="small-button reject-button"
                          onClick={() => openDecision(application, "reject")}
                          type="button"
                        >
                          Reject
                        </button>
                        <button
                          className="small-button suspend-button"
                          onClick={() => openDecision(application, "suspend")}
                          type="button"
                        >
                          Suspend
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {decisionState ? (
        <div className="modal-backdrop" role="presentation">
          <section aria-labelledby="decision-title" className="decision-modal" role="dialog">
            <form onSubmit={submitDecision}>
              <div className="workflow-heading">
                <div>
                  <p className="eyebrow">{decisionLabels[decisionState.decision]} seller</p>
                  <h2 id="decision-title">{selectedStoreName}</h2>
                </div>
                <button
                  className="icon-button"
                  onClick={() => setDecisionState(null)}
                  type="button"
                  aria-label="Close modal"
                >
                  x
                </button>
              </div>
              <p className="muted-text">{decisionCopy(decisionState.decision)}</p>
              {decisionState.decision !== "approve" ? (
                <label className="modal-field">
                  <span>Reason</span>
                  <textarea
                    onChange={(event) => setReason(event.target.value)}
                    placeholder="Explain the decision for the applicant and audit trail."
                    rows={4}
                    value={reason}
                  />
                </label>
              ) : null}
              {error ? <p className="form-error">{error}</p> : null}
              <div className="modal-actions">
                <button
                  className="secondary-button"
                  onClick={() => setDecisionState(null)}
                  type="button"
                >
                  Cancel
                </button>
                <button className="primary-button" disabled={isSubmitting} type="submit">
                  {isSubmitting ? "Saving..." : decisionLabels[decisionState.decision]}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </>
  );
}

function decisionCopy(decision: SellerDecision) {
  if (decision === "approve") {
    return "Approval creates the seller profile and store, then grants seller access.";
  }

  if (decision === "reject") {
    return "Rejection sends the application back with a reason and returns the account to buyer status.";
  }

  return "Suspension disables seller access and marks related seller records as suspended.";
}
