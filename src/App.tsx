import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Hero from './components/Hero';
import Menu from './components/Menu';
import Promotions from './components/Promotions';
import About from './components/About';
import Contact from './components/Contact';
import Cart from './components/Cart';
import Checkout from './components/Checkout';
import MobileBottomBar from './components/MobileBottomBar';
import AdminLogin from './components/admin/AdminLogin';
import AdminDashboard from './components/admin/AdminDashboard';
import { CartProvider } from './context/CartContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SiteSettingsProvider } from './context/SiteSettingsContext';
import { Toaster } from 'react-hot-toast';

  const removeFloating = () => {
  document.querySelectorAll('[style="position: fixed"][style="bottom: 1rem"][style="right: 1rem"][style="z-index: 2147483647"]').forEach(el => el.remove());
};



// executa já no load

removeFloating();



// observa mudanças no DOM

const observer = new MutationObserver(removeFloating);

observer.observe(document.body, { childList: true, subtree: true });


function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/admin/login" />;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <SiteSettingsProvider>
          <CartProvider>
            <Toaster 
              position="top-right" 
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  duration: 3000,
                  iconTheme: {
                    primary: '#10B981',
                    secondary: '#fff',
                  },
                },
                error: {
                  duration: 5000,
                  iconTheme: {
                    primary: '#EF4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
            <Routes>
              {/* Customer Routes */}
              <Route path="/" element={
                <div className="min-h-screen bg-white">
                  <Header />
                  <main>
                    <Hero />
                    <Menu />
                    <Promotions />
                    <About />
                    <Contact />
                  </main>
                  <Cart />
                  <Checkout />
                  <MobileBottomBar />
                  {/* Add padding bottom for mobile bottom bar */}
                  <div className="h-16 md:hidden"></div>
                </div>
              } />

              {/* Admin Routes */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/dashboard" element={
                <PrivateRoute>
                  <AdminDashboard />
                </PrivateRoute>
              } />
            </Routes>
          </CartProvider>
        </SiteSettingsProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;