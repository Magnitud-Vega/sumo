import { CopyButton } from "@/components/ui/CopyButton";

export default function BankInfoCard(props: {
  slug: string;
  bankName: string;
  bankHolder: string;
  bankAccount: string;
  bankDoc: string;
}) {
  const { slug, bankName, bankHolder, bankAccount, bankDoc } = props;
  return (
    <section className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-2">
      <h2 className="text-lg font-semibold">
        Datos para transferencia bancaria
      </h2>
      <p className="text-sm text-gray-700">
        Realizá la transferencia correspondiente al total de tu pedido y luego
        confirmá tu pago usando el botón de WhatsApp que aparece en tu fila de
        pedido.
      </p>

      {/* TODO: reemplazar por tus datos reales */}
      <div className="mt-2 grid gap-1 text-sm">
        <div className="flex items-center justify-between gap-2">
          <div>
            <span className="font-semibold">Banco:</span>{" "}
            <span>{bankName}</span>
          </div>
          <CopyButton value={bankName} />
        </div>

        <div className="flex items-center justify-between gap-2">
          <div>
            <span className="font-semibold">Titular:</span>{" "}
            <span>{bankHolder}</span>
          </div>
          <CopyButton value={bankHolder} />
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col">
            <span className="font-semibold">Cuenta / Alias:</span>
            <span className="break-all text-sm">{bankAccount}</span>
          </div>
          <CopyButton value={bankAccount} />
        </div>

        <div className="flex items-center justify-between gap-2">
          <div>
            <span className="font-semibold">RUC o CI:</span>{" "}
            <span>{bankDoc}</span>
          </div>
          <CopyButton value={bankDoc} />
        </div>

        <p className="text-xs text-gray-500 mt-2">
          * No olvides mencionar tu nombre y el código del pedido (
          {slug.toUpperCase()}) en el concepto de la transferencia.
        </p>
      </div>
    </section>
  );
}
