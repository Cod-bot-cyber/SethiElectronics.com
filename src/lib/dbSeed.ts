import { collection, doc, getDocs, setDoc, writeBatch } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { hashPassword } from './utils';

const SEED_CATEGORIES = [
  { id: 'kitchen-appliances', name: 'Kitchen Appliances', image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=600&auto=format&fit=crop&q=80', displayOrder: 1, enabled: true },
  { id: 'fans', name: 'Fans', image: 'https://images.unsplash.com/photo-1618945097723-d309be04d9a3?w=600&auto=format&fit=crop&q=80', displayOrder: 2, enabled: true },
  { id: 'coolers', name: 'Coolers', image: 'https://images.unsplash.com/photo-1622737133809-d95047b9e673?w=600&auto=format&fit=crop&q=80', displayOrder: 3, enabled: true },
  { id: 'mixers', name: 'Mixers', image: 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=600&auto=format&fit=crop&q=80', displayOrder: 4, enabled: true },
  { id: 'induction-cooktops', name: 'Induction Cooktops', image: 'https://images.unsplash.com/photo-1506368249639-73a05d6f6488?w=600&auto=format&fit=crop&q=80', displayOrder: 5, enabled: true },
  { id: 'electric-kettles', name: 'Electric Kettles', image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80', displayOrder: 6, enabled: true },
  { id: 'lighting', name: 'Lighting', image: 'https://images.unsplash.com/photo-1565814636199-ae8133055c1c?w=600&auto=format&fit=crop&q=80', displayOrder: 7, enabled: true },
  { id: 'extension-boards', name: 'Extension Boards', image: 'https://images.unsplash.com/photo-1558244661-d248897f7bc4?w=600&auto=format&fit=crop&q=80', displayOrder: 8, enabled: true },
  { id: 'geysers', name: 'Geysers', image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&auto=format&fit=crop&q=80', displayOrder: 9, enabled: true },
  { id: 'irons', name: 'Irons', image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&auto=format&fit=crop&q=80', displayOrder: 10, enabled: true },
  { id: 'home-appliances', name: 'Home Appliances', image: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=600&auto=format&fit=crop&q=80', displayOrder: 11, enabled: true }
];

const SEED_PRODUCTS = [
  {
    id: 'bajaj-platini-px97-cooler',
    name: 'Bajaj Platini PX97 Torque 36L Personal Air Cooler',
    brand: 'Bajaj',
    category: 'coolers',
    price: 5999,
    originalPrice: 7990,
    discount: 25,
    description: 'Bajaj Platini PX97 air cooler is designed with Hexacool technology and powerful air delivery to offer efficient cooling for up to 150 sq. ft. room sizes.',
    specifications: {
      'Capacity': '36 Litres',
      'Cooling Media': 'Hexacool Honeycomb Pads',
      'Air Delivery': '1300 m3/hr',
      'Power Consumption': '100 Watts',
      'Speed Settings': '3 Speed Settings'
    },
    features: [
      'Hexacool technology for superior cooling efficiency',
      '3-side honeycomb cooling pads',
      'Powerful air throw with auto swing option',
      'Compact design with castor wheels for easy mobility',
      'Inverter compatible'
    ],
    warranty: '1 Year Bajaj Brand Warranty',
    stock: 12,
    images: ['https://images.unsplash.com/photo-1622737133809-d95047b9e673?w=800&auto=format&fit=crop&q=80'],
    isFeatured: true,
    isTrending: true,
    isBestSeller: true,
    isOutOfStock: false,
    rating: 4.3,
    reviewsCount: 24,
    createdAt: new Date().toISOString()
  },
  {
    id: 'philips-hl7756-mixer',
    name: 'Philips HL7756/00 750-Watt Mixer Grinder with 3 Jars',
    brand: 'Philips',
    category: 'mixers',
    price: 3499,
    originalPrice: 5295,
    discount: 34,
    description: 'The Philips HL7756/00 mixer grinder is equipped with a powerful 750W turbo motor that handles tough ingredients like black gram dal and spices with absolute ease.',
    specifications: {
      'Power': '750 Watts',
      'Jars': '3 Stainless Steel Jars (1.5L, 1L, 0.3L)',
      'Motor Speed': '23000 RPM',
      'Body Material': 'ABS Plastic',
      'Blade Material': 'High Grade Stainless Steel'
    },
    features: [
      'Powerful 750W turbo motor with advanced air ventilation system',
      'High-grade stainless steel blades for fine grinding',
      'Leak-proof jars with secure lock mechanism',
      '3-speed control with pulse settings',
      'Sturdy ABS plastic body with non-slip feet'
    ],
    warranty: '2 Years Philips Brand Warranty',
    stock: 18,
    images: ['https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=800&auto=format&fit=crop&q=80'],
    isFeatured: true,
    isTrending: false,
    isBestSeller: true,
    isOutOfStock: false,
    rating: 4.5,
    reviewsCount: 45,
    createdAt: new Date().toISOString()
  },
  {
    id: 'havells-pedestal-fan',
    name: 'Havells Sprint LED 400mm Pedestal Fan',
    brand: 'Havells',
    category: 'fans',
    price: 2899,
    originalPrice: 3850,
    discount: 25,
    description: 'Havells Sprint Pedestal Fan delivers powerful cooling with customized speed options, LED indicators, and full remote-control operations for ultimate convenience.',
    specifications: {
      'Sweep Size': '400 mm',
      'Air Delivery': '72 m3/min',
      'Speed': '1350 RPM',
      'Control': 'Remote and Push Button',
      'Oscillation': '60 Degree Auto Swing'
    },
    features: [
      'Ergonomic design with customized height adjustment',
      'Thermal overload protection for motor safety',
      'High-grade blades with aerodynamic design',
      'Silent operation with strong wind delivery',
      'Telescopic height adjustment'
    ],
    warranty: '2 Years Havells Brand Warranty',
    stock: 25,
    images: ['https://images.unsplash.com/photo-1618945097723-d309be04d9a3?w=800&auto=format&fit=crop&q=80'],
    isFeatured: false,
    isTrending: true,
    isBestSeller: false,
    isOutOfStock: false,
    rating: 4.2,
    reviewsCount: 15,
    createdAt: new Date().toISOString()
  },
  {
    id: 'pigeon-cruise-induction',
    name: 'Pigeon by Stovekraft Cruise 1800W Induction Cooktop',
    brand: 'Pigeon',
    category: 'induction-cooktops',
    price: 1599,
    originalPrice: 3195,
    discount: 50,
    description: 'The Pigeon Cruise induction cooktop offers an easy-to-use smart touch panel, 7 preset Indian cooking menus, and high-efficiency heating elements to save power.',
    specifications: {
      'Power': '1800 Watts',
      'Work Voltage': '220-240 Volts',
      'Preset Menus': '7 Indian Preset Cooking Menus',
      'Display': '7 Segment LED Display',
      'Timer': 'Auto shut-off timer up to 3 hours'
    },
    features: [
      'Dual-layer high grade glass panel for heat resistance',
      'Smart preset menus for easy Indian cooking',
      'Automatic pan detection and overheat protection',
      'High-grade microcrystal plate',
      'Easy to clean, spill-proof design'
    ],
    warranty: '1 Year Stovekraft Warranty',
    stock: 30,
    images: ['https://images.unsplash.com/photo-1506368249639-73a05d6f6488?w=800&auto=format&fit=crop&q=80'],
    isFeatured: true,
    isTrending: true,
    isBestSeller: true,
    isOutOfStock: false,
    rating: 4.4,
    reviewsCount: 52,
    createdAt: new Date().toISOString()
  },
  {
    id: 'havells-instanio-geyser',
    name: 'Havells Instanio 3-Litre Instant Water Heater',
    brand: 'Havells',
    category: 'geysers',
    price: 3899,
    originalPrice: 5990,
    discount: 35,
    description: 'Get instant hot water with the Havells Instanio Water Heater. Made with rust-proof outer body and stainless steel inner tank for long-term durability.',
    specifications: {
      'Capacity': '3 Litres',
      'Power': '3000 Watts',
      'Inner Tank': '304 Grade Stainless Steel',
      'Working Pressure': '6.5 Bar',
      'Indicator': 'Color Changing LED Indicator'
    },
    features: [
      'Rust-proof and shock-proof high strength ABS outer body',
      'Smart color-changing LED ring indicates heating status',
      'High pressure rating suitable for multi-storey buildings',
      'Fire retardant cable for safety',
      'Copper heating element for instant heating'
    ],
    warranty: '2 Years on Product, 5 Years on Inner Tank',
    stock: 15,
    images: ['https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&auto=format&fit=crop&q=80'],
    isFeatured: true,
    isTrending: true,
    isBestSeller: false,
    isOutOfStock: false,
    rating: 4.6,
    reviewsCount: 38,
    createdAt: new Date().toISOString()
  },
  {
    id: 'philips-gc1905-iron',
    name: 'Philips GC1905 1440-Watt Steam Iron with Spray',
    brand: 'Philips',
    category: 'irons',
    price: 1499,
    originalPrice: 1995,
    discount: 25,
    description: 'Philips GC1905 steam iron is designed to make iron your clothes quickly and effectively, thanks to its Linished soleplate and powerful continuous steam output.',
    specifications: {
      'Power': '1440 Watts',
      'Water Tank Capacity': '180 ml',
      'Soleplate': 'Linished Soleplate',
      'Steam Output': '17 g/min Continuous Steam',
      'Spray': 'Fine mist spray option'
    },
    features: [
      'Continuous steam and fine spray option to tackle tough creases',
      'Fast water filling and emptying design',
      'Easy temperature dial control for various fabrics',
      'Lightweight and ergonomic handle for comfortable grip',
      'Self-clean function to prevent limescale buildup'
    ],
    warranty: '2 Years Philips Brand Warranty',
    stock: 20,
    images: ['https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop&q=80'],
    isFeatured: false,
    isTrending: false,
    isBestSeller: true,
    isOutOfStock: false,
    rating: 4.1,
    reviewsCount: 19,
    createdAt: new Date().toISOString()
  }
];

export async function seedDatabase() {
  try {
    // 1. Check if categories exist. If they do, the database has already been seeded.
    const categorySnap = await getDocs(collection(db, 'categories'));
    if (!categorySnap.empty) {
      console.log('Database already seeded. Skipping seeding.');
      return;
    }

    console.log('Seeding categories...');
    const batch = writeBatch(db);
    for (const cat of SEED_CATEGORIES) {
      const docRef = doc(db, 'categories', cat.id);
      batch.set(docRef, cat);
    }
    await batch.commit();

    // 2. Check if products exist (should be empty, but let's be safe)
    const productSnap = await getDocs(collection(db, 'products'));
    if (productSnap.empty) {
      console.log('Seeding products...');
      const pBatch = writeBatch(db);
      for (const prod of SEED_PRODUCTS) {
        const docRef = doc(db, 'products', prod.id);
        pBatch.set(docRef, prod);
      }
      await pBatch.commit();
    }

    // 3. Create Default Admin Profile
    // We use a predefined mobile number: '7060784706' and password: 'AdminPass2026!'
    const adminId = 'admin_sethi_account';
    const adminMobile = '7060784706';
    const adminPasswordHash = await hashPassword('AdminPass2026!');

    const adminDocRef = doc(db, 'users', adminId);
    await setDoc(adminDocRef, {
      uid: adminId,
      name: 'Admin Sethi',
      mobile: adminMobile,
      passwordHash: adminPasswordHash,
      addresses: [],
      isAdmin: true,
      createdAt: new Date().toISOString()
    }, { merge: true });

    // 4. Create Default Settings Document
    const settingsDocRef = doc(db, 'settings', 'website');
    await setDoc(settingsDocRef, {
      logo: 'SethiElectronics',
      name: 'Sethi Electronics',
      homepageBanners: [
        'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=1600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=1600&auto=format&fit=crop&q=80'
      ],
      offerBanners: [
        'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1600&auto=format&fit=crop&q=80'
      ],
      storeAddress: 'Sethi Electronics, Civil Lines, Opposite Railway Crossing, Modinagar, Uttar Pradesh - 201204',
      storeTimings: '10:00 AM - 08:30 PM (Sunday Closed)',
      contactNumbers: ['+91 70607 84706', '+91 93197 84706'],
      socialLinks: {
        facebook: 'https://facebook.com/sethielectronics',
        instagram: 'https://instagram.com/sethielectronics',
        twitter: 'https://twitter.com/sethielectronics'
      },
      upiId: 'sethielectronics@upi',
      upiName: 'Sethi Electronics',
      upiQrCode: 'https://images.unsplash.com/photo-1595079676339-1534801ad6cf?w=600&auto=format&fit=crop&q=80',
      paymentInstructions: 'Scan QR using any UPI app (GPay, PhonePe, Paytm, BHIM) or pay directly to the UPI ID. Verify receiver name is Sethi Electronics.',
      transactionNote: 'Sethi Electronics Online Order Payment'
    }, { merge: true });

    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Database seeding failed: ', error);
    handleFirestoreError(error, OperationType.WRITE, 'seed');
  }
}
