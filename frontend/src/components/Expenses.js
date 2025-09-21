import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Receipt, 
  Plus, 
  DollarSign, 
  Calendar, 
  Tag, 
  MapPin,
  TrendingUp,
  PieChart,
  BarChart3,
  Filter,
  Search
} from 'lucide-react';
import toast from 'react-hot-toast';
import { API_ENDPOINTS } from '../config/api';

function Expenses() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [trips, setTrips] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [budgetAlerts, setBudgetAlerts] = useState([]);
  const [spendingInsights, setSpendingInsights] = useState(null);
  const [showInsights, setShowInsights] = useState(false);
  const [newExpense, setNewExpense] = useState({
    trip_id: '',
    category: 'food',
    amount: '',
    currency: 'INR',
    description: '',
    date: new Date().toISOString().split('T')[0],
    location: '',
    vendor: ''
  });

  const [newBudget, setNewBudget] = useState({
    trip_id: '',
    total_budget: '',
    currency: 'INR',
    category_allocations: {
      accommodation: '',
      food: '',
      transport: '',
      activities: '',
      shopping: '',
      other: ''
    },
    daily_allowance: ''
  });

  const expenseCategories = [
    { id: 'accommodation', name: 'Accommodation', icon: '🏨', color: 'from-blue-500 to-blue-600' },
    { id: 'food', name: 'Food & Dining', icon: '🍽️', color: 'from-green-500 to-green-600' },
    { id: 'transport', name: 'Transportation', icon: '🚗', color: 'from-purple-500 to-purple-600' },
    { id: 'activities', name: 'Activities', icon: '🎯', color: 'from-orange-500 to-orange-600' },
    { id: 'shopping', name: 'Shopping', icon: '🛍️', color: 'from-pink-500 to-pink-600' },
    { id: 'other', name: 'Other', icon: '📝', color: 'from-gray-500 to-gray-600' }
  ];

  const currencies = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
    { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
    { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
    { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar' },
    { code: 'THB', symbol: '฿', name: 'Thai Baht' },
    { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
    { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah' },
    { code: 'PHP', symbol: '₱', name: 'Philippine Peso' },
    { code: 'VND', symbol: '₫', name: 'Vietnamese Dong' },
    { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
    { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal' },
    { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
    { code: 'MXN', symbol: '$', name: 'Mexican Peso' },
    { code: 'ARS', symbol: '$', name: 'Argentine Peso' },
    { code: 'CLP', symbol: '$', name: 'Chilean Peso' },
    { code: 'COP', symbol: '$', name: 'Colombian Peso' },
    { code: 'PEN', symbol: 'S/', name: 'Peruvian Sol' },
    { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
    { code: 'EGP', symbol: '£', name: 'Egyptian Pound' },
    { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
    { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
    { code: 'GHS', symbol: '₵', name: 'Ghanaian Cedi' },
    { code: 'MAD', symbol: 'د.م.', name: 'Moroccan Dirham' },
    { code: 'RUB', symbol: '₽', name: 'Russian Ruble' },
    { code: 'TRY', symbol: '₺', name: 'Turkish Lira' },
    { code: 'PLN', symbol: 'zł', name: 'Polish Zloty' },
    { code: 'CZK', symbol: 'Kč', name: 'Czech Koruna' },
    { code: 'HUF', symbol: 'Ft', name: 'Hungarian Forint' },
    { code: 'RON', symbol: 'lei', name: 'Romanian Leu' },
    { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone' },
    { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
    { code: 'DKK', symbol: 'kr', name: 'Danish Krone' },
    { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
    { code: 'ISK', symbol: 'kr', name: 'Icelandic Krona' }
  ];

  useEffect(() => {
    fetchTrips();
    fetchExpenses();
    fetchBudgets();
  }, []);

  const fetchTrips = async () => {
    try {
      const response = await fetch('API_ENDPOINTS.TRIPS', {
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTrips(data.trips || []);
        if (data.trips && data.trips.length > 0) {
          setSelectedTrip(data.trips[0].id);
          setNewExpense(prev => ({ ...prev, trip_id: data.trips[0].id }));
        }
      }
    } catch (error) {
      console.error('Error fetching trips:', error);
    }
  };

  const fetchExpenses = async () => {
    try {
      const response = await fetch('API_ENDPOINTS.EXPENSES', {
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setExpenses(data.expenses || []);
        checkBudgetAlerts(data.expenses || []);
      } else {
        console.error('Failed to fetch expenses');
        setExpenses([]);
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
      setExpenses([]);
    }
  };

  const fetchBudgets = async () => {
    try {
      const response = await fetch('API_ENDPOINTS/budgets', {
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBudgets(data.budgets || []);
      }
    } catch (error) {
      console.error('Error fetching budgets:', error);
    }
  };

  const handleSubmitExpense = async (e) => {
    e.preventDefault();
    
    if (!newExpense.trip_id || !newExpense.amount || !newExpense.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch('API_ENDPOINTS.EXPENSES', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({
          ...newExpense,
          amount: parseFloat(newExpense.amount)
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add expense');
      }

      toast.success('Expense added successfully!');
      setNewExpense({
        trip_id: selectedTrip,
        category: 'food',
        amount: '',
        currency: 'USD',
        description: '',
        date: new Date().toISOString().split('T')[0]
      });
      setShowExpenseForm(false);
      fetchExpenses();
    } catch (error) {
      console.error('Error adding expense:', error);
      toast.error('Failed to add expense');
    }
  };

  const getTotalExpenses = () => {
    return expenses.reduce((total, expense) => total + expense.amount, 0);
  };

  const getCurrencySymbol = (currencyCode) => {
    const currency = currencies.find(c => c.code === currencyCode);
    return currency ? currency.symbol : '$';
  };

  const checkBudgetAlerts = (expenses) => {
    const alerts = [];
    
    // Group expenses by trip and category
    const tripExpenses = {};
    expenses.forEach(expense => {
      if (!tripExpenses[expense.trip_id]) {
        tripExpenses[expense.trip_id] = {};
      }
      if (!tripExpenses[expense.trip_id][expense.category]) {
        tripExpenses[expense.trip_id][expense.category] = 0;
      }
      tripExpenses[expense.trip_id][expense.category] += expense.amount;
    });

    // Check against budgets
    budgets.forEach(budget => {
      const tripExpense = tripExpenses[budget.trip_id] || {};
      const categoryAllocations = budget.category_allocations || {};
      
      Object.keys(categoryAllocations).forEach(category => {
        const allocated = categoryAllocations[category];
        const spent = tripExpense[category] || 0;
        const percentage = allocated > 0 ? (spent / allocated) * 100 : 0;
        
        if (percentage >= 100) {
          alerts.push({
            type: 'over_budget',
            trip_id: budget.trip_id,
            category: category,
            spent: spent,
            allocated: allocated,
            message: `⚠️ You've exceeded your ${category} budget! Spent ${getCurrencySymbol(budget.currency)}${spent.toFixed(2)} of ${getCurrencySymbol(budget.currency)}${allocated.toFixed(2)}`
          });
        } else if (percentage >= 80) {
          alerts.push({
            type: 'near_budget',
            trip_id: budget.trip_id,
            category: category,
            spent: spent,
            allocated: allocated,
            message: `⚠️ You're close to your ${category} budget limit! Spent ${getCurrencySymbol(budget.currency)}${spent.toFixed(2)} of ${getCurrencySymbol(budget.currency)}${allocated.toFixed(2)} (${percentage.toFixed(1)}%)`
          });
        }
      });
    });
    
    setBudgetAlerts(alerts);
    
    // Show alerts as toasts
    alerts.forEach(alert => {
      if (alert.type === 'over_budget') {
        toast.error(alert.message);
      } else if (alert.type === 'near_budget') {
        toast(alert.message, { icon: '⚠️' });
      }
    });
  };

  const handleSubmitBudget = async (e) => {
    e.preventDefault();
    
    if (!newBudget.trip_id || !newBudget.total_budget) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch('API_ENDPOINTS/budget-allocation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({
          ...newBudget,
          total_budget: parseFloat(newBudget.total_budget),
          daily_allowance: newBudget.daily_allowance ? parseFloat(newBudget.daily_allowance) : null,
          category_allocations: Object.fromEntries(
            Object.entries(newBudget.category_allocations).map(([key, value]) => [
              key, 
              value ? parseFloat(value) : 0
            ])
          )
        })
      });

      if (!response.ok) {
        throw new Error('Failed to set budget');
      }

      toast.success('Budget set successfully!');
      setNewBudget({
        trip_id: '',
        total_budget: '',
        currency: 'INR',
        category_allocations: {
          accommodation: '',
          food: '',
          transport: '',
          activities: '',
          shopping: '',
          other: ''
        },
        daily_allowance: ''
      });
      setShowBudgetForm(false);
      fetchBudgets();
    } catch (error) {
      console.error('Error setting budget:', error);
      toast.error('Failed to set budget');
    }
  };

  const fetchSpendingInsights = async (tripId) => {
    if (!tripId) return;
    
    try {
      const response = await fetch(`API_ENDPOINTS/spending-insights/${tripId}`, {
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSpendingInsights(data);
        setShowInsights(true);
        toast.success('Spending insights loaded!');
      } else {
        toast.error('Failed to load spending insights');
      }
    } catch (error) {
      console.error('Error fetching spending insights:', error);
      toast.error('Failed to load spending insights');
    }
  };

  const getExpensesByCategory = () => {
    const categoryTotals = {};
    expenses.forEach(expense => {
      categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
    });
    return categoryTotals;
  };

  const getCategoryIcon = (category) => {
    const cat = expenseCategories.find(c => c.id === category);
    return cat ? cat.icon : '📝';
  };

  const getCategoryColor = (category) => {
    const cat = expenseCategories.find(c => c.id === category);
    return cat ? cat.color : 'from-gray-500 to-gray-600';
  };

  const filteredExpenses = expenses.filter(expense => 
    !filterCategory || expense.category === filterCategory
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-r from-green-600 to-blue-600 p-3 rounded-full">
              <Receipt className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Expense Tracker</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Track your travel expenses and stay on budget with real-time insights
          </p>
        </div>

        {/* Budget Alerts */}
        {budgetAlerts.length > 0 && (
          <div className="mb-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-red-800 mb-3 flex items-center">
                <span className="text-2xl mr-2">⚠️</span>
                Budget Alerts
              </h3>
              <div className="space-y-2">
                {budgetAlerts.map((alert, index) => (
                  <div key={index} className={`p-3 rounded-lg ${
                    alert.type === 'over_budget' ? 'bg-red-100 border border-red-300' : 'bg-yellow-100 border border-yellow-300'
                  }`}>
                    <p className="text-sm font-medium text-gray-800">{alert.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Spent</p>
                <p className="text-2xl font-bold text-gray-900">₹{getTotalExpenses().toFixed(2)}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                <p className="text-2xl font-bold text-gray-900">{expenses.length}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                <Receipt className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Daily Average</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{expenses.length > 0 ? (getTotalExpenses() / expenses.length).toFixed(2) : '0.00'}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Categories</p>
                <p className="text-2xl font-bold text-gray-900">{Object.keys(getExpensesByCategory()).length}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                <PieChart className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Expense Form */}
        {showExpenseForm ? (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <Plus className="h-5 w-5 mr-2 text-blue-500" />
              Add New Expense
            </h3>
            
            <form onSubmit={handleSubmitExpense} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Trip Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Trip
                  </label>
                  <select
                    value={newExpense.trip_id}
                    onChange={(e) => setNewExpense(prev => ({ ...prev, trip_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select a trip</option>
                    {trips.map((trip) => (
                      <option key={trip.id} value={trip.id}>
                        {trip.destination} - {new Date(trip.start_date).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={newExpense.date}
                    onChange={(e) => setNewExpense(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {expenseCategories.map((category) => (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => setNewExpense(prev => ({ ...prev, category: category.id }))}
                        className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                          newExpense.category === category.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-2xl mb-1">{category.icon}</div>
                        <p className="text-xs font-medium text-gray-700">{category.name}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amount and Currency */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newExpense.amount}
                      onChange={(e) => setNewExpense(prev => ({ ...prev, amount: e.target.value }))}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Currency
                    </label>
                    <select
                      value={newExpense.currency}
                      onChange={(e) => setNewExpense(prev => ({ ...prev, currency: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {currencies.map((currency) => (
                        <option key={currency.code} value={currency.code}>
                          {currency.symbol} {currency.name} ({currency.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={newExpense.description}
                  onChange={(e) => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="What was this expense for?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Location and Vendor */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location (Optional)
                  </label>
                  <input
                    type="text"
                    value={newExpense.location}
                    onChange={(e) => setNewExpense(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Where did you spend?"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vendor/Store (Optional)
                  </label>
                  <input
                    type="text"
                    value={newExpense.vendor}
                    onChange={(e) => setNewExpense(prev => ({ ...prev, vendor: e.target.value }))}
                    placeholder="Store or vendor name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-blue-700 transition-all duration-200"
                >
                  Add Expense
                </button>
                <button
                  type="button"
                  onClick={() => setShowExpenseForm(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="text-center mb-6 space-y-4">
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setShowExpenseForm(true)}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-blue-700 transition-all duration-200 flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add Expense</span>
              </button>
              <button
                onClick={() => setShowBudgetForm(true)}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200 flex items-center space-x-2"
              >
                <DollarSign className="h-4 w-4" />
                <span>Set Budget</span>
              </button>
              <button
                onClick={() => {
                  if (selectedTrip) {
                    fetchSpendingInsights(selectedTrip);
                  } else {
                    toast.error('Please select a trip first');
                  }
                }}
                className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg font-semibold hover:from-orange-700 hover:to-red-700 transition-all duration-200 flex items-center space-x-2"
              >
                <TrendingUp className="h-4 w-4" />
                <span>Get Insights</span>
              </button>
            </div>
          </div>
        )}

        {/* Budget Form */}
        {showBudgetForm && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-purple-500" />
              Set Budget for Trip
            </h3>
            <form onSubmit={handleSubmitBudget} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Trip Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Trip
                  </label>
                  <select
                    value={newBudget.trip_id}
                    onChange={(e) => setNewBudget(prev => ({ ...prev, trip_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  >
                    <option value="">Choose a trip</option>
                    {trips.map((trip) => (
                      <option key={trip.id} value={trip.id}>
                        {trip.destination} - {trip.start_date} to {trip.end_date}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Total Budget */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Budget
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newBudget.total_budget}
                    onChange={(e) => setNewBudget(prev => ({ ...prev, total_budget: e.target.value }))}
                    placeholder="10000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Currency */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currency
                  </label>
                  <select
                    value={newBudget.currency}
                    onChange={(e) => setNewBudget(prev => ({ ...prev, currency: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    {currencies.map((currency) => (
                      <option key={currency.code} value={currency.code}>
                        {currency.symbol} {currency.name} ({currency.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Daily Allowance */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Daily Allowance (Optional)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newBudget.daily_allowance}
                    onChange={(e) => setNewBudget(prev => ({ ...prev, daily_allowance: e.target.value }))}
                    placeholder="500"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Category Allocations */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Category Allocations
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {expenseCategories.map((category) => (
                    <div key={category.id}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {category.icon} {category.name}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={newBudget.category_allocations[category.id] || ''}
                        onChange={(e) => setNewBudget(prev => ({
                          ...prev,
                          category_allocations: {
                            ...prev.category_allocations,
                            [category.id]: e.target.value
                          }
                        }))}
                        placeholder="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-4">
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200"
                >
                  Set Budget
                </button>
                <button
                  type="button"
                  onClick={() => setShowBudgetForm(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Spending Insights */}
        {showInsights && spendingInsights && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-orange-500" />
                AI Spending Insights
              </h3>
              <button
                onClick={() => setShowInsights(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* AI Insights */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800">🤖 AI Analysis</h4>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {spendingInsights.ai_insights}
                  </p>
                </div>
              </div>
              
              {/* Quick Stats */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800">📊 Quick Stats</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-600">Total Spent</span>
                    <span className="font-semibold text-gray-900">
                      ₹{spendingInsights.total_spent?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-600">Daily Average</span>
                    <span className="font-semibold text-gray-900">
                      ₹{spendingInsights.daily_average?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-600">Highest Category</span>
                    <span className="font-semibold text-gray-900 capitalize">
                      {spendingInsights.highest_spending_category || 'None'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Suggestions */}
            <div className="mt-6">
              <h4 className="font-semibold text-gray-800 mb-3">💡 Smart Suggestions</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {spendingInsights.suggestions?.map((suggestion, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <span className="text-green-600 mt-0.5">💡</span>
                    <p className="text-sm text-gray-700">{suggestion}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Expenses List */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Receipt className="h-5 w-5 mr-2 text-blue-500" />
              Recent Expenses
            </h3>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                {expenseCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filteredExpenses.length > 0 ? (
            <div className="space-y-4">
              {filteredExpenses.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-all duration-200 card-overflow">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 bg-gradient-to-r ${getCategoryColor(expense.category)} rounded-full flex items-center justify-center`}>
                      <span className="text-white text-xl">{getCategoryIcon(expense.category)}</span>
                    </div>
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <h4 className="font-semibold text-gray-900 emergency-contain">{expense.description}</h4>
                      <p className="text-sm text-gray-500 emergency-contain">
                        {new Date(expense.date).toLocaleDateString()} • {expenseCategories.find(c => c.id === expense.category)?.name}
                      </p>
                      {(expense.location || expense.vendor) && (
                        <p className="text-xs text-gray-400 mt-1 address-text emergency-contain">
                          {expense.vendor && <span>📍 {expense.vendor}</span>}
                          {expense.vendor && expense.location && <span> • </span>}
                          {expense.location && <span>🏢 {expense.location}</span>}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      {getCurrencySymbol(expense.currency)}{expense.amount.toFixed(2)} {expense.currency}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Receipt className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Expenses Yet</h3>
              <p className="text-gray-500 mb-4">
                Start tracking your travel expenses to stay on budget
              </p>
              <button
                onClick={() => setShowExpenseForm(true)}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-blue-700 transition-all duration-200 flex items-center space-x-2 mx-auto"
              >
                <Plus className="h-4 w-4" />
                <span>Add Your First Expense</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Expenses;
