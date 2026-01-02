import '../../core/services/api_service.dart';
import '../models/camera_model.dart';

class CameraRepository {
  final ApiService _api;

  CameraRepository({required ApiService api}) : _api = api;

  Future<List<CameraModel>> getCameras({
    int? page,
    int? limit,
    bool? isOnline,
    String? organizationId,
  }) async {
    try {
      final params = <String, dynamic>{};
      if (page != null) params['page'] = page;
      if (limit != null) params['per_page'] = limit;
      if (isOnline != null) params['status'] = isOnline ? 'online' : 'offline';
      if (organizationId != null) params['organization_id'] = organizationId;

      final response = await _api.get('/cameras', queryParameters: params);
      final data = response.data;

      if (data is Map && data.containsKey('data')) {
        return (data['data'] as List)
            .map((json) => CameraModel.fromJson(json))
            .toList();
      }

      return (data as List).map((json) => CameraModel.fromJson(json)).toList();
    } catch (e) {
      rethrow;
    }
  }

  Future<CameraModel?> getCameraById(String id) async {
    try {
      final response = await _api.get('/cameras/$id');
      final data = response.data;
      if (data == null) return null;
      return CameraModel.fromJson(data);
    } catch (e) {
      rethrow;
    }
  }

  Future<Map<String, dynamic>> getCameraStats({String? organizationId}) async {
    try {
      final params = <String, dynamic>{};
      if (organizationId != null) params['organization_id'] = organizationId;

      final response = await _api.get('/cameras/stats', queryParameters: params);
      return response.data as Map<String, dynamic>;
    } catch (e) {
      rethrow;
    }
  }
}
