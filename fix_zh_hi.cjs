const fs = require('fs');
const path = 'src/i18n/translations.ts';
let content = fs.readFileSync(path, 'utf8');

const zhToAdd = `
    // Notifications
    notifications: '通知',
    notificationsEnabled: '通知已启用',
    notificationsDisabled: '通知已禁用',
    notificationFrequency: '频率',
    notificationTime: '时间',
    daily: '每天',
    weekly: '每周',
    monthly: '每月',
    browserPermissionRequired: '您需要授予浏览器通知权限。',
    notificationTestTitle: '通知测试',
    notificationTestBody: 'Bütçem通知已成功激活！',
`;

const hiToAdd = `
    // Notifications
    notifications: 'सूचनाएं',
    notificationsEnabled: 'सूचनाएं सक्षम',
    notificationsDisabled: 'सूचनाएं अक्षम',
    notificationFrequency: 'आवृत्ति',
    notificationTime: 'समय',
    daily: 'दैनिक',
    weekly: 'साप्ताहिक',
    monthly: 'मासिक',
    browserPermissionRequired: 'आपको ब्राउज़र सूचनाओं के लिए अनुमति देनी होगी।',
    notificationTestTitle: 'सूचना परीक्षण',
    notificationTestBody: 'Bütçem सूचनाएं सफलतापूर्वक सक्रिय हो गईं!',
`;

let lines = content.split('\n');
let zhDone = false;
let hiDone = false;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('zh: {')) {
    // find end of zh block
    let j = i;
    while (!lines[j].includes('deleteAllCardRecordsDesc:')) j++;
    lines.splice(j + 1, 0, zhToAdd);
    zhDone = true;
    i = j + 1;
  }
  if (lines[i].includes('hi: {')) {
    // find end of hi block
    let j = i;
    while (!lines[j].includes('deleteAllCardRecordsDesc:')) j++;
    lines.splice(j + 1, 0, hiToAdd);
    hiDone = true;
    i = j + 1;
  }
}

fs.writeFileSync(path, lines.join('\n'), 'utf8');
console.log("Done");
