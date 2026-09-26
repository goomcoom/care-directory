import { PhoneCall, Siren } from "lucide-react";

/** Prominent reminder that the directory is not an emergency service. */
export function EmergencyBanner() {
  return (
    <aside className="emergency-banner" role="note" aria-label="Emergency numbers">
      <span className="emergency-icon">
        <Siren size={22} />
      </span>
      <div className="emergency-body">
        <strong className="emergency-title">This is not an emergency service.</strong>
        <span className="emergency-text">
          If someone is seriously ill or injured and their life is at risk, call <b>999</b> or go to A&amp;E. For
          urgent medical help that is not life-threatening, call <b>111</b>.
        </span>
      </div>
      <div className="emergency-numbers" aria-hidden="true">
        <span className="emergency-number emergency-999">
          <PhoneCall size={14} />
          999
        </span>
        <span className="emergency-number emergency-111">
          <PhoneCall size={14} />
          111
        </span>
      </div>
    </aside>
  );
}
