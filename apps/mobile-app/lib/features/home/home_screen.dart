import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_strings.dart';
import '../../data/providers/app_providers.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  int _selectedIndex = 0;

  final List<Map<String, dynamic>> _navItems = [
    {'icon': Icons.home, 'label': AppStrings.home, 'route': '/home'},
    {'icon': Icons.videocam, 'label': AppStrings.cameras, 'route': '/cameras'},
    {'icon': Icons.notifications_active, 'label': AppStrings.alerts, 'route': '/alerts'},
    {'icon': Icons.analytics, 'label': AppStrings.analytics, 'route': '/analytics'},
    {'icon': Icons.settings, 'label': AppStrings.settings, 'route': '/settings'},
  ];

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final currentUser = ref.watch(currentUserProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(AppStrings.appName),
        actions: [
          IconButton(
            icon: Icon(isDark ? Icons.light_mode : Icons.dark_mode),
            onPressed: () {
              ref.read(themeModeProvider.notifier).toggleTheme();
            },
          ),
          IconButton(
            icon: const Icon(Icons.notifications_outlined),
            onPressed: () {},
          ),
        ],
      ),
      body: _selectedIndex == 0 ? _buildHomeContent() : const Center(child: Text('قيد التطوير')),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _selectedIndex,
        onTap: (index) {
          setState(() => _selectedIndex = index);
          if (index > 0) {
            context.go(_navItems[index]['route']);
          }
        },
        type: BottomNavigationBarType.fixed,
        items: _navItems
            .map((item) => BottomNavigationBarItem(
                  icon: Icon(item['icon']),
                  label: item['label'],
                ))
            .toList(),
      ),
    );
  }

  Widget _buildHomeContent() {
    final statsAsync = ref.watch(dashboardStatsProvider);
    final recentAlertsAsync = ref.watch(recentAlertsProvider);
    final recentCamerasAsync = ref.watch(recentCamerasProvider);
    final currentUserAsync = ref.watch(currentUserProvider);

    return RefreshIndicator(
      onRefresh: () async {
        ref.invalidate(dashboardStatsProvider);
        ref.invalidate(recentAlertsProvider);
        ref.invalidate(recentCamerasProvider);
        await Future.delayed(const Duration(seconds: 1));
      },
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            currentUserAsync.when(
              data: (user) => Text(
                'مرحباً ${user?.name ?? ""}',
                style: Theme.of(context).textTheme.headlineMedium,
              ),
              loading: () => const SizedBox.shrink(),
              error: (_, __) => Text(
                'مرحباً بك',
                style: Theme.of(context).textTheme.headlineMedium,
              ),
            ),
            const SizedBox(height: 24),
            statsAsync.when(
              data: (stats) => Column(
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: _buildStatCard(
                          title: 'الكاميرات المتصلة',
                          value: '${stats['cameras']?['online'] ?? 0}',
                          total: '${stats['cameras']?['total'] ?? 0}',
                          icon: Icons.videocam,
                          color: AppColors.online,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _buildStatCard(
                          title: 'التنبيهات الجديدة',
                          value: '${stats['alerts']?['new'] ?? 0}',
                          icon: Icons.notifications_active,
                          color: AppColors.criticalRed,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: _buildStatCard(
                          title: 'السيرفرات',
                          value: '${stats['servers']?['online'] ?? 0}',
                          total: '${stats['servers']?['total'] ?? 0}',
                          icon: Icons.dns,
                          color: AppColors.online,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _buildStatCard(
                          title: 'التحليلات اليوم',
                          value: '${stats['analytics']?['today'] ?? 0}',
                          icon: Icons.analytics,
                          color: AppColors.info,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              loading: () => const SizedBox(
                height: 200,
                child: Center(child: CircularProgressIndicator()),
              ),
              error: (_, __) => const SizedBox.shrink(),
            ),
            const SizedBox(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'آخر التنبيهات',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                TextButton(
                  onPressed: () => context.go('/alerts'),
                  child: const Text('عرض الكل'),
                ),
              ],
            ),
            const SizedBox(height: 12),
            recentAlertsAsync.when(
              data: (alerts) => _buildAlertsList(alerts),
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (_, __) => const Text('فشل تحميل التنبيهات'),
            ),
            const SizedBox(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'حالة الكاميرات',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                TextButton(
                  onPressed: () => context.go('/cameras'),
                  child: const Text('عرض الكل'),
                ),
              ],
            ),
            const SizedBox(height: 12),
            recentCamerasAsync.when(
              data: (cameras) => _buildCamerasList(cameras),
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (_, __) => const Text('فشل تحميل الكاميرات'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatCard({
    required String title,
    required String value,
    String? total,
    required IconData icon,
    required Color color,
  }) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(icon, color: color, size: 24),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              title,
              style: Theme.of(context).textTheme.bodySmall,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 4),
            Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  value,
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
                if (total != null) ...[
                  Text(
                    ' / $total',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAlertsList(List alerts) {
    if (alerts.isEmpty) {
      return const Card(
        child: Padding(
          padding: EdgeInsets.all(16.0),
          child: Center(child: Text('لا توجد تنبيهات جديدة')),
        ),
      );
    }

    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: alerts.length,
      itemBuilder: (context, index) {
        final alert = alerts[index];
        return Card(
          margin: const EdgeInsets.only(bottom: 8),
          child: ListTile(
            leading: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: _getAlertColor(alert.level).withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(
                _getAlertIcon(alert.type),
                color: _getAlertColor(alert.level),
              ),
            ),
            title: Text(alert.title),
            subtitle: Text(alert.cameraName ?? alert.cameraId),
            trailing: Text(_formatTimeAgo(alert.timestamp)),
            onTap: () => context.go('/alerts'),
          ),
        );
      },
    );
  }

  Widget _buildCamerasList(List cameras) {
    if (cameras.isEmpty) {
      return const Card(
        child: Padding(
          padding: EdgeInsets.all(16.0),
          child: Center(child: Text('لا توجد كاميرات')),
        ),
      );
    }

    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: cameras.length,
      itemBuilder: (context, index) {
        final camera = cameras[index];
        return Card(
          margin: const EdgeInsets.only(bottom: 8),
          child: ListTile(
            leading: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: (camera.isOnline ? AppColors.online : AppColors.offline)
                    .withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.videocam,
                color: camera.isOnline ? AppColors.online : AppColors.offline,
              ),
            ),
            title: Text(camera.name),
            subtitle: Text(camera.isOnline ? 'متصل' : 'غير متصل'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => context.go('/cameras'),
          ),
        );
      },
    );
  }

  Color _getAlertColor(alertLevel) {
    switch (alertLevel.toString()) {
      case 'AlertLevel.critical':
        return AppColors.criticalRed;
      case 'AlertLevel.high':
        return Colors.orange;
      default:
        return Colors.blue;
    }
  }

  IconData _getAlertIcon(String type) {
    switch (type.toLowerCase()) {
      case 'fire':
        return Icons.local_fire_department;
      case 'intrusion':
        return Icons.warning;
      default:
        return Icons.notifications;
    }
  }

  String _formatTimeAgo(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);

    if (difference.inMinutes < 1) {
      return 'الآن';
    } else if (difference.inMinutes < 60) {
      return 'منذ ${difference.inMinutes} دقيقة';
    } else if (difference.inHours < 24) {
      return 'منذ ${difference.inHours} ساعة';
    } else {
      return 'منذ ${difference.inDays} يوم';
    }
  }
}
