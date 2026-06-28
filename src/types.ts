export interface Address {
  id: string;
  fullName: string;
  mobileNumber: string;
  houseNumber: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  isDefault?: boolean;
}

export interface UserProfile {
  uid: string;
  name: string;
  mobile: string;
  passwordHash: string; // Stored securely
  addresses: Address[];
  isAdmin?: boolean;
  createdAt: any; // Firestore Timestamp or string
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  originalPrice: number;
  discount: number; // percentage
  description: string;
  specifications: { [key: string]: string };
  features: string[];
  warranty: string;
  stock: number;
  images: string[];
  isFeatured: boolean;
  isTrending: boolean;
  isBestSeller: boolean;
  isOutOfStock: boolean;
  rating: number;
  reviewsCount: number;
  createdAt: any;
}

export interface Category {
  id: string;
  name: string;
  image: string;
  displayOrder: number;
  enabled: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface OrderTimeline {
  status: string;
  time: string; // ISO string
  note?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  customerName: string;
  mobile: string;
  items: OrderItem[];
  address: Address;
  amount: number;
  paymentScreenshot: string; // Storage URL
  utr: string; // 12 digit UTR
  createdAt: any;
  status: 'pending_verification' | 'payment_verified' | 'confirmed' | 'packed' | 'shipped' | 'delivered' | 'cancelled' | 'rejected';
  statusTimeline: OrderTimeline[];
}

export interface Review {
  id: string;
  productId: string;
  productName: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  images: string[];
  status: 'pending' | 'approved' | 'rejected';
  createdAt: any;
}

export interface Offer {
  id: string;
  title: string;
  description: string;
  type: 'percentage' | 'flat' | 'festival' | 'brand' | 'category' | 'countdown';
  code?: string;
  value: number; // percentage or flat discount amount
  expiryDate?: string;
  bannerUrl?: string;
  enabled: boolean;
}

export interface HighlightCard {
  title: string;
  description: string;
  iconType: 'truck' | 'shield' | 'award';
}

export interface PromoCard {
  badge: string;
  title: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  gradientFrom: string;
  gradientTo: string;
}

export interface WebsiteSettings {
  logo: string;
  name: string;
  homepageBanners: string[];
  offerBanners: string[];
  storeAddress: string;
  storeTimings: string;
  contactNumbers: string[];
  socialLinks: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
  };
  upiId: string;
  upiName: string;
  upiQrCode: string;
  paymentInstructions: string;
  transactionNote: string;
  popularBrands?: string[];
  highlightCards?: HighlightCard[];
  promoCards?: PromoCard[];
  adminMobile?: string;
  adminName?: string;
}
