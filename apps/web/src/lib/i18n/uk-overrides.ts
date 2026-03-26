export const ukOverrides = {
  navigation: {
    assistant: 'AI помічник',
  },
  orders: {
    loadShipmentError: 'Не вдалося завантажити відправлення.',
    shipmentFormDescription:
      'Створіть відправлення Nova Poshta для цього замовлення та збережіть дані для подальшої синхронізації статусу.',
    shipmentSummaryDescription:
      'Поточний стан відправлення Nova Poshta з останніми синхронізованими даними.',
    shipmentCreateHelp:
      'Поки що довідники Nova Poshta не підключені, тому обовʼязкові ref-поля потрібно вказати вручну.',
    shipmentRefsTitle: 'Реквізити Nova Poshta',
    shipmentRefsDescription:
      'Обовʼязкові ідентифікатори контрагента, контакту, міста та відділення для створення ЕН.',
    shipmentRecipientTitle: 'Отримувач і маршрут',
    shipmentRecipientDescription:
      'Перевірте або уточніть контактні дані одержувача та точку доставки.',
    shipmentDetailsTitle: 'Параметри відправлення',
    shipmentDetailsDescription:
      'Фінансові та логістичні параметри, які будуть передані в Nova Poshta під час створення відправлення.',
    createShipment: 'Створити відправлення',
    creatingShipment: 'Створення відправлення...',
    syncShipment: 'Синхронізувати статус',
    syncingShipment: 'Синхронізація...',
    shipmentCreateError: 'Не вдалося створити відправлення.',
    shipmentSyncError: 'Не вдалося синхронізувати відправлення.',
    trackingNumber: 'ТТН',
    provider: 'Перевізник',
    deliveryStatusLabel: 'Статус доставки',
    recipient: 'Отримувач',
    destination: 'Призначення',
    lastSyncedAt: 'Остання синхронізація',
    recipientRef: 'Ref отримувача',
    recipientContactRef: 'Ref контакту отримувача',
    recipientCityRef: 'Ref міста отримувача',
    recipientWarehouseRef: 'Ref відділення отримувача',
    recipientRefPlaceholder: 'Наприклад, 8d5f1f3e-...',
    recipientContactRefPlaceholder: 'Наприклад, 5c4f2b8a-...',
    recipientCityRefPlaceholder: 'Наприклад, db5c88f0-...',
    recipientWarehouseRefPlaceholder: 'Наприклад, 91b6b4f9-...',
    recipientName: 'Імʼя отримувача',
    recipientPhone: 'Телефон отримувача',
    destinationCityLabel: 'Місто призначення',
    destinationBranchLabel: 'Відділення / пункт видачі',
    cargoDescription: 'Опис відправлення',
    cargoDescriptionPlaceholder: 'Замовлення ORD-...',
    weight: 'Вага, кг',
    seatsAmount: 'Кількість місць',
  },
  assistant: {
    eyebrow: 'AI помічник',
    title: 'Внутрішній чат CRM',
    description:
      'Поставте питання про замовлення, повернення, фінанси або доставку. Помічник читає дані лише через дозволені інструменти й не змінює CRM.',
    chatTitle: 'Діалог',
    chatDescription:
      'Історія зберігається в межах поточної браузерної сесії. Відповіді формуються українською мовою.',
    emptyTitle: 'Почніть новий діалог',
    emptyDescription:
      'Сформулюйте питання звичайною мовою, наприклад про проблемні замовлення, фінанси менеджера або стан доставки.',
    inputLabel: 'Ваше повідомлення',
    inputPlaceholder: 'Наприклад: покажи проблемні замовлення за останній тиждень',
    send: 'Надіслати',
    sending: 'Надсилання...',
    errorTitle: 'Не вдалося отримати відповідь',
    capabilitiesTitle: 'Що вміє помічник',
    capabilitiesDescription:
      'Помічник має доступ лише до дозволених read-only інструментів і пояснює обмеження, якщо дія заборонена.',
    allowedTitle: 'Дозволено',
    forbiddenTitle: 'Заборонено',
    toolsTitle: 'Доступні інструменти',
    toolLabel: 'Використані інструменти',
    noCapabilities: 'Список можливостей поки що недоступний.',
    sessionReset: 'Очистити діалог',
    assistantLabel: 'Помічник',
    userLabel: 'Ви',
    suggestionsTitle: 'Приклади запитів',
    suggestions: {
      common: [
        'Покажи проблемні замовлення за сьогодні',
        'Поясни стан доставки по замовленню ORD-...',
      ],
      manager: ['Покажи мій фінансовий підсумок'],
      admin: [
        'Підсумуй фінанси компанії за цей місяць',
        'Підготуй повідомлення клієнту про затримку доставки',
      ],
    },
  },
  validation: {
    recipientRefRequired: 'Вкажіть ref отримувача.',
    recipientContactRefRequired: 'Вкажіть ref контакту отримувача.',
    recipientCityRefRequired: 'Вкажіть ref міста отримувача.',
    recipientWarehouseRefRequired: 'Вкажіть ref відділення отримувача.',
    declaredValueMin: 'Оголошена вартість має бути не меншою за 0.',
    cashOnDeliveryMin: 'Післяплата має бути не меншою за 0.',
    weightMin: 'Вага має бути більшою за 0.',
    seatsAmountMin: 'Кількість місць має бути не меншою за 1.',
  },
  apiMessages: {
    'Unable to create shipment.': 'Не вдалося створити відправлення.',
    'Unable to sync shipment.': 'Не вдалося синхронізувати відправлення.',
    'AI chat is disabled.': 'AI чат тимчасово вимкнений.',
    'OpenAI Responses API request failed.': 'Не вдалося звернутися до AI сервісу.',
    'AI response did not include assistant text.':
      'AI сервіс не повернув текст відповіді.',
  },
} as const;
