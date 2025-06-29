import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// PNG Provinces Data
const pngProvinces = [
  { name: "Central Province", code: "CPV", region: "Papua", capital: "Port Moresby", population: 269000 },
  { name: "Western Province", code: "WPV", region: "Papua", capital: "Daru", population: 201000 },
  { name: "Gulf Province", code: "GPV", region: "Papua", capital: "Kerema", population: 106000 },
  { name: "Milne Bay Province", code: "MBP", region: "Papua", capital: "Alotau", population: 276000 },
  { name: "Northern Province", code: "NPV", region: "Papua", capital: "Popondetta", population: 186000 },
  { name: "Southern Highlands", code: "SHP", region: "Highlands", capital: "Mendi", population: 510000 },
  { name: "Western Highlands", code: "WHP", region: "Highlands", capital: "Mount Hagen", population: 362000 },
  { name: "Eastern Highlands", code: "EHP", region: "Highlands", capital: "Goroka", population: 579000 },
  { name: "Simbu Province", code: "SIM", region: "Highlands", capital: "Kundiawa", population: 259000 },
  { name: "Enga Province", code: "ENG", region: "Highlands", capital: "Wabag", population: 432000 },
  { name: "Morobe Province", code: "MOR", region: "Momase", capital: "Lae", population: 674000 },
  { name: "Madang Province", code: "MAD", region: "Momase", capital: "Madang", population: 493000 },
  { name: "East Sepik Province", code: "ESP", region: "Momase", capital: "Wewak", population: 433000 },
  { name: "West Sepik Province", code: "WSP", region: "Momase", capital: "Vanimo", population: 248000 },
  { name: "Manus Province", code: "MAN", region: "Islands", capital: "Lorengau", population: 60000 },
  { name: "New Ireland Province", code: "NIP", region: "Islands", capital: "Kavieng", population: 194000 },
  { name: "East New Britain", code: "ENB", region: "Islands", capital: "Kokopo", population: 328000 },
  { name: "West New Britain", code: "WNB", region: "Islands", capital: "Kimbe", population: 264000 },
  { name: "Bougainville", code: "ARB", region: "Islands", capital: "Buka", population: 300000 },
  { name: "Hela Province", code: "HLA", region: "Highlands", capital: "Tari", population: 249000 },
  { name: "Jiwaka Province", code: "JWK", region: "Highlands", capital: "Kurumul", population: 343000 },
  { name: "National Capital District", code: "NCD", region: "Papua", capital: "Port Moresby", population: 364000 }
];

// Sample Contractors Data
const sampleContractors = [
  {
    name: "PNG Construction Ltd",
    licenseNumber: "PCC-2024-001",
    contactPerson: "Joseph Kila",
    email: "j.kila@pngconstruction.com.pg",
    phone: "+675 325 2100",
    address: "Port Moresby, Central Province, PNG",
    specializations: ["Road Construction", "Drainage Systems", "Bridge Construction", "Civil Engineering"],
    certificationLevel: "Grade A",
    establishedDate: new Date("2010-03-15")
  },
  {
    name: "Pacific Infrastructure Partners",
    licenseNumber: "PCC-2024-002",
    contactPerson: "Mary Tau",
    email: "m.tau@pacificinfra.com.pg",
    phone: "+675 472 3344",
    address: "Lae, Morobe Province, PNG",
    specializations: ["Highway Construction", "Airport Runways", "Heavy Civil Works", "Marine Infrastructure"],
    certificationLevel: "Grade A",
    establishedDate: new Date("2005-08-22")
  },
  {
    name: "Highlands Road Builders",
    licenseNumber: "PCC-2024-003",
    contactPerson: "Peter Namaliu",
    email: "p.namaliu@highlandsroad.com.pg",
    phone: "+675 542 1800",
    address: "Mount Hagen, Western Highlands, PNG",
    specializations: ["Mountain Road Construction", "Terrain Adaptation", "Remote Area Access", "Slope Stabilization"],
    certificationLevel: "Grade B",
    establishedDate: new Date("2012-11-05")
  },
  {
    name: "Island Infrastructure Co",
    licenseNumber: "PCC-2024-004",
    contactPerson: "Anna Rapese",
    email: "a.rapese@islandinfra.com.pg",
    phone: "+675 982 5600",
    address: "Kokopo, East New Britain, PNG",
    specializations: ["Coastal Road Construction", "Maritime Access Roads", "Island Logistics", "Coral Road Base"],
    certificationLevel: "Grade B",
    establishedDate: new Date("2015-02-18")
  },
  {
    name: "Momase Engineering Solutions",
    licenseNumber: "PCC-2024-005",
    contactPerson: "James Siaguru",
    email: "j.siaguru@momaseeng.com.pg",
    phone: "+675 856 4200",
    address: "Wewak, East Sepik Province, PNG",
    specializations: ["Rural Road Networks", "Community Access Roads", "Flood Resistant Construction"],
    certificationLevel: "Grade C",
    establishedDate: new Date("2018-07-10")
  }
];

