import type { OrderManagerOption } from '@/features/orders/types';

export interface ReturnStatusInfo {
  code: string;
  name: string;
  description: string | null;
  isTerminal: boolean;
}

export interface ReturnOrderSummary {
  id: string;
  orderNumber: string;
  managerId: string;
  manager: OrderManagerOption;
  customerName: string;
  customerPhone: string | null;
  customerPhoneExtra: string | null;
  customerEmail: string | null;
  city: string | null;
  totalAmount: string;
  saleAmount: string;
  purchaseAmount: string;
  marginAmount: string;
  currencyCode: string;
  orderStatusCode: string;
  placedAt: string;
  completedAt: string | null;
  isProblematic: boolean;
  counts: {
    items: number;
    shipments: number;
    orderReturns: number;
  };
}

export interface ReturnOrderItemSummary {
  id: string;
  lineNumber: number;
  sku: string | null;
  purchaseLink: string | null;
  productName: string;
  quantity: number;
  salePrice: string;
  purchasePrice: string;
  discountAmount: string;
  lineTotal: string;
}

export interface OrderReturnListItem {
  id: string;
  returnNumber: string;
  orderId: string;
  returnStatusCode: string;
  returnStatus: ReturnStatusInfo;
  processedById: string | null;
  processedBy: OrderManagerOption | null;
  reason: string | null;
  notes: string | null;
  amount: string;
  requestedAt: string;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  order: ReturnOrderSummary;
}

export interface OrderReturnDetail extends OrderReturnListItem {
  order: ReturnOrderSummary & {
    items: ReturnOrderItemSummary[];
  };
}

export interface ReturnsListFilters {
  page: number;
  limit: number;
  search?: string;
  returnStatusCode?: string;
  managerId?: string;
  orderId?: string;
  requestedFrom?: string;
  requestedTo?: string;
}

export interface ReturnsListResponse {
  items: OrderReturnListItem[];
  total: number;
  page: number;
  limit: number;
  pageCount: number;
}
