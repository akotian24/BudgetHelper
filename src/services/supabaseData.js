import { getSupabaseClientOrThrow } from '../lib/supabaseClient';

function toBudgetObject(row) {
  if (!row) return {};
  const mapped = {};
  if (typeof row.total_budget === 'number') {
    mapped.total = row.total_budget;
  }
  if (row.category_limits && typeof row.category_limits === 'object') {
    for (const [key, value] of Object.entries(row.category_limits)) {
      if (typeof value === 'number') {
        mapped[key] = value;
      }
    }
  }
  return mapped;
}

export async function fetchLatestBudget(userId) {
  const client = getSupabaseClientOrThrow();
  const { data, error } = await client
    .from('budgets')
    .select('total_budget, category_limits')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load budget: ${error.message}`);
  }
  return toBudgetObject(data);
}

export async function saveBudget(userId, budgets) {
  const client = getSupabaseClientOrThrow();
  const categoryLimits = {};

  for (const [key, value] of Object.entries(budgets)) {
    if (key === 'total') continue;
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
      categoryLimits[key] = value;
    }
  }

  const payload = {
    user_id: userId,
    period_type: 'monthly',
    total_budget: typeof budgets.total === 'number' ? budgets.total : 0,
    category_limits: categoryLimits,
  };

  const { error } = await client.from('budgets').insert(payload);
  if (error) {
    throw new Error(`Failed to save budget: ${error.message}`);
  }
}

function rowToTransaction(row) {
  return {
    id: row.id,
    date: new Date(row.transaction_date),
    dateStr: row.transaction_date,
    description: row.description || '',
    amount: Number(row.amount),
    category: row.category || 'Other',
  };
}

export async function fetchTransactions(userId) {
  const client = getSupabaseClientOrThrow();
  const { data, error } = await client
    .from('transactions')
    .select('id, transaction_date, description, amount, category')
    .eq('user_id', userId)
    .order('transaction_date', { ascending: false });

  if (error) {
    throw new Error(`Failed to load transactions: ${error.message}`);
  }

  return (data || []).map(rowToTransaction);
}

export async function replaceTransactions(userId, transactions) {
  const client = getSupabaseClientOrThrow();
  const { error: deleteError } = await client.from('transactions').delete().eq('user_id', userId);

  if (deleteError) {
    throw new Error(`Failed to clear existing transactions: ${deleteError.message}`);
  }

  if (!transactions.length) return;

  const rows = transactions.map(tx => ({
    user_id: userId,
    transaction_date: tx.date.toISOString().slice(0, 10),
    description: tx.description || '',
    amount: tx.amount,
    category: tx.category || 'Other',
    spend_type: 'individual',
    split_type: 'none',
    group_size: null,
    my_share_amount: tx.amount,
  }));

  const { error: insertError } = await client.from('transactions').insert(rows);
  if (insertError) {
    throw new Error(`Failed to save transactions: ${insertError.message}`);
  }
}

export async function updateTransactionCategory(transactionId, category) {
  const client = getSupabaseClientOrThrow();
  const { error } = await client
    .from('transactions')
    .update({ category })
    .eq('id', transactionId);

  if (error) {
    throw new Error(`Failed to update category: ${error.message}`);
  }
}
