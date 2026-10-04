import { HenPlan } from '../types';
import { REALISTIC_HEN_IMAGES, REALISTIC_EGG_IMAGES } from './henAssets';

const HEN_BREEDS = [
  'Golden Sussex',
  'Rhode Island Red',
  'Emerald Leghorn',
  'Black Australorp',
  'Sapphire Bantam',
  'Crimson Marans',
  'Silver Wyandotte',
  'White Silkie',
  'Buff Orpington',
  'Imperial Brahma',
  'Barred Plymouth Rock',
  'Copper Marans',
  'Speckled Sussex',
  'Blue Andalusian',
  'Ancona Layer',
  'Welsummer Heritage',
  'Campine Roost',
  'Dorking Crested',
  'Hamburg Feathered',
  'Faverolles Classic'
];

const HEN_COLORS = [
  '#f59e0b', // Amber/Gold
  '#b45309', // Deep Bronze
  '#10b981', // Emerald
  '#3b82f6', // Sapphire Blue
  '#ef4444', // Crimson
  '#8b5cf6', // Imperial Purple
  '#059669', // Forest Green
  '#d97706', // Copper
  '#ec4899', // Ruby Rose
  '#64748b'  // Silver Slate
];

const EGG_COLORS = [
  '#fef3c7', // Cream
  '#fed7aa', // Tinted Amber
  '#a7f3d0', // Mint
  '#bfdbfe', // Soft Blue
  '#fecaca', // Pale Pink
  '#ddd6fe', // Lavender
  '#6ee7b7', // Pastel Jade
  '#fde68a', // Warm Gold
  '#fbcfe8', // Pearl Rose
  '#e2e8f0'  // White Porcelain
];

export const INITIAL_PLANS: HenPlan[] = [];

for (let i = 1; i <= 50; i++) {
  const breedName = HEN_BREEDS[(i - 1) % HEN_BREEDS.length];
  const color = HEN_COLORS[(i - 1) % HEN_COLORS.length];
  const eggColor = EGG_COLORS[(i - 1) % EGG_COLORS.length];
  const price = i * 500;
  const hensText = i === 1 ? '1 Hen' : `${i} Hens`;

  let badge: string | undefined = undefined;
  if (i === 1) badge = 'STARTER ROOST';
  else if (i === 5) badge = 'POPULAR COOP';
  else if (i === 10) badge = 'FARM CLASSIC';
  else if (i === 25) badge = 'EXPEDITION FLOCK';
  else if (i === 50) badge = 'GRAND RANCH';

  INITIAL_PLANS.push({
    id: `plan_${i}`,
    planNumber: i,
    name: `Plan ${i}`,
    henQuantity: i,
    price: price,
    cycleDays: 60,
    dailyEggs: i, // 1 egg per day per hen
    eggValuePkr: 40,
    status: 'ACTIVE',
    sortOrder: i,
    henType: `${breedName} (${hensText})`,
    henColor: color,
    eggColor: eggColor,
    henImage: REALISTIC_HEN_IMAGES[(i - 1) % REALISTIC_HEN_IMAGES.length],
    eggImage: REALISTIC_EGG_IMAGES[(i - 1) % REALISTIC_EGG_IMAGES.length],
    badge: badge,
    description: `Digital coop flock containing ${hensText}. Produces ${i} egg${i > 1 ? 's' : ''} daily over a 60-day farm cycle.`,
    terms: 'Digital game asset simulation only. Eggs must be harvested manually each cycle day. No guaranteed monetary profits or fixed investment returns.'
  });
}
