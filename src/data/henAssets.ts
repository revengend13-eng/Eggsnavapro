import goldenHenImg from '../assets/images/golden_farm_hen_1791050982611.jpg';
import rhodeRedImg from '../assets/images/rhode_red_hen_1791051009774.jpg';
import whiteLeghornImg from '../assets/images/white_leghorn_hen_1791051022883.jpg';
import speckledMaransImg from '../assets/images/speckled_marans_hen_1791051036330.jpg';
import freshEggImg from '../assets/images/fresh_golden_egg_1791050998665.jpg';
import nestEggsImg from '../assets/images/farm_nest_eggs_1791051048434.jpg';

export interface ImagePreset {
  id: string;
  name: string;
  url: string;
  category: 'hen' | 'egg';
}

export const REALISTIC_HEN_IMAGES = [
  goldenHenImg,
  rhodeRedImg,
  whiteLeghornImg,
  speckledMaransImg
];

export const REALISTIC_EGG_IMAGES = [
  freshEggImg,
  nestEggsImg
];

export const PRESET_HEN_OPTIONS: ImagePreset[] = [
  { id: 'golden_sussex', name: 'Golden Sussex (Amber)', url: goldenHenImg, category: 'hen' },
  { id: 'rhode_red', name: 'Rhode Island Red (Heritage)', url: rhodeRedImg, category: 'hen' },
  { id: 'white_leghorn', name: 'White Leghorn (Pure)', url: whiteLeghornImg, category: 'hen' },
  { id: 'speckled_marans', name: 'Speckled Marans (Iridescent)', url: speckledMaransImg, category: 'hen' },
];

export const PRESET_EGG_OPTIONS: ImagePreset[] = [
  { id: 'golden_fresh_egg', name: 'Golden Farm Egg (Clean)', url: freshEggImg, category: 'egg' },
  { id: 'nest_eggs', name: 'Nest Eggs (Rustic Straw)', url: nestEggsImg, category: 'egg' },
];

export {
  goldenHenImg,
  rhodeRedImg,
  whiteLeghornImg,
  speckledMaransImg,
  freshEggImg,
  nestEggsImg
};
