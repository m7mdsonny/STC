import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import '../constants/app_colors.dart';

class AppTheme {
  AppTheme._();

  static ThemeData lightTheme = ThemeData(
    useMaterial3: true,
    brightness: Brightness.light,
    primaryColor: AppColors.primaryLight,
    scaffoldBackgroundColor: AppColors.backgroundLight,
    colorScheme: ColorScheme.light(
      primary: AppColors.primaryLight,
      secondary: AppColors.primaryGold,
      surface: AppColors.cardLight,
      error: AppColors.error,
      onPrimary: Colors.white,
      onSecondary: Colors.white,
      onSurface: AppColors.textDark,
      onError: Colors.white,
    ),

    appBarTheme: AppBarTheme(
      centerTitle: true,
      elevation: 0,
      backgroundColor: AppColors.cardLight,
      surfaceTintColor: Colors.transparent,
      systemOverlayStyle: SystemUiOverlayStyle.dark,
      iconTheme: const IconThemeData(color: AppColors.textDark),
      titleTextStyle: GoogleFonts.alexandria(
        fontSize: 20,
        fontWeight: FontWeight.w600,
        color: AppColors.textDark,
      ),
    ),

    cardTheme: CardTheme(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      color: AppColors.cardLight,
      surfaceTintColor: Colors.transparent,
      shadowColor: Colors.black.withOpacity(0.05),
    ),

    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.primaryLight,
        foregroundColor: Colors.white,
        elevation: 0,
        padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        textStyle: GoogleFonts.alexandria(
          fontSize: 16,
          fontWeight: FontWeight.w600,
        ),
      ),
    ),

    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: AppColors.primaryLight,
        padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        side: const BorderSide(color: AppColors.primaryLight, width: 2),
        textStyle: GoogleFonts.alexandria(
          fontSize: 16,
          fontWeight: FontWeight.w600,
        ),
      ),
    ),

    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: AppColors.surfaceLight,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide.none,
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide.none,
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppColors.primaryLight, width: 2),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppColors.error, width: 2),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      hintStyle: GoogleFonts.alexandria(
        color: AppColors.textSecondaryLight,
        fontSize: 14,
      ),
      labelStyle: GoogleFonts.alexandria(
        color: AppColors.textDark,
        fontSize: 14,
      ),
    ),

    textTheme: TextTheme(
      displayLarge: GoogleFonts.alexandria(
        fontSize: 32,
        fontWeight: FontWeight.bold,
        color: AppColors.textDark,
        height: 1.2,
      ),
      displayMedium: GoogleFonts.alexandria(
        fontSize: 28,
        fontWeight: FontWeight.bold,
        color: AppColors.textDark,
        height: 1.2,
      ),
      displaySmall: GoogleFonts.alexandria(
        fontSize: 24,
        fontWeight: FontWeight.w600,
        color: AppColors.textDark,
        height: 1.2,
      ),
      headlineLarge: GoogleFonts.alexandria(
        fontSize: 22,
        fontWeight: FontWeight.w600,
        color: AppColors.textDark,
        height: 1.3,
      ),
      headlineMedium: GoogleFonts.alexandria(
        fontSize: 20,
        fontWeight: FontWeight.w600,
        color: AppColors.textDark,
        height: 1.3,
      ),
      headlineSmall: GoogleFonts.alexandria(
        fontSize: 18,
        fontWeight: FontWeight.w600,
        color: AppColors.textDark,
        height: 1.3,
      ),
      titleLarge: GoogleFonts.alexandria(
        fontSize: 16,
        fontWeight: FontWeight.w600,
        color: AppColors.textDark,
        height: 1.5,
      ),
      titleMedium: GoogleFonts.alexandria(
        fontSize: 14,
        fontWeight: FontWeight.w500,
        color: AppColors.textDark,
        height: 1.5,
      ),
      titleSmall: GoogleFonts.alexandria(
        fontSize: 12,
        fontWeight: FontWeight.w500,
        color: AppColors.textDark,
        height: 1.5,
      ),
      bodyLarge: GoogleFonts.alexandria(
        fontSize: 16,
        fontWeight: FontWeight.normal,
        color: AppColors.textDark,
        height: 1.5,
      ),
      bodyMedium: GoogleFonts.alexandria(
        fontSize: 14,
        fontWeight: FontWeight.normal,
        color: AppColors.textDark,
        height: 1.5,
      ),
      bodySmall: GoogleFonts.alexandria(
        fontSize: 12,
        fontWeight: FontWeight.normal,
        color: AppColors.textSecondaryDark,
        height: 1.5,
      ),
      labelLarge: GoogleFonts.alexandria(
        fontSize: 14,
        fontWeight: FontWeight.w500,
        color: AppColors.textDark,
      ),
      labelMedium: GoogleFonts.alexandria(
        fontSize: 12,
        fontWeight: FontWeight.w500,
        color: AppColors.textDark,
      ),
      labelSmall: GoogleFonts.alexandria(
        fontSize: 10,
        fontWeight: FontWeight.w500,
        color: AppColors.textSecondaryDark,
      ),
    ),

    bottomNavigationBarTheme: BottomNavigationBarThemeData(
      backgroundColor: AppColors.cardLight,
      selectedItemColor: AppColors.primaryLight,
      unselectedItemColor: AppColors.textSecondaryLight,
      type: BottomNavigationBarType.fixed,
      elevation: 8,
      selectedLabelStyle: GoogleFonts.alexandria(
        fontSize: 12,
        fontWeight: FontWeight.w600,
      ),
      unselectedLabelStyle: GoogleFonts.alexandria(
        fontSize: 12,
        fontWeight: FontWeight.normal,
      ),
    ),

    dividerTheme: const DividerThemeData(
      color: AppColors.borderLight,
      thickness: 1,
      space: 1,
    ),

    iconTheme: const IconThemeData(
      color: AppColors.textDark,
      size: 24,
    ),

    floatingActionButtonTheme: FloatingActionButtonThemeData(
      backgroundColor: AppColors.primaryLight,
      foregroundColor: Colors.white,
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
    ),

    chipTheme: ChipThemeData(
      backgroundColor: AppColors.surfaceLight,
      labelStyle: GoogleFonts.alexandria(
        fontSize: 12,
        color: AppColors.textDark,
      ),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
    ),
  );

  static ThemeData darkTheme = ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    primaryColor: AppColors.primaryNavy,
    scaffoldBackgroundColor: AppColors.backgroundDark,
    colorScheme: ColorScheme.dark(
      primary: AppColors.primaryGold,
      secondary: AppColors.primaryNavy,
      surface: AppColors.cardDark,
      error: AppColors.error,
      onPrimary: AppColors.textDark,
      onSecondary: AppColors.textLight,
      onSurface: AppColors.textLight,
      onError: Colors.white,
    ),

    appBarTheme: AppBarTheme(
      centerTitle: true,
      elevation: 0,
      backgroundColor: AppColors.cardDark,
      surfaceTintColor: Colors.transparent,
      systemOverlayStyle: SystemUiOverlayStyle.light,
      iconTheme: const IconThemeData(color: AppColors.textLight),
      titleTextStyle: GoogleFonts.alexandria(
        fontSize: 20,
        fontWeight: FontWeight.w600,
        color: AppColors.textLight,
      ),
    ),

    cardTheme: CardTheme(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      color: AppColors.cardDark,
      surfaceTintColor: Colors.transparent,
      shadowColor: Colors.black.withOpacity(0.3),
    ),

    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.primaryGold,
        foregroundColor: AppColors.textDark,
        elevation: 0,
        padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        textStyle: GoogleFonts.alexandria(
          fontSize: 16,
          fontWeight: FontWeight.w600,
        ),
      ),
    ),

    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: AppColors.primaryGold,
        padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        side: const BorderSide(color: AppColors.primaryGold, width: 2),
        textStyle: GoogleFonts.alexandria(
          fontSize: 16,
          fontWeight: FontWeight.w600,
        ),
      ),
    ),

    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: AppColors.primaryNavy,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide.none,
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide.none,
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppColors.primaryGold, width: 2),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppColors.error, width: 2),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      hintStyle: GoogleFonts.alexandria(
        color: AppColors.textSecondaryLight,
        fontSize: 14,
      ),
      labelStyle: GoogleFonts.alexandria(
        color: AppColors.textLight,
        fontSize: 14,
      ),
    ),

    textTheme: TextTheme(
      displayLarge: GoogleFonts.alexandria(
        fontSize: 32,
        fontWeight: FontWeight.bold,
        color: AppColors.textLight,
        height: 1.2,
      ),
      displayMedium: GoogleFonts.alexandria(
        fontSize: 28,
        fontWeight: FontWeight.bold,
        color: AppColors.textLight,
        height: 1.2,
      ),
      displaySmall: GoogleFonts.alexandria(
        fontSize: 24,
        fontWeight: FontWeight.w600,
        color: AppColors.textLight,
        height: 1.2,
      ),
      headlineLarge: GoogleFonts.alexandria(
        fontSize: 22,
        fontWeight: FontWeight.w600,
        color: AppColors.textLight,
        height: 1.3,
      ),
      headlineMedium: GoogleFonts.alexandria(
        fontSize: 20,
        fontWeight: FontWeight.w600,
        color: AppColors.textLight,
        height: 1.3,
      ),
      headlineSmall: GoogleFonts.alexandria(
        fontSize: 18,
        fontWeight: FontWeight.w600,
        color: AppColors.textLight,
        height: 1.3,
      ),
      titleLarge: GoogleFonts.alexandria(
        fontSize: 16,
        fontWeight: FontWeight.w600,
        color: AppColors.textLight,
        height: 1.5,
      ),
      titleMedium: GoogleFonts.alexandria(
        fontSize: 14,
        fontWeight: FontWeight.w500,
        color: AppColors.textLight,
        height: 1.5,
      ),
      titleSmall: GoogleFonts.alexandria(
        fontSize: 12,
        fontWeight: FontWeight.w500,
        color: AppColors.textLight,
        height: 1.5,
      ),
      bodyLarge: GoogleFonts.alexandria(
        fontSize: 16,
        fontWeight: FontWeight.normal,
        color: AppColors.textLight,
        height: 1.5,
      ),
      bodyMedium: GoogleFonts.alexandria(
        fontSize: 14,
        fontWeight: FontWeight.normal,
        color: AppColors.textLight,
        height: 1.5,
      ),
      bodySmall: GoogleFonts.alexandria(
        fontSize: 12,
        fontWeight: FontWeight.normal,
        color: AppColors.textSecondaryLight,
        height: 1.5,
      ),
      labelLarge: GoogleFonts.alexandria(
        fontSize: 14,
        fontWeight: FontWeight.w500,
        color: AppColors.textLight,
      ),
      labelMedium: GoogleFonts.alexandria(
        fontSize: 12,
        fontWeight: FontWeight.w500,
        color: AppColors.textLight,
      ),
      labelSmall: GoogleFonts.alexandria(
        fontSize: 10,
        fontWeight: FontWeight.w500,
        color: AppColors.textSecondaryLight,
      ),
    ),

    bottomNavigationBarTheme: BottomNavigationBarThemeData(
      backgroundColor: AppColors.cardDark,
      selectedItemColor: AppColors.primaryGold,
      unselectedItemColor: AppColors.textSecondaryLight,
      type: BottomNavigationBarType.fixed,
      elevation: 8,
      selectedLabelStyle: GoogleFonts.alexandria(
        fontSize: 12,
        fontWeight: FontWeight.w600,
      ),
      unselectedLabelStyle: GoogleFonts.alexandria(
        fontSize: 12,
        fontWeight: FontWeight.normal,
      ),
    ),

    dividerTheme: const DividerThemeData(
      color: AppColors.borderDark,
      thickness: 1,
      space: 1,
    ),

    iconTheme: const IconThemeData(
      color: AppColors.textLight,
      size: 24,
    ),

    floatingActionButtonTheme: FloatingActionButtonThemeData(
      backgroundColor: AppColors.primaryGold,
      foregroundColor: AppColors.textDark,
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
    ),

    chipTheme: ChipThemeData(
      backgroundColor: AppColors.primaryNavy,
      labelStyle: GoogleFonts.alexandria(
        fontSize: 12,
        color: AppColors.textLight,
      ),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
    ),
  );
}
