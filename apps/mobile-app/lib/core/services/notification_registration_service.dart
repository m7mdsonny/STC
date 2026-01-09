import 'package:flutter/foundation.dart';
import 'dart:io';
import 'api_service.dart';
import 'storage_service.dart';

class NotificationRegistrationService {
  final ApiService _api;
  final StorageService _storage;

  NotificationRegistrationService({
    required ApiService api,
    required StorageService storage,
  })  : _api = api,
        _storage = storage;

  /// Register FCM device token with Cloud API
  Future<bool> registerDeviceToken({
    required String deviceToken,
    String? deviceId,
    String? deviceName,
    String? appVersion,
  }) async {
    try {
      final platform = Platform.isAndroid ? 'android' : (Platform.isIOS ? 'ios' : 'unknown');
      
      final response = await _api.post(
        '/auth/register-fcm-token',
        data: {
          'device_token': deviceToken,
          'platform': platform,
          if (deviceId != null) 'device_id': deviceId,
          if (deviceName != null) 'device_name': deviceName,
          if (appVersion != null) 'app_version': appVersion,
        },
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        // Save token locally
        await _storage.saveString('fcm_token', deviceToken);
        if (kDebugMode) {
          print('FCM token registered successfully with Cloud');
        }
        return true;
      }

      return false;
    } catch (e) {
      if (kDebugMode) {
        print('Error registering device token: $e');
      }
      return false;
    }
  }

  /// Unregister device token (on logout)
  Future<bool> unregisterDeviceToken(String deviceToken) async {
    try {
      await _api.delete(
        '/notifications/unregister-device',
        data: {
          'device_token': deviceToken,
        },
      );
      await _storage.remove('fcm_token');
      return true;
    } catch (e) {
      if (kDebugMode) {
        print('Error unregistering device token: $e');
      }
      return false;
    }
  }

  /// Get stored FCM token
  Future<String?> getStoredToken() async {
    return await _storage.getString('fcm_token');
  }
}

