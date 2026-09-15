package com.cebim.muhasebe;

import android.content.Context;
import android.content.SharedPreferences;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONArray;
import org.json.JSONObject;

@CapacitorPlugin(name = "WidgetBridge")
public class WidgetBridgePlugin extends Plugin {

    @PluginMethod
    public void getPendingTransactions(PluginCall call) {
        try {
            Context context = getContext();
            SharedPreferences prefs = context.getSharedPreferences(QuickExpenseWidgetProvider.PREFS_NAME, Context.MODE_PRIVATE);
            String rawJson = prefs.getString(QuickExpenseWidgetProvider.KEY_PENDING_TXS, "[]");

            JSArray jsArray = new JSArray(rawJson);

            JSObject result = new JSObject();
            result.put("transactions", jsArray);
            call.resolve(result);
        } catch (Exception e) {
            call.reject("Failed to get pending widget transactions", e);
        }
    }

    @PluginMethod
    public void clearPendingTransactions(PluginCall call) {
        try {
            Context context = getContext();
            SharedPreferences prefs = context.getSharedPreferences(QuickExpenseWidgetProvider.PREFS_NAME, Context.MODE_PRIVATE);
            prefs.edit().putString(QuickExpenseWidgetProvider.KEY_PENDING_TXS, "[]").apply();
            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to clear pending widget transactions", e);
        }
    }

    @PluginMethod
    public void syncCategories(PluginCall call) {
        try {
            JSArray categories = call.getArray("categories");
            if (categories == null || categories.length() == 0) {
                call.resolve();
                return;
            }

            Context context = getContext();
            SharedPreferences prefs = context.getSharedPreferences(QuickExpenseWidgetProvider.PREFS_NAME, Context.MODE_PRIVATE);
            SharedPreferences.Editor editor = prefs.edit();

            int max = Math.min(categories.length(), 4);
            for (int i = 0; i < max; i++) {
                JSONObject cat = categories.getJSONObject(i);
                String id = cat.optString("id", "cat-" + (i + 1));
                String name = cat.optString("name", "Kategori " + (i + 1));

                // Shorten name if too long for small widget button
                if (name.contains("&")) {
                    name = name.split("&")[0].trim();
                } else if (name.length() > 8) {
                    name = name.substring(0, 8);
                }

                if (i == 0) {
                    editor.putString(QuickExpenseWidgetProvider.KEY_CAT1_ID, id);
                    editor.putString(QuickExpenseWidgetProvider.KEY_CAT1_NAME, name);
                } else if (i == 1) {
                    editor.putString(QuickExpenseWidgetProvider.KEY_CAT2_ID, id);
                    editor.putString(QuickExpenseWidgetProvider.KEY_CAT2_NAME, name);
                } else if (i == 2) {
                    editor.putString(QuickExpenseWidgetProvider.KEY_CAT3_ID, id);
                    editor.putString(QuickExpenseWidgetProvider.KEY_CAT3_NAME, name);
                } else if (i == 3) {
                    editor.putString(QuickExpenseWidgetProvider.KEY_CAT4_ID, id);
                    editor.putString(QuickExpenseWidgetProvider.KEY_CAT4_NAME, name);
                }
            }

            editor.apply();
            QuickExpenseWidgetProvider.updateAllWidgets(context);

            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to sync categories to widget", e);
        }
    }
}
