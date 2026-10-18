export interface Store {
  id: string;
  owner_id: string;
  name: string;
  whatsapp_number: string;
  theme_color: string;
  font_family: string;
  logo_url?: string;
  // Control de pago: si es false, el catálogo público queda fuera de servicio.
  is_active: boolean;
  // Fin de la suscripción (date o timestamptz). null = ilimitada.
  subscription_end?: string | null;
  // Tema por defecto de la vitrina: 'light' | 'dark' | 'system'.
  default_theme?: string | null;
  created_at?: string;
}

export interface Product {
  id: string;
  store_id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  is_active: boolean;
  category?: string | null;
  // Unidades disponibles. null = stock ilimitado (no se controla).
  stock?: number | null;
}

export const SUPERADMIN_ROLE = "SUPERADMIN";

export interface Profile {
  id: string;
  email: string;
  global_role: string | null;
}

export const TICKET_STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED"] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];

export interface SupportTicket {
  id: string;
  store_id: string;
  subject: string;
  message: string;
  admin_reply: string | null;
  status: TicketStatus;
  created_at: string;
}

export const ORDER_STATUSES = ["PENDING", "PAID", "CANCELLED"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

// Línea de pedido tal como la guarda logOrder (precios verificados en servidor).
export interface OrderItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface OrderLog {
  id: string;
  store_id: string;
  total: number;
  items: OrderItem[];
  status: OrderStatus;
  customer_name: string | null;
  created_at: string;
}
