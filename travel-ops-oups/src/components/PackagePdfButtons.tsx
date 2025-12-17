'use client';

/* eslint-disable @next/next/no-img-element */

import { forwardRef, useRef, useState } from "react";
import { FileDown } from "lucide-react";
import type { TravelPackage } from "../types";
import { Button } from "./ui/button";

type Props = {
  travelPackage: TravelPackage;
};

type JsPdfLike = {
  internal: {
    getNumberOfPages: () => number;
    pageSize: { getWidth: () => number; getHeight: () => number };
  };
  setPage: (n: number) => void;
  setFontSize: (n: number) => void;
  setTextColor: (n: number) => void;
  text: (text: string, x: number, y: number, options?: { align?: "left" | "center" | "right" }) => void;
};

type Html2PdfWorker = {
  set: (options: unknown) => Html2PdfWorker;
  from: (element: HTMLElement) => Html2PdfWorker;
  toPdf: () => Html2PdfWorker;
  get: (key: "pdf") => Promise<JsPdfLike>;
  save: () => void;
};

type Html2PdfFactory = () => Html2PdfWorker;

export function PackagePdfButtons({ travelPackage }: Props) {
  const [loading, setLoading] = useState<"b2c" | "b2b" | null>(null);
  const b2cRef = useRef<HTMLDivElement | null>(null);
  const b2bRef = useRef<HTMLDivElement | null>(null);

  const generatePdf = async (mode: "b2c" | "b2b") => {
    const element = mode === "b2c" ? b2cRef.current : b2bRef.current;
    if (!element) return;
    setLoading(mode);
    const html2pdf = (await import("html2pdf.js")).default as unknown as Html2PdfFactory;
    const filename = `${travelPackage.general.productCode}-${mode}.pdf`;
    const generatedAt = new Date().toLocaleString("fr-FR");
    const options = {
      margin: [10, 10, 14, 10],
      filename,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      pagebreak: { mode: ["css", "legacy"] },
      jsPDF: { format: "a4", orientation: "portrait" },
    };

    const worker = html2pdf().set(options).from(element).toPdf();
    const pdf = await worker.get("pdf");
    const total = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= total; i++) {
      pdf.setPage(i);
      const w = pdf.internal.pageSize.getWidth();
      const h = pdf.internal.pageSize.getHeight();
      pdf.setFontSize(9);
      pdf.setTextColor(100);
      pdf.text(`TravelOps Platform`, 12, h - 10);
      pdf.text(`${generatedAt}`, w / 2, h - 10, { align: "center" });
      pdf.text(`Page ${i}/${total}`, w - 12, h - 10, { align: "right" });
    }
    worker.save();
    setLoading(null);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => generatePdf("b2c")} disabled={loading === "b2c"}>
          <FileDown className="h-4 w-4" />
          {loading === "b2c" ? "Génération..." : "PDF B2C"}
        </Button>
        <Button variant="outline" onClick={() => generatePdf("b2b")} disabled={loading === "b2b"}>
          <FileDown className="h-4 w-4" />
          {loading === "b2b" ? "Génération..." : "PDF B2B"}
        </Button>
      </div>

      <div className="hidden">
        <B2CContent ref={b2cRef} pkg={travelPackage} />
        <B2BContent ref={b2bRef} pkg={travelPackage} />
      </div>
    </div>
  );
}

const Block = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div style={{ marginTop: 12 }}>
    <h3 style={{ margin: "0 0 6px 0", fontSize: 14, fontWeight: 700 }}>
      {title}
    </h3>
    {children}
  </div>
);

