import '../../core/services/api_service.dart';
import '../models/server_model.dart';

class ServerRepository {
  final ApiService _api;

  ServerRepository({required ApiService api}) : _api = api;

  Future<List<ServerModel>> getServers({String? organizationId}) async {
    try {
      final params = <String, dynamic>{};
      if (organizationId != null) params['organization_id'] = organizationId;

      final response = await _api.get('/edge-servers', queryParameters: params);
      final data = response.data;

      if (data is Map && data.containsKey('data')) {
        return (data['data'] as List)
            .map((json) => ServerModel.fromJson(json))
            .toList();
      }

      return (data as List).map((json) => ServerModel.fromJson(json)).toList();
    } catch (e) {
      rethrow;
    }
  }

  Future<ServerModel?> getServerById(String id) async {
    try {
      final response = await _api.get('/edge-servers/$id');
      final data = response.data;
      if (data == null) return null;
      return ServerModel.fromJson(data);
    } catch (e) {
      rethrow;
    }
  }

  Future<Map<String, dynamic>> getServerStats({String? organizationId}) async {
    try {
      final params = <String, dynamic>{};
      if (organizationId != null) params['organization_id'] = organizationId;

      final response = await _api.get('/edge-servers/stats', queryParameters: params);
      return response.data as Map<String, dynamic>;
    } catch (e) {
      rethrow;
    }
  }
}
