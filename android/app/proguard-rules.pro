# Project specific ProGuard / R8 rules

# Capacitor Core & Plugins
-keep class com.getcapacitor.** { *; }
-keep interface com.getcapacitor.** { *; }
-keepattributes *Annotation*
-keepclassmembers class * {
    @org.apache.cordova.CordovaPluginPath *;
    @com.getcapacitor.PluginMethod *;
    @android.webkit.JavascriptInterface <methods>;
}

# Keep all Capacitor plugins
-keep class * extends com.getcapacitor.Plugin { *; }

# Keep App Package (MainActivity, WidgetBridge, WidgetProvider)
-keep class com.cebim.muhasebe.** { *; }

# Keep Cordova plugins if any
-keep class org.apache.cordova.** { *; }

# Preserve line numbers and source file attributes for Play Console crash reports
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
