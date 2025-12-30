/**
 * Regional Folklore & Traditional Stories Database
 * 
 * This configuration helps integrate local folklore, traditions, and cultural context
 * into educational content, making it more relatable for rural students.
 */

export interface FolkloreTopic {
  id: string;
  name: string;
  nativeName: string;
  category: 'folktale' | 'festival' | 'tradition' | 'hero' | 'nature' | 'moral';
  description: string;
  culturalContext: string;
  educationalValue: string;
  suggestedGrades: string[];
}

export interface RegionalContext {
  state: string;
  language: string;
  localHeroes: string[];
  festivals: string[];
  crops: string[];
  landmarks: string[];
  traditionalCrafts: string[];
  folklore: FolkloreTopic[];
}

/**
 * Pan-India Folklore Topics (Common Across Regions)
 */
export const commonFolklore: FolkloreTopic[] = [
  {
    id: 'panchatantra',
    name: 'Panchatantra Tales',
    nativeName: 'पंचतंत्र की कहानियाँ',
    category: 'folktale',
    description: 'Ancient Indian animal fables teaching life lessons',
    culturalContext: 'Stories told by village elders for generations',
    educationalValue: 'Critical thinking, moral values, problem-solving',
    suggestedGrades: ['1', '2', '3', '4', '5']
  },
  {
    id: 'akbar-birbal',
    name: 'Akbar-Birbal Stories',
    nativeName: 'अकबर-बीरबल की कहानियाँ',
    category: 'folktale',
    description: 'Witty tales of Emperor Akbar and his clever advisor Birbal',
    culturalContext: 'Mughal era stories showcasing wisdom and humor',
    educationalValue: 'Logical reasoning, quick thinking, justice',
    suggestedGrades: ['3', '4', '5', '6', '7']
  },
  {
    id: 'tenali-rama',
    name: 'Tenali Rama',
    nativeName: 'तेनालीराम',
    category: 'hero',
    description: 'Tales of the witty poet in Krishnadevaraya\'s court',
    culturalContext: 'Vijayanagara Empire folklore',
    educationalValue: 'Intelligence, courage, humor',
    suggestedGrades: ['3', '4', '5', '6']
  },
  {
    id: 'jataka-tales',
    name: 'Jataka Tales',
    nativeName: 'जातक कथाएँ',
    category: 'folktale',
    description: 'Buddhist birth stories of Lord Buddha',
    culturalContext: 'Ancient Indian Buddhist tradition',
    educationalValue: 'Compassion, wisdom, karma',
    suggestedGrades: ['4', '5', '6', '7']
  }
];

/**
 * State-Specific Regional Contexts
 */
