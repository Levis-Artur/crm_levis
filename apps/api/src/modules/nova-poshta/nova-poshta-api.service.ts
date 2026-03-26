import {
  BadGatewayException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  CreateNovaPoshtaWaybillInput,
  NovaPoshtaApiEnvelope,
  NovaPoshtaCreateWaybillRecord,
  NovaPoshtaTrackingStatusRecord,
} from './nova-poshta.types';

type NovaPoshtaRequestBody = {
  modelName: string;
  calledMethod: string;
  methodProperties: Record<string, unknown>;
};

@Injectable()
export class NovaPoshtaApiService {
  constructor(private readonly configService: ConfigService) {}

  async createExpressWaybill(input: CreateNovaPoshtaWaybillInput) {
    const response = await this.post<NovaPoshtaCreateWaybillRecord>(
      'InternetDocument',
      'save',
      {
        PayerType: input.payerType,
        PaymentMethod: input.paymentMethod,
        DateTime: this.formatNovaPoshtaDate(new Date()),
        CargoType: input.cargoType,
        Weight: input.weight,
        ServiceType: input.serviceType,
        SeatsAmount: input.seatsAmount,
        Description: input.cargoDescription,
        Cost: input.declaredValue,
        CitySender: this.getRequiredSetting('NOVA_POSHTA_SENDER_CITY_REF'),
        Sender: this.getRequiredSetting('NOVA_POSHTA_SENDER_REF'),
        SenderAddress: this.getSenderWarehouseRef(),
        ContactSender: this.getRequiredSetting('NOVA_POSHTA_SENDER_CONTACT_REF'),
        SendersPhone: this.getRequiredSetting('NOVA_POSHTA_SENDER_PHONE'),
        CityRecipient: input.recipientCityRef,
        Recipient: input.recipientRef,
        RecipientAddress: input.recipientWarehouseRef,
        ContactRecipient: input.recipientContactRef,
        RecipientsPhone: input.recipientPhone,
        ...(Number(input.cashOnDeliveryAmount) > 0
          ? {
              BackwardDeliveryData: [
                {
                  PayerType: input.payerType,
                  CargoType: 'Money',
                  RedeliveryString: input.cashOnDeliveryAmount,
                },
              ],
            }
          : {}),
      },
    );

    return {
      raw: response,
      record: this.getSingleRecord(response, 'create Nova Poshta express waybill'),
    };
  }

  async fetchShipmentStatus(trackingNumber: string, phone?: string | null) {
    const response = await this.post<NovaPoshtaTrackingStatusRecord>(
      'TrackingDocument',
      'getStatusDocuments',
      {
        Documents: [
          {
            DocumentNumber: trackingNumber,
            ...(phone ? { Phone: phone } : {}),
          },
        ],
      },
    );

    return {
      raw: response,
      record: this.getSingleRecord(response, 'fetch Nova Poshta shipment status'),
    };
  }

  getDefaultServiceType() {
    return (
      this.configService.get<string>('NOVA_POSHTA_DEFAULT_SERVICE_TYPE') ??
      'WarehouseWarehouse'
    );
  }

  getDefaultPayerType() {
    return this.configService.get<string>('NOVA_POSHTA_DEFAULT_PAYER_TYPE') ?? 'Recipient';
  }

  getDefaultPaymentMethod() {
    return this.configService.get<string>('NOVA_POSHTA_DEFAULT_PAYMENT_METHOD') ?? 'Cash';
  }

  getDefaultCargoType() {
    return this.configService.get<string>('NOVA_POSHTA_DEFAULT_CARGO_TYPE') ?? 'Cargo';
  }

  getDefaultWeight() {
    return Number(this.configService.get<number>('NOVA_POSHTA_DEFAULT_WEIGHT') ?? 1);
  }

  getDefaultSeatsAmount() {
    return Number(this.configService.get<number>('NOVA_POSHTA_DEFAULT_SEATS_AMOUNT') ?? 1);
  }

  getSenderName() {
    return this.getRequiredSetting('NOVA_POSHTA_SENDER_NAME');
  }

  private async post<TRecord>(
    modelName: string,
    calledMethod: string,
    methodProperties: Record<string, unknown>,
  ) {
    this.assertIntegrationEnabled();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.getRequestTimeoutMs());

    try {
      const response = await fetch(this.getApiUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: this.getRequiredSetting('NOVA_POSHTA_API_KEY'),
          modelName,
          calledMethod,
          methodProperties,
        } satisfies NovaPoshtaRequestBody & { apiKey: string }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new BadGatewayException(
          `Nova Poshta API request failed with HTTP ${response.status}.`,
        );
      }

      const payload = (await response.json()) as NovaPoshtaApiEnvelope<TRecord>;

      if (!payload.success) {
        throw new BadGatewayException(this.buildApiErrorMessage(payload));
      }

      return payload;
    } catch (error) {
      if (error instanceof BadGatewayException || error instanceof ServiceUnavailableException) {
        throw error;
      }

      throw new BadGatewayException('Nova Poshta API request failed.');
    } finally {
      clearTimeout(timeout);
    }
  }

  private getSingleRecord<TRecord>(
    payload: NovaPoshtaApiEnvelope<TRecord>,
    actionLabel: string,
  ) {
    const [record] = payload.data ?? [];

    if (!record) {
      throw new BadGatewayException(
        `Nova Poshta API did not return data for ${actionLabel}.`,
      );
    }

    return record;
  }

  private assertIntegrationEnabled() {
    const enabled = this.configService.get<boolean>('NOVA_POSHTA_ENABLED') ?? false;

    if (!enabled) {
      throw new ServiceUnavailableException('Nova Poshta integration is disabled.');
    }
  }

  private getApiUrl() {
    return (
      this.configService.get<string>('NOVA_POSHTA_BASE_URL') ??
      this.configService.get<string>('NOVA_POSHTA_API_URL') ??
      'https://api.novaposhta.ua/v2.0/json/'
    );
  }

  private getRequestTimeoutMs() {
    return Number(this.configService.get<number>('NOVA_POSHTA_REQUEST_TIMEOUT_MS') ?? 10000);
  }

  private getRequiredSetting(key: string) {
    const value = this.configService.get<string>(key)?.trim();

    if (!value) {
      throw new ServiceUnavailableException(
        `Nova Poshta integration is missing required setting "${key}".`,
      );
    }

    return value;
  }

  private getSenderWarehouseRef() {
    const value =
      this.configService.get<string>('NOVA_POSHTA_SENDER_WAREHOUSE_REF')?.trim() ??
      this.configService.get<string>('NOVA_POSHTA_SENDER_ADDRESS_REF')?.trim();

    if (!value) {
      throw new ServiceUnavailableException(
        'Nova Poshta integration is missing required setting "NOVA_POSHTA_SENDER_WAREHOUSE_REF".',
      );
    }

    return value;
  }

  private buildApiErrorMessage(payload: NovaPoshtaApiEnvelope<unknown>) {
    const parts = [
      ...(payload.errors ?? []),
      ...(payload.warnings ?? []),
      ...(payload.info ?? []),
    ].filter((value) => typeof value === 'string' && value.trim().length > 0);

    return parts.length > 0
      ? `Nova Poshta API request failed. ${parts.join(' ')}`
      : 'Nova Poshta API request failed.';
  }

  private formatNovaPoshtaDate(value: Date) {
    const day = String(value.getDate()).padStart(2, '0');
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const year = value.getFullYear();

    return `${day}.${month}.${year}`;
  }
}
