import 'dart:convert';

class ServerModel {
  final String id;
  final String name;
  final String host;
  final int port;
  final bool isOnline;
  final String? version;
  final int? camerasCount;
  final double? cpuUsage;
  final double? memoryUsage;
  final double? diskUsage;
  final DateTime? lastSeen;
  final DateTime? createdAt;

  ServerModel({
    required this.id,
    required this.name,
    required this.host,
    required this.port,
    required this.isOnline,
    this.version,
    this.camerasCount,
    this.cpuUsage,
    this.memoryUsage,
    this.diskUsage,
    this.lastSeen,
    this.createdAt,
  });

  factory ServerModel.fromJson(Map<String, dynamic> json) {
    // Cloud API returns edge_servers with ip_address and online status
    final systemInfo = json['system_info'] as Map<String, dynamic>?;
    
    return ServerModel(
      id: json['id'] ?? json['edge_id'] ?? '',
      name: json['name'] ?? '',
      host: json['ip_address'] ?? json['host'] ?? '',
      port: json['port'] ?? 8080,
      isOnline: json['online'] ?? json['is_online'] ?? json['isOnline'] ?? false,
      version: json['version'],
      camerasCount: json['cameras_count'] ?? json['camerasCount'],
      cpuUsage: systemInfo?['cpu_percent']?.toDouble() ?? 
                json['cpu_usage']?.toDouble() ?? 
                json['cpuUsage']?.toDouble(),
      memoryUsage: systemInfo?['memory_used_percent']?.toDouble() ?? 
                   json['memory_usage']?.toDouble() ?? 
                   json['memoryUsage']?.toDouble(),
      diskUsage: systemInfo?['disk_used_percent']?.toDouble() ?? 
                 json['disk_usage']?.toDouble() ?? 
                 json['diskUsage']?.toDouble(),
      lastSeen: json['last_seen_at'] != null
          ? DateTime.parse(json['last_seen_at'])
          : (json['last_seen'] != null ? DateTime.parse(json['last_seen']) : null),
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'host': host,
      'port': port,
      'is_online': isOnline,
      'version': version,
      'cameras_count': camerasCount,
      'cpu_usage': cpuUsage,
      'memory_usage': memoryUsage,
      'disk_usage': diskUsage,
      'last_seen': lastSeen?.toIso8601String(),
      'created_at': createdAt?.toIso8601String(),
    };
  }

  String toJsonString() => json.encode(toJson());

  factory ServerModel.fromJsonString(String jsonString) {
    return ServerModel.fromJson(json.decode(jsonString));
  }

  ServerModel copyWith({
    String? id,
    String? name,
    String? host,
    int? port,
    bool? isOnline,
    String? version,
    int? camerasCount,
    double? cpuUsage,
    double? memoryUsage,
    double? diskUsage,
    DateTime? lastSeen,
    DateTime? createdAt,
  }) {
    return ServerModel(
      id: id ?? this.id,
      name: name ?? this.name,
      host: host ?? this.host,
      port: port ?? this.port,
      isOnline: isOnline ?? this.isOnline,
      version: version ?? this.version,
      camerasCount: camerasCount ?? this.camerasCount,
      cpuUsage: cpuUsage ?? this.cpuUsage,
      memoryUsage: memoryUsage ?? this.memoryUsage,
      diskUsage: diskUsage ?? this.diskUsage,
      lastSeen: lastSeen ?? this.lastSeen,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  String get fullAddress => '$host:$port';
  bool get hasMetrics => cpuUsage != null || memoryUsage != null || diskUsage != null;
  String get statusLabel => isOnline ? 'متصل' : 'غير متصل';
}
