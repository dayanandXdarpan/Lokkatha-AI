/**
 * State-wise Cultural Themes for LokKatha AI 2.0
 * Each state has unique colors, patterns, and visual elements inspired by local culture
 */

export interface StateTheme {
  id: string;
  name: string;
  displayName: string;
  
  // Color palette
  colors: {
    primary: string;
    primaryDark: string;
    secondary: string;
    accent: string;
    bg: string;
    bgSecondary: string;
    text: string;
    textSecondary: string;
  };
  
  // Visual elements
  pattern?: string; // CSS pattern or texture
  illustration: string; // Emoji or icon for welcome card
  illustrationDesc: string; // Description
  borderStyle?: string; // Custom border for create button
  
  // Typography
  font?: string; // Optional custom font
  
  // Cultural metadata
  artForm: string; // Primary art form inspiration
  description: string;
}

/**
 * All Indian States & Union Territories with Cultural Themes
 */
export const STATE_THEMES: Record<string, StateTheme> = {
  // Default theme
  default: {
    id: 'default',
    name: 'default',
    displayName: 'Modern India',
    colors: {
      primary: '#4F46E5', // Indigo
      primaryDark: '#3730A3',
      secondary: '#10B981', // Emerald
      accent: '#F59E0B', // Amber
      bg: '#FFFFFF',
      bgSecondary: '#F3F4F6',
      text: '#111827',
      textSecondary: '#6B7280',
    },
    illustration: '🇮🇳',
    illustrationDesc: 'Indian Flag',
    artForm: 'Modern Design',
    description: 'Clean, modern design for all of India',
  },

  // Northern India
  'Uttar Pradesh': {
    id: 'uttar-pradesh',
    name: 'Uttar Pradesh',
    displayName: 'Awadh - The Court of Awadh',
    colors: {
      primary: '#FFFBF5', // Ivory White
      primaryDark: '#E8DCC8',
      secondary: '#98D8C8', // Mint Green
      accent: '#F7B5CA', // Rose Pink
      bg: '#FFFEFA',
      bgSecondary: '#F5F0E8',
      text: '#2C1810',
      textSecondary: '#6B5D52',
    },
    pattern: 'chikankari',
    illustration: '🕌',
    illustrationDesc: 'Mughal Architecture',
    borderStyle: 'embroidered',
    artForm: 'Chikankari Embroidery',
    description: 'Inspired by intricate Chikankari embroidery and Mughal grandeur',
  },

  'Uttarakhand': {
    id: 'uttarakhand',
    name: 'Uttarakhand',
    displayName: 'Devbhumi - Land of the Gods',
    colors: {
      primary: '#708090', // Slate Grey
      primaryDark: '#4A5568',
      secondary: '#6B9362', // Alpine Green
      accent: '#9B59B6', // Brahma Kamal Purple
      bg: '#F7FAFC',
      bgSecondary: '#EDF2F7',
      text: '#1A202C',
      textSecondary: '#718096',
    },
    pattern: 'aipan',
    illustration: '🏔️',
    illustrationDesc: 'Himalayan Peaks',
    borderStyle: 'geometric',
    artForm: 'Aipan Floor Art',
    description: 'Serene Himalayan peaks and traditional Aipan geometric patterns',
  },

  'Himachal Pradesh': {
    id: 'himachal-pradesh',
    name: 'Himachal Pradesh',
    displayName: 'Himalayan Orchard',
    colors: {
      primary: '#DC143C', // Apple Red
      primaryDark: '#A01020',
      secondary: '#2D5016', // Pine Green
      accent: '#8B4513', // Woody Brown
      bg: '#FFF8F5',
      bgSecondary: '#F5EDE8',
      text: '#1C0F08',
      textSecondary: '#6B5D52',
    },
    pattern: 'woven-wool',
    illustration: '🍎',
    illustrationDesc: 'Apple Orchard',
    borderStyle: 'kullu-shawl',
    artForm: 'Kullu Shawls & Kangra Paintings',
    description: 'Vibrant Kullu shawls and apple orchards of Himachal',
  },

  'Haryana': {
    id: 'haryana',
    name: 'Haryana',
    displayName: 'Viraat - The Grand Land',
    colors: {
      primary: '#CD853F', // Terracotta
      primaryDark: '#8B5A2B',
      secondary: '#FFD700', // Mustard Yellow
      accent: '#87CEEB', // Sky Blue
      bg: '#FFF9F5',
      bgSecondary: '#F5EDE5',
      text: '#2C1810',
      textSecondary: '#6B5D52',
    },
    pattern: 'pottery',
    illustration: '🏺',
    illustrationDesc: 'Earthen Pot',
    borderStyle: 'panja-durrie',
    artForm: 'Panja Durries & Pottery',
    description: 'Earthy pottery tones and geometric Panja Durrie patterns',
  },

  'Punjab': {
    id: 'punjab',
    name: 'Punjab',
    displayName: 'Virasat - Land of Heritage',
    colors: {
      primary: '#FFD700', // Golden
      primaryDark: '#B8860B',
      secondary: '#8B0000', // Deep Red
      accent: '#228B22', // Forest Green
      bg: '#FFFAF0',
      bgSecondary: '#F5E6D3',
      text: '#2C1810',
      textSecondary: '#6B5D52',
    },
    pattern: 'phulkari',
    illustration: '🌾',
    illustrationDesc: 'Golden Wheat Fields',
    borderStyle: 'phulkari-stitch',
    artForm: 'Phulkari Embroidery',
    description: 'Golden wheat fields and vibrant Phulkari embroidery',
  },

  'Jammu and Kashmir': {
    id: 'jammu-kashmir',
    name: 'Jammu and Kashmir',
    displayName: 'Paradise on Earth',
    colors: {
      primary: '#FF8C00', // Saffron
      primaryDark: '#CC7000',
      secondary: '#DC143C', // Chinar Red
      accent: '#FFFAFA', // Snowy White
      bg: '#FFF5EE',
      bgSecondary: '#F5E6DC',
      text: '#2C1810',
      textSecondary: '#6B5D52',
    },
    pattern: 'kashida',
    illustration: '🍁',
    illustrationDesc: 'Chinar Leaf',
    borderStyle: 'kashida-embroidery',
    artForm: 'Kashida Embroidery',
    description: 'Saffron fields, Chinar leaves, and exquisite Kashida embroidery',
  },

  'Ladakh': {
    id: 'ladakh',
    name: 'Ladakh',
    displayName: 'Land of High Passes',
    colors: {
      primary: '#0047AB', // Deep Blue
      primaryDark: '#003380',
      secondary: '#D2691E', // Desert Brown
      accent: '#8B0000', // Monastery Red
      bg: '#F0F8FF',
      bgSecondary: '#E6EFF5',
      text: '#1C1C1C',
      textSecondary: '#666666',
    },
    pattern: 'thangka',
    illustration: '🏔️',
    illustrationDesc: 'Mountain Pass',
    borderStyle: 'prayer-wheel',
    artForm: 'Thangka Paintings',
    description: 'Stark beauty of high passes and Buddhist Thangka art',
  },

  'Delhi': {
    id: 'delhi',
    name: 'Delhi',
    displayName: 'The Capital',
    colors: {
      primary: '#D4A574', // Sandstone
      primaryDark: '#A67C52',
      secondary: '#F5F5F5', // Marble White
      accent: '#008080', // Modern Teal
      bg: '#FFFAF5',
      bgSecondary: '#F5EDE3',
      text: '#2C1810',
      textSecondary: '#6B5D52',
    },
    pattern: 'geometric-mughal',
    illustration: '🏛️',
    illustrationDesc: 'Lotus Temple',
    borderStyle: 'geometric-modern',
    artForm: 'Mughal & Modern Architecture',
    description: 'Sandstone heritage meets modern geometric design',
  },

  // Central India
  'Madhya Pradesh': {
    id: 'madhya-pradesh',
    name: 'Madhya Pradesh',
    displayName: 'Heart of India',
    colors: {
      primary: '#CC7722', // Earthy Ochre
      primaryDark: '#994411',
      secondary: '#2F4F4F', // Charcoal Black
      accent: '#228B22', // Forest Green
      bg: '#FFF8F0',
      bgSecondary: '#F5E6D3',
      text: '#1C1C1C',
      textSecondary: '#666666',
    },
    pattern: 'gond-dots',
    illustration: '🐅',
    illustrationDesc: 'Tiger of Madhya Pradesh',
    borderStyle: 'gond-art',
    artForm: 'Gond Art',
    description: 'Ancient rock art colors and intricate Gond tribal patterns',
  },

  'Chhattisgarh': {
    id: 'chhattisgarh',
    name: 'Chhattisgarh',
    displayName: 'Dhokra - The Lost Wax Art',
    colors: {
      primary: '#B87333', // Antique Brass
      primaryDark: '#8B5A2B',
      secondary: '#2F4F4F', // Deep Teal
      accent: '#F5F5F5', // Off-White
      bg: '#FFF9F5',
      bgSecondary: '#F5E9DD',
      text: '#1C1C1C',
      textSecondary: '#666666',
    },
    pattern: 'dhokra-coil',
    illustration: '🐘',
    illustrationDesc: 'Dhokra Elephant',
    borderStyle: 'dhokra-wire',
    artForm: 'Dhokra Bell Metal Art',
    description: 'Unique Dhokra metal art with coiled wire texture',
  },

  // Eastern India
  'Bihar': {
    id: 'bihar',
    name: 'Bihar',
    displayName: 'Madhubani - Forest of Honey',
    colors: {
      primary: '#DC143C', // Crimson Red
      primaryDark: '#A01020',
      secondary: '#FF8C00', // Saffron Yellow
      accent: '#0047AB', // Deep Blue
      bg: '#FFF8F0',
      bgSecondary: '#F5E6D3',
      text: '#2C1810',
      textSecondary: '#6B5D52',
    },
    pattern: 'madhubani',
    illustration: '🐟',
    illustrationDesc: 'Madhubani Fish',
    borderStyle: 'madhubani-double',
    artForm: 'Madhubani Painting',
    description: 'Vibrant Madhubani art with intricate geometric fills',
  },

  'Jharkhand': {
    id: 'jharkhand',
    name: 'Jharkhand',
    displayName: 'Sohrai - The Harvest Art',
    colors: {
      primary: '#2F4F4F', // Charcoal Black
      primaryDark: '#1C1C1C',
      secondary: '#CD853F', // Terracotta Red
      accent: '#F5F5DC', // Cream White
      bg: '#FFF9F5',
      bgSecondary: '#F5E9DD',
      text: '#1C1C1C',
      textSecondary: '#666666',
    },
    pattern: 'sohrai',
    illustration: '🐂',
    illustrationDesc: 'Sohrai Bull',
    borderStyle: 'comb-cut',
    artForm: 'Sohrai & Khovar Art',
    description: 'Vibrant Sohrai wall art with bold comb-cut patterns',
  },

  'West Bengal': {
    id: 'west-bengal',
    name: 'West Bengal',
    displayName: 'Shonar Bangla - Golden Bengal',
    colors: {
      primary: '#FFD700', // Golden Yellow
      primaryDark: '#B8860B',
      secondary: '#8B0000', // Deep Red
      accent: '#FFFAFA', // White
      bg: '#FFFEF7',
      bgSecondary: '#F5F0E0',
      text: '#2C1810',
      textSecondary: '#6B5D52',
    },
    pattern: 'kantha',
    illustration: '🌼',
    illustrationDesc: 'Tagore\'s Flower',
    borderStyle: 'kantha-stitch',
    artForm: 'Kantha Embroidery',
    description: 'Golden Bengal with delicate Kantha running stitch',
  },

  'Odisha': {
    id: 'odisha',
    name: 'Odisha',
    displayName: 'Kalinga - Land of Art',
    colors: {
      primary: '#DC143C', // Crimson
      primaryDark: '#A01020',
      secondary: '#FFD700', // Golden
      accent: '#000000', // Black
      bg: '#FFF8F0',
      bgSecondary: '#F5E6D3',
      text: '#1C1C1C',
      textSecondary: '#666666',
    },
    pattern: 'pattachitra',
    illustration: '🦚',
    illustrationDesc: 'Pattachitra Peacock',
    borderStyle: 'pattachitra-scroll',
    artForm: 'Pattachitra Scroll Painting',
    description: 'Vibrant Pattachitra art with intricate scrollwork',
  },

  'Assam': {
    id: 'assam',
    name: 'Assam',
    displayName: 'The Land of Red River',
    colors: {
      primary: '#8B0000', // Deep Red
      primaryDark: '#660000',
      secondary: '#228B22', // Forest Green
      accent: '#FFD700', // Golden
      bg: '#FFF9F5',
      bgSecondary: '#F5E9DD',
      text: '#1C1C1C',
      textSecondary: '#666666',
    },
    pattern: 'assam-silk',
    illustration: '🦏',
    illustrationDesc: 'One-horned Rhino',
    borderStyle: 'muga-weave',
    artForm: 'Muga Silk Weaving',
    description: 'Rich Assam silk colors and tea garden greens',
  },

  // North East
  'Sikkim': {
    id: 'sikkim',
    name: 'Sikkim',
    displayName: 'Kanchenjunga - Five Treasures of Snow',
    colors: {
      primary: '#8B0000', // Monastery Maroon
      primaryDark: '#660000',
      secondary: '#FFD700', // Gold
      accent: '#87CEEB', // Sky Blue
      bg: '#F0F8FF',
      bgSecondary: '#E6EFF5',
      text: '#1C1C1C',
      textSecondary: '#666666',
    },
    pattern: 'endless-knot',
    illustration: '🌸',
    illustrationDesc: 'Rhododendron',
    borderStyle: 'gold-line',
    artForm: 'Buddhist Symbols',
    description: 'Serene Buddhist monasteries and prayer flags',
  },

  'Arunachal Pradesh': {
    id: 'arunachal-pradesh',
    name: 'Arunachal Pradesh',
    displayName: 'Land of Dawn-Lit Mountains',
    colors: {
      primary: '#4B0082', // Deep Indigo
      primaryDark: '#310052',
      secondary: '#FF6347', // Flame Orange
      accent: '#D2B48C', // Bamboo Beige
      bg: '#FFF9F5',
      bgSecondary: '#F5E9DD',
      text: '#1C1C1C',
      textSecondary: '#666666',
    },
    pattern: 'bamboo-weave',
    illustration: '🦜',
    illustrationDesc: 'Hornbill',
    borderStyle: 'tribal-geometric',
    artForm: 'Apatani Textiles',
    description: 'Vivid Apatani textiles and bamboo crafts',
  },

  'Nagaland': {
    id: 'nagaland',
    name: 'Nagaland',
    displayName: 'Land of Festivals',
    colors: {
      primary: '#DC143C', // Bold Red
      primaryDark: '#A01020',
      secondary: '#000000', // Jet Black
      accent: '#FFFFFF', // White
      bg: '#1C1C1C',
      bgSecondary: '#2C2C2C',
      text: '#FFFFFF',
      textSecondary: '#CCCCCC',
    },
    pattern: 'naga-stripes',
    illustration: '🪶',
    illustrationDesc: 'Hornbill Feather',
    borderStyle: 'spear-pattern',
    artForm: 'Naga Shawls',
    description: 'Iconic red and black Naga tribal shawls',
  },

  'Manipur': {
    id: 'manipur',
    name: 'Manipur',
    displayName: 'The Jewelled Land',
    colors: {
      primary: '#50C878', // Emerald Green
      primaryDark: '#2E7D4E',
      secondary: '#FFFFFF', // Pure White
      accent: '#FFD700', // Soft Gold
      bg: '#F0FFF0',
      bgSecondary: '#E0F5E0',
      text: '#1C1C1C',
      textSecondary: '#666666',
    },
    pattern: 'kauna-weave',
    illustration: '🦌',
    illustrationDesc: 'Sangai Deer',
    borderStyle: 'kauna-mat',
    artForm: 'Kauna Grass Crafts',
    description: 'Delicate Kauna grass crafts and Sangai deer',
  },

  'Mizoram': {
    id: 'mizoram',
    name: 'Mizoram',
    displayName: 'Land of the Hill People',
    colors: {
      primary: '#000000', // Black
      primaryDark: '#1C1C1C',
      secondary: '#FFFFFF', // White
      accent: '#FF4500', // Red-Orange
      bg: '#2C2C2C',
      bgSecondary: '#3C3C3C',
      text: '#FFFFFF',
      textSecondary: '#CCCCCC',
    },
    pattern: 'puan-geometric',
    illustration: '🧶',
    illustrationDesc: 'Puan Textile',
    borderStyle: 'striped-pattern',
    artForm: 'Puan Textiles',
    description: 'Intricate Puan textiles with geometric patterns',
  },

  'Tripura': {
    id: 'tripura',
    name: 'Tripura',
    displayName: 'Land of the Bamboo Queen',
    colors: {
      primary: '#6B8E23', // Bamboo Green
      primaryDark: '#4A5F19',
      secondary: '#F0E68C', // Cane Yellow
      accent: '#F5F5F5', // Off-White
      bg: '#F9FFF5',
      bgSecondary: '#EFF5E5',
      text: '#1C1C1C',
      textSecondary: '#666666',
    },
    pattern: 'bamboo-grid',
    illustration: '🎋',
    illustrationDesc: 'Bamboo Shoot',
    borderStyle: 'bamboo-border',
    artForm: 'Bamboo & Cane Crafts',
    description: 'Exceptional bamboo and cane craftsmanship',
  },

  'Meghalaya': {
    id: 'meghalaya',
    name: 'Meghalaya',
    displayName: 'Abode of Clouds',
    colors: {
      primary: '#708090', // Misty Grey
      primaryDark: '#4A5568',
      secondary: '#8FBC8F', // Moss Green
      accent: '#D2B48C', // Ryndia Silk tone
      bg: '#F0F4F8',
      bgSecondary: '#E2E8F0',
      text: '#1C1C1C',
      textSecondary: '#666666',
    },
    pattern: 'root-weave',
    illustration: '🌉',
    illustrationDesc: 'Living Root Bridge',
    borderStyle: 'natural-weave',
    artForm: 'Living Root Bridges',
    description: 'Misty hills and unique living root bridges',
  },

  // Southern India
  'Tamil Nadu': {
    id: 'tamil-nadu',
    name: 'Tamil Nadu',
    displayName: 'The Land of Temples',
    colors: {
      primary: '#8B0000', // Temple Red
      primaryDark: '#660000',
      secondary: '#FFD700', // Golden
      accent: '#006400', // Dark Green
      bg: '#FFF9F0',
      bgSecondary: '#F5E6D0',
      text: '#1C1C1C',
      textSecondary: '#666666',
    },
    pattern: 'kolam',
    illustration: '🕉️',
    illustrationDesc: 'Kolam Design',
    borderStyle: 'temple-border',
    artForm: 'Kolam & Temple Art',
    description: 'Intricate Kolam patterns and majestic temple architecture',
  },

  'Andhra Pradesh': {
    id: 'andhra-pradesh',
    name: 'Andhra Pradesh',
    displayName: 'Kalamkari - The Pen-Art',
    colors: {
      primary: '#4B0082', // Indigo
      primaryDark: '#310052',
      secondary: '#8B0000', // Maroon
      accent: '#FFD700', // Mustard Yellow
      bg: '#FFF8F0',
      bgSecondary: '#F5E6D3',
      text: '#2C1810',
      textSecondary: '#6B5D52',
    },
    pattern: 'kalamkari',
    illustration: '🦚',
    illustrationDesc: 'Kalamkari Peacock',
    borderStyle: 'floral-vine',
    artForm: 'Kalamkari Art',
    description: 'Beautiful Kalamkari art with natural dyes and intricate details',
  },

  'Telangana': {
    id: 'telangana',
    name: 'Telangana',
    displayName: 'Bidri - The Silver Inlay',
    colors: {
      primary: '#000000', // Black
      primaryDark: '#1C1C1C',
      secondary: '#C0C0C0', // Silver
      accent: '#FFFFFF', // White
      bg: '#0A0A0A',
      bgSecondary: '#1A1A1A',
      text: '#FFFFFF',
      textSecondary: '#CCCCCC',
    },
    pattern: 'bidri-inlay',
    illustration: '⭐',
    illustrationDesc: 'Bidri Star',
    borderStyle: 'silver-inlay',
    artForm: 'Bidriware Metal Inlay',
    description: 'Striking Bidriware with silver inlay on black metal',
  },

  'Karnataka': {
    id: 'karnataka',
    name: 'Karnataka',
    displayName: 'Mysuru - City of Palaces',
    colors: {
      primary: '#F5DEB3', // Sandalwood Beige
      primaryDark: '#D4A574',
      secondary: '#FFD700', // Royal Gold
      accent: '#8B0000', // Deep Maroon
      bg: '#FFF9F0',
      bgSecondary: '#F5E6D3',
      text: '#2C1810',
      textSecondary: '#6B5D52',
    },
    pattern: 'mysore-silk',
    illustration: '🦅',
    illustrationDesc: 'Ganda Bherunda',
    borderStyle: 'ornate-gold',
    artForm: 'Mysore Paintings',
    description: 'Ornate Mysore paintings with gold embellishments',
  },

  'Kerala': {
    id: 'kerala',
    name: 'Kerala',
    displayName: 'God\'s Own Country',
    colors: {
      primary: '#228B22', // Kerala Green
      primaryDark: '#006400',
      secondary: '#FFD700', // Golden
      accent: '#8B4513', // Wooden Brown
      bg: '#F0FFF0',
      bgSecondary: '#E0F5E0',
      text: '#1C1C1C',
      textSecondary: '#666666',
    },
    pattern: 'kerala-mural',
    illustration: '🐘',
    illustrationDesc: 'Kerala Elephant',
    borderStyle: 'mural-border',
    artForm: 'Kerala Murals',
    description: 'Vibrant Kerala murals with traditional green and gold',
  },

  'Goa': {
    id: 'goa',
    name: 'Goa',
    displayName: 'The Pearl of the Orient',
    colors: {
      primary: '#0077BE', // Ocean Blue
      primaryDark: '#005A8C',
      secondary: '#F5F5DC', // Sandy White
      accent: '#FF6B6B', // Coral
      bg: '#F0F8FF',
      bgSecondary: '#E6F2F8',
      text: '#1C1C1C',
      textSecondary: '#666666',
    },
    pattern: 'azulejo',
    illustration: '🏖️',
    illustrationDesc: 'Beach Paradise',
    borderStyle: 'tile-border',
    artForm: 'Portuguese Azulejo Tiles',
    description: 'Vibrant Portuguese Azulejo tiles and serene beaches',
  },

  // Western India
  'Gujarat': {
    id: 'gujarat',
    name: 'Gujarat',
    displayName: 'Rann of Kutch',
    colors: {
      primary: '#F5F5F5', // White Rann
      primaryDark: '#D3D3D3',
      secondary: '#FF6347', // Vibrant Red
      accent: '#FFD700', // Golden
      bg: '#FFFAF5',
      bgSecondary: '#F5E9DD',
      text: '#1C1C1C',
      textSecondary: '#666666',
    },
    pattern: 'bandhani',
    illustration: '🪔',
    illustrationDesc: 'Diya Lamp',
    borderStyle: 'mirror-work',
    artForm: 'Bandhani & Mirror Work',
    description: 'Vibrant Bandhani tie-dye and intricate mirror work',
  },

  'Maharashtra': {
    id: 'maharashtra',
    name: 'Maharashtra',
    displayName: 'Warli - The Tribal Art',
    colors: {
      primary: '#8B4513', // Earthy Brown
      primaryDark: '#654321',
      secondary: '#F5F5F5', // White
      accent: '#DC143C', // Red
      bg: '#FFF9F5',
      bgSecondary: '#F5E9DD',
      text: '#1C1C1C',
      textSecondary: '#666666',
    },
    pattern: 'warli',
    illustration: '🌾',
    illustrationDesc: 'Warli Dance',
    borderStyle: 'warli-tribal',
    artForm: 'Warli Tribal Art',
    description: 'Simple yet powerful Warli tribal art with geometric figures',
  },

  'Rajasthan': {
    id: 'rajasthan',
    name: 'Rajasthan',
    displayName: 'Rang Bhumi - Land of Colors',
    colors: {
      primary: '#FF6347', // Vibrant Red
      primaryDark: '#CC4D38',
      secondary: '#FFD700', // Royal Gold
      accent: '#4169E1', // Royal Blue
      bg: '#FFF5E1',
      bgSecondary: '#F5E6D0',
      text: '#2C1810',
      textSecondary: '#6B5D52',
    },
    pattern: 'rajasthani-miniature',
    illustration: '👑',
    illustrationDesc: 'Royal Heritage',
    borderStyle: 'royal-ornate',
    artForm: 'Rajasthani Miniature Paintings',
    description: 'Vibrant colors of royal Rajasthan and intricate miniatures',
  },

  // Union Territories
  'Chandigarh': {
    id: 'chandigarh',
    name: 'Chandigarh',
    displayName: 'The City Beautiful',
    colors: {
      primary: '#808080', // Concrete Grey
      primaryDark: '#5A5A5A',
      secondary: '#87CEEB', // Sky Blue
      accent: '#FFD700', // Primary Yellow
      bg: '#F5F5F5',
      bgSecondary: '#E8E8E8',
      text: '#1C1C1C',
      textSecondary: '#666666',
    },
    pattern: 'geometric-brutalist',
    illustration: '🏛️',
    illustrationDesc: 'Le Corbusier Architecture',
    borderStyle: 'clean-geometric',
    artForm: 'Brutalist Architecture',
    description: 'Clean geometric design inspired by Le Corbusier',
  },

  'Puducherry': {
    id: 'puducherry',
    name: 'Puducherry',
    displayName: 'The French Riviera of the East',
    colors: {
      primary: '#FF69B4', // Bougainvillea Pink
      primaryDark: '#C71585',
      secondary: '#FFD700', // Mustard Yellow
      accent: '#F5F5F5', // Colonial White
      bg: '#FFF5F7',
      bgSecondary: '#F5E5E8',
      text: '#2C1810',
      textSecondary: '#6B5D52',
    },
    pattern: 'french-colonial',
    illustration: '🌺',
    illustrationDesc: 'Bougainvillea',
    borderStyle: 'colonial-elegant',
    artForm: 'French Colonial Architecture',
    description: 'French colonial charm with bougainvillea colors',
  },

  'Lakshadweep': {
    id: 'lakshadweep',
    name: 'Lakshadweep',
    displayName: 'One Hundred Thousand Islands',
    colors: {
      primary: '#FF7F50', // Coral Pink
      primaryDark: '#CC6540',
      secondary: '#20B2AA', // Lagoon Teal
      accent: '#F5F5F5', // White Sand
      bg: '#F0FFFF',
      bgSecondary: '#E0F5F5',
      text: '#1C1C1C',
      textSecondary: '#666666',
    },
    pattern: 'coral-texture',
    illustration: '🐚',
    illustrationDesc: 'Coral Reef',
    borderStyle: 'wave-pattern',
    artForm: 'Coral Reefs',
    description: 'Turquoise lagoons and vibrant coral reefs',
  },

  'Andaman and Nicobar Islands': {
    id: 'andaman-nicobar',
    name: 'Andaman and Nicobar Islands',
    displayName: 'The Emerald Isles',
    colors: {
      primary: '#50C878', // Deep Emerald Green
      primaryDark: '#2E7D4E',
      secondary: '#0077BE', // Ocean Blue
      accent: '#8B4513', // Wooden Brown
      bg: '#F0FFF0',
      bgSecondary: '#E0F5E0',
      text: '#1C1C1C',
      textSecondary: '#666666',
    },
    pattern: 'rainforest',
    illustration: '🌴',
    illustrationDesc: 'Tropical Paradise',
    borderStyle: 'tribal-simple',
    artForm: 'Indigenous Jarawa Art',
    description: 'Pristine rainforests and indigenous tribal art',
  },

  'Dadra and Nagar Haveli and Daman and Diu': {
    id: 'dadra-daman-diu',
    name: 'Dadra and Nagar Haveli and Daman and Diu',
    displayName: 'Coastal Heritage',
    colors: {
      primary: '#F5DEB3', // Fortstone Beige
      primaryDark: '#D4A574',
      secondary: '#0077BE', // Sea Blue
      accent: '#DC143C', // Warli Red
      bg: '#FFF9F0',
      bgSecondary: '#F5E6D3',
      text: '#2C1810',
      textSecondary: '#6B5D52',
    },
    pattern: 'warli-coastal',
    illustration: '🏰',
    illustrationDesc: 'Portuguese Fort',
    borderStyle: 'fort-wall',
    artForm: 'Portuguese Forts & Warli',
    description: 'Portuguese coastal heritage meets tribal Warli art',
  },
};

/**
 * Get theme for a specific state
 */
export function getThemeForState(stateName: string): StateTheme {
  return STATE_THEMES[stateName] || STATE_THEMES.default;
}

/**
 * Get all available themes
 */
export function getAllThemes(): StateTheme[] {
  return Object.values(STATE_THEMES);
}

/**
 * Get theme IDs for dropdown selection
 */
export function getThemeIds(): string[] {
  return Object.keys(STATE_THEMES);
}
