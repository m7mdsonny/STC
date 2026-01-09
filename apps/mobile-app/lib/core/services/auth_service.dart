import '../../data/models/user_model.dart';
import 'api_service.dart';
import 'storage_service.dart';
import 'notification_service.dart';
import 'notification_registration_service.dart';
import 'package:flutter/foundation.dart';
import 'dart:io';

class AuthService {
  final StorageService _storage;
  final ApiService _api;
  final NotificationService? _notificationService;
  final NotificationRegistrationService? _notificationRegistrationService;

  AuthService({
    required StorageService storage,
    required ApiService api,
    NotificationService? notificationService,
    NotificationRegistrationService? notificationRegistrationService,
  })  : _storage = storage,
        _api = api,
        _notificationService = notificationService,
        _notificationRegistrationService = notificationRegistrationService;

  Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    try {
      final response = await _api.post(
        '/auth/login',
        data: {
          'email': email,
          'password': password,
        },
      );

      final data = response.data;
      final token = data['token'] as String?;
      final userData = data['user'] as Map<String, dynamic>?;

      if (token == null || userData == null) {
        throw Exception('فشل تسجيل الدخول');
      }

      await _storage.saveToken(token);

      final user = UserModel.fromJson(userData);
      await _storage.saveUser(user.toJsonString());

      // Register FCM token after successful login
      _registerFcmTokenIfAvailable();

      return {
        'token': token,
        'user': user,
      };
    } catch (e) {
      rethrow;
    }
  }

  Future<UserModel> getMe() async {
    try {
      final response = await _api.get('/auth/me');
      final userData = response.data as Map<String, dynamic>;
      final userModel = UserModel.fromJson(userData);
      await _storage.saveUser(userModel.toJsonString());
      return userModel;
    } catch (e) {
      rethrow;
    }
  }

  Future<void> logout() async {
    try {
      await _api.post('/auth/logout');
    } catch (e) {
      // Continue with local logout even if API fails
    } finally {
      // Unregister FCM token on logout
      await _unregisterFcmToken();
      
      await _storage.clearToken();
      await _storage.clearUser();
    }
  }

  Future<void> _registerFcmTokenIfAvailable() async {
    if (_notificationService == null || _notificationRegistrationService == null) {
      return;
    }

    try {
      final fcmToken = await _notificationService!.getToken();
      if (fcmToken != null) {
        await _notificationRegistrationService!.registerDeviceToken(
          deviceToken: fcmToken,
          appVersion: '1.0.0',
        );
        if (kDebugMode) {
          print('FCM token registered after login');
        }
      }
    } catch (e) {
      if (kDebugMode) {
        print('Failed to register FCM token after login: $e');
      }
    }
  }

  Future<void> _unregisterFcmToken() async {
    if (_notificationRegistrationService == null) {
      return;
    }

    try {
      final storedToken = await _notificationRegistrationService!.getStoredToken();
      if (storedToken != null) {
        await _notificationRegistrationService!.unregisterDeviceToken(storedToken);
      }
    } catch (e) {
      if (kDebugMode) {
        print('Failed to unregister FCM token on logout: $e');
      }
    }
  }

  Future<bool> isLoggedIn() async {
    final token = await _storage.getToken();
    return token != null && token.isNotEmpty;
  }

  Future<UserModel?> getCurrentUser() async {
    try {
      final userString = await _storage.getUser();
      if (userString == null) return null;
      return UserModel.fromJsonString(userString);
    } catch (e) {
      return null;
    }
  }

  Future<void> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    try {
      await _api.put(
        '/auth/password',
        data: {
          'current_password': currentPassword,
          'password': newPassword,
          'password_confirmation': newPassword,
        },
      );
    } catch (e) {
      rethrow;
    }
  }

  Future<void> resetPassword({required String email}) async {
    try {
      await _api.post(
        '/auth/forgot-password',
        data: {'email': email},
      );
    } catch (e) {
      rethrow;
    }
  }

  Future<void> updateProfile({
    required String name,
    String? phone,
  }) async {
    try {
      final response = await _api.put(
        '/auth/profile',
        data: {
          'name': name,
          if (phone != null) 'phone': phone,
        },
      );

      final userData = response.data as Map<String, dynamic>;
      final userModel = UserModel.fromJson(userData);
      await _storage.saveUser(userModel.toJsonString());
    } catch (e) {
      rethrow;
    }
  }
}
