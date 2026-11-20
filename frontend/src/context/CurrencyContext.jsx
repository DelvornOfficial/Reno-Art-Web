import React, { createContext, useContext, useState, useEffect } from 'react';

  export const DEFAULT_CURRENCY_CONFIG = {
    INR: {
      code: 'INR',
      symbol: '₹',
      rate: 1, // Base currency is INR
      name: 'Indian Rupee'
    },
    USD: {
      code: 'USD',
      symbol: '$',
      rate: 0.0107, // Real-time updated via API
      name: 'United States Dollar'
    },
    EUR: {
      code: 'EUR',
      symbol: '€',
      rate: 0.0098, // Real-time updated via API
      name: 'Euro'
    },
    GBP: {
      code: 'GBP',
      symbol: '£',
      rate: 0.0081, // Real-time updated via API
      name: 'British Pound'
    },
    AED: {
      code: 'AED',
      symbol: 'AED ',
      rate: 0.0393, // Real-time updated via API
      name: 'UAE Dirham'
    }
  };

  const CurrencyContext = createContext();

  export function CurrencyProvider({ children }) {
    const [currency, setCurrency] = useState(() => {
      return localStorage.getItem('reno_currency') || 'INR';
    });

const [ratesConfig, setRatesConfig] = useState(() => {
  try {
    const cached = localStorage.getItem('reno_currency_rates');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed.timestamp && Date.now() - parsed.timestamp < 1000 * 60 * 60 * 12) { // 12 hours cache
        return parsed.config;
      }
    }
  } catch {
    // ignore
  }
  return DEFAULT_CURRENCY_CONFIG;
});

// Fetch real-life live foreign exchange rates against INR
useEffect(() => {
  let isCancelled = false;
  async function fetchLiveExchangeRates() {
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/INR');
      if (res.ok) {
        const data = await res.json();
        if (data && data.rates && !isCancelled) {
          const updatedConfig = { ...DEFAULT_CURRENCY_CONFIG };
          Object.keys(updatedConfig).forEach((currKey) => {
            if (currKey === 'INR') {
              updatedConfig[currKey].rate = 1;
            } else if (data.rates[currKey]) {
              updatedConfig[currKey] = {
                ...updatedConfig[currKey],
                rate: Number(data.rates[currKey])
              };
            }
          });
          setRatesConfig(updatedConfig);
          localStorage.setItem('reno_currency_rates', JSON.stringify({
            config: updatedConfig,
            timestamp: Date.now()
          }));
        }
      }
    } catch (err) {
      console.warn('Realtime exchange rate fetch fallback:', err);
    }
  }
  fetchLiveExchangeRates();
  return () => {
    isCancelled = true;
  };
}, []);

const changeCurrency = (code) => {
    if (ratesConfig[code]) {
      setCurrency(code);
      localStorage.setItem('reno_currency', code);
    }
  };

  const currentConfig = ratesConfig[currency] || ratesConfig.INR || DEFAULT_CURRENCY_CONFIG.INR;

  const formatPrice = (priceInINR) => {
    const rawNum = Number(priceInINR);
    if (isNaN(rawNum)) return { formatted: `${currentConfig.symbol}0`, symbol: currentConfig.symbol, value: '0' };
    const converted = rawNum * currentConfig.rate;

    let displayVal;
    if (currency === 'INR') {
      displayVal = Math.round(converted).toLocaleString('en-IN');
    } else {
      displayVal = converted < 10 ? converted.toFixed(2) : Math.round(converted).toLocaleString('en-US');
    }
    return {
      formatted: `${currentConfig.symbol}${displayVal}`,
      symbol: currentConfig.symbol,
      value: displayVal
    };
  };

  return (
      <CurrencyContext.Provider value={{ currency, currentConfig, changeCurrency, formatPrice, CURRENCY_CONFIG: ratesConfig }}>
        {children}
      </CurrencyContext.Provider>
      );
}

      export function useCurrency() {
  const context = useContext(CurrencyContext);
      if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
      return context;
}
