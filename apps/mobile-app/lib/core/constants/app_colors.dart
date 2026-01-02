import 'package:flutter/material.dart';

class AppColors {
  AppColors._();

  // Brand Colors
  static const Color primaryNavy = Color(0xFF141450);
  static const Color primaryGold = Color(0xFFDCA000);
  static const Color backgroundDark = Color(0xFF0A0A2E);
  static const Color cardDark = Color(0xFF1E1E6E);

  // Light Theme Colors
  static const Color primaryLight = Color(0xFF2563EB);
  static const Color backgroundLight = Color(0xFFF8FAFC);
  static const Color cardLight = Color(0xFFFFFFFF);
  static const Color surfaceLight = Color(0xFFF1F5F9);

  // Alert Level Colors
  static const Color criticalRed = Color(0xFFDC2626);
  static const Color highOrange = Color(0xFFEA580C);
  static const Color mediumYellow = Color(0xFFF59E0B);
  static const Color lowGreen = Color(0xFF16A34A);

  // Status Colors
  static const Color success = Color(0xFF10B981);
  static const Color error = Color(0xFFEF4444);
  static const Color warning = Color(0xFFF59E0B);
  static const Color info = Color(0xFF3B82F6);

  // Online/Offline
  static const Color online = Color(0xFF10B981);
  static const Color offline = Color(0xFF6B7280);

  // Text Colors
  static const Color textDark = Color(0xFF1F2937);
  static const Color textLight = Color(0xFFF9FAFB);
  static const Color textSecondaryDark = Color(0xFF6B7280);
  static const Color textSecondaryLight = Color(0xFF9CA3AF);

  // Border Colors
  static const Color borderLight = Color(0xFFE5E7EB);
  static const Color borderDark = Color(0xFF374151);

  // Gradient Colors
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [primaryNavy, Color(0xFF1E1E6E)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient goldGradient = LinearGradient(
    colors: [primaryGold, Color(0xFFFFD700)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient lightGradient = LinearGradient(
    colors: [primaryLight, Color(0xFF3B82F6)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
}
