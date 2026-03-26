import type { AuthenticatedUser } from '@/lib/auth/types';

export interface OrderManagerOption {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
}

export interface OrderStatusInfo {
  code: string;
  name: string;
  description: string | null;
  isTerminal: boolean;
}

export interface PaymentStatusInfo {
  code: string;
  name: string;
  description: string | null;
  isFinal: boolean;
}

export interface DeliveryStatusInfo {
  code: string;
  name: string;
  description: string | null;
  isTerminal: boolean;
}

export interface OrderShipmentSummary {
  id: string;
  provider: string;
  externalRef: string | null;
  trackingNumber: string | null;
  deliveryStatusCode: string;
  declaredValue: string;
  cashOnDeliveryAmount: string;
  shippingCost: string;
  dispatchedAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderShipmentDetail {
  id: string;
  orderId: string;
  provider: string;
  externalRef: string | null;
  trackingNumber: string | null;
  deliveryStatusCode: string;
  deliveryStatus: DeliveryStatusInfo;
  recipientName: string | null;
  recipientPhone: string | null;
  destinationCity: string | null;
  destinationBranch: string | null;
  declaredValue: string;
  cashOnDeliveryAmount: string;
  shippingCost: string;
  metadata: unknown;
  rawPayloadJson: unknown;
  lastSyncedAt: string | null;
  dispatchedAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  updatedAt: string;
  order: {
    id: string;
    orderNumber: string;
    managerId: string;
    customerName: string;
    deliveryStatusCode: string;
  };
}

export interface OrderShipmentResponse {
  shipment: OrderShipmentDetail | null;
}

export interface CreateOrderShipmentPayload {
  recipientRef: string;
  recipientContactRef: string;
  recipientCityRef: string;
  recipientWarehouseRef: string;
  recipientName?: string;
  recipientPhone?: string;
  destinationCity?: string;
  destinationBranch?: string;
  cargoDescription?: string;
  declaredValue?: number;
  cashOnDeliveryAmount?: number;
  shippingCost?: number;
  weight?: number;
  seatsAmount?: number;
}

export interface OrderListItem {
  id: string;
  orderNumber: string;
  managerId: string;
  manager: OrderManagerOption;
  orderStatusCode: string;
  orderStatus: OrderStatusInfo;
  paymentStatusCode: string;
  paymentStatus: PaymentStatusInfo;
  deliveryStatusCode: string;
  deliveryStatus: DeliveryStatusInfo;
  customerName: string;
  customerPhone: string | null;
  customerPhoneExtra: string | null;
  customerEmail: string | null;
  city: string | null;
  deliveryPoint: string | null;
  deliveryMethod: string | null;
  paymentMethod: string | null;
  currencyCode: string;
  subtotal: string;
  discountTotal: string;
  totalAmount: string;
  purchaseAmount: string;
  saleAmount: string;
  marginAmount: string;
  prepaymentAmount: string;
  shippingCost: string;
  notes: string | null;
  internalNote: string | null;
  cancelReason: string | null;
  isProblematic: boolean;
  placedAt: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  shipments: OrderShipmentSummary[];
  counts: {
    items: number;
    shipments: number;
    orderReturns: number;
  };
}

export interface OrderItemDetail {
  id: string;
  lineNumber: number;
  sku: string | null;
  purchaseLink: string | null;
  productName: string;
  quantity: number;
  purchasePrice: string;
  salePrice: string;
  unitPrice: string;
  discountAmount: string;
  lineTotal: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderDetail extends OrderListItem {
  items: OrderItemDetail[];
}

export interface OrdersListResponse {
  items: OrderListItem[];
  total: number;
  page: number;
  limit: number;
  pageCount: number;
}

export interface OrdersListFilters {
  page: number;
  limit: number;
  search?: string;
  orderStatusCode?: string;
  managerId?: string;
  placedFrom?: string;
  placedTo?: string;
}

export interface OrdersPageData {
  currentUser: AuthenticatedUser;
  managers: OrderManagerOption[];
  filters: OrdersListFilters;
  orders: OrdersListResponse;
}
