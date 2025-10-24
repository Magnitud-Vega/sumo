import ItemForm from "@/components/ItemForm";
import { prisma } from "@/lib/db";

export default async function GroupOrderPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  console.log("Fetching group order page for slug:", slug);
  const group = await prisma.groupOrder.findUnique({
    where: { slug: slug },
    include: { menu: { include: { items: { where: { isActive: true } } } } },
  });
  if (!group) return <div className="p-6">No existe el evento.</div>;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">{group.menu.title}</h1>
      <p className="text-gray-600">
        Evento: <b>{group.slug}</b>
      </p>

      <ItemForm groupSlug={group.slug} items={group.menu.items} />
    </div>
  );
}
