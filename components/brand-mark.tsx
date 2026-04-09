export function BrandMark() {
  return (
    <div className="brand-mark" aria-label="DishFrame">
      <span className="brand-mark-icon" aria-hidden="true">
        <svg viewBox="0 0 72 72" role="presentation">
          <rect x="10" y="10" width="52" height="52" rx="16" className="brand-card" />
          <path d="M24 26h24" className="brand-line" />
          <path d="M24 36h18" className="brand-line soft" />
          <path d="M24 46h14" className="brand-line soft" />
          <circle cx="50" cy="46" r="7" className="brand-seal" />
          <path d="M47 46.5l2 2 4-5" className="brand-check" />
        </svg>
      </span>
      <span className="brand-wordmark">DishFrame</span>
    </div>
  );
}
