// Single source of truth for verified business facts.
// Everything here is taken from coastal-windows.co.uk (Oct 2026).
export const BIZ = {
  name: 'Coastal Windows & Conservatories',
  legal: 'Coastal Windows & Conservatories (UK) Limited',
  trading: 'Coastal Windows',
  address: ['Silverhills Buildings', 'Silverhills Road', 'Decoy Industrial Estate', 'Newton Abbot', 'South Devon', 'TQ12 5LZ'],
  addressLine: 'Silverhills Buildings, Silverhills Road, Decoy Industrial Estate, Newton Abbot, TQ12 5LZ',
  registered: 'Unit 8, Silverhills Buildings, Decoy Industrial Estate, Newton Abbot, TQ12 5LZ',
  showroom: ['Unit 12, Silverhills Units', 'Decoy Industrial Estate', 'Newton Abbot', 'Devon TQ12 5LZ'],
  hours: [['Monday – Thursday', '10am – 6.30pm'], ['Friday', '10am – 4pm'], ['Saturday & Sunday', 'Closed']],
  hoursData: { 1: [10, 18.5], 2: [10, 18.5], 3: [10, 18.5], 4: [10, 18.5], 5: [10, 16] },
  emails: [
    ['Windows, doors, fascias & guttering', 'windows@coastal-windows.co.uk'],
    ['Conservatories & kitchens', 'conservatories@coastal-windows.co.uk'],
    ['Service work under guarantee', 'customerservice@coastal-windows.co.uk'],
    ['Sales', 'sales@coastal-windows.co.uk'],
  ],
  phone: '01803 299937',
  phoneHref: 'tel:+441803299937',
  phoneAlt: '01626 354438',
  phoneAltHref: 'tel:+441626354438',
  whatsapp: 'https://api.whatsapp.com/send/?phone=447476940854',
  companyNo: '3973690',
  vat: '793078592',
  frn: '673550',
  founded: 1988,
  named: 1989,
  limited: 2000,
  installTeams: 9,
  buildTeams: 3,
  area: ['Cornwall', 'Devon', 'North Devon', 'Somerset', 'Dorset'],
  mapsHref: 'https://www.google.com/maps/search/?api=1&query=Coastal+Windows+%26+Conservatories+Silverhills+Road+Newton+Abbot+TQ12+5LZ',
  currentSite: 'https://www.coastal-windows.co.uk/',
  solidorDesigner: 'https://app.glazingvault.com/system/195',
  financeDisclosure:
    'Credit is subject to status and affordability. Terms & Conditions Apply. Coastal Windows & Conservatories (UK) Limited (FRN 673550) 8 Silverhills Buildings, Silverhills Road, Decoy Industrial Estate, Newton Abbot, Devon TQ12 5LZ trading as Coastal Windows is a credit broker, not the lender and is authorised and regulated by the Financial Conduct Authority. Credit is provided by Novuna Personal Finance, a trading style of Mitsubishi HC Capital UK PLC. Authorised and Regulated by the Financial Conduct Authority.',
};

export const NAV = [
  { href: '/windows/', label: 'Windows', n: '01', sub: ['Casement', 'Flush casement', 'Tilt & turn', 'Vertical sliding sash', 'Bow & bay', 'Aluminium'] },
  { href: '/doors/', label: 'Doors', n: '02', sub: ['Composite', 'Residential', 'French', 'Bifold', 'Sliding patio', 'Aluminium patio'] },
  { href: '/conservatories/', label: 'Conservatories', n: '03', sub: ['Conservatories', 'HUP! extensions', 'Replacement roofs', 'Porches', 'Verandas'] },
  { href: '/home-improvements/', label: 'Home & roofline', n: '04', sub: ['Kitchens', 'Fascias, soffits & gutters', 'Cladding', 'Flat roofing'] },
  { href: '/about/', label: 'Our story', n: '05' },
  { href: '/visit/', label: 'Visit & contact', n: '06' },
];

export const TOOLS = [
  { href: '/light-lab/', label: 'Light Lab', note: 'See the sun move through a conservatory' },
  { href: '/door-studio/', label: 'Door Studio', note: 'Compose a front door' },
  { href: '/plan/', label: 'Plan your project', note: 'A tailored brief in two minutes' },
];
