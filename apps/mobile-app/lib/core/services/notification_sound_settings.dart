import 'package:flutter/foundation.dart';
import '../services/storage_service.dart';

/// Service to manage notification sound settings for different alert types
class NotificationSoundSettings {
  final StorageService _storage;

  NotificationSoundSettings({required StorageService storage}) : _storage = storage;

  // Default sound mappings
  static const Map<String, String> _defaultSounds = {
    'critical': 'alert_critical',
    'high': 'alert_high',
    'medium': 'alert_medium',
    'low': 'alert_low',
    'camera_offline': 'alert_high',
    'camera_online': 'alert_medium',
    'fire_detection': 'alert_critical',
    'intrusion_detection': 'alert_critical',
    'face_recognition': 'alert_medium',
    'vehicle_recognition': 'alert_medium',
    'people_counter': 'alert_low',
    'attendance': 'alert_medium',
    'loitering': 'alert_high',
    'crowd_detection': 'alert_high',
    'object_detection': 'alert_medium',
  };

  /// Get sound for a specific alert type/level
  Future<String> getSoundForAlert({
    required String type,
    String? level,
  }) async {
    // First check custom settings
    final customSound = await _storage.getString('notification_sound_$type');
    if (customSound != null && customSound.isNotEmpty) {
      return customSound;
    }

    // Use level if provided
    if (level != null) {
      final levelSound = await _storage.getString('notification_sound_level_$level');
      if (levelSound != null && levelSound.isNotEmpty) {
        return levelSound;
      }
      return _defaultSounds[level.toLowerCase()] ?? 'alert_medium';
    }

    // Use type default
    return _defaultSounds[type] ?? 'alert_medium';
  }

  /// Set custom sound for alert type
  Future<void> setSoundForAlertType(String type, String sound) async {
    await _storage.saveString('notification_sound_$type', sound);
  }

  /// Set custom sound for alert level
  Future<void> setSoundForLevel(String level, String sound) async {
    await _storage.saveString('notification_sound_level_$level', sound);
  }

  /// Get all available sounds
  List<String> getAvailableSounds() {
    return [
      'alert_critical',
      'alert_high',
      'alert_medium',
      'alert_low',
      'default',
      'none', // Silent
    ];
  }

  /// Get sound label (Arabic)
  String getSoundLabel(String sound) {
    switch (sound) {
      case 'alert_critical':
        return 'حرج';
      case 'alert_high':
        return 'عالي';
      case 'alert_medium':
        return 'متوسط';
      case 'alert_low':
        return 'منخفض';
      case 'default':
        return 'افتراضي';
      case 'none':
        return 'صامت';
      default:
        return sound;
    }
  }

  /// Enable/disable sounds globally
  Future<void> setSoundsEnabled(bool enabled) async {
    await _storage.saveBool('notification_sounds_enabled', enabled);
  }

  /// Check if sounds are enabled
  Future<bool> areSoundsEnabled() async {
    return await _storage.getBool('notification_sounds_enabled') ?? true;
  }

  /// Reset all custom sound settings
  Future<void> resetToDefaults() async {
    final keys = await _storage.getAllKeys();
    for (final key in keys) {
      if (key.startsWith('notification_sound_')) {
        await _storage.remove(key);
      }
    }
  }
}



