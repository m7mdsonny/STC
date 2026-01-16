import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../features/splash/splash_screen.dart';
import '../features/auth/login_screen.dart';
import '../features/home/home_screen.dart';
import '../features/alerts/alerts_screen.dart';
import '../features/cameras/cameras_screen.dart';
import '../features/settings/notification_sound_settings_screen.dart';

// Custom page transition with fade + slide
Page<T> _buildPageWithTransition<T extends Object>(
  Widget child,
  GoRouterState state,
) {
  return Page<T>(
    key: state.pageKey,
    child: child,
  );
}

final appRouter = GoRouter(
  initialLocation: '/splash',
  debugLogDiagnostics: true,
  routes: [
    GoRoute(
      path: '/splash',
      name: 'splash',
      builder: (context, state) => const SplashScreen(),
    ),
    GoRoute(
      path: '/login',
      name: 'login',
      builder: (context, state) => const LoginScreen(),
    ),
    GoRoute(
      path: '/home',
      name: 'home',
      pageBuilder: (context, state) => _buildPageWithTransition(
        const HomeScreen(),
        state,
      ),
    ),
    GoRoute(
      path: '/cameras',
      name: 'cameras',
      pageBuilder: (context, state) => _buildPageWithTransition(
        const CamerasScreen(),
        state,
      ),
    ),
    GoRoute(
      path: '/alerts',
      name: 'alerts',
      pageBuilder: (context, state) => _buildPageWithTransition(
        const AlertsScreen(),
        state,
      ),
    ),
    GoRoute(
      path: '/analytics',
      name: 'analytics',
      builder: (context, state) => const Scaffold(
        body: Center(child: Text('التحليلات - قيد التطوير')),
      ),
    ),
    GoRoute(
      path: '/settings',
      name: 'settings',
      builder: (context, state) => const Scaffold(
        body: Center(child: Text('الإعدادات - قيد التطوير')),
      ),
    ),
    GoRoute(
      path: '/settings/notification-sounds',
      name: 'notification-sounds',
      builder: (context, state) => const NotificationSoundSettingsScreen(),
    ),
  ],
  errorBuilder: (context, state) => Scaffold(
    body: Center(
      child: Text('الصفحة غير موجودة: ${state.uri}'),
    ),
  ),
);
