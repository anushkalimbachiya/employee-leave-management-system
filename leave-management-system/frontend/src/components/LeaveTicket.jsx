import StatusStamp from "./StatusStamp";
import { formatDate, formatDateTime } from "../utils/format";

/**
 * Renders a single leave request as a ticket / voucher stub. When
 * `showEmployee` is true (manager views) the employee's name is shown as
 * the headline; otherwise the date range is the headline (employee views).
 */
export default function LeaveTicket({
  leave,
  showEmployee = false,
  onCancel,
  onApprove,
  onReject,
  busy = false,
}) {
  const canCancel = !showEmployee && leave.status === "PENDING" && onCancel;
  const canDecide = showEmployee && leave.status === "PENDING" && (onApprove || onReject);

  return (
    <div className="ticket">
      <div className="ticket-body">
        <div className="ticket-id">TICKET #{String(leave.id).padStart(5, "0")}</div>

        {showEmployee && (
          <div className="ticket-employee">
            {leave.employee?.full_name || leave.employee?.username}
          </div>
        )}

        <div className="ticket-dates">
          <span>{formatDate(leave.start_date)}</span>
          <span className="arrow">→</span>
          <span>{formatDate(leave.end_date)}</span>
          <span className="ticket-days-pill">
            {leave.number_of_days} day{leave.number_of_days === 1 ? "" : "s"}
          </span>
        </div>

        <div className="ticket-reason">{leave.reason}</div>

        <div className="ticket-meta-row">
          Filed {formatDateTime(leave.applied_on)}
          {leave.decided_by_name ? ` · Decided by ${leave.decided_by_name}` : ""}
        </div>

        {leave.manager_comment && (
          <div className="ticket-comment">"{leave.manager_comment}"</div>
        )}
      </div>

      <div className="ticket-seam" />

      <div className="ticket-stamp-zone">
        <StatusStamp status={leave.status} />

        {canCancel && (
          <button className="btn btn-cancel" disabled={busy} onClick={() => onCancel(leave)}>
            Cancel request
          </button>
        )}

        {canDecide && (
          <div className="ticket-actions">
            {onApprove && (
              <button className="btn btn-approve" disabled={busy} onClick={() => onApprove(leave)}>
                Approve
              </button>
            )}
            {onReject && (
              <button className="btn btn-reject" disabled={busy} onClick={() => onReject(leave)}>
                Reject
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
