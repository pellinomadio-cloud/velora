export interface EarnCompany {
  id: string;
  name: string;
  sector: 'Energy & Gas' | 'Agriculture & Food' | 'Real Estate & Infra' | 'Local Trade & Retail' | 'Tech & Digital';
  dailyEarning: number;
  description: string;
  emoji: string;
}

const RAW_EARN_COMPANIES: EarnCompany[] = [
  // 1. Energy & Gas (10 companies)
  {
    id: 'co-1',
    name: 'Lekki Gas Turbine Plant',
    sector: 'Energy & Gas',
    dailyEarning: 8500,
    description: 'Supplies natural gas power to Lekki Phase 1 residential grid.',
    emoji: '🔥'
  },
  {
    id: 'co-2',
    name: 'Niger Delta Refinery Co.',
    sector: 'Energy & Gas',
    dailyEarning: 14200,
    description: 'Crude oil refining and automated petrochemical separation.',
    emoji: '🛢️'
  },
  {
    id: 'co-3',
    name: 'Kano Solar Array Hub',
    sector: 'Energy & Gas',
    dailyEarning: 6200,
    description: 'Renewable photovoltaic station feeding the northern power grid.',
    emoji: '☀️'
  },
  {
    id: 'co-4',
    name: 'Shell Pipeline Security Depot',
    sector: 'Energy & Gas',
    dailyEarning: 11000,
    description: 'Advanced pressure monitoring and flow security telemetry.',
    emoji: '⛽'
  },
  {
    id: 'co-5',
    name: 'Atlantic Wind Energy Park',
    sector: 'Energy & Gas',
    dailyEarning: 7400,
    description: 'Offshore wind turbine generators off the Gulf of Guinea.',
    emoji: '🌀'
  },
  {
    id: 'co-6',
    name: 'Eko LPG Bottling Factory',
    sector: 'Energy & Gas',
    dailyEarning: 5800,
    description: 'Liquefied petroleum gas cylinders bottling and distribution.',
    emoji: '🧪'
  },
  {
    id: 'co-7',
    name: 'Forcados Crude Terminal',
    sector: 'Energy & Gas',
    dailyEarning: 15500,
    description: 'High-volume marine tanker loading and export operations.',
    emoji: '🚢'
  },
  {
    id: 'co-8',
    name: 'Ondo Bitumen Extraction Site',
    sector: 'Energy & Gas',
    dailyEarning: 9200,
    description: 'Heavy asphalt raw bitumen mining and road prep storage.',
    emoji: '🧱'
  },
  {
    id: 'co-9',
    name: 'Shiroro Hydroelectric Station',
    sector: 'Energy & Gas',
    dailyEarning: 10500,
    description: 'Hydro-powered turbine water basin supplying Central Nigeria.',
    emoji: '💧'
  },
  {
    id: 'co-10',
    name: 'Calabar Bio-Gas Generators',
    sector: 'Energy & Gas',
    dailyEarning: 4900,
    description: 'Organic recycling waste converted to methane clean fuel.',
    emoji: '🌱'
  },

  // 2. Agriculture & Food (10 companies)
  {
    id: 'co-11',
    name: 'Ogbomosho Cashew Nut Factory',
    sector: 'Agriculture & Food',
    dailyEarning: 4100,
    description: 'Premium cashew harvesting, peeling, and export packaging.',
    emoji: '🥜'
  },
  {
    id: 'co-12',
    name: 'Benue Soya Bean Silos',
    sector: 'Agriculture & Food',
    dailyEarning: 5500,
    description: 'Bulk grain drying and high-volume soy distribution.',
    emoji: '🫘'
  },
  {
    id: 'co-13',
    name: 'Ebonyi Rice Processing Mill',
    sector: 'Agriculture & Food',
    dailyEarning: 6800,
    description: 'De-husking, parboiling, and packaging of stone-free premium rice.',
    emoji: '🌾'
  },
  {
    id: 'co-14',
    name: 'Ondo Cocoa Farm Estates',
    sector: 'Agriculture & Food',
    dailyEarning: 12500,
    description: 'Fermenting organic cocoa beans for European chocolate trade.',
    emoji: '🍫'
  },
  {
    id: 'co-15',
    name: 'Obasanjo Poultry Farm Hatchery',
    sector: 'Agriculture & Food',
    dailyEarning: 7800,
    description: 'High-yield egg incubators and healthy broiler distribution.',
    emoji: '🐓'
  },
  {
    id: 'co-16',
    name: 'Anambra Palm Oil Pressers',
    sector: 'Agriculture & Food',
    dailyEarning: 6300,
    description: 'Cold-press palm fruit extraction and vegetable oil refining.',
    emoji: '🌴'
  },
  {
    id: 'co-17',
    name: 'Yobe Cattle Feedlot Logistics',
    sector: 'Agriculture & Food',
    dailyEarning: 8200,
    description: 'Organic beef cattle pasture tracking and veterinary supply chains.',
    emoji: '🐂'
  },
  {
    id: 'co-18',
    name: 'Jos Potato Greenhouses',
    sector: 'Agriculture & Food',
    dailyEarning: 3800,
    description: 'Climate-controlled hydroponics for clean Irish potato crops.',
    emoji: '🥔'
  },
  {
    id: 'co-19',
    name: 'Epe Fishery Cooperative',
    sector: 'Agriculture & Food',
    dailyEarning: 5200,
    description: 'Freshwater catfish breeding ponds and cold storage depots.',
    emoji: '🐟'
  },
  {
    id: 'co-20',
    name: 'Zaria Cassava Flour Plant',
    sector: 'Agriculture & Food',
    dailyEarning: 4700,
    description: 'Garri processing, starch extraction, and high-grade flour.',
    emoji: '🍠'
  },

  // 3. Real Estate & Infra (10 companies)
  {
    id: 'co-21',
    name: 'Lekki Toll Plaza Revenue Pool',
    sector: 'Real Estate & Infra',
    dailyEarning: 13500,
    description: 'Automated tolling royalties on the Lekki-Epe expressway.',
    emoji: '🛣️'
  },
  {
    id: 'co-22',
    name: 'Eko Atlantic Land Dredging',
    sector: 'Real Estate & Infra',
    dailyEarning: 16000,
    description: 'Ocean reclamation sand pumping and coastal luxury foundations.',
    emoji: '🏗️'
  },
  {
    id: 'co-23',
    name: 'Apapa Container Port Logistics',
    sector: 'Real Estate & Infra',
    dailyEarning: 14800,
    description: 'Customs clearance handling, crane hire, and ship berthing fees.',
    emoji: '🧱'
  },
  {
    id: 'co-24',
    name: 'Dangote Cement Depot Pool',
    sector: 'Real Estate & Infra',
    dailyEarning: 11900,
    description: 'Wholesale building material supply chains for developers.',
    emoji: '🏗️'
  },
  {
    id: 'co-25',
    name: 'Eko Hotels Conference Suites',
    sector: 'Real Estate & Infra',
    dailyEarning: 15200,
    description: 'Premium corporate event spaces and accommodation leasing.',
    emoji: '🏨'
  },
  {
    id: 'co-26',
    name: 'Ikeja City Mall Rent Pool',
    sector: 'Real Estate & Infra',
    dailyEarning: 12100,
    description: 'Commercial tenancy rent collection across 80 retail spots.',
    emoji: '🏢'
  },
  {
    id: 'co-27',
    name: 'Banana Island High-Rises',
    sector: 'Real Estate & Infra',
    dailyEarning: 17500,
    description: 'Luxury condominium leasing and facility management royalties.',
    emoji: '🏙️'
  },
  {
    id: 'co-28',
    name: 'Abuja Garki Warehousing Yards',
    sector: 'Real Estate & Infra',
    dailyEarning: 8900,
    description: 'Secure dry cargo container storage and distribution bays.',
    emoji: '🏭'
  },
  {
    id: 'co-29',
    name: 'Port Harcourt Airport Cargo Hub',
    sector: 'Real Estate & Infra',
    dailyEarning: 10400,
    description: 'Aviation cargo sorting, handling, and cold chain transit warehouses.',
    emoji: '✈️'
  },
  {
    id: 'co-30',
    name: 'Kano Grain Silos Logistics',
    sector: 'Real Estate & Infra',
    dailyEarning: 7600,
    description: 'Government grain reserve storage facilities and grain distribution.',
    emoji: '🌾'
  },

  // 4. Local Trade & Retail (10 companies)
  {
    id: 'co-31',
    name: 'Aba Leather Shoe Factory',
    sector: 'Local Trade & Retail',
    dailyEarning: 4500,
    description: 'Handcrafted leather boots, belts, and export-grade shoes.',
    emoji: '👞'
  },
  {
    id: 'co-32',
    name: 'Alaba International Electronics',
    sector: 'Local Trade & Retail',
    dailyEarning: 6900,
    description: 'Bulk smart TV and home theater wholesale distribution.',
    emoji: '📺'
  },
  {
    id: 'co-33',
    name: 'Balogun Textile Fabrics',
    sector: 'Local Trade & Retail',
    dailyEarning: 5400,
    description: 'Ankara print imports, lace weaving, and wholesale textiles.',
    emoji: '👗'
  },
  {
    id: 'co-34',
    name: 'Onitsha Main Market Spare Parts',
    sector: 'Local Trade & Retail',
    dailyEarning: 8800,
    description: 'Japanese automotive gearboxes and brake pads container imports.',
    emoji: '⚙️'
  },
  {
    id: 'co-35',
    name: 'Idumota Cosmetics Wholesale',
    sector: 'Local Trade & Retail',
    dailyEarning: 3600,
    description: 'Hair extension processing and organic skin care products supply.',
    emoji: '💄'
  },
  {
    id: 'co-36',
    name: 'Ibadan Timber Sawmill Center',
    sector: 'Local Trade & Retail',
    dailyEarning: 5900,
    description: 'Teak and Mahogany log sawing, curing, and furniture boards.',
    emoji: '🪵'
  },
  {
    id: 'co-37',
    name: 'Bodija Yam and Foodstuff Trucking',
    sector: 'Local Trade & Retail',
    dailyEarning: 6200,
    description: 'Interstate logistics trucks hauling tubers, onions, and pepper.',
    emoji: '🚛'
  },
  {
    id: 'co-38',
    name: 'Sabon Gari Commodity Market',
    sector: 'Local Trade & Retail',
    dailyEarning: 7100,
    description: 'Wholesale fertilizer and agrochemical supply network.',
    emoji: '🧺'
  },
  {
    id: 'co-39',
    name: 'Oshodi Cold Chain Meat Depot',
    sector: 'Local Trade & Retail',
    dailyEarning: 4800,
    description: 'Industrial refrigeration for local livestock and imports.',
    emoji: '🥩'
  },
  {
    id: 'co-40',
    name: 'Lagos Island Baby Products Ltd',
    sector: 'Local Trade & Retail',
    dailyEarning: 3900,
    description: 'Baby apparel, diapers, and children food wholesale logistics.',
    emoji: '🧸'
  },

  // 5. Tech & Digital (10 companies)
  {
    id: 'co-41',
    name: 'Velora eSim Network Towers',
    sector: 'Tech & Digital',
    dailyEarning: 11200,
    description: 'Active digital telecom bandwidth leasing and profile queries.',
    emoji: '📶'
  },
  {
    id: 'co-42',
    name: 'Lagos POS Merchant Pool',
    sector: 'Tech & Digital',
    dailyEarning: 8300,
    description: 'Cashout agent terminal routing fees and commission pool.',
    emoji: '📟'
  },
  {
    id: 'co-43',
    name: 'Yaba Ride-Hailing Fleet',
    sector: 'Tech & Digital',
    dailyEarning: 9500,
    description: 'Autonomous tracking and rental dividends from 50 electric cabs.',
    emoji: '🚗'
  },
  {
    id: 'co-44',
    name: 'Paystack Core API Gateway Proxy',
    sector: 'Tech & Digital',
    dailyEarning: 13800,
    description: 'Microtransaction fee split on checkout routing nodes.',
    emoji: '⚡'
  },
  {
    id: 'co-45',
    name: 'Interswitch ATM Security Nodes',
    sector: 'Tech & Digital',
    dailyEarning: 10600,
    description: 'Biometric security layer and encryption heartbeat checking.',
    emoji: '🛡️'
  },
  {
    id: 'co-46',
    name: 'CyberSpace Cloud Server Farm',
    sector: 'Tech & Digital',
    dailyEarning: 12700,
    description: 'Virtual private server hosting and database container backups.',
    emoji: '💾'
  },
  {
    id: 'co-47',
    name: 'Gbagada Fiber Broadband Hub',
    sector: 'Tech & Digital',
    dailyEarning: 7900,
    description: 'FTTH (Fiber to the Home) last-mile internet service provider.',
    emoji: '🔌'
  },
  {
    id: 'co-48',
    name: 'Konga Automated Fulfillment Bot',
    sector: 'Tech & Digital',
    dailyEarning: 6700,
    description: 'Smart sorting arm and robotic warehouse pickers.',
    emoji: '🤖'
  },
  {
    id: 'co-49',
    name: 'MainOne Undersea Fiber Cable',
    sector: 'Tech & Digital',
    dailyEarning: 16500,
    description: 'Trans-Atlantic internet pipeline bandwidth wholesale capacity.',
    emoji: '🪡'
  },
  {
    id: 'co-50',
    name: 'Outsource Global Support Center',
    sector: 'Tech & Digital',
    dailyEarning: 5300,
    description: 'AI-assisted customer service bots for international brands.',
    emoji: '🎧'
  }
];

export const EARN_COMPANIES: EarnCompany[] = RAW_EARN_COMPANIES.map((co) => {
  // Map raw daily earning linearly from [3600, 17500] to [20000, 50000]
  const minRaw = 3600;
  const maxRaw = 17500;
  const minTarget = 20000;
  const maxTarget = 50000;
  
  const fraction = (co.dailyEarning - minRaw) / (maxRaw - minRaw);
  const target = minTarget + fraction * (maxTarget - minTarget);
  
  // Round to nearest 100 Naira
  const dailyEarning = Math.round(target / 100) * 100;
  
  return {
    ...co,
    dailyEarning,
  };
});

