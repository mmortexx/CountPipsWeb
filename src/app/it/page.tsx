import type { Metadata } from "next";
import { HomeBody } from "../page";
import { esquemasGlobales } from "@/lib/site";
import { SUPPORT_EMAIL } from "@/lib/forms";
import { metadataHome } from "@/lib/rutas-internacionales";

export const metadata: Metadata = metadataHome("it");

export default function HomeIt() {
  return (
    <>
      {esquemasGlobales("it", { soporte: SUPPORT_EMAIL }).map((s, i) => (
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
