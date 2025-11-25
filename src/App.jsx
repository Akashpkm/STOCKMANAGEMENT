import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Product from './pages/Products'
import Profile from './pages/Profile'
import './App.css'

// SheetDB configuration
const USERS_SHEET_URL = 'https://sheetdb.io/api/v1/2h9lh0lt9x8j7'
const PRODUCTS_SHEET_URL = 'https://sheetdb.io/api/v1/b32howf8952yl'

// Define all products globally
const allProducts = [
  { id: 1, name: 'HOPE-10000', icon: 'fas fa-microscope' },
  { id: 2, name: 'IV POLE', icon: 'fas fa-procedures' },
  { id: 3, name: 'FOOT-PEDAL-V3', icon: 'fas fa-shoe-prints' },
  { id: 4, name: 'FOOT-PEDAL-V4', icon: 'fas fa-shoe-prints' },
  { id: 5, name: 'STANDALONE-LIGHTSOURCE', icon: 'fas fa-lightbulb' },
  { id: 6, name: 'ANT_VIT', icon: 'fas fa-capsules' },
  { id: 7, name: 'SCREWS-M', icon: 'fas fa-cogs' },
  { id: 8, name: 'POWDER-COAT', icon: 'fas fa-paint-roller' },
  { id: 9, name: 'Tools', icon: 'fas fa-tools' }
]

