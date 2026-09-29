import type { ImageSourcePropType } from 'react-native';

export type Category =
  'Tümü' | 'Müzeler' | 'Gastronomi' | 'Konaklama' | 'Sakin köşeler' | 'Kaydedilenler';
export type Place = {
  id: string;
  title: string;
  category: Category;
  location: string;
  description: string;
  tag: string;
  rating: string;
  image: ImageSourcePropType;
  quiet?: boolean;
  compact?: boolean;
  mappable?: boolean;
};

export const places: Place[] = [
  {
    id: 'enzo',
    title: 'Trattoria da Enzo al 29',
    category: 'Gastronomi',
    location: 'Trastevere, Roma',
    description:
      'Dar sokaklar, uzun sofralar ve Roma mutfağından bir tabak mutluluk. Keşiflerine lezzetli bir mola ver.',
    tag: 'Yerel lezzetler',
    rating: '4,9',
    image: require('../../../assets/explore/pasta.jpg'),
  },
  {
    id: 'doria',
    title: 'Palazzo Doria Pamphilj',
    category: 'Müzeler',
    location: 'Via del Corso, Roma',
    description:
      'Altın çerçevelerin, aynaların ve sanatla dolu salonların arasında şehrin başka bir yüzünü keşfet.',
    tag: 'Kültür & sanat',
    rating: '4,8',
    image: require('../../../assets/explore/gallery.jpg'),
    quiet: true,
  },
  {
    id: 'gelato',
    title: 'San Crispino',
    category: 'Gastronomi',
    location: 'Trevi, Roma',
    description: 'Şehir yürüyüşüne tatlı bir dondurma molası.',
    tag: 'Kafe / Dondurma',
    rating: '4,7',
    image: require('../../../assets/explore/gelato.jpg'),
    compact: true,
  },
  {
    id: 'osteria',
    title: 'Osteria, bir Roma akşamı',
    category: 'Gastronomi',
    location: 'Roma, İtalya',
    description: 'Sıcak bir sofra, sakin bir akşam ve yeni anılar.',
    tag: 'Yerel mutfak',
    rating: '4,8',
    image: require('../../../assets/explore/restaurant.jpg'),
    quiet: true,
    compact: true,
    mappable: false,
  },
];

export const categories: Category[] = [
  'Tümü',
  'Müzeler',
  'Gastronomi',
  'Konaklama',
  'Sakin köşeler',
  'Kaydedilenler',
];
