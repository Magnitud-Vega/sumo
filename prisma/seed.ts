import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const menu = await prisma.menu.create({
    data: {
      title: "PizzBur Fran",
      items: {
        create: [
          { name: "Burger Muzza", priceGs: 27000, category: "Burgers" },
          { name: "Burger Cheddar", priceGs: 27000, category: "Burgers" },
          { name: "Papas Chicas", priceGs: 7000, category: "Sides" },
          { name: "Papas Medianas", priceGs: 12000, category: "Sides" },
        ],
      },
    },
    include: { items: true },
  });

  await prisma.groupOrder.create({
    data: {
      slug: "martes-chill-cena",
      menuId: menu.id,
      deadlineTs: new Date(Date.now() + 1000 * 60 * 60), // +1h
      deliveryCostGs: 30000,
      minTotalGs: 300000,
      splitStrategy: "EVEN",
      adminPin: "1234",
    },
  });

  console.log("Seed OK:", menu.title);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
