// app/admin/style-guide/page.tsx
import type { ReactNode } from "react";

const colors = [
  { name: "Primary", token: "--sumo-primary", hex: "#2563EB" },
  { name: "Primary Hover", token: "--sumo-primary-hover", hex: "#1E40AF" },
  { name: "Secondary", token: "--sumo-secondary", hex: "#A3E635" },
  { name: "Accent", token: "--sumo-accent", hex: "#FACC15" },
  { name: "Background", token: "--sumo-bg", hex: "#F8FAFC" },
  { name: "Surface", token: "--sumo-surface", hex: "#FFFFFF" },
  { name: "Border", token: "--sumo-border", hex: "#E2E8F0" },
  { name: "Text primary", token: "--sumo-text-primary", hex: "#0F172A" },
  { name: "Text secondary", token: "--sumo-text-secondary", hex: "#475569" },
];

export default function StyleGuidePage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <header className="card-sumo">
        <h1>SUMO · Brand Color Guide</h1>
        <p className="card-sumo-subtitle mt-1">
          Paleta vibrante y alegre para interfaz light/dark.
        </p>
      </header>

      <section className="card-sumo">
        <div className="card-sumo-header">
          <h2>Colores base</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {colors.map((c) => (
            <ColorSwatch key={c.name} {...c} />
          ))}
        </div>
      </section>

      <section className="card-sumo">
        <div className="card-sumo-header">
          <h2>SUMO – Buttons</h2>
        </div>

        <div className="flex gap-3 flex-wrap">
          <button className="btn-sumo">Botón primario</button>
          <button className="btn-sumo-secondary">Secundario</button>
          <button className="btn-sumo-ghost">Ghost</button>
          <button className="btn-sumo-danger">Peligro</button>
        </div>
      </section>

      <section className="card-sumo">
        <div className="card-sumo-header">
          <h2>SUMO – Table</h2>
        </div>

        <table className="table-sumo mt-4">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Ítem</th>
              <th className="text-right">Total</th>
              <th className="text-center">Pago</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Julia</td>
              <td>Pizza muzzarella</td>
              <td className="text-right">35.000</td>
              <td className="text-center">
                <span className="table-sumo-status-pill table-sumo-status-pending">
                  Pendiente
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="card-sumo">
        <div className="card-sumo-header">
          <h2>SUMO – Tipografías</h2>
        </div>

        <div className="">
          <h1>Titulo</h1>
          <h2>Subtitulo</h2>
          <h3>Heading 3</h3>
          <h4>Heading 4</h4>
          <h5>Heading 5</h5>
          <h6>Heading 6</h6>
          <p className="text-sumo-base">Texto base</p>
          <p className="text-sumo-sm">Texto pequeño</p>
          <p className="text-sumo-xs">Texto extra pequeño</p>
        </div>
      </section>
    </div>
  );
}

function ColorSwatch({
  name,
  token,
  hex,
}: {
  name: string;
  token: string;
  hex: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div
        className="h-16 w-full rounded-xl border border-sumo-soft"
        style={{ backgroundColor: `var(${token})` }}
      />
      <div className="text-xs">
        <div className="font-semibold">{name}</div>
        <div className="text-sumo-muted">{token}</div>
        <div className="text-sumo-muted">{hex}</div>
      </div>
    </div>
  );
}
