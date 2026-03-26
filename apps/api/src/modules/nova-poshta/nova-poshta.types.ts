export type ShipmentAuditContext = {
  ipAddress: string | null;
  userAgent: string | null;
};

export type NovaPoshtaApiEnvelope<TRecord> = {
  success: boolean;
  data: TRecord[];
  errors?: string[];
  warnings?: string[];
  info?: string[];
  messageCodes?: string[];
  errorCodes?: string[];
  warningCodes?: string[];
  infoCodes?: string[];
};

export type NovaPoshtaCreateWaybillRecord = {
  Ref?: string;
  IntDocNumber?: string;
  CostOnSite?: string;
  EstimatedDeliveryDate?: string;
  TypeDocument?: string;
};

export type NovaPoshtaTrackingStatusRecord = {
  Number?: string;
  RefEW?: string;
  Status?: string;
  StatusCode?: string | number;
  DateCreated?: string;
  ScheduledDeliveryDate?: string;
  ActualDeliveryDate?: string;
  WarehouseRecipient?: string;
  WarehouseRecipientNumber?: string;
  PhoneRecipient?: string;
  DocumentCost?: string;
};

export type CreateNovaPoshtaWaybillInput = {
  recipientRef: string;
  recipientContactRef: string;
  recipientCityRef: string;
  recipientWarehouseRef: string;
  recipientPhone: string;
  declaredValue: string;
  cashOnDeliveryAmount: string;
  weight: string;
  seatsAmount: string;
  cargoDescription: string;
  serviceType: string;
  payerType: string;
  paymentMethod: string;
  cargoType: string;
};

export type NovaPoshtaStatusMapping = {
  deliveryStatusCode: string;
  externalStatusCode: string | null;
  externalStatusText: string | null;
  shouldSetDispatchedAt: boolean;
  shouldSetDeliveredAt: boolean;
  isTerminal: boolean;
};
