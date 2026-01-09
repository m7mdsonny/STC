import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // Colors
  static const Color primaryGold = Color(0xFFD4AF37);
  static const Color bgDark = Color(0xFF0A0A0A);
  static const Color cardDark = Color(0xFF1A1A1A);
  static const Color borderColor = Color(0xFF2A2A2A);

  // Severity Colors
  static const Color criticalRed = Color(0xFFDC2626);
  static const Color highOrange = Color(0xFFEA580C);
  static const Color mediumYellow = Color(0xFFF59E0B);
  static const Color lowGreen = Color(0xFF10B981);

  // Status Colors
  static const Color onlineGreen = Color(0xFF22C55E);
  static const Color offlineRed = Color(0xFFEF4444);

  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: bgDark,
      colorScheme: const ColorScheme.dark(
        primary: primaryGold,
        secondary: primaryGold,
        surface: cardDark,
        background: bgDark,
        error: criticalRed,
      ),
      cardTheme: CardTheme(
        color: cardDark,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: const BorderSide(color: borderColor, width: 1),
        ),
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: bgDark,
        elevation: 0,
        centerTitle: true,
        iconTheme: const IconThemeData(color: Colors.white),
        titleTextStyle: GoogleFonts.cairo(
          fontSize: 20,
          fontWeight: FontWeight.bold,
          color: Colors.white,
        ),
      ),
      textTheme: GoogleFonts.cairoTextTheme(
        const TextTheme(
          displayLarge: TextStyle(
            fontSize: 32,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
          displayMedium: TextStyle(
            fontSize: 28,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
          displaySmall: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
          headlineMedium: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w600,
            color: Colors.white,
          ),
          titleLarge: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w600,
            color: Colors.white,
          ),
          bodyLarge: TextStyle(
            fontSize: 16,
            color: Colors.white70,
          ),
          bodyMedium: TextStyle(
            fontSize: 14,
            color: Colors.white60,
          ),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryGold,
          foregroundColor: bgDark,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
          textStyle: GoogleFonts.cairo(
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: primaryGold,
          side: const BorderSide(color: primaryGold),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
          textStyle: GoogleFonts.cairo(
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: cardDark,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: borderColor),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: borderColor),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: primaryGold, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: criticalRed),
        ),
        labelStyle: GoogleFonts.cairo(color: Colors.white70),
        hintStyle: GoogleFonts.cairo(color: Colors.white38),
      ),
      dividerTheme: const DividerThemeData(
        color: borderColor,
        thickness: 1,
      ),
    );
  }

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      scaffoldBackgroundColor: Colors.grey[100],
      colorScheme: ColorScheme.light(
        primary: primaryGold,
        secondary: primaryGold,
        surface: Colors.white,
        background: Colors.grey[100]!,
        error: criticalRed,
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
        iconTheme: const IconThemeData(color: Colors.black87),
        titleTextStyle: GoogleFonts.cairo(
          fontSize: 20,
          fontWeight: FontWeight.bold,
          color: Colors.black87,
        ),
      ),
      textTheme: GoogleFonts.cairoTextTheme(),
    );
  }

  // Helper methods for severity colors
  static Color getSeverityColor(String severity) {
    switch (severity.toLowerCase()) {
      case 'critical':
        return criticalRed;
      case 'high':
        return highOrange;
      case 'medium':
        return mediumYellow;
      case 'low':
        return lowGreen;
      default:
        return Colors.grey;
    }
  }

  static Color getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'online':
        return onlineGreen;
      case 'offline':
        return offlineRed;
      default:
        return Colors.grey;
    }
  }
}
