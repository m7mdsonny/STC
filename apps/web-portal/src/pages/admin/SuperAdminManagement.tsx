import { useState, useEffect } from 'react';
import { Shield, Plus, Trash2, Search, CheckCircle, User } from 'lucide-react';
import { superAdminApi, SuperAdmin } from '../../lib/api/superAdmin';
import { Modal } from '../../components/ui/Modal';

export function SuperAdminManagement() {
  const [admins, setAdmins] = useState<SuperAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newAdminUserId, setNewAdminUserId] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const data = await superAdminApi.getSuperAdmins();
      setAdmins(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching super admins:', error);
      setAdmins([]);
      alert('حدث خطأ في تحميل قائمة السوبر أدمن. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminUserId.trim()) return;

    setAdding(true);
    try {
      await superAdminApi.addSuperAdmin(parseInt(newAdminUserId));
      await fetchAdmins();
      setShowModal(false);
      setNewAdminUserId('');
      alert('Super admin added successfully');
    } catch (error) {
      console.error('Error adding super admin:', error);
      alert('Failed to add super admin. Please check the user ID and try again.');
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveAdmin = async (admin: SuperAdmin) => {
    if (!confirm(`Are you sure you want to remove ${admin.user?.name || 'this user'} as a super admin?`)) {
      return;
    }

    try {
      await superAdminApi.removeSuperAdmin(admin.id);
      await fetchAdmins();
      alert('Super admin removed successfully');
    } catch (error) {
      console.error('Error removing super admin:', error);
      alert('Failed to remove super admin');
    }
  };

  const filteredAdmins = admins.filter(admin =>
    admin.user?.name.toLowerCase().includes(search.toLowerCase()) ||
    admin.user?.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Super Admin Management</h1>
          <p className="text-white/60">Manage users with super administrator privileges</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Add Super Admin</span>
        </button>
      </div>

      <div className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 p-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-12 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-white/60">
            Loading super admins...
          </div>
        ) : filteredAdmins.length === 0 ? (
          <div className="p-12 text-center text-white/60">
            {search ? 'No super admins found matching your search' : 'No super admins found'}
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {filteredAdmins.map((admin) => (
              <div
                key={admin.id}
                className="p-6 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                      <Shield className="w-6 h-6 text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-semibold">
                          {admin.user?.name || 'Unknown User'}
                        </h3>
                        <span className="px-2 py-1 text-xs font-medium bg-blue-500/20 text-blue-400 rounded">
                          Super Admin
                        </span>
                      </div>
                      <p className="text-white/60 text-sm mb-3">
                        {admin.user?.email || 'No email'}
                      </p>
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-white/80">Permissions:</p>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(admin.permissions).map(([key, value]) => (
                            value && (
                              <div
                                key={key}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm"
                              >
                                <CheckCircle className="w-4 h-4 text-green-400" />
                                <span className="capitalize">
                                  {key.replace(/_/g, ' ')}
                                </span>
                              </div>
                            )
                          ))}
                          {Object.values(admin.permissions).every(v => !v) && (
                            <span className="text-sm text-white/50">No specific permissions set</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveAdmin(admin)}
                    className="ml-4 flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-red-500/10 border border-red-500/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <div className="flex gap-3">
          <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-blue-400 mb-1">About Super Admin Access</p>
            <p className="text-sm text-white/70">
              Super admins have full access to all platform features and settings. They can manage organizations,
              users, system settings, and other super admins. Only grant this access to trusted personnel.
            </p>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setNewAdminUserId('');
        }}
        title="Add Super Admin"
        size="md"
      >
        <form onSubmit={handleAddAdmin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              User ID
            </label>
            <input
              type="number"
              value={newAdminUserId}
              onChange={(e) => setNewAdminUserId(e.target.value)}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter user ID"
              required
              min="1"
            />
            <p className="text-xs text-white/50 mt-2">
              Enter the numeric ID of the user you want to promote to super admin.
              You can find user IDs in the Users management page.
            </p>
          </div>

          <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <p className="text-sm text-yellow-500 font-medium mb-1">Warning</p>
            <p className="text-sm text-white/70">
              This will grant the user full administrative access to the platform.
              Make sure you trust this user before proceeding.
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setShowModal(false);
                setNewAdminUserId('');
              }}
              className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={adding}
              className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 rounded-lg font-medium transition-colors"
            >
              {adding ? 'Adding...' : 'Add Super Admin'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