const Table = ({ headers, rows }: { headers: string[]; rows: string[][] }) => (
  <table
    style={{
      width: "100%",
      borderCollapse: "collapse",
      fontSize: 12,
      marginBottom: 8,
    }}
  >
    <thead>
      <tr>
        {headers.map((h, i) => (
          <th
            key={i}
            style={{
              textAlign: "left",
              padding: "6px 8px",
              borderBottom: "1px solid #e5e7eb",
              background: "#f8fafc",
            }}
          >
            {h}
          </th>
        ))}
      </tr>
    </thead>
    <tbody>
      {rows.map((row, idx) => (
        <tr key={idx}>
          {row.map((cell, j) => (
            <td
              key={j}
              style={{
                padding: "6px 8px",
                borderBottom: "1px solid #f1f5f9",
              }}
            >
              {cell}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
);

const BrandHeader = ({
  title,
  subtitle,
  badge,
}: {
  title: string;
  subtitle: string;
  badge: string;
}) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 12,
      borderBottom: "2px solid #2b8cee",
      paddingBottom: 8,
    }}
  >
    <div>
      <p style={{ margin: 0, color: "#2b8cee", fontWeight: 700, fontSize: 12 }}>
        TravelOps Platform
      </p>
      <h1 style={{ margin: "2px 0 4px 0", fontSize: 20, color: "#0f172a" }}>{title}</h1>
      <p style={{ margin: 0, color: "#475569", fontSize: 12 }}>{subtitle}</p>
    </div>
    <div
      style={{
        width: 52,
        height: 52,
        borderRadius: 12,
        background: "#e8f3ff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#2b8cee",
        fontWeight: 700,
      }}
    >
      {badge}
    </div>
  </div>
);

const Cover = ({
  pkg,
  mode,
}: {
  pkg: TravelPackage;
  mode: "B2C" | "B2B";
}) => (
  <div
    style={{
      border: "1px solid #e5e7eb",
      borderRadius: 16,
      overflow: "hidden",
      marginBottom: 12,
    }}
  >
    {pkg.general.imageUrl ? (
      <img
        src={pkg.general.imageUrl}
        alt={pkg.general.productName}
        style={{ width: "100%", height: 180, objectFit: "cover" }}
      />
    ) : (
      <div
        style={{
          width: "100%",
          height: 180,
          background: "#f1f5f9",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#64748b",
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        Couverture
      </div>
    )}
    <div style={{ padding: 14 }}>
      <p style={{ margin: 0, color: "#2b8cee", fontWeight: 800, fontSize: 12 }}>
        {mode} · TravelOps Platform
      </p>
      <h2 style={{ margin: "6px 0 6px 0", fontSize: 22 }}>
        {pkg.general.productName}
      </h2>
      <p style={{ margin: 0, color: "#475569", fontSize: 12 }}>
        {pkg.flights.destination} · Code {pkg.general.productCode} · Stock{" "}
        {pkg.general.stock} pax
      </p>
    </div>
    <div style={{ pageBreakAfter: "always" }} />
  </div>
);

const B2CContent = forwardRef<HTMLDivElement, { pkg: TravelPackage }>(
  ({ pkg }, ref) => {
  const lowestPrice = pkg.pricing.reduce(
    (acc, p) => (p.unitPrice > 0 ? Math.min(acc, p.unitPrice) : acc),
    Infinity
  );
  return (
    <div
      ref={ref}
      style={{ width: 794, padding: 20, color: "#0f172a", fontFamily: "Arial" }}
    >
      <Cover pkg={pkg} mode="B2C" />
      <BrandHeader
        title={`${pkg.general.productName} — B2C`}
        subtitle={`Destination: ${pkg.flights.destination} · Code ${pkg.general.productCode}`}
        badge="B2C"
      />

      <div
        style={{
          padding: 12,
          background: "#f8fafc",
          borderRadius: 12,
          marginBottom: 12,
        }}
      >
        <p style={{ margin: 0, fontSize: 13, color: "#0f172a" }}>
          Prix dès {Number.isFinite(lowestPrice) ? `${lowestPrice}€` : "—"} · Stock{" "}
          {pkg.general.stock} pax
        </p>
        <p style={{ margin: "4px 0 0 0", fontSize: 12, color: "#475569" }}>
          Responsable : {pkg.general.responsible}
        </p>
      </div>

      <Block title="Programme détaillé">
        <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: "#0f172a" }}>
          {pkg.itinerary.days.map((day) => (
            <li key={day.dayNumber} style={{ marginBottom: 4 }}>
              <strong>Jour {day.dayNumber}</strong> — {day.description}
            </li>
          ))}
        </ul>
      </Block>

      <Block title="Inclus / Exclus">
        <Table
          headers={["Inclus", "Non inclus"]}
          rows={mergeRows(pkg.content.included, pkg.content.excluded)}
        />
      </Block>

      <Block title="Excursions">
        <Table
          headers={["Incluses", "En extra"]}
          rows={mergeRows(pkg.content.excursionsIncluded, pkg.content.excursionsExtra)}
        />
      </Block>

      <Block title="Hébergements">
        <Table
          headers={["Nom", "Catégorie", "Pension", "Lien"]}
          rows={pkg.accommodations.map((a) => [
            a.name,
            a.category || "—",
            a.pension || "—",
            a.mapLink || "—",
          ])}
        />
      </Block>
    </div>
  );
  }
);
B2CContent.displayName = "B2CContent";

const B2BContent = forwardRef<HTMLDivElement, { pkg: TravelPackage }>(
  ({ pkg }, ref) => (
    <div
      ref={ref}
      style={{ width: 794, padding: 20, color: "#0f172a", fontFamily: "Arial" }}
    >
      <Cover pkg={pkg} mode="B2B" />
      <BrandHeader
        title={`${pkg.general.productName} — B2B`}
        subtitle={`Responsable ${pkg.general.responsible} · Code ${pkg.general.productCode}`}
        badge="B2B"
      />

    <Block title="Tarifs & Commissions">
      <Table
        headers={["Label", "Sous-label", "Prix (€)", "Com (€)"]}
        rows={pkg.pricing.map((p) => [
          p.label,
          p.subLabel || "—",
          `${p.unitPrice}`,
          `${p.commission ?? 0}`,
        ])}
      />
      <p style={{ margin: "4px 0 0 0", fontSize: 12, color: "#475569" }}>
        Com agence adulte T1/T2/T3 : {pkg.agencyCommissions.adulte.t1}/
        {pkg.agencyCommissions.adulte.t2}/{pkg.agencyCommissions.adulte.t3} · Enfant{" "}
        {pkg.agencyCommissions.enfant} · Bébé {pkg.agencyCommissions.bebe}
      </p>
    </Block>

    <Block title="Logement">
      <Table
        headers={["Nom", "Catégorie", "Pension", "Carte"]}
        rows={pkg.accommodations.map((a) => [
          a.name,
          a.category || "—",
          a.pension || "—",
          a.mapLink || "—",
        ])}
      />
    </Block>

    <Block title="Vols / Ops">
      <Table
        headers={["Compagnie", "Départ", "Retour", "Durée", "Visa", "Transfert"]}
        rows={pkg.flights.flights.map((f) => [
          f.airline,
          f.departureDate,
          f.returnDate,
          f.duration || "—",
          pkg.flights.visaStatus || "—",
          pkg.flights.transferStatus || "—",
        ])}
      />
    </Block>

    <Block title="Itinéraire complet">
      <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: "#0f172a" }}>
        {pkg.itinerary.days.map((day) => (
          <li key={day.dayNumber} style={{ marginBottom: 4 }}>
            <strong>Jour {day.dayNumber}</strong> — {day.description}
          </li>
        ))}
      </ul>
      <p style={{ margin: "6px 0 0 0", fontSize: 12, color: "#475569" }}>
        Notes internes : {pkg.itinerary.internalNotes || "—"} · Infos client :{" "}
        {pkg.itinerary.clientInformation || "—"}
      </p>
    </Block>
    </div>
  )
);
B2BContent.displayName = "B2BContent";

function mergeRows(left: string[], right: string[]) {
  const max = Math.max(left.length, right.length);
  const rows: string[][] = [];
  for (let i = 0; i < max; i++) {
    rows.push([left[i] ?? "—", right[i] ?? "—"]);
  }
  return rows;
}
