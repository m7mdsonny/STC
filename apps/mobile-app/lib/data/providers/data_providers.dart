"""
Data Providers for Riverpod
Provides real-time data from Cloud API
"""
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/alert_model.dart';
import '../models/camera_model.dart';
import '../models/server_model.dart';
import '../repositories/alert_repository.dart';
import '../repositories/camera_repository.dart';
import '../repositories/server_repository.dart';
import '../../data/providers/app_providers.dart';
import '../../core/services/auth_service.dart';

// Dashboard Stats Provider
final dashboardStatsProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  final alertRepo = ref.watch(alertRepositoryProvider);
  final cameraRepo = ref.watch(cameraRepositoryProvider);
  final serverRepo = ref.watch(serverRepositoryProvider);
  final currentUser = await ref.watch(currentUserProvider.future);
  
  final organizationId = currentUser?.organizationId;
  
  try {
    // Fetch stats in parallel
    final alertsStats = await alertRepo.getAlertStats(organizationId: organizationId);
    final cameras = await cameraRepo.getCameras(organizationId: organizationId);
    final servers = await serverRepo.getServers(organizationId: organizationId);
    
    // Calculate stats
    final onlineCameras = cameras.where((c) => c.isOnline).length;
    final newAlerts = alertsStats['new'] ?? 0;
    final totalAlerts = alertsStats['total'] ?? 0;
    final onlineServers = servers.where((s) => s.isOnline).length;
    
    return {
      'cameras': {
        'total': cameras.length,
        'online': onlineCameras,
        'offline': cameras.length - onlineCameras,
      },
      'alerts': {
        'total': totalAlerts,
        'new': newAlerts,
        'critical': alertsStats['critical'] ?? 0,
        'high': alertsStats['high'] ?? 0,
      },
      'servers': {
        'total': servers.length,
        'online': onlineServers,
        'offline': servers.length - onlineServers,
      },
      'analytics': {
        'today': alertsStats['today'] ?? 0,
      },
    };
  } catch (e) {
    throw Exception('Failed to load dashboard stats: $e');
  }
});

// Alerts Provider
final alertsProvider = FutureProvider.family<List<AlertModel>, Map<String, dynamic>>((ref, filters) async {
  final alertRepo = ref.watch(alertRepositoryProvider);
  final currentUser = await ref.watch(currentUserProvider.future);
  
  try {
    final alerts = await alertRepo.getAlerts(
      page: filters['page'] as int?,
      limit: filters['limit'] as int? ?? 20,
      type: filters['type'] as String?,
      level: filters['level'] as String?,
      status: filters['status'] as String?,
      startDate: filters['startDate'] as DateTime?,
      endDate: filters['endDate'] as DateTime?,
      organizationId: currentUser?.organizationId,
    );
    
    return alerts;
  } catch (e) {
    throw Exception('Failed to load alerts: $e');
  }
});

// Recent Alerts Provider (for home screen)
final recentAlertsProvider = FutureProvider<List<AlertModel>>((ref) async {
  final alertRepo = ref.watch(alertRepositoryProvider);
  final currentUser = await ref.watch(currentUserProvider.future);
  
  try {
    final alerts = await alertRepo.getAlerts(
      limit: 5,
      organizationId: currentUser?.organizationId,
    );
    
    return alerts;
  } catch (e) {
    return [];
  }
});

// Cameras Provider
final camerasProvider = FutureProvider.family<List<CameraModel>, Map<String, dynamic>>((ref, filters) async {
  final cameraRepo = ref.watch(cameraRepositoryProvider);
  final currentUser = await ref.watch(currentUserProvider.future);
  
  try {
    final cameras = await cameraRepo.getCameras(
      page: filters['page'] as int?,
      limit: filters['limit'] as int? ?? 20,
      isOnline: filters['isOnline'] as bool?,
      organizationId: currentUser?.organizationId,
    );
    
    return cameras;
  } catch (e) {
    throw Exception('Failed to load cameras: $e');
  }
});

// Recent Cameras Provider (for home screen)
final recentCamerasProvider = FutureProvider<List<CameraModel>>((ref) async {
  final cameraRepo = ref.watch(cameraRepositoryProvider);
  final currentUser = await ref.watch(currentUserProvider.future);
  
  try {
    final cameras = await cameraRepo.getCameras(
      limit: 4,
      organizationId: currentUser?.organizationId,
    );
    
    return cameras;
  } catch (e) {
    return [];
  }
});

// Servers Provider
final serversProvider = FutureProvider<List<ServerModel>>((ref) async {
  final serverRepo = ref.watch(serverRepositoryProvider);
  final currentUser = await ref.watch(currentUserProvider.future);
  
  try {
    final servers = await serverRepo.getServers(
      organizationId: currentUser?.organizationId,
    );
    
    return servers;
  } catch (e) {
    throw Exception('Failed to load servers: $e');
  }
});

// Single Alert Provider
final alertProvider = FutureProvider.family<AlertModel?, String>((ref, alertId) async {
  final alertRepo = ref.watch(alertRepositoryProvider);
  
  try {
    return await alertRepo.getAlertById(alertId);
  } catch (e) {
    return null;
  }
});

// Single Camera Provider
final cameraProvider = FutureProvider.family<CameraModel?, String>((ref, cameraId) async {
  final cameraRepo = ref.watch(cameraRepositoryProvider);
  
  try {
    return await cameraRepo.getCameraById(cameraId);
  } catch (e) {
    return null;
  }
});