// Sample Multi-Project Data
const multiProjects = [
  {
    name: "Maria Pori Road Construction",
    description: "15km road construction connecting rural communities to main highway in Central Province",
    sponsor: "ITCFA - Exxon Mobile PNG",
    totalDistance: 15000,
    projectType: "ROAD_CONSTRUCTION",
    totalSections: 3,
    contractMethod: "MULTI_CONTRACTOR",
    fundingSource: "ITCFA Infrastructure Development Fund",
    governmentPriority: "HIGH",
    status: "IN_PROGRESS",
    startDate: new Date("2024-01-15"),
    estimatedEndDate: new Date("2024-12-15"),
    teamLead: "Emmanuel Mabi"
  },
  {
    name: "Highlands Highway Upgrade - Lae to Mount Hagen Section",
    description: "Major highway upgrade improving connectivity between Morobe and Western Highlands provinces",
    sponsor: "PNG Government - Department of Works",
    totalDistance: 45000,
    projectType: "HIGHWAY_UPGRADE",
    totalSections: 3,
    contractMethod: "MULTI_CONTRACTOR",
    fundingSource: "PNG National Infrastructure Fund",
    governmentPriority: "CRITICAL",
    status: "TENDERING",
    startDate: new Date("2024-06-01"),
    estimatedEndDate: new Date("2026-05-30"),
    teamLead: "David Natera"
  },
  {
    name: "Daru Port Access Road",
    description: "8km access road connecting Daru Port to town center and airport in Western Province",
    sponsor: "Australian Aid - PNG Infrastructure Program",
    totalDistance: 8000,
    projectType: "PORT_ACCESS",
    totalSections: 2,
    contractMethod: "SINGLE_CONTRACTOR",
    fundingSource: "Australian Government Aid",
    governmentPriority: "MEDIUM",
    status: "PLANNING",
    startDate: new Date("2024-09-01"),
    estimatedEndDate: new Date("2025-03-31"),
    teamLead: "Rosa Kambuou"
  }
];

// Road Sections for Maria Pori Project
const mariaPoriSections = [
  {
    sectionName: "Section A: Town Access Road",
    startKm: 0,
    endKm: 5,
    totalLength: 5000,
    difficultyLevel: "Easy",
    terrainType: "Flat terrain with some drainage requirements",
    status: "CONSTRUCTION",
    budgetAllocated: 800000,
    budgetSpent: 200000,
    progressPercentage: 40,
    targetCompletionDate: new Date("2024-08-30")
  },
  {
    sectionName: "Section B: Main Highway Connection",
    startKm: 5,
    endKm: 12,
    totalLength: 7000,
    difficultyLevel: "Medium",
    terrainType: "Rolling hills with moderate slopes",
    status: "CONSTRUCTION",
    budgetAllocated: 1200000,
    budgetSpent: 180000,
    progressPercentage: 15,
    targetCompletionDate: new Date("2024-10-31")
  },
  {
    sectionName: "Section C: Bridge Approach & Crossing",
    startKm: 12,
    endKm: 15,
    totalLength: 3000,
    difficultyLevel: "Hard",
    terrainType: "River crossing with bridge construction required",
    status: "DESIGN",
    budgetAllocated: 500000,
    budgetSpent: 0,
    progressPercentage: 0,
    targetCompletionDate: new Date("2024-12-15")
  }
];

