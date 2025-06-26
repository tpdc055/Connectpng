'use client';

import { useState, useEffect } from 'react';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AdminResponse {
  success: boolean;
  adminUsers?: AdminUser[];
  count?: number;
  message?: string;
  admin?: any;
  credentials?: string;
  error?: string;
  timestamp: string;
}

export default function AdminDebugPage() {
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');

  const fetchAdminUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin-manager?action=list');
      const data: AdminResponse = await response.json();

      if (data.success && data.adminUsers) {
        setAdminUsers(data.adminUsers);
        setMessage(`Found ${data.count} admin users`);
        setMessageType('success');
      } else {
        setMessage(data.error || 'Failed to fetch admin users');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Error fetching admin users');
      setMessageType('error');
    }
    setLoading(false);
  };

  const handleAction = async (action: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin-manager?action=${action}`);
      const data: AdminResponse = await response.json();

      if (data.success) {
        setMessage(data.message || 'Action completed successfully');
        if (data.credentials) {
          setMessage(`${data.message}\nCredentials: ${data.credentials}`);
        }
        setMessageType('success');
        // Refresh admin users list
        await fetchAdminUsers();
      } else {
        setMessage(data.error || 'Action failed');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Error performing action');
      setMessageType('error');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAdminUsers();
  }, []);

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-center">🇵🇬 PNG Road Construction - Admin Debug</h1>

      {/* Status Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          messageType === 'success' ? 'bg-green-100 text-green-800 border border-green-300' :
          messageType === 'error' ? 'bg-red-100 text-red-800 border border-red-300' :
          'bg-blue-100 text-blue-800 border border-blue-300'
        }`}>
          <pre className="whitespace-pre-wrap text-sm">{message}</pre>
        </div>
      )}

      {/* Admin Users List */}
      <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Current Admin Users</h2>
          <button
            onClick={fetchAdminUsers}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {adminUsers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left">Email</th>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Role</th>
                  <th className="px-4 py-2 text-left">Active</th>
                  <th className="px-4 py-2 text-left">Created</th>
                </tr>
              </thead>
              <tbody>
                {adminUsers.map((user) => (
                  <tr key={user.id} className="border-t">
                    <td className="px-4 py-2 font-mono text-sm">{user.email}</td>
                    <td className="px-4 py-2">{user.name}</td>
                    <td className="px-4 py-2">
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        user.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No admin users found</p>
        )}
      </div>

      {/* Admin Management Actions */}
      <div className="bg-white shadow-lg rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Admin Management Actions</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Reset ConnectPNG Admin */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold text-green-700 mb-2">Reset ConnectPNG Admin</h3>
            <p className="text-sm text-gray-600 mb-3">
              Reset admin@connectpng.com password to "Admin123!"
            </p>
            <button
              onClick={() => handleAction('reset-admin')}
              disabled={loading}
              className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            >
              Reset Password
            </button>
          </div>

          {/* Force Recreate Admin */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold text-orange-700 mb-2">Force Recreate Admin</h3>
            <p className="text-sm text-gray-600 mb-3">
              Delete and recreate admin@connectpng.com with fresh credentials
            </p>
            <button
              onClick={() => handleAction('force-recreate')}
              disabled={loading}
              className="w-full px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50"
            >
              Force Recreate
            </button>
          </div>

          {/* Create Maria Pori Admin */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold text-blue-700 mb-2">Maria Pori Admin</h3>
            <p className="text-sm text-gray-600 mb-3">
              Create/update admin@mariapori.com with password "admin123"
            </p>
            <button
              onClick={() => handleAction('create-mariapori-admin')}
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              Create/Update
            </button>
          </div>

          {/* Login Test */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold text-purple-700 mb-2">Test Login</h3>
            <p className="text-sm text-gray-600 mb-3">
              Go to the main app to test login with the credentials above
            </p>
            <a
              href="/"
              className="block w-full px-4 py-2 bg-purple-500 text-white text-center rounded hover:bg-purple-600"
            >
              Go to Login
            </a>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold mb-2">Instructions:</h3>
        <ol className="text-sm text-gray-700 space-y-1">
          <li>1. First, check the current admin users above</li>
          <li>2. If there are existing admins, try "Reset Password" to set known credentials</li>
          <li>3. If that doesn't work, use "Force Recreate" to start fresh</li>
          <li>4. Test login with the credentials shown in the success message</li>
          <li>5. Once working, you can create additional users through the admin panel</li>
        </ol>
      </div>
    </div>
  );
}
