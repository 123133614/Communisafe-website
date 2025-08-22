// src/hooks/useDesktopNotification.js
import { useCallback } from "react";

export default function useDesktopNotification() {
  /**
   * @param {{ title: string, body: string, icon?: string, url?: string }} opts
   */
  const notify = useCallback(({ title, body, icon, url }) => {
    if (!("Notification" in window)) return;

    // If still “default”, ask now (must be in response to click)
    if (Notification.permission === "default") {
      Notification.requestPermission().then((perm) => {
        if (perm === "granted") create();
      });
    } else if (Notification.permission === "granted") {
      // already allowed
      create();
    } // if “denied”, do nothing

    function create() {
      const n = new Notification(title, { body, icon });
      if (url) {
        n.onclick = () => {
          window.focus();
          window.location.href = url;
          n.close();
        };
      }
    }
  }, []);

  return notify;
}
