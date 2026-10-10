import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_ACTIONS } from '../data/emissionFactors';
import { calculateFootprint, calculateWhatIfImpact } from '../utils/calculations';
import { getCurrentUser, onAuthStateChange, signOut as supabaseSignOut, isSupabaseConfigured } from '../services/supabaseClient';

const AppContext = createContext();

const SCREENS = [
  { id: 1, key: 'splash', name: '1. Splash / Welcome', group: 'Onboarding' },
  { id: 2, key: 'auth', name: '2. Authentication', group: 'Onboarding' },
  { id: 3, key: 'business', name: '3. Business Details', group: 'Data Input' },
  { id: 0, key: 'domain_chooser', name: 'Domain Chooser (Ask User First)', group: 'Data Input' },
  { id: 4, key: 'activity_elec', name: '4. Electricity Domain', group: 'Data Input' },
  { id: 5, key: 'activity_fuel', name: '5. Fuel Domain', group: 'Data Input' },
  { id: 15, key: 'transport', name: 'Transport Domain', group: 'Data Input' },
  { id: 6, key: 'materials', name: '6. Materials Domain', group: 'Data Input' },
  { id: 16, key: 'waste', name: 'Waste Domain', group: 'Data Input' },
  { id: 7, key: 'review', name: '7. Review & Calculate', group: 'Data Input' },
  { id: 8, key: 'dashboard', name: '8. Home / Dashboard', group: 'Main App' },
  { id: 9, key: 'results', name: '9. Results - Analysis', group: 'Main App' },
  { id: 10, key: 'actions', name: '10. Actions - Reduction Plan', group: 'Main App' },
  { id: 11, key: 'what_if', name: '11. ROI & Emission Factors', group: 'Main App' },
  { id: 12, key: 'reports', name: '12. Reports (Excel & PDF)', group: 'Main App' },
  { id: 13, key: 'profile', name: '13. Profile', group: 'Main App' },
  { id: 14, key: 'more', name: '14. More / Legal Pages', group: 'Main App' },
];

