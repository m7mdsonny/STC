import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_core/firebase_core.dart';
import 'core/theme/app_theme.dart';
import 'core/services/storage_service.dart';
import 'core/services/notification_service.dart';
import 'core/services/camera_monitor_service.dart';
import 'data/providers/app_providers.dart';
import 'data/providers/data_providers.dart';
import 'routes/app_router.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  try {
    await Firebase.initializeApp();
  } catch (e) {
    debugPrint('Firebase initialization error: $e');
  }

  final storageService = StorageService();
  await storageService.init();

  try {
    final notificationService = NotificationService();
    await notificationService.initialize();
  } catch (e) {
    debugPrint('Notification service initialization error: $e');
  }

  runApp(
    ProviderScope(
      child: const MyApp(),
      overrides: [
        storageServiceProvider.overrideWithValue(storageService),
      ],
    ),
  );
}

class CameraMonitorInitializer extends ConsumerStatefulWidget {
  final Widget child;
  const CameraMonitorInitializer({super.key, required this.child});

  @override
  ConsumerState<CameraMonitorInitializer> createState() => _CameraMonitorInitializerState();
}

class _CameraMonitorInitializerState extends ConsumerState<CameraMonitorInitializer> {
  @override
  void initState() {
    super.initState();
    // Start camera monitoring after a delay to ensure user is logged in
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Future.delayed(const Duration(seconds: 2), () {
        if (!mounted) return;
        final currentUserAsync = ref.read(currentUserProvider);
        currentUserAsync.whenData((user) {
          if (user != null && mounted) {
            final monitorService = ref.read(cameraMonitorServiceProvider);
            monitorService.startMonitoring(organizationId: user.organizationId);
          }
        });
      });
    });
  }

  @override
  void dispose() {
    if (mounted) {
      final monitorService = ref.read(cameraMonitorServiceProvider);
      monitorService.stopMonitoring();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return widget.child;
  }
}

class MyApp extends ConsumerWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(themeModeProvider);

    return CameraMonitorInitializer(
      child: MaterialApp.router(
        title: 'STC AI-VAP',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.lightTheme,
        darkTheme: AppTheme.darkTheme,
        themeMode: themeMode,
        routerConfig: appRouter,
        locale: const Locale('ar', 'SA'),
        builder: (context, child) {
          return Directionality(
            textDirection: TextDirection.rtl,
            child: child ?? const SizedBox.shrink(),
          );
        },
      ),
    );
  }
}
