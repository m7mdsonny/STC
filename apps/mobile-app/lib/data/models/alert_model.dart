import 'dart:convert';

enum AlertLevel {
  critical,
  high,
  medium,
  low;

  String get displayName {
    switch (this) {
      case AlertLevel.critical:
        return 'حرج';
      case AlertLevel.high:
        return 'عالي';
      case AlertLevel.medium:
        return 'متوسط';
      case AlertLevel.low:
        return 'منخفض';
    }
  }
}

enum AlertStatus {
  newAlert,
  acknowledged,
  resolved;

  String get displayName {
    switch (this) {
      case AlertStatus.newAlert:
        return 'جديد';
      case AlertStatus.acknowledged:
        return 'تم الإقرار';
      case AlertStatus.resolved:
        return 'تم الحل';
    }
  }
}

enum AlertType {
  fire,
  intrusion,
  unknownFace,
  vehicle,
  peopleCount,
  other;

  String get displayName {
    switch (this) {
      case AlertType.fire:
        return 'حريق';
      case AlertType.intrusion:
        return 'تسلل';
      case AlertType.unknownFace:
        return 'وجه غير معروف';
      case AlertType.vehicle:
        return 'مركبة';
      case AlertType.peopleCount:
        return 'عدد الأشخاص';
      case AlertType.other:
        return 'أخرى';
    }
  }
}

class AlertModel {
  final String id;
  final String type;
  final String title;
  final String description;
  final String cameraId;
  final String? cameraName;
  final AlertLevel level;
  final AlertStatus status;
  final String? imageUrl;
  final String? videoClipUrl;
  final DateTime timestamp;
  final DateTime? acknowledgedAt;
  final DateTime? resolvedAt;
  final String? acknowledgedBy;
  final String? resolvedBy;
  final Map<String, dynamic>? metadata;

  AlertModel({
    required this.id,
    required this.type,
    required this.title,
    required this.description,
    required this.cameraId,
    this.cameraName,
    required this.level,
    required this.status,
    this.imageUrl,
    this.videoClipUrl,
    required this.timestamp,
    this.acknowledgedAt,
    this.resolvedAt,
    this.acknowledgedBy,
    this.resolvedBy,
    this.metadata,
  });

  factory AlertModel.fromJson(Map<String, dynamic> json) {
    return AlertModel(
      id: json['id'] ?? '',
      type: json['type'] ?? '',
      title: json['title'] ?? '',
      description: json['description'] ?? '',
      cameraId: json['camera_id'] ?? json['cameraId'] ?? '',
      cameraName: json['camera_name'] ?? json['cameraName'],
      level: _parseAlertLevel(json['level'] ?? 'medium'),
      status: _parseAlertStatus(json['status'] ?? 'new'),
      imageUrl: json['image_url'] ?? json['imageUrl'],
      videoClipUrl: json['video_clip_url'] ?? json['videoClipUrl'],
      timestamp: json['timestamp'] != null
          ? DateTime.parse(json['timestamp'])
          : DateTime.now(),
      acknowledgedAt: json['acknowledged_at'] != null
          ? DateTime.parse(json['acknowledged_at'])
          : null,
      resolvedAt: json['resolved_at'] != null
          ? DateTime.parse(json['resolved_at'])
          : null,
      acknowledgedBy: json['acknowledged_by'] ?? json['acknowledgedBy'],
      resolvedBy: json['resolved_by'] ?? json['resolvedBy'],
      metadata: json['metadata'],
    );
  }

  static AlertLevel _parseAlertLevel(String level) {
    switch (level.toLowerCase()) {
      case 'critical':
        return AlertLevel.critical;
      case 'high':
        return AlertLevel.high;
      case 'medium':
        return AlertLevel.medium;
      case 'low':
        return AlertLevel.low;
      default:
        return AlertLevel.medium;
    }
  }

  static AlertStatus _parseAlertStatus(String status) {
    switch (status.toLowerCase()) {
      case 'new':
        return AlertStatus.newAlert;
      case 'acknowledged':
        return AlertStatus.acknowledged;
      case 'resolved':
        return AlertStatus.resolved;
      default:
        return AlertStatus.newAlert;
    }
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'type': type,
      'title': title,
      'description': description,
      'camera_id': cameraId,
      'camera_name': cameraName,
      'level': level.name,
      'status': status.name,
      'image_url': imageUrl,
      'video_clip_url': videoClipUrl,
      'timestamp': timestamp.toIso8601String(),
      'acknowledged_at': acknowledgedAt?.toIso8601String(),
      'resolved_at': resolvedAt?.toIso8601String(),
      'acknowledged_by': acknowledgedBy,
      'resolved_by': resolvedBy,
      'metadata': metadata,
    };
  }

  String toJsonString() => json.encode(toJson());

  factory AlertModel.fromJsonString(String jsonString) {
    return AlertModel.fromJson(json.decode(jsonString));
  }

  AlertModel copyWith({
    String? id,
    String? type,
    String? title,
    String? description,
    String? cameraId,
    String? cameraName,
    AlertLevel? level,
    AlertStatus? status,
    String? imageUrl,
    String? videoClipUrl,
    DateTime? timestamp,
    DateTime? acknowledgedAt,
    DateTime? resolvedAt,
    String? acknowledgedBy,
    String? resolvedBy,
    Map<String, dynamic>? metadata,
  }) {
    return AlertModel(
      id: id ?? this.id,
      type: type ?? this.type,
      title: title ?? this.title,
      description: description ?? this.description,
      cameraId: cameraId ?? this.cameraId,
      cameraName: cameraName ?? this.cameraName,
      level: level ?? this.level,
      status: status ?? this.status,
      imageUrl: imageUrl ?? this.imageUrl,
      videoClipUrl: videoClipUrl ?? this.videoClipUrl,
      timestamp: timestamp ?? this.timestamp,
      acknowledgedAt: acknowledgedAt ?? this.acknowledgedAt,
      resolvedAt: resolvedAt ?? this.resolvedAt,
      acknowledgedBy: acknowledgedBy ?? this.acknowledgedBy,
      resolvedBy: resolvedBy ?? this.resolvedBy,
      metadata: metadata ?? this.metadata,
    );
  }

  bool get isNew => status == AlertStatus.newAlert;
  bool get isAcknowledged => status == AlertStatus.acknowledged;
  bool get isResolved => status == AlertStatus.resolved;
  bool get isCritical => level == AlertLevel.critical;
  bool get hasImage => imageUrl != null && imageUrl!.isNotEmpty;
  bool get hasVideo => videoClipUrl != null && videoClipUrl!.isNotEmpty;
}
