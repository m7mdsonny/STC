import '../../core/services/api_service.dart';
import '../models/alert_model.dart';

class AlertRepository {
  final ApiService _api;

  AlertRepository({required ApiService api}) : _api = api;

  Future<List<AlertModel>> getAlerts({
    int? page,
    int? limit,
    String? type,
    String? level,
    String? status,
    DateTime? startDate,
    DateTime? endDate,
    String? organizationId,
  }) async {
    try {
      final params = <String, dynamic>{};
      if (page != null) params['page'] = page;
      if (limit != null) params['per_page'] = limit;
      if (type != null) params['module'] = type;
      if (level != null) params['severity'] = level;
      if (status != null) params['status'] = status;
      if (startDate != null) params['from'] = startDate.toIso8601String();
      if (endDate != null) params['to'] = endDate.toIso8601String();
      if (organizationId != null) params['organization_id'] = organizationId;

      final response = await _api.get('/alerts', queryParameters: params);
      final data = response.data;

      if (data is Map && data.containsKey('data')) {
        return (data['data'] as List)
            .map((json) => AlertModel.fromJson(json))
            .toList();
      }

      return (data as List).map((json) => AlertModel.fromJson(json)).toList();
    } catch (e) {
      rethrow;
    }
  }

  Future<AlertModel?> getAlertById(String id) async {
    try {
      final response = await _api.get('/alerts/$id');
      final data = response.data;
      if (data == null) return null;
      return AlertModel.fromJson(data);
    } catch (e) {
      rethrow;
    }
  }

  Future<AlertModel> acknowledgeAlert(String id, String userId) async {
    try {
      final response = await _api.post('/alerts/$id/acknowledge');
      return AlertModel.fromJson(response.data);
    } catch (e) {
      rethrow;
    }
  }

  Future<AlertModel> resolveAlert(String id) async {
    try {
      final response = await _api.post('/alerts/$id/resolve');
      return AlertModel.fromJson(response.data);
    } catch (e) {
      rethrow;
    }
  }

  Future<Map<String, dynamic>> getAlertStats({String? organizationId}) async {
    try {
      final params = <String, dynamic>{};
      if (organizationId != null) params['organization_id'] = organizationId;

      final response = await _api.get('/alerts/stats', queryParameters: params);
      return response.data as Map<String, dynamic>;
    } catch (e) {
      rethrow;
    }
  }
}
