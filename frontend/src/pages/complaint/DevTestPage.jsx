import { useNavigate } from 'react-router-dom';
import { useContext, useEffect } from 'react';
import AuthContext from '../../contexts/complaint/AuthContext';

const DevTestPage = () => {
  const navigate = useNavigate();
  const { setSession } = useContext(AuthContext);

  const mockUsers = {
    worker: {
      _id: 'worker-test-123',
      email: 'worker@test.com',
      firstName: 'Alice',
      lastName: 'Worker',
      role: 'worker'
    },
    admin: {
      _id: 'admin-test-456',
      email: 'admin@test.com',
      firstName: 'Bob',
      lastName: 'Admin',
      role: 'admin'
    },
    legal_officer: {
      _id: 'officer-test-789',
      email: 'officer@test.com',
      firstName: 'Charlie',
      lastName: 'Officer',
      role: 'legal_officer'
    }
  };

  const routes = {
    worker: [
      { path: '/complaints/my', label: 'My Complaints (Worker)' },
      { path: '/complaints/new', label: 'File New Complaint (Worker)' }
    ],
    admin: [
      { path: '/complaints/admin', label: 'Admin Complaint Board' }
    ],
    legal_officer: [
      { path: '/complaints/officer', label: 'Officer Workspace' }
    ]
  };

  const handleQuickLogin = (role) => {
    const user = mockUsers[role];
    setSession({
      accessToken: `mock-token-${role}-${Date.now()}`,
      userRole: role,
      profile: user
    });

    // Navigate to first route for that role
    const firstRoute = routes[role]?.[0]?.path || '/complaints/my';
    setTimeout(() => navigate(firstRoute), 100);
  };

  return (
    <div className="min-h-screen bg-bg-secondary p-8">
      <div className="max-w-[1200px] mx-auto">
        <div className="rounded-[24px] border border-slate-200 bg-white p-8 shadow-sm mb-8">
          <h1 className="text-4xl font-extrabold text-text-primary mb-2">🧪 Dev Test Dashboard</h1>
          <p className="text-text-secondary">Quickly test the complaint module UI as any role without authentication.</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {Object.entries(mockUsers).map(([role, user]) => (
            <div key={role} className="rounded-[24px] border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-accent-primary text-white flex items-center justify-center font-bold text-lg">
                  {user.firstName.charAt(0)}
                </div>
                <div>
                  <h2 className="font-extrabold text-text-primary">{user.firstName} {user.lastName}</h2>
                  <p className="text-sm text-text-secondary">{role}</p>
                </div>
              </div>
              
              <p className="text-[0.9rem] text-text-secondary mb-6 bg-slate-50 p-3 rounded-lg border border-slate-200">
                {user.email}
              </p>

              <div className="space-y-3 mb-6">
                {routes[role].map((route) => (
                  <div key={route.path} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <span className="text-[0.9rem] text-text-secondary">{route.label}</span>
                    <span className="text-[0.75rem] text-text-secondary font-mono">{route.path}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleQuickLogin(role)}
                className="btn-primary w-full"
              >
                Test as {user.firstName}
              </button>
            </div>
          ))}
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white p-8 shadow-sm mt-8">
          <h2 className="text-xl font-extrabold text-text-primary mb-4">ℹ️ How to Use</h2>
          <ol className="space-y-3 text-text-secondary">
            <li><strong>1.</strong> Click "Test as [Name]" button above for your desired role</li>
            <li><strong>2.</strong> You'll be instantly logged in and redirected to that role's main complaint page</li>
            <li><strong>3.</strong> Browse the complaint UIs, forms, and components</li>
            <li><strong>4.</strong> The auth token is mocked but will work with the app's routing</li>
            <li><strong>5.</strong> To switch roles, click another button or navigate back here</li>
          </ol>
        </div>

        <div className="rounded-[24px] border border-rose-200 bg-rose-50 p-8 shadow-sm mt-8">
          <h3 className="text-lg font-bold text-rose-900 mb-3">⚠️ Note</h3>
          <p className="text-rose-800">This is a development page for testing. The complaint API calls will fail because the mock token is not recognized by the backend. <strong>To fully test the module including API calls, you'll need to start the backend services.</strong></p>
        </div>
      </div>
    </div>
  );
};

export default DevTestPage;
