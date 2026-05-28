# Capacitor ProGuard Rules
-keep class com.getcapacitor.** { *; }

# Google Sign-In / GMS
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.android.gms.**

# Keep Javascript interfaces
-keepattributes JavascriptInterface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# General Android rules
-keepattributes *Annotation*
-keepattributes EnclosingMethod
-keepattributes InnerClasses
-keepattributes Signature
-keepattributes SourceFile,LineNumberTable
