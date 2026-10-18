import Papa from 'papaparse';

// Keyword-based auto-categorization
const CATEGORY_RULES = [
  { category: 'Groceries', keywords: ['walmart', 'kroger', 'safeway', 'whole foods', 'trader joe', 'costco', 'aldi', 'publix', 'wegmans', 'sprouts', 'grocery', 'market', 'food lion', 'stop & shop', 'meijer', 'h-e-b'] },
  { category: 'Dining', keywords: ['restaurant', 'mcdonald', 'starbucks', 'chipotle', 'subway', 'domino', 'pizza', 'taco bell', 'burger', 'diner', 'cafe', 'coffee', 'sushi', 'doordash', 'grubhub', 'uber eats', 'postmates', 'instacart'] },
  { category: 'Transport', keywords: ['uber', 'lyft', 'taxi', 'gas', 'shell', 'bp ', 'chevron', 'exxon', 'mobil', 'speedway', 'wawa', 'parking', 'toll', 'transit', 'metro', 'amtrak', 'airline', 'delta', 'united', 'southwest', 'american air', 'jetblue'] },
  { category: 'Shopping', keywords: ['amazon', 'target', 'best buy', 'apple store', 'macy', 'nordstrom', 'tj maxx', 'marshalls', 'gap', 'zara', 'h&m', 'nike', 'ebay', 'etsy', 'wayfair', 'ikea', 'home depot', 'lowes'] },
  { category: 'Entertainment', keywords: ['netflix', 'spotify', 'hulu', 'disney', 'hbo', 'apple tv', 'youtube', 'twitch', 'steam', 'playstation', 'xbox', 'cinema', 'movie', 'theater', 'concert', 'ticketmaster', 'stubhub', 'amc'] },
  { category: 'Health', keywords: ['pharmacy', 'cvs', 'walgreens', 'rite aid', 'doctor', 'dental', 'vision', 'hospital', 'clinic', 'gym', 'fitness', 'planet fitness', 'anytime fitness', 'health', 'medical', 'urgent care'] },
  { category: 'Utilities', keywords: ['electric', 'water bill', 'gas bill', 'internet', 'phone', 'verizon', 'at&t', 'tmobile', 't-mobile', 'comcast', 'xfinity', 'spectrum', 'cable', 'insurance'] },
  { category: 'Travel', keywords: ['hotel', 'airbnb', 'marriott', 'hilton', 'expedia', 'booking.com', 'vrbo', 'resort', 'airfare'] },
  { category: 'Personal Care', keywords: ['salon', 'barber', 'spa', 'nail', 'haircut', 'beauty', 'sephora', 'ulta'] },
  { category: 'Education', keywords: ['tuition', 'udemy', 'coursera', 'textbook', 'school', 'university', 'college', 'library'] },
];

export function categorize(description) {
  if (!description) return 'Other';
  const lower = description.toLowerCase();
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some(kw => lower.includes(kw))) {
      return rule.category;
    }
  }
  return 'Other';
}

// Normalize various bank CSV formats into a standard shape:
// { id, date, description, amount, category }
function normalizeRow(row, index) {
  const keys = Object.keys(row).map(k => k.trim().toLowerCase());
  const get = (...candidates) => {
    for (const c of candidates) {
      const k = keys.find(k => k.includes(c));
      if (k !== undefined) return String(Object.values(row)[keys.indexOf(k)] || '').trim();
    }
    return '';
  };

  // Date
  const dateRaw = get('date', 'transaction date', 'post date', 'posted');

  // Description / merchant
  const description = get('description', 'merchant', 'memo', 'payee', 'name', 'transaction');

  // Amount — handle debit/credit split columns (Chase, BoA) or single amount column
  let amount = 0;
  const debitRaw = get('debit', 'withdrawal', 'charge');
  const creditRaw = get('credit', 'deposit', 'payment');
  const amountRaw = get('amount', 'transaction amount');

  if (debitRaw || creditRaw) {
    // Separate debit/credit columns: debits are expenses (positive), credits are refunds/payments (negative)
    const debit = parseFloat(debitRaw.replace(/[$,]/g, '')) || 0;
    const credit = parseFloat(creditRaw.replace(/[$,]/g, '')) || 0;
    amount = debit - credit;
  } else if (amountRaw) {
    // Single amount column — credit card CSVs often use negative = expense
    const parsed = parseFloat(amountRaw.replace(/[$,]/g, ''));
    // If negative means expense (Chase/Amex style), flip sign
    amount = isNaN(parsed) ? 0 : -parsed;
  }

  if (!dateRaw || isNaN(amount)) return null;

  return {
    id: index,
    date: new Date(dateRaw),
    dateStr: dateRaw,
    description,
    amount: parseFloat(amount.toFixed(2)),
    category: categorize(description),
  };
}

export function parseCSV(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: ({ data, errors }) => {
        if (errors.length && !data.length) {
          reject(new Error('Could not parse CSV file.'));
          return;
        }
        const transactions = data
          .map((row, i) => normalizeRow(row, i))
          .filter(t => t !== null && t.amount > 0) // only expenses
          .sort((a, b) => b.date - a.date);
        resolve(transactions);
      },
      error: reject,
    });
  });
}

export function summarizeByCategory(transactions) {
  const totals = {};
  for (const t of transactions) {
    totals[t.category] = (totals[t.category] || 0) + t.amount;
  }
  return totals;
}

export const ALL_CATEGORIES = [
  'Groceries', 'Dining', 'Transport', 'Shopping', 'Entertainment',
  'Health', 'Utilities', 'Travel', 'Personal Care', 'Education', 'Other',
];
