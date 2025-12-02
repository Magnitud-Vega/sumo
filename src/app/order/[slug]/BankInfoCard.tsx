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
          <h2 className="card-sumo-title font-brand text-sumo-xl text-sumo-primary">
            Datos bancarios
          </h2>
          {/* <p className="card-sumo-subtitle">
            Transferí y enviá tu comprobante por WhatsApp.
          </p> */}
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
          <div>
            <span className="font-medium">Cuenta o Alias: </span>
            <span className="break-all text-sumo-sm">{bankAccount}</span>
          </div>
          <CopyButton value={bankAccount} />
        </div>

        {bankDoc && (
          <div className="flex items-center justify-between gap-2">
            <div>
              <span className="font-medium">RUC o CI: </span>
              <span>{bankDoc}</span>
            </div>
            <CopyButton value={bankDoc} />
          </div>
        )}

        <p className="text-sumo-xs text-sumo-muted mt-2">
          * Transferí el monto de tu pedido y avisános por WhatsApp.
        </p>
      </div>
    </section>
  );
}
