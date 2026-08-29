const fs = require('fs');
const path = 'src/i18n/translations.ts';
let content = fs.readFileSync(path, 'utf8');

const enDefaults = {
  enterCardInfo: 'Enter Card Info', cardNameBank: 'Card Name', cardType: 'Card Type', last4Digits: 'Last 4 Digits', cutoffDayLabel: 'Cutoff Day', everyMonth: 'Every Month', lastPayment: 'Last Payment', cardTheme: 'Card Theme', saveCard: 'Save Card',
  enterCardPayment: 'Enter Payment', currentTotalDebt: 'Current Total Debt', periodExpenses: 'Period Expenses', paymentsMade: 'Payments Made', amountShortcuts: 'Amount Shortcuts', payAllDebt: 'Pay All Debt', periodNetDebt: 'Period Net Debt', paidAmount: 'Paid Amount', paymentDate: 'Payment Date', note: 'Note', savePayment: 'Save Payment',
  totalCardDebts: 'Total Card Debts', totalAvailableLimit: 'Total Available Limit', noSavedCardsDesc: 'No saved cards yet', remainingLimit: 'Remaining Limit', limitUsage: 'Limit Usage', daysLeft: 'Days Left', paid: 'Paid', payDebt: 'Pay Debt',
  irreversibleAction: 'Irreversible Action', cardDeleteWarning: 'Card Delete Warning', cardHasTransactionRecords: 'Card has transaction records', whatToDoWithRecords: 'What to do with records?', deleteAll: 'Delete All', deleteAllDesc: 'Delete All Desc',
  updateCardInfo: 'Update Card Info', clear: 'Clear', returnToCurrentDate: 'Return to current date', chooseDifferentDate: 'Choose different date', delete: 'Delete',
  customDateAnalysis: 'Custom Date Analysis', startDate: 'Start Date', endDate: 'End Date', change: 'Change', totalExpense: 'Total Expense', transactionsCount: 'Transactions', paidCardDebt: 'Paid Card Debt', cardClosingPayments: 'Card Closing Payments', topCategory: 'Top Category', share: 'Share', categoryDistribution: 'Category Distribution', noExpenseInPeriod: 'No expense in period', dailyExpenseTrend: 'Daily Expense Trend', showHistory: 'Show History', showDetails: 'Show Details', noTransactionFound: 'No transactions found', unknown: 'Unknown', paymentSourceDistribution: 'Payment Source Distribution', selectCustomDateRange: 'Select Custom Date Range', expenseAnalysisBetweenDates: 'Expense Analysis Between Dates', showAnalysis: 'Show Analysis', close: 'Close',
  allTransactionTypes: 'All Transaction Types', tryChangingSearch: 'Try changing search', deleteConfirmTransaction: 'Delete Transaction', dateTime: 'Date & Time',
  notifications: 'Notifications', notificationsEnabled: 'Notifications Enabled', notificationsDisabled: 'Notifications Disabled', notificationFrequency: 'Frequency', notificationTime: 'Time', daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', browserPermissionRequired: 'Browser Permission Required', notificationTestTitle: 'Notification Test', notificationTestBody: 'Test Body'
};

const keysString = '\\n' + Object.entries(enDefaults).map(function(kv) { return "    " + kv[0] + ": '" + kv[1] + "',"; }).join('\\n') + '\\n  },';

// A more robust replacement: look for "deleteAllCardRecordsDesc: '...'," and insert right after it
content = content.replace(/(deleteAllCardRecordsDesc:\s*'.*?',)/g, "$1" + '\\n' + keysString.replace('  },', ''));

// For interface TranslationKeys
const interfaceKeysString = '\\n' + Object.keys(enDefaults).map(function(k) { return "  " + k + ": string;"; }).join('\\n') + '\\n  // End';
content = content.replace(/(deleteAllCardRecordsDesc:\s*string;)/g, "$1" + interfaceKeysString);

fs.writeFileSync(path, content, 'utf8');
console.log("Successfully injected keys securely.");
