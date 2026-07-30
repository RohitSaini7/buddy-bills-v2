import Pusher from "pusher";

// Note: In development/tests, these env vars might not be present.
// We handle that by safely falling back or failing gracefully when attempting to trigger.
export const pusherServer =
  process.env.PUSHER_APP_ID &&
  process.env.NEXT_PUBLIC_PUSHER_KEY &&
  process.env.PUSHER_SECRET &&
  process.env.NEXT_PUBLIC_PUSHER_CLUSTER
    ? new Pusher({
        appId: process.env.PUSHER_APP_ID,
        key: process.env.NEXT_PUBLIC_PUSHER_KEY,
        secret: process.env.PUSHER_SECRET,
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
        useTLS: true,
      })
    : null;

export const triggerGroupUpdate = async (groupId: string) => {
  if (!pusherServer) return;
  try {
    await pusherServer.trigger(`group-${groupId}`, "update", { timestamp: Date.now() });
  } catch (error) {
    console.error("Failed to trigger Pusher update:", error);
  }
};
