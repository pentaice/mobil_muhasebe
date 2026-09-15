package com.cebim.muhasebe;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.widget.RemoteViews;
import android.widget.Toast;

import org.json.JSONArray;
import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.TimeZone;

public class QuickExpenseWidgetProvider extends AppWidgetProvider {

    public static final String PREFS_NAME = "cebim_widget_prefs";
    public static final String KEY_DRAFT_AMOUNT = "widget_draft_amount";
    public static final String KEY_METHOD = "widget_selected_method";
    public static final String KEY_CAT_INDEX = "widget_selected_cat_index";
    public static final String KEY_PENDING_TXS = "widget_pending_transactions";

    // Category keys
    public static final String KEY_CAT1_ID = "widget_cat1_id";
    public static final String KEY_CAT1_NAME = "widget_cat1_name";
    public static final String KEY_CAT2_ID = "widget_cat2_id";
    public static final String KEY_CAT2_NAME = "widget_cat2_name";
    public static final String KEY_CAT3_ID = "widget_cat3_id";
    public static final String KEY_CAT3_NAME = "widget_cat3_name";
    public static final String KEY_CAT4_ID = "widget_cat4_id";
    public static final String KEY_CAT4_NAME = "widget_cat4_name";

    // Intent Actions
    public static final String ACTION_DIGIT = "com.cebim.muhasebe.WIDGET_DIGIT";
    public static final String ACTION_DOT = "com.cebim.muhasebe.WIDGET_DOT";
    public static final String ACTION_BACKSPACE = "com.cebim.muhasebe.WIDGET_BACKSPACE";
    public static final String ACTION_CLEAR = "com.cebim.muhasebe.WIDGET_CLEAR";
    public static final String ACTION_PRESET = "com.cebim.muhasebe.WIDGET_PRESET";
    public static final String ACTION_METHOD = "com.cebim.muhasebe.WIDGET_METHOD";
    public static final String ACTION_CATEGORY = "com.cebim.muhasebe.WIDGET_CATEGORY";
    public static final String ACTION_SAVE = "com.cebim.muhasebe.WIDGET_SAVE";
    public static final String ACTION_OPEN_APP = "com.cebim.muhasebe.WIDGET_OPEN_APP";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        updateAllWidgets(context);
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);

        String action = intent.getAction();
        if (action == null) return;

        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String currentAmount = prefs.getString(KEY_DRAFT_AMOUNT, "0");

        if (ACTION_DIGIT.equals(action)) {
            String digit = intent.getStringExtra("digit");
            if (digit != null) {
                if (currentAmount.equals("0")) {
                    currentAmount = digit;
                } else if (currentAmount.length() < 8) {
                    currentAmount += digit;
                }
                prefs.edit().putString(KEY_DRAFT_AMOUNT, currentAmount).apply();
                updateAllWidgets(context);
            }
        } else if (ACTION_DOT.equals(action)) {
            if (!currentAmount.contains(".")) {
                currentAmount = currentAmount + ".";
                prefs.edit().putString(KEY_DRAFT_AMOUNT, currentAmount).apply();
                updateAllWidgets(context);
            }
        } else if (ACTION_BACKSPACE.equals(action)) {
            if (currentAmount.length() > 1) {
                currentAmount = currentAmount.substring(0, currentAmount.length() - 1);
            } else {
                currentAmount = "0";
            }
            prefs.edit().putString(KEY_DRAFT_AMOUNT, currentAmount).apply();
            updateAllWidgets(context);
        } else if (ACTION_CLEAR.equals(action)) {
            prefs.edit().putString(KEY_DRAFT_AMOUNT, "0").apply();
            updateAllWidgets(context);
        } else if (ACTION_PRESET.equals(action)) {
            int addValue = intent.getIntExtra("amount", 0);
            double val = 0;
            try {
                val = Double.parseDouble(currentAmount);
            } catch (Exception ignored) {}
            val += addValue;
            if (val % 1 == 0) {
                currentAmount = String.valueOf((long) val);
            } else {
                currentAmount = String.valueOf(val);
            }
            prefs.edit().putString(KEY_DRAFT_AMOUNT, currentAmount).apply();
            updateAllWidgets(context);
        } else if (ACTION_METHOD.equals(action)) {
            String method = intent.getStringExtra("method");
            if (method != null) {
                prefs.edit().putString(KEY_METHOD, method).apply();
                updateAllWidgets(context);
            }
        } else if (ACTION_CATEGORY.equals(action)) {
            int catIndex = intent.getIntExtra("cat_index", 1);
            prefs.edit().putInt(KEY_CAT_INDEX, catIndex).apply();
            updateAllWidgets(context);
        } else if (ACTION_SAVE.equals(action)) {
            handleSaveExpense(context, prefs);
        } else if (ACTION_OPEN_APP.equals(action)) {
            Intent launchIntent = new Intent(context, MainActivity.class);
            launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            context.startActivity(launchIntent);
        }
    }

    private void handleSaveExpense(Context context, SharedPreferences prefs) {
        String amountStr = prefs.getString(KEY_DRAFT_AMOUNT, "0");
        double amount = 0;
        try {
            amount = Double.parseDouble(amountStr);
        } catch (Exception ignored) {}

        if (amount <= 0) {
            Toast.makeText(context, "Lütfen bir harcama tutarı girin", Toast.LENGTH_SHORT).show();
            return;
        }

        int catIndex = prefs.getInt(KEY_CAT_INDEX, 1);
        String method = prefs.getString(KEY_METHOD, "credit_card");

        String catId = getCategoryData(prefs, catIndex, true);
        String catName = getCategoryData(prefs, catIndex, false);

        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
        sdf.setTimeZone(TimeZone.getTimeZone("UTC"));
        String nowIso = sdf.format(new Date());

        try {
            JSONObject tx = new JSONObject();
            tx.put("id", "tx-widget-" + System.currentTimeMillis() + "-" + ((int) (Math.random() * 9000) + 1000));
            tx.put("type", "expense");
            tx.put("amount", amount);
            tx.put("categoryId", catId);
            tx.put("categoryName", catName);
            tx.put("sourceType", method);
            tx.put("date", nowIso);
            tx.put("createdAt", nowIso);
            tx.put("note", "Widget ile eklendi");

            String pendingJson = prefs.getString(KEY_PENDING_TXS, "[]");
            JSONArray pendingArray = new JSONArray(pendingJson);
            pendingArray.put(tx);

            prefs.edit()
                .putString(KEY_PENDING_TXS, pendingArray.toString())
                .putString(KEY_DRAFT_AMOUNT, "0")
                .apply();

            String methodLabel = "credit_card".equals(method) ? "Kart" : "Nakit";
            String formattedAmount = (amount % 1 == 0) ? String.valueOf((long) amount) : String.format(Locale.US, "%.2f", amount);
            String successMsg = formattedAmount + " ₺ " + catName + " (" + methodLabel + ") kaydedildi!";

            Toast.makeText(context, successMsg, Toast.LENGTH_LONG).show();

            updateAllWidgets(context);
        } catch (Exception e) {
            Toast.makeText(context, "Harcama kaydedilirken hata oluştu", Toast.LENGTH_SHORT).show();
        }
    }

    private String getCategoryData(SharedPreferences prefs, int index, boolean returnId) {
        if (index == 1) {
            return returnId ? prefs.getString(KEY_CAT1_ID, "cat-yemek") : prefs.getString(KEY_CAT1_NAME, "Yemek");
        } else if (index == 2) {
            return returnId ? prefs.getString(KEY_CAT2_ID, "cat-market") : prefs.getString(KEY_CAT2_NAME, "Market");
        } else if (index == 3) {
            return returnId ? prefs.getString(KEY_CAT3_ID, "cat-tatli-kahve") : prefs.getString(KEY_CAT3_NAME, "Kahve");
        } else {
            return returnId ? prefs.getString(KEY_CAT4_ID, "cat-ulasim") : prefs.getString(KEY_CAT4_NAME, "Ulaşım");
        }
    }

    public static void updateAllWidgets(Context context) {
        AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
        ComponentName componentName = new ComponentName(context, QuickExpenseWidgetProvider.class);
        int[] appWidgetIds = appWidgetManager.getAppWidgetIds(componentName);

        if (appWidgetIds == null || appWidgetIds.length == 0) return;

        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String draftAmount = prefs.getString(KEY_DRAFT_AMOUNT, "0");
        String currentMethod = prefs.getString(KEY_METHOD, "credit_card");
        int currentCatIndex = prefs.getInt(KEY_CAT_INDEX, 1);

        String cat1Name = prefs.getString(KEY_CAT1_NAME, "Yemek");
        String cat2Name = prefs.getString(KEY_CAT2_NAME, "Market");
        String cat3Name = prefs.getString(KEY_CAT3_NAME, "Kahve");
        String cat4Name = prefs.getString(KEY_CAT4_NAME, "Ulaşım");

        for (int widgetId : appWidgetIds) {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_quick_expense);

            // Amount display
            views.setTextViewText(R.id.tv_amount, draftAmount + " ₺");

            // Open app click
            views.setOnClickPendingIntent(R.id.tv_widget_title, createPendingIntent(context, ACTION_OPEN_APP, 100));

            // Method buttons styling & intent
            boolean isCard = "credit_card".equals(currentMethod);
            views.setInt(R.id.btn_method_card, "setBackgroundResource", isCard ? R.drawable.widget_btn_active : R.drawable.widget_btn_bg);
            views.setTextColor(R.id.btn_method_card, isCard ? 0xFFFFFFFF : 0xFF94A3B8);

            views.setInt(R.id.btn_method_cash, "setBackgroundResource", !isCard ? R.drawable.widget_btn_active : R.drawable.widget_btn_bg);
            views.setTextColor(R.id.btn_method_cash, !isCard ? 0xFFFFFFFF : 0xFF94A3B8);

            Intent cardIntent = new Intent(context, QuickExpenseWidgetProvider.class);
            cardIntent.setAction(ACTION_METHOD);
            cardIntent.putExtra("method", "credit_card");
            views.setOnClickPendingIntent(R.id.btn_method_card, createPendingIntentWithIntent(context, cardIntent, 101));

            Intent cashIntent = new Intent(context, QuickExpenseWidgetProvider.class);
            cashIntent.setAction(ACTION_METHOD);
            cashIntent.putExtra("method", "cash_bank");
            views.setOnClickPendingIntent(R.id.btn_method_cash, createPendingIntentWithIntent(context, cashIntent, 102));

            // Category buttons styling & intent
            bindCategoryButton(context, views, R.id.btn_cat_1, 1, cat1Name, currentCatIndex == 1);
            bindCategoryButton(context, views, R.id.btn_cat_2, 2, cat2Name, currentCatIndex == 2);
            bindCategoryButton(context, views, R.id.btn_cat_3, 3, cat3Name, currentCatIndex == 3);
            bindCategoryButton(context, views, R.id.btn_cat_4, 4, cat4Name, currentCatIndex == 4);

            // Number digits (1-9, 0, .)
            bindDigit(context, views, R.id.btn_key_1, "1", 201);
            bindDigit(context, views, R.id.btn_key_2, "2", 202);
            bindDigit(context, views, R.id.btn_key_3, "3", 203);
            bindDigit(context, views, R.id.btn_key_4, "4", 204);
            bindDigit(context, views, R.id.btn_key_5, "5", 205);
            bindDigit(context, views, R.id.btn_key_6, "6", 206);
            bindDigit(context, views, R.id.btn_key_7, "7", 207);
            bindDigit(context, views, R.id.btn_key_8, "8", 208);
            bindDigit(context, views, R.id.btn_key_9, "9", 209);
            bindDigit(context, views, R.id.btn_key_0, "0", 210);

            views.setOnClickPendingIntent(R.id.btn_key_dot, createPendingIntent(context, ACTION_DOT, 211));
            views.setOnClickPendingIntent(R.id.btn_key_back, createPendingIntent(context, ACTION_BACKSPACE, 212));
            views.setOnClickPendingIntent(R.id.btn_key_clear, createPendingIntent(context, ACTION_CLEAR, 213));

            // Presets (+50, +100, +250)
            bindPreset(context, views, R.id.btn_preset_50, 50, 220);
            bindPreset(context, views, R.id.btn_preset_100, 100, 221);
            bindPreset(context, views, R.id.btn_preset_250, 250, 222);

            // Save button
            views.setOnClickPendingIntent(R.id.btn_save, createPendingIntent(context, ACTION_SAVE, 300));

            appWidgetManager.updateAppWidget(widgetId, views);
        }
    }

    private static void bindCategoryButton(Context context, RemoteViews views, int viewId, int index, String name, boolean isSelected) {
        views.setTextViewText(viewId, name);
        views.setInt(viewId, "setBackgroundResource", isSelected ? R.drawable.widget_btn_active : R.drawable.widget_btn_bg);
        views.setTextColor(viewId, isSelected ? 0xFFFFFFFF : 0xFF94A3B8);

        Intent intent = new Intent(context, QuickExpenseWidgetProvider.class);
        intent.setAction(ACTION_CATEGORY);
        intent.putExtra("cat_index", index);
        views.setOnClickPendingIntent(viewId, createPendingIntentWithIntent(context, intent, 150 + index));
    }

    private static void bindDigit(Context context, RemoteViews views, int viewId, String digit, int requestCode) {
        Intent intent = new Intent(context, QuickExpenseWidgetProvider.class);
        intent.setAction(ACTION_DIGIT);
        intent.putExtra("digit", digit);
        views.setOnClickPendingIntent(viewId, createPendingIntentWithIntent(context, intent, requestCode));
    }

    private static void bindPreset(Context context, RemoteViews views, int viewId, int amount, int requestCode) {
        Intent intent = new Intent(context, QuickExpenseWidgetProvider.class);
        intent.setAction(ACTION_PRESET);
        intent.putExtra("amount", amount);
        views.setOnClickPendingIntent(viewId, createPendingIntentWithIntent(context, intent, requestCode));
    }

    private static PendingIntent createPendingIntent(Context context, String action, int requestCode) {
        Intent intent = new Intent(context, QuickExpenseWidgetProvider.class);
        intent.setAction(action);
        return createPendingIntentWithIntent(context, intent, requestCode);
    }

    private static PendingIntent createPendingIntentWithIntent(Context context, Intent intent, int requestCode) {
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }
        return PendingIntent.getBroadcast(context, requestCode, intent, flags);
    }
}
