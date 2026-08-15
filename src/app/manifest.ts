import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Buddy Bills",
    short_name: "Buddy Bills",
    description: "Split expenses with friends easily",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#10b981", // emerald-500
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
