"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Pusher from "pusher-js";

export function usePusherRefresh(groupId: string) {
  const router = useRouter();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Only initialize if keys are present
    if (!process.env.NEXT_PUBLIC_PUSHER_KEY || !process.env.NEXT_PUBLIC_PUSHER_CLUSTER) {
      return;
    }

    // Enable pusher logging in dev only
    // Pusher.logToConsole = process.env.NODE_ENV === "development";

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
    });

    pusher.connection.bind("connected", () => setIsConnected(true));
    pusher.connection.bind("disconnected", () => setIsConnected(false));

    const channel = pusher.subscribe(`group-${groupId}`);

    channel.bind("update", () => {
      // When we receive an update event, silently refresh the server components
      // This will refetch the latest DB data without blowing away client state
      router.refresh();
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
      pusher.disconnect();
    };
  }, [groupId, router]);

  return { isConnected };
}
