const fs = require('fs');
const path = 'src/i18n/translations.ts';
let content = fs.readFileSync(path, 'utf8');

let lines = content.split('\\n');

// 1. Truncate file at line 1537 to remove garbage
lines = lines.slice(0, 1538);

// 2. We need to add the missing properties to every language block to fix TS2740.
// Let's find the closing brace of each language block.
const enDefaults = {
  enterCardInfo: 'Enter Card Info', cardNameBank: 'Card Name', cardType: 'Card Type', last4Digits: 'Last 4 Digits', cutoffDayLabel: 'Cutoff Day', everyMonth: 'Every Month', lastPayment: 'Last Payment', cardTheme: 'Card Theme', saveCard: 'Save Card',
  enterCardPayment: 'Enter Payment', currentTotalDebt: 'Current Total Debt', periodExpenses: 'Period Expenses', paymentsMade: 'Payments Made', amountShortcuts: 'Amount Shortcuts', payAllDebt: 'Pay All Debt', periodNetDebt: 'Period Net Debt', paidAmount: 'Paid Amount', paymentDate: 'Payment Date', note: 'Note', savePayment: 'Save Payment',
  totalCardDebts: 'Total Card Debts', totalAvailableLimit: 'Total Available Limit', noSavedCardsDesc: 'No saved cards yet', remainingLimit: 'Remaining Limit', limitUsage: 'Limit Usage', daysLeft: 'Days Left', paid: 'Paid', payDebt: 'Pay Debt',
  irreversibleAction: 'Irreversible Action', cardDeleteWarning: 'Card Delete Warning', cardHasTransactionRecords: 'Card has transaction records', whatToDoWithRecords: 'What to do with records?', deleteAll: 'Delete All', deleteAllDesc: 'Delete All Desc',
  updateCardInfo: 'Update Card Info', clear: 'Clear', returnToCurrentDate: 'Return to current date', chooseDifferentDate: 'Choose different date', delete: 'Delete',
  customDateAnalysis: 'Custom Date Analysis', startDate: 'Start Date', endDate: 'End Date', change: 'Change', totalExpense: 'Total Expense', transactionsCount: 'Transactions', paidCardDebt: 'Paid Card Debt', cardClosingPayments: 'Card Closing Payments', topCategory: 'Top Category', share: 'Share', categoryDistribution: 'Category Distribution', noExpenseInPeriod: 'No expense in period', dailyExpenseTrend: 'Daily Expense Trend', showHistory: 'Show History', showDetails: 'Show Details', noTransactionFound: 'No transactions found', unknown: 'Unknown', paymentSourceDistribution: 'Payment Source Distribution', selectCustomDateRange: 'Select Custom Date Range', expenseAnalysisBetweenDates: 'Expense Analysis Between Dates', showAnalysis: 'Show Analysis', close: 'Close',
  allTransactionTypes: 'All Transaction Types', tryChangingSearch: 'Try changing search', deleteConfirmTransaction: 'Delete Transaction', dateTime: 'Date & Time'
};

const keysString = Object.entries(enDefaults).map(function(kv) { return "    " + kv[0] + ": '" + kv[1] + "',"; }).join('\\n');

// Find all occurrences of "deleteAllCardRecordsDesc: " in the file
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('deleteAllCardRecordsDesc: ') && lines[i].includes(',')) {
    // This is inside a language block
    lines.splice(i + 1, 0, keysString);
    i += Object.keys(enDefaults).length; // skip added lines
  }
}

// 3. Make sure the interface TranslationKeys has all these keys.
// The interface ended with "deleteAllCardRecordsDesc: string;"
const interfaceKeysString = Object.keys(enDefaults).map(function(k) { return "  " + k + ": string;"; }).join('\\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i] === '  deleteAllCardRecordsDesc: string;') {
    // We replace it with itself + new keys to make sure they are in the interface
    lines.splice(i + 1, 0, interfaceKeysString);
    break;
  }
}

fs.writeFileSync(path, lines.join('\\n'), 'utf8');
console.log("Repaired successfully.");
