// app/order/[slug]/BankInfoCard.tsx
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
    <section className="card-sumo space-y-3">
      <div className="card-sumo-header">
        <div>
          <h2 className="card-sumo-title font-brand text-sumo-xl">
            Datos para transferencia bancaria
          </h2>
          <p className="card-sumo-subtitle">
            Hacé la transferencia por el total de tu pedido y después confirmá
            el pago desde tu fila usando WhatsApp.
          </p>
        </div>
      </div>

      <div className="space-y-2 text-sumo-sm">
        <div className="flex items-center justify-between gap-2">
          <div>
            <span className="font-medium">Banco: </span>
            <span>{bankName}</span>
          </div>
          <CopyButton value={bankName} />
        </div>

        <div className="flex items-center justify-between gap-2">
          <div>
            <span className="font-medium">Titular: </span>
            <span>{bankHolder}</span>
          </div>
          <CopyButton value={bankHolder} />
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col">
            <span className="font-medium">Cuenta / Alias:</span>
            <span className="break-all text-sumo-sm">{bankAccount}</span>
          </div>
          <CopyButton value={bankAccount} />
        </div>

        <div className="flex items-center justify-between gap-2">
          <div>
            <span className="font-medium">RUC o CI: </span>
            <span>{bankDoc}</span>
          </div>
          <CopyButton value={bankDoc} />
        </div>

        <p className="text-sumo-xs text-sumo-muted mt-2">
          * En el concepto de la transferencia escribí tu nombre y el código del
          pedido <strong>({slug.toUpperCase()})</strong> para identificar tu
          pago más rápido.
        </p>
      </div>
    </section>
  );
}
