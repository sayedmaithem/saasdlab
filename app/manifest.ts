import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LabFlow — Dental Lab Management",
    short_name: "LabFlow",
    description:
      "Production workflow, case management, and doctor portal for modern dental laboratories.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#18181b",
    orientation: "portrait-primary",
    categories: ["productivity", "business", "medical"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "New case",
        short_name: "New case",
        description: "Submit a new lab case",
        url: "/cases/new",
      },
      {
        name: "Production board",
        short_name: "Production",
        description: "Open the production Kanban",
        url: "/production",
      },
      {
        name: "My workspace",
        short_name: "Workspace",
        description: "Open technician workspace",
        url: "/technicians/workspace",
      },
    ],
  };
}
