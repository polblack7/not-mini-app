import { useCallback, useState } from "react";
import { NOTICE_KIND } from "../constants/status";

export function useNotice() {
  const [notice, setNotice] = useState(null);
  const clear = useCallback(() => setNotice(null), []);
  const success = useCallback((message) => setNotice({ kind: NOTICE_KIND.SUCCESS, message }), []);
  const error = useCallback((message) => setNotice({ kind: NOTICE_KIND.ERROR, message }), []);
  return { notice, success, error, clear, set: setNotice };
}
