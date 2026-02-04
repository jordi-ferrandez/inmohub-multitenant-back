const { PrismaClient } = require("../src/generated/prisma");
const prisma = new PrismaClient();

async function seedForum() {
  console.log("🌱 Seeding Forum Categories...");

  const categories = [
    {
      title: "Captación y Mercado",
      description: "Estrategias para captar nuevas propiedades y análisis del mercado inmobiliario.",
      icon: "Building2",
      color: "#3b82f6",
      order: 1,
    },
    {
      title: "Marketing Inmobiliario",
      description: "Publicidad, redes sociales, fotografía y cómo destacar tus anuncios.",
      icon: "Megaphone",
      color: "#8b5cf6",
      order: 2,
    },
    {
      title: "Legal y Fiscalidad",
      description: "Consultas sobre contratos, leyes de vivienda, impuestos y trámites.",
      icon: "Gavel",
      color: "#ef4444",
      order: 3,
    },
    {
      title: "Tecnología e IA",
      description: "Uso de CRM, herramientas digitales e Inteligencia Artificial en el sector.",
      icon: "Cpu",
      color: "#10b981",
      order: 4,
    },
    {
      title: "Cafetería (Off-topic)",
      description: "Charlas informales, humor y networking fuera del ámbito laboral.",
      icon: "Coffee",
      color: "#f59e0b",
      order: 5,
    },
  ];

  for (const cat of categories) {
    await prisma.forumCategory.upsert({
      where: { id: categories.indexOf(cat) + 1 }, // Simple ID logic for seeding
      update: cat,
      create: cat,
    });
  }

  console.log("✅ Forum Categories Seeded!");
}

seedForum()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
