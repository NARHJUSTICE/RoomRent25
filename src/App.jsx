import React, { useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import SubscriptionPrompt from './components/subscription/SubscriptionPrompt';
import Navigation from './components/layout/Navigation';
import Dashboard from './components/Dashboard';
import BrowseProperties from './components/properties/BrowseProperties';
import AddProperty from './components/properties/AddProperty';

// Auth wrapper component
const AuthWrapper = () => {
  const [showRegister, setShowRegister] = useState(false);
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      {showRegister ? (
        <RegisterForm onSwitchToLogin={() => setShowRegister(false)} />
      ) : (
        <LoginForm onSwitchToRegister={() => setShowRegister(true)} />
      )}
    </div>
  );
};

// Main app content
const AppContent = () => {
  const { user, loading, isAuthenticated, hasActiveSubscription, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthWrapper />;
  }

  if (!hasActiveSubscription) {
    return (
      <SubscriptionPrompt 
        onSubscriptionComplete={() => {
          // Refresh user data to get updated subscription status
          window.location.reload();
        }} 
      />
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="w-64 flex-shrink-0">
        <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'browse' && <BrowseProperties />}
          {activeTab === 'properties' && user?.role === 'landlord' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">My Properties</h2>
              <p className="text-gray-600">Your properties management coming soon...</p>
            </div>
          )}
          {activeTab === 'add-property' && user?.role === 'landlord' && <AddProperty />}
          {activeTab === 'profile' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Profile</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <p className="mt-1 text-sm text-gray-900">{user?.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="mt-1 text-sm text-gray-900">{user?.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <p className="mt-1 text-sm text-gray-900 capitalize">{user?.role?.replace('_', ' ')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Subscription Status</label>
                  <p className="mt-1 text-sm text-green-600 capitalize">{user?.subscriptionStatus}</p>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'subscription' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Subscription</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <p className="mt-1 text-sm text-green-600 capitalize">{user?.subscriptionStatus}</p>
                </div>
                {user?.subscriptionExpiryDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Expires On</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(user.subscriptionExpiryDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
      </AuthProvider>
    </Router>
  );
}

export default App;