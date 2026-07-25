"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { acceptInvitesAction } from "@/app/(app)/dashboard/actions";

export function InviteAcceptToast() {
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    acceptInvitesAction().then((res) => {
      if (
        "success" in res &&
        res.success &&
        res.acceptedGroupNames &&
        res.acceptedGroupNames.length > 0
      ) {
        res.acceptedGroupNames.forEach((groupName: string) => {
          toast.success(`You were added to ${groupName}!`);
        });
      }
    });
  }, []);

  return null;
}
