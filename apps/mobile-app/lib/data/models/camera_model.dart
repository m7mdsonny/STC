import 'dart:convert';

class CameraModel {
  final String id;
  final String name;
  final String rtspUrl;
  final String? hlsUrl;
  final String location;
  final String serverId;
  final String? serverName;
  final bool isOnline;
  final List<String> modules;
  final String? thumbnail;
  final DateTime? lastSeen;
  final DateTime? createdAt;

  CameraModel({
    required this.id,
    required this.name,
    required this.rtspUrl,
    this.hlsUrl,
    required this.location,
    required this.serverId,
    this.serverName,
    required this.isOnline,
    required this.modules,
    this.thumbnail,
    this.lastSeen,
    this.createdAt,
  });

  factory CameraModel.fromJson(Map<String, dynamic> json) {
    return CameraModel(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      rtspUrl: json['rtsp_url'] ?? json['rtspUrl'] ?? '',
      hlsUrl: json['hls_url'] ?? json['hlsUrl'],
      location: json['location'] ?? '',
      serverId: json['server_id'] ?? json['serverId'] ?? '',
      serverName: json['server_name'] ?? json['serverName'],
      isOnline: json['is_online'] ?? json['isOnline'] ?? false,
      modules: json['modules'] != null
          ? List<String>.from(json['modules'])
          : [],
      thumbnail: json['thumbnail'],
      lastSeen: json['last_seen'] != null
          ? DateTime.parse(json['last_seen'])
          : null,
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'rtsp_url': rtspUrl,
      'hls_url': hlsUrl,
      'location': location,
      'server_id': serverId,
      'server_name': serverName,
      'is_online': isOnline,
      'modules': modules,
      'thumbnail': thumbnail,
      'last_seen': lastSeen?.toIso8601String(),
      'created_at': createdAt?.toIso8601String(),
    };
  }

  String toJsonString() => json.encode(toJson());

  factory CameraModel.fromJsonString(String jsonString) {
    return CameraModel.fromJson(json.decode(jsonString));
  }

  CameraModel copyWith({
    String? id,
    String? name,
    String? rtspUrl,
    String? hlsUrl,
    String? location,
    String? serverId,
    String? serverName,
    bool? isOnline,
    List<String>? modules,
    String? thumbnail,
    DateTime? lastSeen,
    DateTime? createdAt,
  }) {
    return CameraModel(
      id: id ?? this.id,
      name: name ?? this.name,
      rtspUrl: rtspUrl ?? this.rtspUrl,
      hlsUrl: hlsUrl ?? this.hlsUrl,
      location: location ?? this.location,
      serverId: serverId ?? this.serverId,
      serverName: serverName ?? this.serverName,
      isOnline: isOnline ?? this.isOnline,
      modules: modules ?? this.modules,
      thumbnail: thumbnail ?? this.thumbnail,
      lastSeen: lastSeen ?? this.lastSeen,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  bool get hasModule => modules.isNotEmpty;
  bool get hasFaceRecognition => modules.contains('face_recognition');
  bool get hasVehicleRecognition => modules.contains('vehicle_recognition');
  bool get hasIntrusionDetection => modules.contains('intrusion_detection');
  bool get hasFireDetection => modules.contains('fire_detection');
}