export const regionalContexts: Record<string, RegionalContext> = {
  'Bihar': {
    state: 'Bihar',
    language: 'Hindi',
    localHeroes: ['Birsa Munda', 'Chandragupta Maurya', 'Aryabhata', 'Guru Gobind Singh'],
    festivals: ['Chhath Puja', 'Sonepur Mela', 'Rajgir Mahotsav', 'Sama-Chakeva'],
    crops: ['Rice', 'Wheat', 'Maize', 'Lentils', 'Sugarcane'],
    landmarks: ['Mahabodhi Temple', 'Nalanda University', 'Vikramshila', 'Rajgir Hills'],
    traditionalCrafts: ['Madhubani painting', 'Sikki grass craft', 'Manjusha art'],
    folklore: [
      {
        id: 'lorik-chanda',
        name: 'Lorik-Chanda',
        nativeName: 'लोरिक-चंदा',
        category: 'folktale',
        description: 'Epic love story sung in Bhojpuri folk songs',
        culturalContext: 'Traditional Bhojpuri folklore about bravery and love',
        educationalValue: 'Courage, loyalty, regional pride',
        suggestedGrades: ['5', '6', '7', '8']
      },
      {
        id: 'sama-chakeva',
        name: 'Sama-Chakeva',
        nativeName: 'सामा-चकेवा',
        category: 'festival',
        description: 'Festival celebrating brother-sister bond with clay birds',
        culturalContext: 'Mithila region tradition during Kartik month',
        educationalValue: 'Family bonds, art, seasonal celebrations',
        suggestedGrades: ['1', '2', '3', '4']
      }
    ]
  },
  
  'Rajasthan': {
    state: 'Rajasthan',
    language: 'Hindi',
    localHeroes: ['Maharana Pratap', 'Rani Padmini', 'Panna Dhai', 'Mirabai'],
    festivals: ['Gangaur', 'Teej', 'Pushkar Fair', 'Kite Festival'],
    crops: ['Bajra', 'Mustard', 'Wheat', 'Cotton'],
    landmarks: ['Hawa Mahal', 'Mehrangarh Fort', 'City Palace', 'Thar Desert'],
    traditionalCrafts: ['Blue pottery', 'Miniature painting', 'Bandhani tie-dye', 'Puppet making'],
    folklore: [
      {
        id: 'dhola-maru',
        name: 'Dhola-Maru',
        nativeName: 'ढोला-मारू',
        category: 'folktale',
        description: 'Legendary desert love story',
        culturalContext: 'Marwar folk tale about eternal love',
        educationalValue: 'Perseverance, devotion, desert life',
        suggestedGrades: ['6', '7', '8']
      },
      {
        id: 'pabuji',
        name: 'Pabuji',
        nativeName: 'पाबूजी',
        category: 'hero',
        description: 'Folk deity who protected cattle',
        culturalContext: 'Rajasthani epic performed as Phad painting scrolls',
        educationalValue: 'Heroism, protecting the weak, traditional art',
        suggestedGrades: ['4', '5', '6']
      }
    ]
  },

  'Tamil Nadu': {
    state: 'Tamil Nadu',
    language: 'Tamil',
    localHeroes: ['Thiruvalluvar', 'Avvaiyar', 'Kannagi', 'Raja Raja Chola'],
    festivals: ['Pongal', 'Jallikattu', 'Natyanjali', 'Karthigai Deepam'],
    crops: ['Rice', 'Sugarcane', 'Cotton', 'Groundnut', 'Coconut'],
    landmarks: ['Meenakshi Temple', 'Brihadeeswara Temple', 'Mahabalipuram', 'Kodaikanal'],
    traditionalCrafts: ['Tanjore painting', 'Kanjeevaram silk', 'Bronze casting'],
    folklore: [
      {
        id: 'kannagi',
        name: 'Kannagi\'s Story',
        nativeName: 'கண்ணகி கதை',
        category: 'hero',
        description: 'Tale of Kannagi from Silappatikaram',
        culturalContext: 'Ancient Tamil epic about justice and chastity',
        educationalValue: 'Justice, women empowerment, truth',
        suggestedGrades: ['6', '7', '8', '9']
      },
      {
        id: 'avvaiyar',
        name: 'Avvaiyar\'s Wisdom',
        nativeName: 'ஔவையார் கதைகள்',
        category: 'folktale',
        description: 'Wise sayings of the ancient Tamil poetess',
        culturalContext: 'Sangam period poetry and moral stories',
        educationalValue: 'Wisdom, ethics, Tamil literature',
        suggestedGrades: ['3', '4', '5', '6']
      }
    ]
  },

  'West Bengal': {
    state: 'West Bengal',
    language: 'Bengali',
    localHeroes: ['Netaji Subhas Bose', 'Rabindranath Tagore', 'Swami Vivekananda', 'Rani Rashmoni'],
    festivals: ['Durga Puja', 'Saraswati Puja', 'Poila Boishakh', 'Rath Yatra'],
    crops: ['Rice', 'Jute', 'Tea', 'Vegetables'],
    landmarks: ['Victoria Memorial', 'Howrah Bridge', 'Sundarbans', 'Darjeeling'],
    traditionalCrafts: ['Kantha embroidery', 'Terracotta', 'Sholapith craft'],
    folklore: [
      {
        id: 'thakurmar-jhuli',
        name: 'Thakurmar Jhuli',
        nativeName: 'ঠাকুরমার ঝুলি',
        category: 'folktale',
        description: 'Grandmother\'s bag of folk tales',
        culturalContext: 'Classic Bengali fairy tales collection',
        educationalValue: 'Imagination, moral lessons, Bengali heritage',
        suggestedGrades: ['2', '3', '4', '5']
      },
      {
        id: 'gopal-bhar',
        name: 'Gopal Bhar',
        nativeName: 'গোপাল ভাঁড়',
        category: 'folktale',
        description: 'Court jester of Maharaja Krishnachandra',
        culturalContext: 'Bengali folk humor tradition',
        educationalValue: 'Wit, humor, social commentary',
        suggestedGrades: ['3', '4', '5', '6', '7']
      }
    ]
  },

  'Maharashtra': {
    state: 'Maharashtra',
    language: 'Marathi',
    localHeroes: ['Chhatrapati Shivaji', 'Jijabai', 'Savitribai Phule', 'Babasaheb Ambedkar'],
    festivals: ['Ganesh Chaturthi', 'Gudi Padwa', 'Makar Sankranti', 'Ashadhi Ekadashi'],
    crops: ['Sugarcane', 'Cotton', 'Jowar', 'Rice', 'Onions'],
    landmarks: ['Gateway of India', 'Ajanta-Ellora Caves', 'Raigad Fort', 'Western Ghats'],
    traditionalCrafts: ['Warli painting', 'Kolhapuri chappals', 'Paithani sarees'],
    folklore: [
      {
        id: 'shivaji-stories',
        name: 'Tales of Shivaji',
        nativeName: 'शिवाजी महाराज की कहानियाँ',
        category: 'hero',
        description: 'Stories of Maratha warrior king',
        culturalContext: 'Maratha empire history and valor',
        educationalValue: 'Leadership, bravery, strategic thinking',
        suggestedGrades: ['5', '6', '7', '8', '9']
      },
      {
        id: 'sant-tukaram',
        name: 'Sant Tukaram Abhangs',
        nativeName: 'संत तुकाराम अभंग',
        category: 'tradition',
        description: 'Devotional poetry of Sant Tukaram',
        culturalContext: 'Bhakti movement spiritual tradition',
        educationalValue: 'Devotion, equality, Marathi poetry',
        suggestedGrades: ['4', '5', '6', '7']
      }
    ]
  },

  'Gujarat': {
    state: 'Gujarat',
    language: 'Gujarati',
    localHeroes: ['Mahatma Gandhi', 'Sardar Patel', 'Narsinh Mehta', 'Morarji Desai'],
    festivals: ['Navratri', 'Uttarayan', 'Janmashtami', 'Rann Utsav'],
    crops: ['Cotton', 'Groundnut', 'Tobacco', 'Castor'],
    landmarks: ['Sabarmati Ashram', 'Somnath Temple', 'Rann of Kutch', 'Gir Forest'],
    traditionalCrafts: ['Bandhani', 'Patola silk', 'Rogan art', 'Kutch embroidery'],
    folklore: [
      {
        id: 'narsinh-mehta',
        name: 'Narsinh Mehta Bhajans',
        nativeName: 'નરસિંહ મહેતા ભજન',
        category: 'tradition',
        description: 'Devotional songs about Krishna',
        culturalContext: 'Gujarat\'s saint-poet tradition',
        educationalValue: 'Devotion, Gujarati literature, music',
        suggestedGrades: ['4', '5', '6', '7']
      }
    ]
  },

  'Punjab': {
    state: 'Punjab',
    language: 'Punjabi',
    localHeroes: ['Guru Nanak Dev', 'Guru Gobind Singh', 'Bhagat Singh', 'Ranjit Singh'],
    festivals: ['Baisakhi', 'Lohri', 'Guru Purab', 'Maghi'],
    crops: ['Wheat', 'Rice', 'Cotton', 'Sugarcane'],
    landmarks: ['Golden Temple', 'Jallianwala Bagh', 'Wagah Border', 'Patiala Palace'],
    traditionalCrafts: ['Phulkari embroidery', 'Punjabi juttis', 'Wooden toys'],
    folklore: [
      {
        id: 'heer-ranjha',
        name: 'Heer-Ranjha',
        nativeName: 'ਹੀਰ-ਰਾਂਝਾ',
        category: 'folktale',
        description: 'Legendary Punjabi love story',
        culturalContext: 'Classic Punjabi romance folk tale',
        educationalValue: 'Poetry, cultural heritage, emotions',
        suggestedGrades: ['7', '8', '9', '10']
      },
      {
        id: 'mirza-sahiban',
        name: 'Mirza-Sahiban',
        nativeName: 'ਮਿਰਜ਼ਾ-ਸਾਹਿਬਾਂ',
        category: 'folktale',
        description: 'Tragic love story from Punjab',
        culturalContext: 'Punjabi folklore tradition',
        educationalValue: 'Loyalty, sacrifice, Punjabi culture',
        suggestedGrades: ['7', '8', '9', '10']
      }
    ]
  },

  'Karnataka': {
    state: 'Karnataka',
    language: 'Kannada',
    localHeroes: ['Kuvempu', 'Basavanna', 'Kittur Rani Chennamma', 'Tipu Sultan'],
    festivals: ['Dasara', 'Karaga', 'Hampi Utsav', 'Ugadi'],
    crops: ['Coffee', 'Ragi', 'Coconut', 'Areca nut'],
    landmarks: ['Mysore Palace', 'Hampi ruins', 'Jog Falls', 'Western Ghats'],
    traditionalCrafts: ['Mysore silk', 'Sandalwood carving', 'Channapatna toys'],
    folklore: [
      {
        id: 'onake-obavva',
        name: 'Onake Obavva',
        nativeName: 'ಒನಕೆ ಓಬವ್ವ',
        category: 'hero',
        description: 'Brave woman who defended Chitradurga Fort',
        culturalContext: 'Karnataka\'s warrior woman legend',
        educationalValue: 'Bravery, patriotism, women empowerment',
        suggestedGrades: ['5', '6', '7', '8']
      }
    ]
  },

  'Kerala': {
    state: 'Kerala',
    language: 'Malayalam',
    localHeroes: ['Narayana Guru', 'Ayyankali', 'Veluthampi Dalawa', 'Pazhassi Raja'],
    festivals: ['Onam', 'Vishu', 'Thrissur Pooram', 'Theyyam'],
    crops: ['Coconut', 'Rubber', 'Tea', 'Spices', 'Cashew'],
    landmarks: ['Backwaters', 'Munnar', 'Athirapally Falls', 'Padmanabhaswamy Temple'],
    traditionalCrafts: ['Kathakali masks', 'Coconut shell craft', 'Aranmula mirrors'],
    folklore: [
      {
        id: 'mahabali',
        name: 'King Mahabali',
        nativeName: 'മഹാബലി രാജാവ്',
        category: 'folktale',
        description: 'Story of Kerala\'s beloved king and Onam festival',
        culturalContext: 'Origin of Onam celebration',
        educationalValue: 'Generosity, equality, harvest celebration',
        suggestedGrades: ['2', '3', '4', '5']
      }
    ]
  },

  'Telangana': {
    state: 'Telangana',
    language: 'Telugu',
    localHeroes: ['Sammakka-Sarakka', 'Chakali Ailamma', 'Doddi Komuraiah'],
    festivals: ['Bonalu', 'Bathukamma', 'Sammakka Sarakka Jatara'],
    crops: ['Rice', 'Cotton', 'Turmeric', 'Chilli'],
    landmarks: ['Charminar', 'Golconda Fort', 'Ramoji Film City', 'Hussain Sagar'],
    traditionalCrafts: ['Bidriware', 'Nirmal paintings', 'Pochampally ikat'],
    folklore: [
      {
        id: 'sammakka-sarakka',
        name: 'Sammakka-Sarakka',
        nativeName: 'సమ్మక్క-సారక్క',
        category: 'hero',
        description: 'Tribal mother-daughter deities',
        culturalContext: 'Tribal goddess worship tradition',
        educationalValue: 'Women leadership, tribal culture, faith',
        suggestedGrades: ['5', '6', '7', '8']
      }
    ]
  }
};

/**
 * Get folklore topics for a specific state
 */
export function getFolkloreForState(state: string): FolkloreTopic[] {
  const regional = regionalContexts[state];
  if (!regional) return commonFolklore;
  
  return [...regional.folklore, ...commonFolklore];
}

/**
 * Get regional context for a specific state
 */
export function getRegionalContext(state: string): RegionalContext | null {
  return regionalContexts[state] || null;
}

/**
 * Get folklore topic by ID
 */
export function getFolkloreById(id: string): FolkloreTopic | undefined {
  // Search in common folklore
  const common = commonFolklore.find(f => f.id === id);
  if (common) return common;
  
  // Search in all regional folklore
  for (const state of Object.keys(regionalContexts)) {
    const regional = regionalContexts[state].folklore.find(f => f.id === id);
    if (regional) return regional;
  }
  
  return undefined;
}

/**
 * Get suggested folklore for grade level
 */
export function getFolkloreForGrade(grade: string, state?: string): FolkloreTopic[] {
  const allFolklore = state ? getFolkloreForState(state) : commonFolklore;
  return allFolklore.filter(f => f.suggestedGrades.includes(grade));
}

/**
 * Get all states with folklore data
 */
export function getAllStates(): string[] {
  return Object.keys(regionalContexts);
}
