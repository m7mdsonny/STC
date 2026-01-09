"""
Cameras Screen - Full implementation with Cloud data
"""
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';
import '../../data/providers/data_providers.dart';
import '../../data/models/camera_model.dart';
import '../../shared/widgets/app_loading.dart';
import '../../shared/widgets/app_error.dart';
import '../../shared/widgets/app_empty_state.dart';

class CamerasScreen extends ConsumerStatefulWidget {
  const CamerasScreen({super.key});

  @override
  ConsumerState<CamerasScreen> createState() => _CamerasScreenState();
}

class _CamerasScreenState extends ConsumerState<CamerasScreen> {
  String _viewMode = 'grid'; // grid or list
  bool _showOnlineOnly = false;

  @override
  Widget build(BuildContext context) {
    final filters = {
      'isOnline': _showOnlineOnly ? true : null,
      'limit': 100,
    };

    final camerasAsync = ref.watch(camerasProvider(filters));

    return Scaffold(
      appBar: AppBar(
        title: const Text('الكاميرات'),
        actions: [
          IconButton(
            icon: Icon(_viewMode == 'grid' ? Icons.view_list : Icons.grid_view),
            onPressed: () {
              setState(() {
                _viewMode = _viewMode == 'grid' ? 'list' : 'grid';
              });
            },
          ),
          PopupMenuButton(
            itemBuilder: (context) => [
              CheckedPopupMenuItem(
                checked: _showOnlineOnly,
                value: !_showOnlineOnly,
                child: const Text('عرض المتصلة فقط'),
                onTap: () {
                  setState(() {
                    _showOnlineOnly = !_showOnlineOnly;
                  });
                },
              ),
            ],
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              ref.invalidate(camerasProvider(filters));
            },
          ),
        ],
      ),
      body: camerasAsync.when(
        data: (cameras) {
          if (cameras.isEmpty) {
            return AppEmptyState(
              icon: Icons.videocam_off,
              title: 'لا توجد كاميرات',
              message: 'لا توجد كاميرات متاحة حالياً',
            );
          }

          return RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(camerasProvider(filters));
            },
            child: _viewMode == 'grid'
                ? _buildGridView(cameras)
                : _buildListView(cameras),
          );
        },
        loading: () => const AppLoading(),
        error: (error, stack) => AppError(
          message: error.toString(),
          onRetry: () {
            ref.invalidate(camerasProvider(filters));
          },
        ),
      ),
    );
  }

  Widget _buildGridView(List<CameraModel> cameras) {
    return GridView.builder(
      padding: const EdgeInsets.all(16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 0.85,
      ),
      itemCount: cameras.length,
      itemBuilder: (context, index) {
        final camera = cameras[index];
        return _buildCameraCard(camera, isGrid: true);
      },
    );
  }

  Widget _buildListView(List<CameraModel> cameras) {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: cameras.length,
      itemBuilder: (context, index) {
        final camera = cameras[index];
        return _buildCameraCard(camera, isGrid: false);
      },
    );
  }

  Widget _buildCameraCard(CameraModel camera, {required bool isGrid}) {
    final statusColor = camera.isOnline ? AppColors.online : AppColors.offline;
    final statusText = camera.isOnline ? 'متصل' : 'غير متصل';

    if (isGrid) {
      return Card(
        child: InkWell(
          onTap: () => _showCameraDetails(camera),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Stack(
                  children: [
                    Container(
                      width: double.infinity,
                      decoration: BoxDecoration(
                        color: Colors.grey[200],
                        borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
                      ),
                      child: camera.thumbnail != null
                          ? Image.network(
                              camera.thumbnail!,
                              fit: BoxFit.cover,
                              errorBuilder: (context, error, stackTrace) {
                                return const Center(
                                  child: Icon(Icons.videocam, size: 48, color: Colors.grey),
                                );
                              },
                            )
                          : const Center(
                              child: Icon(Icons.videocam, size: 48, color: Colors.grey),
                            ),
                    ),
                    Positioned(
                      top: 8,
                      right: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: statusColor,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          statusText,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      camera.name,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      camera.location,
                      style: Theme.of(context).textTheme.bodySmall,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    if (camera.modules.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 4,
                        children: camera.modules.take(2).map((module) {
                          return Chip(
                            label: Text(
                              module,
                              style: const TextStyle(fontSize: 10),
                            ),
                            padding: EdgeInsets.zero,
                            materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                          );
                        }).toList(),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
      );
    } else {
      return Card(
        margin: const EdgeInsets.only(bottom: 12),
        child: ListTile(
          leading: Stack(
            children: [
              Container(
                width: 60,
                height: 60,
                decoration: BoxDecoration(
                  color: Colors.grey[200],
                  borderRadius: BorderRadius.circular(8),
                ),
                child: camera.thumbnail != null
                    ? ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: Image.network(
                          camera.thumbnail!,
                          fit: BoxFit.cover,
                          errorBuilder: (context, error, stackTrace) {
                            return const Icon(Icons.videocam, color: Colors.grey);
                          },
                        ),
                      )
                    : const Icon(Icons.videocam, color: Colors.grey),
              ),
              Positioned(
                bottom: 0,
                right: 0,
                child: Container(
                  width: 12,
                  height: 12,
                  decoration: BoxDecoration(
                    color: statusColor,
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white, width: 2),
                  ),
                ),
              ),
            ],
          ),
          title: Text(camera.name),
          subtitle: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(camera.location),
              if (camera.modules.isNotEmpty)
                Text(
                  camera.modules.join(', '),
                  style: Theme.of(context).textTheme.bodySmall,
                ),
            ],
          ),
          trailing: const Icon(Icons.chevron_right),
          onTap: () => _showCameraDetails(camera),
        ),
      );
    }
  }

  void _showCameraDetails(CameraModel camera) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => _CameraDetailsSheet(camera: camera),
    );
  }
}

class _CameraDetailsSheet extends ConsumerWidget {
  final CameraModel camera;

  const _CameraDetailsSheet({required this.camera});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return DraggableScrollableSheet(
      initialChildSize: 0.9,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      builder: (context, scrollController) {
        return SingleChildScrollView(
          controller: scrollController,
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(
                    color: Colors.grey[300],
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              Text(
                camera.name,
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: 24),
              _buildDetailRow('الموقع', camera.location),
              _buildDetailRow('الحالة', camera.isOnline ? 'متصل' : 'غير متصل'),
              _buildDetailRow('السيرفر', camera.serverName ?? camera.serverId),
              if (camera.modules.isNotEmpty)
                _buildDetailRow('الوحدات', camera.modules.join(', ')),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () {
                    // Navigate to live view
                    Navigator.pop(context);
                    // context.push('/cameras/${camera.id}/live');
                  },
                  icon: const Icon(Icons.play_arrow),
                  label: const Text('عرض مباشر'),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(
              label,
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
          ),
          Expanded(child: Text(value)),
        ],
      ),
    );
  }
}



