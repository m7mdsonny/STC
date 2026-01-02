import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../data/providers/app_providers.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final storage = ref.watch(storageServiceProvider);

  return GoRouter(
    initialLocation: '/splash',
    redirect: (context, state) async {
      final token = await storage.getToken();
      final isAuthenticated = token != null && token.isNotEmpty;
      final isGoingToAuth = state.matchedLocation == '/login' ||
          state.matchedLocation == '/splash';

      if (!isAuthenticated && !isGoingToAuth) {
        return '/login';
      }

      if (isAuthenticated && state.matchedLocation == '/login') {
        return '/home';
      }

      return null;
    },
    routes: [
      GoRoute(
        path: '/splash',
        builder: (context, state) => const SplashScreen(),
      ),

      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),

      GoRoute(
        path: '/home',
        builder: (context, state) => const DashboardScreen(),
      ),

      GoRoute(
        path: '/live-view',
        builder: (context, state) => const LiveViewScreen(),
      ),

      GoRoute(
        path: '/alerts',
        builder: (context, state) => const AlertsScreen(),
        routes: [
          GoRoute(
            path: ':id',
            builder: (context, state) {
              final alertId = state.pathParameters['id']!;
              return AlertDetailScreen(alertId: alertId);
            },
          ),
        ],
      ),

      GoRoute(
        path: '/cameras',
        builder: (context, state) => const CamerasScreen(),
      ),

      GoRoute(
        path: '/people',
        builder: (context, state) => const PeopleScreen(),
      ),

      GoRoute(
        path: '/vehicles',
        builder: (context, state) => const VehiclesScreen(),
      ),

      GoRoute(
        path: '/analytics',
        builder: (context, state) => const AnalyticsScreen(),
      ),

      GoRoute(
        path: '/settings',
        builder: (context, state) => const SettingsScreen(),
      ),
    ],
    errorBuilder: (context, state) => const NotFoundScreen(),
  );
});

class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(
        child: CircularProgressIndicator(),
      ),
    );
  }
}

class LoginScreen extends StatelessWidget {
  const LoginScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(
        child: Text('Login Screen'),
      ),
    );
  }
}

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(
        child: Text('Dashboard Screen'),
      ),
    );
  }
}

class LiveViewScreen extends StatelessWidget {
  const LiveViewScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(
        child: Text('Live View Screen'),
      ),
    );
  }
}

class AlertsScreen extends StatelessWidget {
  const AlertsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(
        child: Text('Alerts Screen'),
      ),
    );
  }
}

class AlertDetailScreen extends StatelessWidget {
  final String alertId;
  const AlertDetailScreen({super.key, required this.alertId});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Alert Details')),
      body: Center(
        child: Text('Alert ID: $alertId'),
      ),
    );
  }
}

class CamerasScreen extends StatelessWidget {
  const CamerasScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(
        child: Text('Cameras Screen'),
      ),
    );
  }
}

class PeopleScreen extends StatelessWidget {
  const PeopleScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(
        child: Text('People Screen'),
      ),
    );
  }
}

class VehiclesScreen extends StatelessWidget {
  const VehiclesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(
        child: Text('Vehicles Screen'),
      ),
    );
  }
}

class AnalyticsScreen extends StatelessWidget {
  const AnalyticsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(
        child: Text('Analytics Screen'),
      ),
    );
  }
}

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(
        child: Text('Settings Screen'),
      ),
    );
  }
}

class NotFoundScreen extends StatelessWidget {
  const NotFoundScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(
        child: Text('404 - Page Not Found'),
      ),
    );
  }
}
