export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  config: {
    address?: string;
    phone?: string;
    currency: string;
    timezone?: string;
  };
}

export interface Table {
  id: string;
  number: number;
  status: 'free' | 'occupied' | 'ordering' | 'bill';
  capacity: number;
  active?: boolean;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  sortOrder?: number;
  active?: boolean;
  products: Product[];
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  imageUrl: string | null;
  available: boolean;
  categoryId?: string;
  trackStock?: boolean;
  sortOrder?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  notes: string;
}

export interface OrderItem {
  id: string;
  product: {
    id: string;
    name: string;
    imageUrl?: string | null;
  };
  quantity: number;
  unitPrice: string;
  subtotal: string;
  notes?: string;
  status: 'pending' | 'preparing' | 'ready' | 'delivered';
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'delivered'
  | 'paid'
  | 'cancelled';

export interface Order {
  id: string;
  orderNumber: number;
  status: OrderStatus;
  table: { id: string; number: number };
  user?: { id: string; name: string; role: string };
  items: OrderItem[];
  subtotal: string;
  total: string;
  notes?: string;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'cashier' | 'waiter' | 'kitchen';
  active?: boolean;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
  tenant: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface DashboardData {
  today: {
    sales: string;
    orders: number;
    averageTicket: string;
    itemsSold: number;
  };
  activeOrders: number;
  tablesOccupied: number;
  totalTables: number;
}

export interface ApiError {
  error: {
    message: string;
    code: string;
    details?: Record<string, string>;
  };
}

export interface SalesReport {
  period: string;
  totalSales: string;
  totalOrders: number;
  breakdown: Array<{
    label: string;
    sales: string;
    orders: number;
  }>;
}

export interface InventoryItem {
  productId: string;
  productName: string;
  currentStock: number;
  minStock: number;
  unit: string;
}
