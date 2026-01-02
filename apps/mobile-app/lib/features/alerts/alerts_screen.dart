"""
Alerts Screen - Full implementation with Cloud data
"""
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:timeago/timeago.dart' as timeago;
import 'package:intl/intl.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_strings.dart';
import '../../data/providers/data_providers.dart';
import '../../data/models/alert_model.dart';
import '../../shared/widgets/app_loading.dart';
import '../../shared/widgets/app_error.dart';
import '../../shared/widgets/app_empty_state.dart';

class AlertsScreen extends ConsumerStatefulWidget {
  const AlertsScreen({super.key});

  @override
  ConsumerState<AlertsScreen> createState() => _AlertsScreenState();
}

class _AlertsScreenState extends ConsumerState<AlertsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  String _selectedFilter = 'all'; // all, new, acknowledged, resolved
  String? _selectedLevel; // critical, high, medium, low
  String? _selectedType; // fire, intrusion, etc.

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _tabController.addListener(() {
      setState(() {
        _selectedFilter = ['all', 'new', 'acknowledged', 'resolved'][_tabController.index];
      });
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final filters = {
      'status': _selectedFilter == 'all' ? null : _selectedFilter,
      'level': _selectedLevel,
      'type': _selectedType,
      'limit': 50,
    };

    final alertsAsync = ref.watch(alertsProvider(filters));

    return Scaffold(
      appBar: AppBar(
        title: const Text('التنبيهات'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'الكل'),
            Tab(text: 'جديدة'),
            Tab(text: 'مقرة'),
            Tab(text: 'محلولة'),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.filter_list),
            onPressed: () => _showFilterDialog(),
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              ref.invalidate(alertsProvider(filters));
            },
          ),
        ],
      ),
      body: alertsAsync.when(
        data: (alerts) {
          if (alerts.isEmpty) {
            return AppEmptyState(
              icon: Icons.notifications_none,
              title: 'لا توجد تنبيهات',
              message: 'لا توجد تنبيهات لعرضها حالياً',
            );
          }

          return RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(alertsProvider(filters));
            },
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: alerts.length,
              itemBuilder: (context, index) {
                final alert = alerts[index];
                return _buildAlertCard(alert);
              },
            ),
          );
        },
        loading: () => const AppLoading(),
        error: (error, stack) => AppError(
          message: error.toString(),
          onRetry: () {
            ref.invalidate(alertsProvider(filters));
          },
        ),
      ),
    );
  }

  Widget _buildAlertCard(AlertModel alert) {
    final levelColor = _getLevelColor(alert.level);
    final statusColor = _getStatusColor(alert.status);

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: () => _showAlertDetails(alert),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: levelColor.withOpacity(0.1),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      _getAlertIcon(alert.type),
                      color: levelColor,
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          alert.title,
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                fontWeight: FontWeight.bold,
                              ),
                        ),
                        if (alert.cameraName != null)
                          Text(
                            alert.cameraName!,
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: statusColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      alert.status.displayName,
                      style: TextStyle(
                        color: statusColor,
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
              if (alert.description.isNotEmpty) ...[
                const SizedBox(height: 8),
                Text(
                  alert.description,
                  style: Theme.of(context).textTheme.bodyMedium,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
              const SizedBox(height: 12),
              Row(
                children: [
                  Icon(Icons.access_time, size: 16, color: Colors.grey[600]),
                  const SizedBox(width: 4),
                  Text(
                    timeago.format(alert.timestamp, locale: 'ar'),
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Colors.grey[600],
                        ),
                  ),
                  const Spacer(),
                  if (alert.hasImage)
                    Icon(Icons.image, size: 16, color: Colors.grey[600]),
                  if (alert.hasVideo) ...[
                    const SizedBox(width: 8),
                    Icon(Icons.videocam, size: 16, color: Colors.grey[600]),
                  ],
                ],
              ),
              if (alert.isNew) ...[
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    TextButton.icon(
                      onPressed: () => _acknowledgeAlert(alert),
                      icon: const Icon(Icons.check, size: 18),
                      label: const Text('إقرار'),
                    ),
                    const SizedBox(width: 8),
                    TextButton.icon(
                      onPressed: () => _resolveAlert(alert),
                      icon: const Icon(Icons.done_all, size: 18),
                      label: const Text('حل'),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Color _getLevelColor(AlertLevel level) {
    switch (level) {
      case AlertLevel.critical:
        return AppColors.criticalRed;
      case AlertLevel.high:
        return Colors.orange;
      case AlertLevel.medium:
        return Colors.amber;
      case AlertLevel.low:
        return Colors.blue;
    }
  }

  Color _getStatusColor(AlertStatus status) {
    switch (status) {
      case AlertStatus.newAlert:
        return Colors.red;
      case AlertStatus.acknowledged:
        return Colors.orange;
      case AlertStatus.resolved:
        return Colors.green;
    }
  }

  IconData _getAlertIcon(String type) {
    switch (type.toLowerCase()) {
      case 'fire':
      case 'fire_detected':
        return Icons.local_fire_department;
      case 'intrusion':
        return Icons.warning;
      case 'unknown_face':
        return Icons.face;
      case 'vehicle':
      case 'unknown_vehicle':
        return Icons.directions_car;
      case 'people_count':
      case 'crowd':
        return Icons.people;
      default:
        return Icons.notifications;
    }
  }

  void _showAlertDetails(AlertModel alert) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => _AlertDetailsSheet(alert: alert),
    );
  }

  Future<void> _acknowledgeAlert(AlertModel alert) async {
    try {
      final alertRepo = ref.read(alertRepositoryProvider);
      final currentUser = await ref.read(currentUserProvider.future);
      
      if (currentUser == null) return;
      
      await alertRepo.acknowledgeAlert(alert.id, currentUser.id);
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('تم إقرار التنبيه')),
        );
        ref.invalidate(alertsProvider({}));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('خطأ: ${e.toString()}')),
        );
      }
    }
  }

  Future<void> _resolveAlert(AlertModel alert) async {
    try {
      final alertRepo = ref.read(alertRepositoryProvider);
      await alertRepo.resolveAlert(alert.id);
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('تم حل التنبيه')),
        );
        ref.invalidate(alertsProvider({}));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('خطأ: ${e.toString()}')),
        );
      }
    }
  }

  void _showFilterDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('تصفية التنبيهات'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            DropdownButtonFormField<String>(
              value: _selectedLevel,
              decoration: const InputDecoration(labelText: 'مستوى الخطورة'),
              items: [
                const DropdownMenuItem(value: null, child: Text('الكل')),
                const DropdownMenuItem(value: 'critical', child: Text('حرج')),
                const DropdownMenuItem(value: 'high', child: Text('عالي')),
                const DropdownMenuItem(value: 'medium', child: Text('متوسط')),
                const DropdownMenuItem(value: 'low', child: Text('منخفض')),
              ],
              onChanged: (value) {
                setState(() => _selectedLevel = value);
              },
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              value: _selectedType,
              decoration: const InputDecoration(labelText: 'نوع التنبيه'),
              items: [
                const DropdownMenuItem(value: null, child: Text('الكل')),
                const DropdownMenuItem(value: 'fire', child: Text('حريق')),
                const DropdownMenuItem(value: 'intrusion', child: Text('تسلل')),
                const DropdownMenuItem(value: 'unknown_face', child: Text('وجه غير معروف')),
                const DropdownMenuItem(value: 'vehicle', child: Text('مركبة')),
              ],
              onChanged: (value) {
                setState(() => _selectedType = value);
              },
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              setState(() {
                _selectedLevel = null;
                _selectedType = null;
              });
              Navigator.pop(context);
              ref.invalidate(alertsProvider({}));
            },
            child: const Text('إعادة تعيين'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              ref.invalidate(alertsProvider({}));
            },
            child: const Text('تطبيق'),
          ),
        ],
      ),
    );
  }
}

class _AlertDetailsSheet extends StatelessWidget {
  final AlertModel alert;

  const _AlertDetailsSheet({required this.alert});

  @override
  Widget build(BuildContext context) {
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
                alert.title,
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: 16),
              _buildDetailRow('الكاميرا', alert.cameraName ?? alert.cameraId),
              _buildDetailRow('النوع', alert.type),
              _buildDetailRow('المستوى', alert.level.displayName),
              _buildDetailRow('الحالة', alert.status.displayName),
              _buildDetailRow('الوقت', DateFormat('yyyy-MM-dd HH:mm:ss').format(alert.timestamp)),
              if (alert.description.isNotEmpty) ...[
                const SizedBox(height: 16),
                Text(
                  'الوصف',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
                const SizedBox(height: 8),
                Text(alert.description),
              ],
              if (alert.hasImage || alert.hasVideo) ...[
                const SizedBox(height: 24),
                Text(
                  'الوسائط',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
                const SizedBox(height: 12),
                if (alert.hasImage)
                  Image.network(alert.imageUrl!),
                if (alert.hasVideo)
                  const Text('فيديو متاح'),
              ],
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



