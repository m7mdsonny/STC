import 'dart:convert';
import 'dart:io';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter/foundation.dart';
import 'notification_sound_settings.dart';
import 'storage_service.dart';

@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  if (kDebugMode) {
    print('Handling a background message: ${message.messageId}');
  }
}

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();
  final FirebaseMessaging _fcm = FirebaseMessaging.instance;

  bool _isInitialized = false;

  Future<void> initialize() async {
    if (_isInitialized) return;

    await _requestPermissions();
    await _initializeLocalNotifications();
    await _configureFCM();

    _isInitialized = true;
  }

  Future<void> _requestPermissions() async {
    if (Platform.isIOS) {
      await _fcm.requestPermission(
        alert: true,
        announcement: false,
        badge: true,
        carPlay: false,
        criticalAlert: true,
        provisional: false,
        sound: true,
      );
    }

    final settings = await _fcm.requestPermission();
    if (kDebugMode) {
      print('FCM permission granted: ${settings.authorizationStatus}');
    }
  }

  Future<void> _initializeLocalNotifications() async {
    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );

    const initSettings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _localNotifications.initialize(
      initSettings,
      onDidReceiveNotificationResponse: _onNotificationTapped,
    );

    if (Platform.isAndroid) {
      const androidChannel = AndroidNotificationChannel(
        'high_importance_channel',
        'تنبيهات مهمة',
        description: 'قناة للتنبيهات المهمة',
        importance: Importance.max,
        playSound: true,
        sound: RawResourceAndroidNotificationSound('alert_critical'),
      );

      await _localNotifications
          .resolvePlatformSpecificImplementation<
              AndroidFlutterLocalNotificationsPlugin>()
          ?.createNotificationChannel(androidChannel);
    }
  }

  Future<void> _configureFCM() async {
    FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);

    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      if (kDebugMode) {
        print('Got a message whilst in the foreground!');
        print('Message data: ${message.data}');
      }

      if (message.notification != null) {
        _showLocalNotification(message);
      }
    });

    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      if (kDebugMode) {
        print('Message clicked!');
      }
      _handleNotificationClick(message.data);
    });

    final initialMessage = await _fcm.getInitialMessage();
    if (initialMessage != null) {
      _handleNotificationClick(initialMessage.data);
    }
  }

  Future<void> _showLocalNotification(RemoteMessage message) async {
    final notification = message.notification;
    final data = message.data;

    if (notification == null) return;

    final alertLevel = data['level'] as String? ?? 'medium';
    final alertType = data['type'] as String? ?? 'general';
    
    // Get sound from settings (if available)
    String notificationSound = _getNotificationSound(alertLevel);
    try {
      // Try to get custom sound from storage
      final storage = StorageService();
      final soundSettings = NotificationSoundSettings(storage: storage);
      final soundsEnabled = await soundSettings.areSoundsEnabled();
      if (soundsEnabled) {
        notificationSound = await soundSettings.getSoundForAlert(
          type: alertType,
          level: alertLevel,
        );
      } else {
        notificationSound = 'none'; // Silent
      }
    } catch (e) {
      // Fallback to default
      notificationSound = _getNotificationSound(alertLevel);
    }
    
    final priority = _getNotificationPriority(alertLevel);

    final playSound = notificationSound != 'none';
    final androidDetails = AndroidNotificationDetails(
      'high_importance_channel',
      'تنبيهات مهمة',
      channelDescription: 'قناة للتنبيهات المهمة',
      importance: Importance.max,
      priority: priority,
      playSound: playSound,
      sound: playSound ? RawResourceAndroidNotificationSound(notificationSound) : null,
      enableVibration: alertLevel == 'critical',
      vibrationPattern: alertLevel == 'critical'
          ? Int64List.fromList([0, 1000, 500, 1000])
          : null,
    );

    const iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    final details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await _localNotifications.show(
      notification.hashCode,
      notification.title,
      notification.body,
      details,
      payload: jsonEncode(data),
    );
  }

  String _getNotificationSound(String level) {
    switch (level.toLowerCase()) {
      case 'critical':
        return 'alert_critical';
      case 'high':
        return 'alert_high';
      case 'medium':
        return 'alert_medium';
      case 'low':
        return 'alert_low';
      default:
        return 'alert_medium';
    }
  }

  Priority _getNotificationPriority(String level) {
    switch (level.toLowerCase()) {
      case 'critical':
        return Priority.max;
      case 'high':
        return Priority.high;
      case 'medium':
        return Priority.defaultPriority;
      case 'low':
        return Priority.low;
      default:
        return Priority.defaultPriority;
    }
  }

  void _onNotificationTapped(NotificationResponse response) {
    if (response.payload != null) {
      final data = jsonDecode(response.payload!);
      _handleNotificationClick(data);
    }
  }

  void _handleNotificationClick(Map<String, dynamic> data) {
    if (kDebugMode) {
      print('Notification clicked with data: $data');
    }
  }

  Future<String?> getToken() async {
    try {
      final token = await _fcm.getToken();
      if (kDebugMode) {
        print('FCM Token: $token');
      }
      
      // Register token with Cloud API
      if (token != null) {
        await _registerTokenWithCloud(token);
      }
      
      return token;
    } catch (e) {
      if (kDebugMode) {
        print('Error getting FCM token: $e');
      }
      return null;
    }
  }

  Future<void> _registerTokenWithCloud(String token) async {
    try {
      // Import ApiService dynamically to avoid circular dependency
      // This will be called after user login
      if (kDebugMode) {
        print('FCM token should be registered with Cloud API: $token');
        print('Note: Implement token registration endpoint in Cloud API');
      }
      // TODO: Call Cloud API to register FCM token
      // POST /api/v1/notifications/register-device
      // Body: { device_token: token, platform: 'android' | 'ios' }
    } catch (e) {
      if (kDebugMode) {
        print('Error registering FCM token with Cloud: $e');
      }
    }
  }

  Future<void> subscribeToTopic(String topic) async {
    try {
      await _fcm.subscribeToTopic(topic);
      if (kDebugMode) {
        print('Subscribed to topic: $topic');
      }
    } catch (e) {
      if (kDebugMode) {
        print('Error subscribing to topic: $e');
      }
    }
  }

  Future<void> unsubscribeFromTopic(String topic) async {
    try {
      await _fcm.unsubscribeFromTopic(topic);
      if (kDebugMode) {
        print('Unsubscribed from topic: $topic');
      }
    } catch (e) {
      if (kDebugMode) {
        print('Error unsubscribing from topic: $e');
      }
    }
  }

  Future<void> showLocalNotification({
    required int id,
    required String title,
    required String body,
    String? payload,
    String level = 'medium',
    String? type,
  }) async {
    // Get sound from settings
    String notificationSound = _getNotificationSound(level);
    try {
      final storage = StorageService();
      final soundSettings = NotificationSoundSettings(storage: storage);
      final soundsEnabled = await soundSettings.areSoundsEnabled();
      if (soundsEnabled) {
        notificationSound = await soundSettings.getSoundForAlert(
          type: type ?? 'general',
          level: level,
        );
      } else {
        notificationSound = 'none';
      }
    } catch (e) {
      notificationSound = _getNotificationSound(level);
    }
    
    final priority = _getNotificationPriority(level);

    final playSound = notificationSound != 'none';
    final androidDetails = AndroidNotificationDetails(
      'high_importance_channel',
      'تنبيهات مهمة',
      channelDescription: 'قناة للتنبيهات المهمة',
      importance: Importance.max,
      priority: priority,
      playSound: playSound,
      sound: playSound ? RawResourceAndroidNotificationSound(notificationSound) : null,
      enableVibration: level == 'critical',
      vibrationPattern: level == 'critical'
          ? Int64List.fromList([0, 1000, 500, 1000])
          : null,
    );

    const iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    final details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await _localNotifications.show(
      id,
      title,
      body,
      details,
      payload: payload,
    );
  }

  Future<void> cancelNotification(int id) async {
    await _localNotifications.cancel(id);
  }

  Future<void> cancelAllNotifications() async {
    await _localNotifications.cancelAll();
  }
}
