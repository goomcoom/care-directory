import { useEffect, useState } from "react";

const MOBILE_QUERY = "(max-width: 900px)";

/** True below the breakpoint where the two-column layout collapses. */
export function useIsMobile(): boolean {
  const [mobile, setMobile] = useState(() => (typeof window === "undefined" ? false : window.matchMedia(MOBILE_QUERY).matches));
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const onChange = () => setMobile(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return mobile;
}
