const fs = require('fs');

const path = 'src/i18n/translations.ts';
let content = fs.readFileSync(path, 'utf8');

const keysToAdd = `
  // Notifications
  notifications: string;
  notificationsEnabled: string;
  notificationsDisabled: string;
  notificationFrequency: string;
  notificationTime: string;
  daily: string;
  weekly: string;
  monthly: string;
  browserPermissionRequired: string;
  notificationTestTitle: string;
  notificationTestBody: string;
`;

const trToAdd = `
    // Notifications
    notifications: 'Bildirimler',
    notificationsEnabled: 'Bildirimler Açık',
    notificationsDisabled: 'Bildirimler Kapalı',
    notificationFrequency: 'Sıklık',
    notificationTime: 'Zaman',
    daily: 'Her Gün',
    weekly: 'Her Hafta',
    monthly: 'Her Ay',
    browserPermissionRequired: 'Tarayıcı bildirimleri için izin vermeniz gerekiyor.',
    notificationTestTitle: 'Bildirim Testi',
    notificationTestBody: 'Bütçem bildirimleri başarıyla aktif edildi!',
`;

const enToAdd = `
    // Notifications
    notifications: 'Notifications',
    notificationsEnabled: 'Notifications Enabled',
    notificationsDisabled: 'Notifications Disabled',
    notificationFrequency: 'Frequency',
    notificationTime: 'Time',
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    browserPermissionRequired: 'You need to grant permission for browser notifications.',
    notificationTestTitle: 'Notification Test',
    notificationTestBody: 'Bütçem notifications successfully activated!',
`;

const esToAdd = `
    // Notifications
    notifications: 'Notificaciones',
    notificationsEnabled: 'Notificaciones Habilitadas',
    notificationsDisabled: 'Notificaciones Deshabilitadas',
    notificationFrequency: 'Frecuencia',
    notificationTime: 'Hora',
    daily: 'Diario',
    weekly: 'Semanal',
    monthly: 'Mensual',
    browserPermissionRequired: 'Debe otorgar permiso para las notificaciones del navegador.',
    notificationTestTitle: 'Prueba de Notificación',
    notificationTestBody: '¡Las notificaciones de Bütçem se han activado con éxito!',
`;

const frToAdd = `
    // Notifications
    notifications: 'Notifications',
    notificationsEnabled: 'Notifications Activées',
    notificationsDisabled: 'Notifications Désactivées',
    notificationFrequency: 'Fréquence',
    notificationTime: 'Heure',
    daily: 'Quotidien',
    weekly: 'Hebdomadaire',
    monthly: 'Mensuel',
    browserPermissionRequired: 'Vous devez accorder l\\'autorisation pour les notifications du navigateur.',
    notificationTestTitle: 'Test de Notification',
    notificationTestBody: 'Les notifications de Bütçem ont été activées avec succès !',
`;

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

content = content.replace(/(deleteAllCardRecordsDesc: string;\\s*)/, '$1' + keysToAdd);

content = content.replace(/(deleteAllCardRecordsDesc: 'Kart ve tüm harcama kayıtları silinir.',\\s*)/, '$1' + trToAdd);
content = content.replace(/(deleteAllCardRecordsDesc: 'Card and all expense records will be deleted.',\\s*)/, '$1' + enToAdd);
content = content.replace(/(deleteAllCardRecordsDesc: 'La tarjeta y todos los registros serán eliminados.',\\s*)/, '$1' + esToAdd);
content = content.replace(/(deleteAllCardRecordsDesc: 'La carte et tous les enregistrements seront supprimés.',\\s*)/, '$1' + frToAdd);
content = content.replace(/(deleteAllCardRecordsDesc: '卡和所有支出记录将被删除。',\\s*)/, '$1' + zhToAdd);
content = content.replace(/(deleteAllCardRecordsDesc: 'कार्ड और सभी व्यय रिकॉर्ड हटा दिए जाएंगे।',\\s*)/, '$1' + hiToAdd);

fs.writeFileSync(path, content, 'utf8');
