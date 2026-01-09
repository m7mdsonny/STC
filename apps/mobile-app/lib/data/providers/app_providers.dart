import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/material.dart';
import '../../config/env.dart';
import '../../core/services/api_service.dart';
import '../../core/services/auth_service.dart';
import '../../core/services/storage_service.dart';
import '../../core/services/notification_service.dart';
import '../../core/services/camera_monitor_service.dart';
import '../../core/services/notification_sound_settings.dart';
import '../repositories/camera_repository.dart';
import '../repositories/alert_repository.dart';
import '../repositories/server_repository.dart';
import '../models/user_model.dart';

final storageServiceProvider = Provider<StorageService>((ref) {
  return StorageService();
});

final apiServiceProvider = Provider<ApiService>((ref) {
  final storage = ref.watch(storageServiceProvider);
  return ApiService(
    baseUrl: Env.apiUrl,
    storage: storage,
  );
});

final authServiceProvider = Provider<AuthService>((ref) {
  final storage = ref.watch(storageServiceProvider);
  final api = ref.watch(apiServiceProvider);
  final notificationService = ref.watch(notificationServiceProvider);
  final notificationRegistrationService = ref.watch(notificationRegistrationServiceProvider);
  return AuthService(
    storage: storage,
    api: api,
    notificationService: notificationService,
    notificationRegistrationService: notificationRegistrationService,
  );
});

final notificationServiceProvider = Provider<NotificationService>((ref) {
  return NotificationService();
});

final cameraRepositoryProvider = Provider<CameraRepository>((ref) {
  final api = ref.watch(apiServiceProvider);
  return CameraRepository(api: api);
});

final alertRepositoryProvider = Provider<AlertRepository>((ref) {
  final api = ref.watch(apiServiceProvider);
  return AlertRepository(api: api);
});

final serverRepositoryProvider = Provider<ServerRepository>((ref) {
  final api = ref.watch(apiServiceProvider);
  return ServerRepository(api: api);
});

final notificationRegistrationServiceProvider = Provider((ref) {
  final api = ref.watch(apiServiceProvider);
  final storage = ref.watch(storageServiceProvider);
  final notificationService = ref.watch(notificationServiceProvider);
  return NotificationRegistrationService(
    api: api,
    storage: storage,
  );
});

final cameraMonitorServiceProvider = Provider<CameraMonitorService>((ref) {
  final cameraRepository = ref.watch(cameraRepositoryProvider);
  final notificationService = ref.watch(notificationServiceProvider);
  final storageService = ref.watch(storageServiceProvider);
  return CameraMonitorService(
    cameraRepository: cameraRepository,
    notificationService: notificationService,
    storageService: storageService,
  );
});

final notificationSoundSettingsProvider = Provider<NotificationSoundSettings>((ref) {
  final storageService = ref.watch(storageServiceProvider);
  return NotificationSoundSettings(storage: storageService);
});

final currentUserProvider = FutureProvider<UserModel?>((ref) async {
  final authService = ref.watch(authServiceProvider);
  return await authService.getCurrentUser();
});

final themeModeProvider = StateNotifierProvider<ThemeModeNotifier, ThemeMode>((ref) {
  final storage = ref.watch(storageServiceProvider);
  return ThemeModeNotifier(storage);
});

class ThemeModeNotifier extends StateNotifier<ThemeMode> {
  final StorageService _storage;

  ThemeModeNotifier(this._storage) : super(ThemeMode.light) {
    _loadThemeMode();
  }

  void _loadThemeMode() {
    final themeMode = _storage.getThemeMode();
    switch (themeMode) {
      case 'dark':
        state = ThemeMode.dark;
        break;
      case 'light':
        state = ThemeMode.light;
        break;
      case 'system':
        state = ThemeMode.system;
        break;
      default:
        state = ThemeMode.light;
    }
  }

  Future<void> setThemeMode(ThemeMode mode) async {
    state = mode;
    await _storage.saveThemeMode(mode.name);
  }

  Future<void> toggleTheme() async {
    final newMode = state == ThemeMode.light ? ThemeMode.dark : ThemeMode.light;
    await setThemeMode(newMode);
  }
}
