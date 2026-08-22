import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Purchase {
  id: string;
  item_name: string;
  category: string;
  price: number;
  quantity: string | null;
  purchased_at: string;
}

export interface MonthBucket {
  key: string; // YYYY-MM
  label: string; // e.g. "Aug"
  total: number;
  count: number;
}

export function formatRand(value: number) {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    maximumFractionDigits: 2,
  }).format(value || 0);
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function useBudget(monthsBack = 6) {
  const { profile } = useAuth();
  const householdId = profile?.household_id;
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPurchases = useCallback(async () => {
    if (!householdId) return;
    const since = new Date();
    since.setMonth(since.getMonth() - (monthsBack - 1));
    since.setDate(1);
    since.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('purchases')
      .select('id, item_name, category, price, quantity, purchased_at')
      .eq('household_id', householdId)
      .gte('purchased_at', since.toISOString())
      .order('purchased_at', { ascending: false });

    if (error) {
      console.error('Error loading purchases:', error);
      setLoading(false);
      return;
    }

    setPurchases(
      (data ?? []).map((p: any) => ({
        ...p,
        price: Number(p.price) || 0,
      })),
    );
    setLoading(false);
  }, [householdId, monthsBack]);

  useEffect(() => {
    if (!householdId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchPurchases();
  }, [householdId, fetchPurchases]);

  // Build a bucket per month, oldest first, including empty months.
  const months: MonthBucket[] = [];
  const cursor = new Date();
  cursor.setDate(1);
  cursor.setMonth(cursor.getMonth() - (monthsBack - 1));
  for (let i = 0; i < monthsBack; i++) {
    const key = monthKey(cursor);
    months.push({
      key,
      label: cursor.toLocaleDateString('en-ZA', { month: 'short' }),
      total: 0,
      count: 0,
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  const byCategory = new Map<string, number>();
  const thisMonth = monthKey(new Date());

  for (const p of purchases) {
    const key = monthKey(new Date(p.purchased_at));
    const bucket = months.find((m) => m.key === key);
    if (bucket) {
      bucket.total += p.price;
      bucket.count += 1;
    }
    if (key === thisMonth) {
      byCategory.set(p.category, (byCategory.get(p.category) ?? 0) + p.price);
    }
  }

  const currentMonth = months.find((m) => m.key === thisMonth) ?? { total: 0, count: 0 };
  const previous = months[months.length - 2];
  const changePct =
    previous && previous.total > 0
      ? ((currentMonth.total - previous.total) / previous.total) * 100
      : null;

  const topCategories = [...byCategory.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([category, total]) => ({ category, total }));

  return {
    purchases,
    loading,
    months,
    monthTotal: currentMonth.total,
    monthCount: currentMonth.count,
    changePct,
    topCategories,
    refresh: fetchPurchases,
  };
}
