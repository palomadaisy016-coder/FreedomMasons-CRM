"use client";

export function Modal({ title, onClose, children }) {
  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg border border-line w-full max-w-md max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-line">
          <h3 className="font-semibold text-ink text-sm">{title}</h3>
          <button onClick={onClose} className="text-muted text-sm">
            Close
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, children }) {
  return (
    <label className="text-xs text-muted flex flex-col gap-1">
      {label}
      {children}
    </label>
  );
}

export function Badge({ text, tone = "default" }) {
  const tones = {
    default: "bg-paper text-muted border-line",
    accent: "bg-accent/10 text-accent border-accent/30",
    danger: "bg-danger/10 text-danger border-danger/30",
    success: "bg-success/10 text-success border-success/30",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border whitespace-nowrap ${tones[tone]}`}>{text}</span>
  );
}

export function PrimaryButton(props) {
  return (
    <button
      {...props}
      className={`bg-accent text-white text-sm font-medium px-3 py-1.5 rounded ${props.className || ""}`}
    />
  );
}

export function GhostButton(props) {
  return (
    <button
      {...props}
      className={`border border-line text-sm text-muted px-3 py-1.5 rounded hover:bg-paper ${
        props.className || ""
      }`}
    />
  );
}

export function EmptyState({ text, actionLabel, onAction }) {
  return (
    <div className="border border-dashed border-line rounded-lg py-10 text-center text-sm text-muted">
      <p className="mb-3">{text}</p>
      {onAction && <PrimaryButton onClick={onAction}>{actionLabel}</PrimaryButton>}
    </div>
  );
}

export function money(n) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(
    Number(n) || 0
  );
}

export function fmtDate(d) {
  if (!d) return "—";
  const dt = new Date(d + "T00:00:00");
  if (isNaN(dt)) return d;
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
