import type { Metadata } from "next";
import { HomeBody } from "../page";
import { esquemasGlobales } from "@/lib/site";
import { SUPPORT_EMAIL } from "@/lib/forms";
import { metadataHome } from "@/lib/rutas-internacionales";

export const metadata: Metadata = metadataHome("fr");

export default function HomeFr() {
  return (
    <>
      {esquemasGlobales("fr", { soporte: SUPPORT_EMAIL }).map((s, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }}
        />
      ))}
      <HomeBody />
    </>
  );
}
