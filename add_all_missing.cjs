const fs = require('fs');
const path = 'src/i18n/translations.ts';
let content = fs.readFileSync(path, 'utf8');

const allMissingKeys = `
  // Missing AddCreditCardModal
  enterCardInfo: string;
  cardNameBank: string;
  cardType: string;
  last4Digits: string;
  cutoffDayLabel: string;
  everyMonth: string;
  lastPayment: string;
  cardTheme: string;
  saveCard: string;

  // Missing CreditCardPaymentModal
  enterCardPayment: string;
  currentTotalDebt: string;
  periodExpenses: string;
  paymentsMade: string;
  amountShortcuts: string;
  payAllDebt: string;
  periodNetDebt: string;
  paidAmount: string;
  paymentDate: string;
  note: string;
  savePayment: string;

  // Missing CreditCardsView
  totalCardDebts: string;
  totalAvailableLimit: string;
  noSavedCardsDesc: string;
  remainingLimit: string;
  limitUsage: string;
  daysLeft: string;
  paid: string;
  payDebt: string;

  // Missing DeleteCardConfirmModal
  irreversibleAction: string;
  cardDeleteWarning: string;
  cardHasTransactionRecords: string;
  whatToDoWithRecords: string;
  deleteAll: string;
  deleteAllDesc: string;

  // Missing EditCreditCardModal
  updateCardInfo: string;

  // Missing QuickAddExpense
  clear: string;
  returnToCurrentDate: string;
  chooseDifferentDate: string;
  delete: string;

  // Missing ReportsView
  customDateAnalysis: string;
  startDate: string;
  endDate: string;
  change: string;
  totalExpense: string;
  transactionsCount: string;
  paidCardDebt: string;
  cardClosingPayments: string;
  topCategory: string;
  share: string;
  categoryDistribution: string;
  noExpenseInPeriod: string;
  dailyExpenseTrend: string;
  showHistory: string;
  showDetails: string;
  noTransactionFound: string;
  unknown: string;
  paymentSourceDistribution: string;
  selectCustomDateRange: string;
  expenseAnalysisBetweenDates: string;
  showAnalysis: string;
  close: string;

  // Missing TransactionsView
  allTransactionTypes: string;
  tryChangingSearch: string;
  deleteConfirmTransaction: string;
  dateTime: string;
`;

const enDefaults = 
"  enterCardInfo: 'Enter Card Info', cardNameBank: 'Card Name', cardType: 'Card Type', last4Digits: 'Last 4 Digits', cutoffDayLabel: 'Cutoff Day', everyMonth: 'Every Month', lastPayment: 'Last Payment', cardTheme: 'Card Theme', saveCard: 'Save Card'," +
"  enterCardPayment: 'Enter Payment', currentTotalDebt: 'Current Total Debt', periodExpenses: 'Period Expenses', paymentsMade: 'Payments Made', amountShortcuts: 'Amount Shortcuts', payAllDebt: 'Pay All Debt', periodNetDebt: 'Period Net Debt', paidAmount: 'Paid Amount', paymentDate: 'Payment Date', note: 'Note', savePayment: 'Save Payment'," +
"  totalCardDebts: 'Total Card Debts', totalAvailableLimit: 'Total Available Limit', noSavedCardsDesc: 'No saved cards yet', remainingLimit: 'Remaining Limit', limitUsage: 'Limit Usage', daysLeft: 'Days Left', paid: 'Paid', payDebt: 'Pay Debt'," +
"  irreversibleAction: 'Irreversible Action', cardDeleteWarning: 'Card Delete Warning', cardHasTransactionRecords: 'Card has transaction records', whatToDoWithRecords: 'What to do with records?', deleteAll: 'Delete All', deleteAllDesc: 'Delete All Desc'," +
"  updateCardInfo: 'Update Card Info', clear: 'Clear', returnToCurrentDate: 'Return to current date', chooseDifferentDate: 'Choose different date', delete: 'Delete'," +
"  customDateAnalysis: 'Custom Date Analysis', startDate: 'Start Date', endDate: 'End Date', change: 'Change', totalExpense: 'Total Expense', transactionsCount: 'Transactions', paidCardDebt: 'Paid Card Debt', cardClosingPayments: 'Card Closing Payments', topCategory: 'Top Category', share: 'Share', categoryDistribution: 'Category Distribution', noExpenseInPeriod: 'No expense in period', dailyExpenseTrend: 'Daily Expense Trend', showHistory: 'Show History', showDetails: 'Show Details', noTransactionFound: 'No transactions found', unknown: 'Unknown', paymentSourceDistribution: 'Payment Source Distribution', selectCustomDateRange: 'Select Custom Date Range', expenseAnalysisBetweenDates: 'Expense Analysis Between Dates', showAnalysis: 'Show Analysis', close: 'Close'," +
"  allTransactionTypes: 'All Transaction Types', tryChangingSearch: 'Try changing search', deleteConfirmTransaction: 'Delete Transaction', dateTime: 'Date & Time',";

const lines = content.split('\\n');

function insertKeys() {
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('deleteAllCardRecordsDesc: string;')) {
      lines.splice(i + 1, 0, allMissingKeys);
      break;
    }
  }

  const langs = ['tr:', 'en:', 'es:', 'fr:', 'zh:', 'hi:'];
  for (const lang of langs) {
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(lang + ' {')) {
        let j = i;
        while (!lines[j].includes('deleteAllCardRecordsDesc:')) j++;
        lines.splice(j + 1, 0, enDefaults);
        i = j + 1; // skip forward
      }
    }
  }
}

insertKeys();
fs.writeFileSync(path, lines.join('\\n'), 'utf8');
console.log("Done");