function AppContent() {
  const [user, setUser] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
  const [notification, setNotification] = useState({ show: false, message: '', type: '' })
  const navigate = useNavigate()
  const location = useLocation()

  // Show notification
  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ show: true, message, type })
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000)
  }, [])

  useEffect(() => {
    checkAuthStatus()
    fetchProducts()
  }, [])

  const checkAuthStatus = () => {
    const savedUser = localStorage.getItem('stockUser')
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser)
        setUser(userData)
      } catch (error) {
        console.error('Error parsing saved user:', error)
        localStorage.removeItem('stockUser')
      }
    }
    setAuthChecked(true)
  }

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const response = await fetch(PRODUCTS_SHEET_URL)
      if (!response.ok) {
        throw new Error('Failed to fetch products')
      }
      const data = await response.json()
      
      const transformedProducts = transformProductsData(data)
      setProducts(transformedProducts)
    } catch (error) {
      console.error('Error fetching products:', error)
      // Start with empty state
      setProducts(allProducts.map(product => ({ ...product, parts: [] })))
    } finally {
      setLoading(false)
    }
  }

  const transformProductsData = (sheetData) => {
    const productsMap = {}
    
    // Initialize all products with empty parts
    allProducts.forEach(product => {
      productsMap[product.name] = {
        id: product.id,
        name: product.name,
        parts: []
      }
    })
    
    // Fill with actual data from SheetDB
    if (sheetData && sheetData.length > 0) {
      sheetData.forEach(item => {
        if (productsMap[item.productName] && item.id && item.partName) {
          // Check for duplicates before adding
          const existingPart = productsMap[item.productName].parts.find(
            part => part.partNo === item.partNo
          )
          
          if (!existingPart) {
            productsMap[item.productName].parts.push({
              id: item.id,
              name: item.partName,
              partNo: item.partNo,
              quantity: parseInt(item.quantity) || 0,
              vendor: item.vendor,
              isNew: item.isNew === 'true',
              createdAt: item.createdAt,
              updatedAt: item.updatedAt
            })
          }
        }
      })
    }
    
    return Object.values(productsMap)
  }

  const login = async (email, password) => {
    try {
      // Try SheetDB first
      const response = await fetch(`${USERS_SHEET_URL}/search?email=${encodeURIComponent(email)}`)
      if (response.ok) {
        const users = await response.json()
        
        if (users && users.length > 0) {
          const foundUser = users[0]
          if (foundUser.password === password) {
            const userData = {
              id: foundUser.id,
              name: foundUser.name,
              email: foundUser.email,
              role: foundUser.role
            }
            setUser(userData)
            localStorage.setItem('stockUser', JSON.stringify(userData))
            showNotification('Login successful!', 'success')
            return { success: true }
          } else {
            return { success: false, message: 'Invalid password' }
          }
        } else {
          return { success: false, message: 'User not found' }
        }
      }
      
      return { success: false, message: 'Login failed. Please try again.' }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, message: 'Login failed. Please try again.' }
    }
  }

  const signup = async (userData) => {
    try {
      // Check if user already exists
      const checkResponse = await fetch(`${USERS_SHEET_URL}/search?email=${encodeURIComponent(userData.email)}`)
      if (checkResponse.ok) {
        const existingUsers = await checkResponse.json()
        if (existingUsers && existingUsers.length > 0) {
          return { success: false, message: 'User with this email already exists' }
        }
      }

      const newUser = {
        id: Date.now().toString(),
        name: userData.name,
        email: userData.email,
        password: userData.password,
        role: userData.role,
        createdAt: new Date().toISOString()
      }

      const response = await fetch(USERS_SHEET_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: newUser
        })
      })
      
      if (response.ok) {
        console.log('User created successfully in SheetDB')
        showNotification('Account created successfully!', 'success')
        return { success: true }
      } else {
        throw new Error('Failed to create user in SheetDB')
      }
    } catch (error) {
      console.error('Signup error:', error)
      return { success: false, message: 'Signup failed. Please try again.' }
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('stockUser')
    showNotification('Logged out successfully', 'info')
    navigate('/login')
  }

  const updateProduct = async (productId, updatedParts) => {
    try {
      // Update local state immediately for better UX
      setProducts(prev => prev.map(product => 
        product.id === productId ? { ...product, parts: updatedParts } : product
      ))

      // Sync with SheetDB in background
      syncProductWithSheetDB(productId, updatedParts)
      return { success: true }
    } catch (error) {
      console.error('Error updating product:', error)
      return { success: false, message: 'Failed to update product' }
    }
  }

  const syncProductWithSheetDB = async (productId, parts) => {
    const product = allProducts.find(p => p.id === productId)
    if (!product) return

    try {
      // Get existing parts for this product to avoid duplicates
      const existingResponse = await fetch(`${PRODUCTS_SHEET_URL}/search?productName=${encodeURIComponent(product.name)}`)
      let existingParts = []
      
      if (existingResponse.ok) {
        existingParts = await existingResponse.json() || []
      }

      // Delete only parts that are no longer in the current parts list
      const currentPartIds = parts.map(part => part.id.toString())
      const partsToDelete = existingParts.filter(part => !currentPartIds.includes(part.id))
      
      // Delete obsolete parts
      for (const part of partsToDelete) {
        await fetch(`${PRODUCTS_SHEET_URL}/id/${part.id}`, {
          method: 'DELETE'
        })
      }

      // Update or create parts
      for (const part of parts) {
        const partData = {
          id: part.id.toString(),
          productName: product.name,
          partName: part.name,
          partNo: part.partNo,
          quantity: part.quantity.toString(),
          vendor: part.vendor,
          isNew: part.isNew ? 'true' : 'false',
          createdAt: part.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }

        const existingPart = existingParts.find(p => p.id === part.id.toString())
        
        if (existingPart) {
          // Update existing part
          await fetch(`${PRODUCTS_SHEET_URL}/id/${part.id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              data: partData
            })
          })
        } else {
          // Create new part
          await fetch(PRODUCTS_SHEET_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              data: partData
            })
          })
        }
      }
    } catch (error) {
      console.error('Error syncing with SheetDB:', error)
      // Don't throw error to prevent UI disruption
    }
  }

  const handleNavigation = (path) => {
    navigate(path)
    setIsMobileNavOpen(false)
  }

  // Memoized page content to prevent unnecessary re-renders
  const pageContent = useMemo(() => {
    if (!authChecked) {
      return (
        <div className="loading-screen">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      )
    }

    if (!user && location.pathname !== '/login' && location.pathname !== '/signup') {
      return <Navigate to="/login" replace />
    }

    if (user && (location.pathname === '/login' || location.pathname === '/signup')) {
      return <Navigate to="/dashboard" replace />
    }

    if (loading && location.pathname !== '/login' && location.pathname !== '/signup') {
      return (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading inventory data...</p>
        </div>
      )
    }

    return (
      <Routes>
        <Route path="/login" element={<Login onLogin={login} />} />
        <Route path="/signup" element={<Signup onSignup={signup} />} />
        <Route path="/dashboard" element={<Dashboard products={products} user={user} allProducts={allProducts} />} />
        <Route path="/products" element={<Product products={products} user={user} onUpdateProduct={updateProduct} allProducts={allProducts} />} />
        <Route path="/profile" element={<Profile user={user} />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    )
  }, [authChecked, user, location.pathname, loading, products, login, signup, updateProduct])

  const getNavIcon = (page) => {
    switch (page) {
      case 'add-item': return 'fas fa-boxes';
      case 'bom': return 'fas fa-sitemap';
      case 'purchase-order': return 'fas fa-file-invoice';
      case 'generate-intent': return 'fas fa-file-invoice-dollar';
      case 'vendors': return 'fas fa-truck';
      default: return 'fas fa-box';
    }
  }

  const getNavText = (page) => {
    switch (page) {
      case 'add-item': return 'Manage Items';
      case 'bom': return 'BOM Management';
      case 'purchase-order': return 'Purchase Orders';
      case 'generate-intent': return 'Generate Intent';
      case 'vendors': return 'Vendors';
      default: return 'Manage Items';
    }
  }

  return (
    <div className="app">
      {/* Notification System */}
      {notification.show && (
        <div className={`notification ${notification.type}`}>
          <i className={`fas ${
            notification.type === 'success' ? 'fa-check-circle' : 
            notification.type === 'error' ? 'fa-exclamation-circle' : 
            'fa-info-circle'
          }`}></i>
          <span>{notification.message}</span>
          <button onClick={() => setNotification({ show: false, message: '', type: '' })}>
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      {user && (
        <>
          {/* Mobile Navigation Overlay */}
          {isMobileNavOpen && (
            <div 
              className="mobile-nav-overlay"
              onClick={() => setIsMobileNavOpen(false)}
            ></div>
          )}
          
          {/* Side Navigation */}
          <div className={`side-navigation ${isMobileNavOpen ? 'mobile-open' : ''}`}>
            <div className="nav-header">
              <div className="nav-brand">
                <i className="fas fa-boxes"></i>
                <h3 className="nav-title">Stock System</h3>
              </div>
              <button 
                className="nav-close-btn"
                onClick={() => setIsMobileNavOpen(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="nav-links">
              <button 
                onClick={() => handleNavigation('/dashboard')} 
                className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
              >
                <i className="fas fa-tachometer-alt"></i>
                <span>Dashboard</span>
              </button>
              <button 
                onClick={() => handleNavigation('/products')} 
                className={`nav-link ${location.pathname === '/products' ? 'active' : ''}`}
              >
                <i className="fas fa-cube"></i>
                <span>Products</span>
              </button>
              <button 
                onClick={() => handleNavigation('/profile')} 
                className={`nav-link ${location.pathname === '/profile' ? 'active' : ''}`}
              >
                <i className="fas fa-user"></i>
                <span>Profile</span>
              </button>
              <button onClick={logout} className="nav-link logout">
                <i className="fas fa-sign-out-alt"></i>
                <span>Logout</span>
              </button>
            </div>
            
            <div className="user-info">
              <div className="user-avatar">
                <i className="fas fa-user-circle"></i>
              </div>
              <div className="user-details">
                <strong>{user?.name}</strong>
                <span className="user-role">{user?.role}</span>
              </div>
            </div>
          </div>
        </>
      )}
      
      <div className={user ? "main-content" : "auth-content"}>
        {/* Mobile Header */}
        {user && (
          <div className="mobile-header">
            <button 
              className="mobile-menu-btn"
              onClick={() => setIsMobileNavOpen(true)}
            >
              <i className="fas fa-bars"></i>
            </button>
            <div className="mobile-header-title">
              {location.pathname === '/dashboard' && 'Dashboard'}
              {location.pathname === '/products' && 'Products'}
              {location.pathname === '/profile' && 'Profile'}
            </div>
            <div className="mobile-user">
              <i className="fas fa-user-circle"></i>
            </div>
          </div>
        )}
        
        {pageContent}
      </div>
    </div>
  )
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}

export default App