async function main() {
  console.log('🇵🇬 Seeding PNG Multi-Project Database...');

  // Create Provinces
  console.log('📍 Creating PNG Provinces...');
  const provinces = [];
  for (const provinceData of pngProvinces) {
    const province = await prisma.province.upsert({
      where: { code: provinceData.code },
      update: provinceData,
      create: provinceData,
    });
    provinces.push(province);
    console.log(`✅ Created province: ${province.name}`);
  }

  // Create Contractors
  console.log('🏗️ Creating Sample Contractors...');
  const contractors = [];
  for (const contractorData of sampleContractors) {
    const contractor = await prisma.contractor.upsert({
      where: { licenseNumber: contractorData.licenseNumber },
      update: contractorData,
      create: contractorData,
    });
    contractors.push(contractor);
    console.log(`✅ Created contractor: ${contractor.name}`);
  }

  // Find Central Province for Maria Pori project
  const centralProvince = provinces.find(p => p.code === 'CPV');
  const morobeProvince = provinces.find(p => p.code === 'MOR');
  const westernProvince = provinces.find(p => p.code === 'WPV');

  // Create Admin User for multi-project management
  console.log('👤 Creating Multi-Project Admin User...');
  const hashedPassword = await bcrypt.hash('Admin123!', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@connectpng.com' },
    update: {
      name: 'PNG Infrastructure Administrator',
      role: 'ADMIN',
      password: hashedPassword,
    },
    create: {
      name: 'PNG Infrastructure Administrator',
      email: 'admin@connectpng.com',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });
  console.log(`✅ Created admin user: ${adminUser.name}`);

  // Create Maria Pori Project (Enhanced)
  console.log('🛣️ Creating Maria Pori Road Project...');
  let mariaPoriProject = await prisma.project.findFirst({
    where: { name: "Maria Pori Road Construction" }
  });

  if (!mariaPoriProject) {
    mariaPoriProject = await prisma.project.create({
      data: {
        name: multiProjects[0].name,
        description: multiProjects[0].description,
        sponsor: multiProjects[0].sponsor,
        provinceId: centralProvince?.id,
        projectType: multiProjects[0].projectType,
        totalSections: multiProjects[0].totalSections,
        contractMethod: multiProjects[0].contractMethod,
        fundingSource: multiProjects[0].fundingSource,
        governmentPriority: multiProjects[0].governmentPriority,
        status: multiProjects[0].status,
        startDate: multiProjects[0].startDate,
        estimatedEndDate: multiProjects[0].estimatedEndDate,
        teamLead: multiProjects[0].teamLead,
        totalDistance: multiProjects[0].totalDistance,
      },
    });
  }
  console.log(`✅ Created project: ${mariaPoriProject.name}`);

  // Create Road Sections for Maria Pori
  console.log('🛤️ Creating Road Sections...');
  const pngConstructor = contractors.find(c => c.name === "PNG Construction Ltd");
  const pacificInfra = contractors.find(c => c.name === "Pacific Infrastructure Partners");

  for (let i = 0; i < mariaPoriSections.length; i++) {
    const sectionData = mariaPoriSections[i];
    const assignedContractor = i === 2 ? pacificInfra : pngConstructor; // Bridge section to Pacific Infrastructure

    await prisma.roadSection.create({
      data: {
        ...sectionData,
        projectId: mariaPoriProject.id,
        assignedContractorId: assignedContractor?.id,
      },
    });
    console.log(`✅ Created section: ${sectionData.sectionName}`);
  }

  // Create Additional Sample Projects
  if (morobeProvince && westernProvince) {
    console.log('🏗️ Creating Additional Sample Projects...');

    // Highlands Highway Project
    await prisma.project.create({
      data: {
        name: multiProjects[1].name,
        description: multiProjects[1].description,
        sponsor: multiProjects[1].sponsor,
        provinceId: morobeProvince.id,
        projectType: multiProjects[1].projectType,
        totalSections: multiProjects[1].totalSections,
        contractMethod: multiProjects[1].contractMethod,
        fundingSource: multiProjects[1].fundingSource,
        governmentPriority: multiProjects[1].governmentPriority,
        status: multiProjects[1].status,
        startDate: multiProjects[1].startDate,
        estimatedEndDate: multiProjects[1].estimatedEndDate,
        teamLead: multiProjects[1].teamLead,
        totalDistance: multiProjects[1].totalDistance,
      },
    });

    // Daru Port Access Project
    await prisma.project.create({
      data: {
        name: multiProjects[2].name,
        description: multiProjects[2].description,
        sponsor: multiProjects[2].sponsor,
        provinceId: westernProvince.id,
        projectType: multiProjects[2].projectType,
        totalSections: multiProjects[2].totalSections,
        contractMethod: multiProjects[2].contractMethod,
        fundingSource: multiProjects[2].fundingSource,
        governmentPriority: multiProjects[2].governmentPriority,
        status: multiProjects[2].status,
        startDate: multiProjects[2].startDate,
        estimatedEndDate: multiProjects[2].estimatedEndDate,
        teamLead: multiProjects[2].teamLead,
        totalDistance: multiProjects[2].totalDistance,
      },
    });

    console.log('✅ Created additional sample projects');
  }

  // Grant admin access to all projects
  console.log('🔐 Setting up project access permissions...');
  const allProjects = await prisma.project.findMany();

  for (const project of allProjects) {
    await prisma.userProjectAccess.upsert({
      where: {
        userId_projectId: {
          userId: adminUser.id,
          projectId: project.id,
        },
      },
      update: {
        accessLevel: 'FULL',
        isActive: true,
      },
      create: {
        userId: adminUser.id,
        projectId: project.id,
        accessLevel: 'FULL',
        grantedBy: adminUser.id,
        isActive: true,
        allowedSections: [],
      },
    });
  }

  console.log('🎉 PNG Multi-Project Database seeding completed successfully!');
  console.log(`📊 Summary:`);
  console.log(`   - ${provinces.length} PNG Provinces created`);
  console.log(`   - ${contractors.length} Contractors created`);
  console.log(`   - ${allProjects.length} Projects created`);
  console.log(`   - Road sections and access permissions configured`);
  console.log(`\n🔑 Admin Login: admin@connectpng.com / Admin123!`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
