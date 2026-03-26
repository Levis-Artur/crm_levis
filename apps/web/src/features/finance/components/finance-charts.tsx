'use client';

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { getFinanceCategoryLabel, t } from '@/lib/i18n';
import type {
  AdminFinanceSummary,
  ManagerFinanceEarningsChartPoint,
} from '../types';

const CATEGORY_COLORS = ['#0f766e', '#2563eb', '#d97706', '#dc2626', '#7c3aed', '#65a30d', '#475569'];

export function ManagerEarningsChart({
  data,
}: {
  data: ManagerFinanceEarningsChartPoint[];
}) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">{t.finance.charts.noManagerEarnings}</p>;
  }

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="period" fontSize={12} />
          <YAxis fontSize={12} />
          <Tooltip />
          <Legend />
          <Bar dataKey="earnings" name={t.finance.charts.earnings} fill="#0f766e" radius={[8, 8, 0, 0]} />
          <Bar dataKey="margin" name={t.finance.charts.margin} fill="#2563eb" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AdminIncomeExpenseChart({
  data,
}: {
  data: AdminFinanceSummary['charts']['monthlyCashflow'];
}) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">{t.finance.charts.noFinanceTransactions}</p>;
  }

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="period" fontSize={12} />
          <YAxis fontSize={12} />
          <Tooltip />
          <Legend />
          <Area
            type="monotone"
            dataKey="income"
            name={t.finance.charts.income}
            stroke="#0f766e"
            fill="#99f6e4"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="expense"
            name={t.finance.charts.expense}
            stroke="#dc2626"
            fill="#fecaca"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AdminExpenseBreakdownChart({
  data,
}: {
  data: AdminFinanceSummary['charts']['expenseByCategory'];
}) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">{t.finance.charts.noExpenseTransactions}</p>;
  }

  const localizedData = data.map((entry) => ({
    ...entry,
    label: getFinanceCategoryLabel(entry.categoryCode),
  }));

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={localizedData} layout="vertical" margin={{ left: 16 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" fontSize={12} />
          <YAxis type="category" dataKey="label" width={120} fontSize={12} />
          <Tooltip />
          <Bar dataKey="amount" name={t.finance.charts.expense} radius={[0, 8, 8, 0]}>
            {localizedData.map((entry, index) => (
              <Cell key={entry.categoryCode} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