function generateRandomTempId() {
  const chars = '0123456789ABCDEF';
  let rand = '';
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const bytes = new Uint8Array(4);
    window.crypto.getRandomValues(bytes);
    rand = Array.from(bytes).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join('');
  } else {
    for (let i = 0; i < 8; i++) {
      rand += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  return `TEMP-MSME-${rand}`;
}

const DEFAULT_STATE = {
  business: {
    name: '',
    industry: '',
    city: '',
    employees: '',
    reportingPeriod: '',
    ownerName: '',
    email: '',
    phone: ''
  },
  electricity: {
    amount: '',
    unit: '',
    period: '',
    sourceType: 'Estimated',
    billFileName: null,
    billUploaded: false
  },
  fuels: [
    {
      id: 'fuel-1',
      type: '',
      quantity: '',
      unit: '',
      period: '',
      sourceType: 'Estimated',
      billFileName: null
    }
  ],
  transport: {
    distance_km: '',
    vehicle_type: '',
    period: '',
    sourceType: 'Estimated',
    logUploaded: false,
    logFileName: null
  },
  materials: [
    {
      id: 'mat-1',
      type: '',
      quantity: '',
      unit: '',
      period: '',
      sourceType: 'Estimated'
    }
  ],
  waste: [
    {
      id: 'waste-1',
      type: '',
      quantity: '',
      unit: '',
      period: '',
      sourceType: 'Estimated'
    }
  ],
  actions: INITIAL_ACTIONS,
  appliedActionIds: [],
  whatIf: {
    category: 'Electricity',
    reductionPct: 20
  }
};

export function AppProvider({ children }) {
  // Supabase Authenticated User state
  const [authUser, setAuthUser] = useState(null);

  // Temporary ID management
  const [tempId, setTempId] = useState(() => {
    return localStorage.getItem('terra_temp_id') || 'TEMP-MSME-8492';
  });

  const [currentScreen, setCurrentScreen] = useState(1);
  const [history, setHistory] = useState([1]);
  const [deviceMode, setDeviceMode] = useState('phone');
  const [activeBottomNav, setActiveBottomNav] = useState('home');

  // Business and inputs state with automatic sanitization of fake mock persona
  const [appData, setAppData] = useState(() => {
    const saved = localStorage.getItem('terra_data_state_v4');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.business) {
          if (parsed.business.name === 'ABC Textiles') parsed.business.name = '';
          if (parsed.business.city === 'Indore, Madhya Pradesh') parsed.business.city = '';
          if (parsed.business.employees === 50) parsed.business.employees = '';
          if (parsed.business.ownerName === 'Aman Jain') parsed.business.ownerName = '';
          if (parsed.business.email === 'aman@example.com') parsed.business.email = '';
          if (parsed.business.phone === '+91 98765 43210') parsed.business.phone = '';
          if (parsed.business.industry === 'Textiles' || parsed.business.industry === 'Manufacturing' || parsed.business.industry === 'Auto Ancillary & Components') {
            if (!parsed.business.name) parsed.business.industry = '';
          }
          if (parsed.business.reportingPeriod === 'FY 2025-26' && !parsed.business.name) {
            parsed.business.reportingPeriod = '';
          }
        }
        if (parsed.electricity) {
          if (parsed.electricity.amount === 12000 && parsed.electricity.billFileName === 'electricity_invoice_aug2026.pdf') {
            parsed.electricity.amount = '';
            parsed.electricity.billFileName = null;
            parsed.electricity.billUploaded = false;
          }
          if (!parsed.electricity.amount) {
            parsed.electricity.period = '';
            parsed.electricity.unit = '';
          }
        }
        if (Array.isArray(parsed.fuels) && parsed.fuels[0]) {
          if (parsed.fuels[0].quantity === 500 && parsed.fuels[0].billFileName === 'fuel_receipt_aug2026.pdf') {
            parsed.fuels[0].quantity = '';
            parsed.fuels[0].billFileName = null;
          }
          if (!parsed.fuels[0].quantity) {
            parsed.fuels[0].type = '';
            parsed.fuels[0].period = '';
            parsed.fuels[0].unit = '';
          }
        }
        if (parsed.transport) {
          if (parsed.transport.distance_km === 3800) {
            parsed.transport.distance_km = '';
          }
          if (!parsed.transport.distance_km) {
            parsed.transport.vehicle_type = '';
            parsed.transport.period = '';
          }
        }
        if (Array.isArray(parsed.materials) && parsed.materials[0]) {
          if (parsed.materials[0].quantity === 5000 || parsed.materials[0].quantity === 1200) {
            parsed.materials[0].quantity = '';
          }
          if (!parsed.materials[0].quantity) {
            parsed.materials[0].type = '';
            parsed.materials[0].period = '';
            parsed.materials[0].unit = '';
          }
        }
        if (Array.isArray(parsed.waste) && parsed.waste[0]) {
          if (parsed.waste[0].quantity === 200) {
            parsed.waste[0].quantity = '';
          }
          if (!parsed.waste[0].quantity) {
            parsed.waste[0].type = '';
            parsed.waste[0].period = '';
            parsed.waste[0].unit = '';
          }
        }
        return parsed;
      } catch (e) {
        return DEFAULT_STATE;
      }
    }
    return DEFAULT_STATE;
  });

  // Supabase Auth listener to restore active session & OAuth redirects
  useEffect(() => {
    // Check if returning from Google OAuth redirect with tokens in URL
    if (window.location.hash?.includes('access_token') || window.location.search?.includes('code=')) {
      getSession().then(session => {
        if (session?.user) {
          const user = session.user;
          setAuthUser(user);
          if (user.email) {
            setAppData(prev => ({
              ...prev,
              business: {
                ...prev.business,
                email: user.email,
                ownerName: prev.business.ownerName || user.user_metadata?.full_name || user.user_metadata?.name || ''
              }
            }));
          }
          setCurrentScreen(3);
        }
      }).catch(() => {});
    }

    getCurrentUser().then(user => {
      if (user) {
        setAuthUser(user);
        if (user.email) {
          setAppData(prev => ({
            ...prev,
            business: {
              ...prev.business,
              email: user.email,
              ownerName: prev.business.ownerName || user.user_metadata?.full_name || user.user_metadata?.name || ''
            }
          }));
        }
      }
    }).catch(() => {});

    const { data: { subscription } } = onAuthStateChange((event, session) => {
      const user = session?.user || null;
      setAuthUser(user);
      if (user?.email) {
        setAppData(prev => ({
          ...prev,
          business: {
            ...prev.business,
            email: user.email,
            ownerName: prev.business.ownerName || user.user_metadata?.full_name || user.user_metadata?.name || ''
          }
        }));
        if (event === 'SIGNED_IN') {
          setCurrentScreen(prev => (prev <= 2 ? 3 : prev));
        }
      }
    });

    return () => {
      if (subscription?.unsubscribe) subscription.unsubscribe();
    };
  }, []);

  // Keep synced to localStorage
  useEffect(() => {
    localStorage.setItem('terra_temp_id', tempId);
    localStorage.setItem('terra_data_state_v4', JSON.stringify(appData));
  }, [tempId, appData]);

  // Dynamic Prediction Integration with Python FastAPI
  const [serverPrediction, setServerPrediction] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetch('http://127.0.0.1:8000/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appData)
      })
        .then(res => res.json())
        .then(data => {
          if (data?.prediction) {
            setServerPrediction(data.prediction);
          }
        })
        .catch(() => {});
    }, 400);

    return () => clearTimeout(timer);
  }, [appData]);

  const navigateTo = (screenNum) => {
    setHistory(prev => [...prev, screenNum]);
    setCurrentScreen(screenNum);

    // Sync active bottom nav
    if (screenNum === 8) setActiveBottomNav('home');
    else if (screenNum === 9 || screenNum === 10) setActiveBottomNav('results');
    else if (screenNum === 11) setActiveBottomNav('whatif');
    else if (screenNum === 12) setActiveBottomNav('reports');
    else if (screenNum === 13) setActiveBottomNav('profile');
    else if (screenNum === 14) setActiveBottomNav('more');
    else if ([0, 4, 5, 15, 6, 16].includes(screenNum)) setActiveBottomNav('inputs');
  };

  const goBack = () => {
    if (history.length > 1) {
      const nextHistory = [...history];
      nextHistory.pop();
      const prevScreen = nextHistory[nextHistory.length - 1];
      setHistory(nextHistory);
      setCurrentScreen(prevScreen);
    } else {
      if (currentScreen > 1) {
        setCurrentScreen(currentScreen - 1);
      }
    }
  };

  const createNewTempId = () => {
    const newId = generateRandomTempId();
    setTempId(newId);
    return newId;
  };

  const updateBusiness = (fields) => {
    setAppData(prev => ({
      ...prev,
      business: { ...prev.business, ...fields }
    }));
  };

  const updateElectricity = (fields) => {
    setAppData(prev => ({
      ...prev,
      electricity: { ...prev.electricity, ...fields }
    }));
  };

  const updateFuels = (fuels) => {
    setAppData(prev => ({ ...prev, fuels }));
  };

  const addFuel = (fuel) => {
    setAppData(prev => ({
      ...prev,
      fuels: [...prev.fuels, { ...fuel, id: `fuel-${Date.now()}` }]
    }));
  };

  const updateMaterials = (materials) => {
    setAppData(prev => ({ ...prev, materials }));
  };

  const addMaterial = (mat) => {
    setAppData(prev => ({
      ...prev,
      materials: [...prev.materials, { ...mat, id: `mat-${Date.now()}` }]
    }));
  };

  const updateWaste = (waste) => {
    setAppData(prev => ({ ...prev, waste }));
  };

  const toggleActionApplied = (actionId) => {
    setAppData(prev => {
      const exists = prev.appliedActionIds.includes(actionId);
      const appliedActionIds = exists
        ? prev.appliedActionIds.filter(id => id !== actionId)
        : [...prev.appliedActionIds, actionId];
      return { ...prev, appliedActionIds };
    });
  };

  const updateWhatIf = (fields) => {
    setAppData(prev => ({
      ...prev,
      whatIf: { ...prev.whatIf, ...fields }
    }));
  };

  const resetToBenchmark = () => {
    setAppData(DEFAULT_STATE);
  };

  // Local calculation engine (always reactive to current inputs)
  const localFootprint = calculateFootprint(appData, appData.appliedActionIds);

  // Blend local calculation with server prediction if available
  const footprint = serverPrediction ? {
    ...localFootprint,
    total: serverPrediction.total,
    scope1: serverPrediction.scope1,
    scope2: serverPrediction.scope2,
    scope3: serverPrediction.scope3,
    breakdownSources: serverPrediction.breakdown || localFootprint.breakdownSources
  } : localFootprint;

  const handleSignOut = async () => {
    await supabaseSignOut();
    setAuthUser(null);
    createNewTempId();
    navigateTo(2);
  };

  const whatIfResult = calculateWhatIfImpact(
    footprint.baselineTotal || footprint.total,
    appData.whatIf.category,
    appData.whatIf.reductionPct,
    localFootprint.annualElecKwh || 144000
  );

  return (
    <AppContext.Provider
      value={{
        screens: SCREENS,
        currentScreen,
        navigateTo,
        goBack,
        deviceMode,
        setDeviceMode,
        activeBottomNav,
        setActiveBottomNav,
        tempId,
        setTempId,
        createNewTempId,
        authUser,
        setAuthUser,
        handleSignOut,
        isSupabaseConfigured: isSupabaseConfigured(),
        appData,
        setAppData,
        updateBusiness,
        updateElectricity,
        updateFuels,
        addFuel,
        updateMaterials,
        addMaterial,
        updateWaste,
        toggleActionApplied,
        updateWhatIf,
        resetToBenchmark,
        footprint,
        whatIfResult,
        serverPrediction
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
