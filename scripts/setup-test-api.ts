import { prisma } from "../src/core/lib";
import { apiKeyService } from "../src/modules/api-keys/services/ApiKeyService";

async function main() {
  console.log("🚀 Setting up test company and API key...");

  // 1. Create a test company
  const company = await prisma.company.upsert({
    where: { name: "Inmohub Test Enterprise" },
    update: {},
    create: {
      name: "Inmohub Test Enterprise",
    },
  });

  console.log(`✅ Company created/found: ${company.name} (ID: ${company.id})`);

  // 2. Create a public API key for this company
  const keyName = "Internal Testing Key " + new Date().getTime();
  const scopes = ["read:properties", "write:properties", "read:contacts", "write:contacts", "read:tasks", "read:followups", "*"];
  
  const result = await apiKeyService.createApiKey({
    companyId: company.id,
    name: keyName,
    scopes,
  });

  console.log("\n--------------------------------------------------");
  console.log("🌟 API KEY GENERATED SUCCESSFULLY 🌟");
  console.log("--------------------------------------------------");
  console.log(`Name:        ${result.name}`);
  console.log(`Company:     ${company.name}`);
  console.log(`Scopes:      ${result.scopes.join(", ")}`);
  console.log(`Prefix:      ${result.prefix}`);
  console.log("\n>>> YOUR RAW API KEY (SAVE THIS):");
  console.log(result.rawKey);
  console.log("--------------------------------------------------\n");

  // 3. Create or find building
  const street = "Calle API Test " + new Date().getTime();
  const building = await prisma.building.create({
    data: {
      street: street,
      number: 1,
      companyId: company.id
    }
  });

  // 4. Create property
  const testProperty = await prisma.property.create({
    data: {
      inmovillaCode: Math.floor(Math.random() * 100000),
      number: "API-1",
      floor: 0,
      buildingId: building.id,
      companyId: company.id,
      description: "Propiedad de prueba para API pública"
    }
  });

  console.log(`✅ Test property created (ID: ${testProperty.id}) linked to company.`);
  console.log(`\nTry testing the API with:`);
  console.log(`curl -H "X-API-Key: ${result.rawKey}" http://localhost:4000/api/v1/public/v1/properties`);
}

main()
  .catch((e) => {
    console.error("❌ Error setting up test data:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
