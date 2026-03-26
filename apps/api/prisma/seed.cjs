const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const DEFAULT_ADMIN_EMAIL = 'admin@local.crm';
const DEFAULT_ADMIN_PASSWORD = 'Admin123!';
const DEFAULT_ADMIN_PHONE = '+380500000001';
const DEFAULT_ADMIN_FIRST_NAME = 'System';
const DEFAULT_ADMIN_LAST_NAME = 'Admin';

const roles = [
  {
    code: 'admin',
    name: 'Administrator',
    description: 'System administrator with global access.',
    isSystem: true,
  },
  {
    code: 'manager',
    name: 'Manager',
    description: 'Operational sales and returns manager.',
    isSystem: true,
  },
];

const orderStatuses = [
  {
    code: 'new',
    name: 'New',
    description: 'Order has been created and awaits confirmation.',
    sortOrder: 10,
    isTerminal: false,
  },
  {
    code: 'confirmed',
    name: 'Confirmed',
    description: 'Order has been confirmed by the manager.',
    sortOrder: 20,
    isTerminal: false,
  },
  {
    code: 'processing',
    name: 'Processing',
    description: 'Order is being prepared for shipment.',
    sortOrder: 30,
    isTerminal: false,
  },
  {
    code: 'shipped',
    name: 'Shipped',
    description: 'Order has left the warehouse.',
    sortOrder: 40,
    isTerminal: false,
  },
  {
    code: 'completed',
    name: 'Completed',
    description: 'Order has been delivered and closed.',
    sortOrder: 50,
    isTerminal: true,
  },
  {
    code: 'cancelled',
    name: 'Cancelled',
    description: 'Order has been cancelled.',
    sortOrder: 60,
    isTerminal: true,
  },
];

const paymentStatuses = [
  {
    code: 'unpaid',
    name: 'Unpaid',
    description: 'No payment has been received yet.',
    sortOrder: 10,
    isFinal: false,
  },
  {
    code: 'partial',
    name: 'Partially Paid',
    description: 'Only part of the amount has been received.',
    sortOrder: 20,
    isFinal: false,
  },
  {
    code: 'paid',
    name: 'Paid',
    description: 'Order has been fully paid.',
    sortOrder: 30,
    isFinal: true,
  },
  {
    code: 'refunded',
    name: 'Refunded',
    description: 'Payment has been returned to the customer.',
    sortOrder: 40,
    isFinal: true,
  },
];

const deliveryStatuses = [
  {
    code: 'pending',
    name: 'Pending',
    description: 'Shipment has not been created yet.',
    sortOrder: 10,
    isTerminal: false,
  },
  {
    code: 'ready_to_ship',
    name: 'Ready To Ship',
    description: 'Order is ready for carrier handoff.',
    sortOrder: 20,
    isTerminal: false,
  },
  {
    code: 'in_transit',
    name: 'In Transit',
    description: 'Shipment is moving through the delivery network.',
    sortOrder: 30,
    isTerminal: false,
  },
  {
    code: 'delivered',
    name: 'Delivered',
    description: 'Shipment has been delivered.',
    sortOrder: 40,
    isTerminal: true,
  },
  {
    code: 'failed',
    name: 'Failed',
    description: 'Delivery attempt failed.',
    sortOrder: 50,
    isTerminal: true,
  },
  {
    code: 'returned',
    name: 'Returned',
    description: 'Shipment was returned back.',
    sortOrder: 60,
    isTerminal: true,
  },
];

const returnStatuses = [
  {
    code: 'requested',
    name: 'Requested',
    description: 'Customer has initiated a return.',
    sortOrder: 10,
    isTerminal: false,
  },
  {
    code: 'approved',
    name: 'Approved',
    description: 'Return has been approved for processing.',
    sortOrder: 20,
    isTerminal: false,
  },
  {
    code: 'received',
    name: 'Received',
    description: 'Returned goods have been received.',
    sortOrder: 30,
    isTerminal: false,
  },
  {
    code: 'refunded',
    name: 'Refunded',
    description: 'Refund has been issued to the customer.',
    sortOrder: 40,
    isTerminal: true,
  },
  {
    code: 'rejected',
    name: 'Rejected',
    description: 'Return request has been rejected.',
    sortOrder: 50,
    isTerminal: true,
  },
];

