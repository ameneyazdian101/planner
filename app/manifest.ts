import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "پلنر — برنامه‌ریز دیجیتال شخصی",
    short_name: "پلنر",
    description: "پلنر دیجیتال شخصی برای برنامه‌ریزی روزانه، اهداف و عادت‌ها",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#2563eb",
    lang: "fa",
    dir: "rtl",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
