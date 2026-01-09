import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'notification_service.dart';
import 'storage_service.dart';
import '../../data/repositories/camera_repository.dart';
import '../../data/models/camera_model.dart';
import '../../data/providers/app_providers.dart';

/// Service to monitor camera status and send notifications when cameras go offline
class CameraMonitorService {
  final CameraRepository _cameraRepository;
  final NotificationService _notificationService;
  final StorageService _storageService;

  Timer? _monitoringTimer;
  Map<String, bool> _lastKnownStatus = {}; // camera_id -> isOnline
  bool _isMonitoring = false;

  CameraMonitorService({
    required CameraRepository cameraRepository,
    required NotificationService notificationService,
    required StorageService storageService,
  })  : _cameraRepository = cameraRepository,
        _notificationService = notificationService,
        _storageService = storageService;

  /// Start monitoring cameras for offline status
  Future<void> startMonitoring({String? organizationId}) async {
    if (_isMonitoring) return;

    _isMonitoring = true;
    if (kDebugMode) {
      print('Camera monitoring started');
    }

    // Check immediately
    await _checkCameras(organizationId);

    // Check every 30 seconds
    _monitoringTimer = Timer.periodic(const Duration(seconds: 30), (_) {
      _checkCameras(organizationId);
    });
  }

  /// Stop monitoring
  void stopMonitoring() {
    _isMonitoring = false;
    _monitoringTimer?.cancel();
    _monitoringTimer = null;
    if (kDebugMode) {
      print('Camera monitoring stopped');
    }
  }

  /// Check cameras and send notifications for offline cameras
  Future<void> _checkCameras(String? organizationId) async {
    try {
      final cameras = await _cameraRepository.getCameras(
        organizationId: organizationId,
      );

      for (final camera in cameras) {
        final lastStatus = _lastKnownStatus[camera.id];
        final currentStatus = camera.isOnline;

        // If camera was online and now is offline, send notification
        if (lastStatus == true && !currentStatus) {
          await _sendOfflineNotification(camera);
        }

        // Update last known status
        _lastKnownStatus[camera.id] = currentStatus;
      }

      // Remove cameras that no longer exist
      final currentCameraIds = cameras.map((c) => c.id).toSet();
      _lastKnownStatus.removeWhere((id, _) => !currentCameraIds.contains(id));
    } catch (e) {
      if (kDebugMode) {
        print('Error checking cameras: $e');
      }
    }
  }

  /// Send notification when camera goes offline
  Future<void> _sendOfflineNotification(CameraModel camera) async {
    // Check if user has enabled camera offline notifications
    final enabled = await _storageService.getBool('camera_offline_notifications_enabled') ?? true;
    if (!enabled) return;

    await _notificationService.showLocalNotification(
      id: 'camera_offline_${camera.id}'.hashCode,
      title: 'كاميرا غير متصلة',
      body: 'الكاميرا "${camera.name}" أصبحت غير متصلة',
      payload: '{"type": "camera_offline", "camera_id": "${camera.id}"}',
      level: 'high',
      type: 'camera_offline',
    );

    if (kDebugMode) {
      print('Camera offline notification sent: ${camera.name}');
    }
  }

  /// Reset monitoring state (useful when user logs out)
  void reset() {
    _lastKnownStatus.clear();
    stopMonitoring();
  }
}

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