const financeCategories = [
  {
    code: 'sale_income',
    name: 'Sale Income',
    description: 'Income received from customer orders.',
    direction: 'INCOME',
    sortOrder: 10,
    isSystem: true,
  },
  {
    code: 'manager_salary',
    name: 'Manager Salary',
    description: 'Salary, commission, or other compensation paid to managers.',
    direction: 'EXPENSE',
    sortOrder: 20,
    isSystem: true,
  },
  {
    code: 'returns_loss',
    name: 'Returns Loss',
    description: 'Losses and refunds associated with returned orders.',
    direction: 'EXPENSE',
    sortOrder: 30,
    isSystem: true,
  },
  {
    code: 'advertising',
    name: 'Advertising',
    description: 'Marketing and paid traffic expenses.',
    direction: 'EXPENSE',
    sortOrder: 40,
    isSystem: true,
  },
  {
    code: 'taxes',
    name: 'Taxes',
    description: 'Tax payments and tax-related charges.',
    direction: 'EXPENSE',
    sortOrder: 50,
    isSystem: true,
  },
  {
    code: 'garage',
    name: 'Garage',
    description: 'Garage, storage, or workshop operational costs.',
    direction: 'EXPENSE',
    sortOrder: 60,
    isSystem: true,
  },
  {
    code: 'logistics',
    name: 'Logistics',
    description: 'Shipping, carrier, and related logistics expenses.',
    direction: 'EXPENSE',
    sortOrder: 70,
    isSystem: true,
  },
  {
    code: 'other_expense',
    name: 'Other Expense',
    description: 'Miscellaneous expenses outside standard categories.',
    direction: 'EXPENSE',
    sortOrder: 80,
    isSystem: true,
  },
  {
    code: 'manual_income_adjustment',
    name: 'Manual Income Adjustment',
    description: 'Manual positive income-side ledger adjustment.',
    direction: 'INCOME',
    sortOrder: 90,
    isSystem: true,
  },
  {
    code: 'manual_expense_adjustment',
    name: 'Manual Expense Adjustment',
    description: 'Manual negative expense-side ledger adjustment.',
    direction: 'EXPENSE',
    sortOrder: 100,
    isSystem: true,
  },
];

async function seedByCode(model, data) {
  for (const item of data) {
    await model.upsert({
      where: { code: item.code },
      update: item,
      create: item,
    });
  }
}

function resolveSaltRounds() {
  const parsed = Number(process.env.BCRYPT_SALT_ROUNDS ?? 12);

  if (!Number.isInteger(parsed) || parsed < 4) {
    return 12;
  }

  return parsed;
}

async function seedDefaultAdminUser() {
  const email = (process.env.SEED_ADMIN_EMAIL ?? DEFAULT_ADMIN_EMAIL).trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD ?? DEFAULT_ADMIN_PASSWORD;
  const phone = (process.env.SEED_ADMIN_PHONE ?? DEFAULT_ADMIN_PHONE).trim();
  const firstName = (process.env.SEED_ADMIN_FIRST_NAME ?? DEFAULT_ADMIN_FIRST_NAME).trim();
  const lastName = (process.env.SEED_ADMIN_LAST_NAME ?? DEFAULT_ADMIN_LAST_NAME).trim();
  const passwordHash = await bcrypt.hash(password, resolveSaltRounds());

  await prisma.user.upsert({
    where: { email },
    update: {
      roleCode: 'admin',
      firstName,
      lastName,
      phone,
      passwordHash,
      isActive: true,
    },
    create: {
      roleCode: 'admin',
      firstName,
      lastName,
      email,
      phone,
      passwordHash,
      isActive: true,
    },
  });

  console.log(`Seeded default admin user: ${email}`);
}

async function main() {
  await seedByCode(prisma.role, roles);
  await seedByCode(prisma.orderStatus, orderStatuses);
  await seedByCode(prisma.paymentStatus, paymentStatuses);
  await seedByCode(prisma.deliveryStatus, deliveryStatuses);
  await seedByCode(prisma.returnStatus, returnStatuses);
  await seedByCode(prisma.financeCategory, financeCategories);
  await seedDefaultAdminUser();
}

main()
  .catch((error) => {
    console.error('Prisma seed failed.');
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
