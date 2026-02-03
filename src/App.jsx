import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { Plus, Trash2, ChevronDown, ChevronRight, TrendingUp, Users, CreditCard, Save, FolderOpen, Eye, EyeOff, X, Link, Check, PanelLeftClose, PanelLeftOpen, ChevronUp, Info } from 'lucide-react';

const STORAGE_KEY = 'cashflow-scenarios';

// Format currency helper (moved outside component to avoid recreation)
const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
};

// UI Components (defined outside main component to prevent focus loss on re-render)
const InputField = ({ label, value, onChange, onBlur, type = "number", prefix, suffix, className = "", step }) => (
  <div className={`flex flex-col gap-1 ${className}`}>
    <label className="text-xs text-gray-500">{label}</label>
    <div className="flex items-center gap-1">
      {prefix && <span className="text-gray-400 text-sm">{prefix}</span>}
      <input
        type={type}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className="w-full px-2 py-1 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      {suffix && <span className="text-gray-400 text-sm">{suffix}</span>}
    </div>
  </div>
);

const ExpenseRow = ({ item, onUpdate, onToggleHidden, onRemove, fields }) => {
  // Local state for deferred updates (update on blur)
  const [localValues, setLocalValues] = React.useState(() => {
    const values = {};
    fields.forEach(field => {
      values[field.key] = item[field.key];
    });
    return values;
  });

  // Sync local values when item changes externally (e.g., loading scenario)
  React.useEffect(() => {
    const values = {};
    fields.forEach(field => {
      values[field.key] = item[field.key];
    });
    setLocalValues(values);
  }, [item.id, ...fields.map(f => item[f.key])]);

  const handleChange = (field, value) => {
    setLocalValues(prev => ({ ...prev, [field.key]: value }));
  };

  const handleBlur = (field) => {
    const value = localValues[field.key];
    onUpdate(field.key, field.parse ? field.parse(value) : value);
  };

  return (
    <div className={`flex items-center gap-2 ${item.hidden ? 'opacity-50 bg-gray-100 rounded p-1 -mx-1' : ''}`}>
      {fields.map((field, idx) => (
        <React.Fragment key={field.key}>
          {field.prefix && <span className="text-gray-400 text-sm">{field.prefix}</span>}
          {field.type === 'select' ? (
            <select
              value={localValues[field.key]}
              onChange={(e) => {
                handleChange(field, e.target.value);
                // Select updates immediately since it's a discrete choice
                onUpdate(field.key, field.parse ? field.parse(e.target.value) : e.target.value);
              }}
              className="px-2 py-1 border rounded text-sm"
              disabled={item.hidden}
            >
              {field.options.map((opt, i) => (
                <option key={i} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          ) : (
            <input
              type={field.type || 'text'}
              step={field.step}
              value={localValues[field.key]}
              onChange={(e) => handleChange(field, e.target.value)}
              onBlur={() => handleBlur(field)}
              className={`${field.className || 'flex-1'} px-2 py-1 border rounded text-sm`}
              disabled={item.hidden}
            />
          )}
          {field.suffix && <span className="text-gray-400 text-sm">{field.suffix}</span>}
        </React.Fragment>
      ))}
      <button
        onClick={onToggleHidden}
        className={`${item.hidden ? 'text-amber-500 hover:text-amber-700' : 'text-gray-400 hover:text-amber-500'}`}
        title={item.hidden ? 'Show' : 'Hide'}
      >
        {item.hidden ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
      <button onClick={onRemove} className="text-red-500 hover:text-red-700" title="Delete">
        <Trash2 size={14} />
      </button>
    </div>
  );
};

const EmployeeRow = ({ item, onUpdate, onToggleHidden, onRemove, monthLabels }) => {
  // Local state for deferred updates (update on blur)
  const [localValues, setLocalValues] = React.useState({
    name: item.name,
    salary: item.salary,
    startMonth: item.startMonth,
    endMonth: item.endMonth,
    severanceMonths: item.severanceMonths,
  });

  // Sync local values when item changes externally
  React.useEffect(() => {
    setLocalValues({
      name: item.name,
      salary: item.salary,
      startMonth: item.startMonth,
      endMonth: item.endMonth,
      severanceMonths: item.severanceMonths,
    });
  }, [item.id, item.name, item.salary, item.startMonth, item.endMonth, item.severanceMonths]);

  const handleChange = (field, value) => {
    setLocalValues(prev => ({ ...prev, [field]: value }));
  };

  const handleBlur = (field, parse) => {
    const value = localValues[field];
    onUpdate(field, parse ? parse(value) : value);
  };

  const handleSelectChange = (field, value, parse) => {
    handleChange(field, value);
    onUpdate(field, parse ? parse(value) : value);
  };

  const hasEndDate = item.endMonth !== null && item.endMonth !== undefined;

  return (
    <div className={`space-y-2 py-2.5 border-b border-gray-200 ${item.hidden ? 'opacity-50' : ''}`}>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={localValues.name}
          onChange={(e) => handleChange('name', e.target.value)}
          onBlur={() => handleBlur('name')}
          className="w-28 px-2 py-1 border rounded text-sm"
          placeholder="Name"
          disabled={item.hidden}
        />
        <span className="text-gray-400 text-sm">$</span>
        <input
          type="number"
          value={localValues.salary}
          onChange={(e) => handleChange('salary', e.target.value)}
          onBlur={() => handleBlur('salary', v => parseFloat(v) || 0)}
          className="w-24 px-2 py-1 border rounded text-sm"
          placeholder="Salary"
          disabled={item.hidden}
        />
        <span className="text-gray-400 text-xs">/mo</span>
        <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
          = {formatCurrency(item.salary * 1.15)} all-in
        </span>
        <span className="flex-1" />
        <button
          onClick={onToggleHidden}
          className={`${item.hidden ? 'text-amber-500 hover:text-amber-700' : 'text-gray-400 hover:text-amber-500'}`}
          title={item.hidden ? 'Show' : 'Hide'}
        >
          {item.hidden ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
        <button onClick={onRemove} className="text-red-500 hover:text-red-700" title="Delete">
          <Trash2 size={14} />
        </button>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <span className="text-gray-500">Start:</span>
        <select
          value={localValues.startMonth}
          onChange={(e) => handleSelectChange('startMonth', e.target.value, v => parseInt(v))}
          className="px-1 py-0.5 border rounded text-xs"
          disabled={item.hidden}
        >
          {monthLabels.map((label, i) => (
            <option key={i} value={i}>{label}</option>
          ))}
        </select>
        <span className="text-gray-500 ml-2">End:</span>
        <select
          value={hasEndDate ? localValues.endMonth : ''}
          onChange={(e) => {
            const val = e.target.value;
            if (val === '') {
              handleSelectChange('endMonth', null, () => null);
              handleSelectChange('severanceMonths', 0, () => 0);
            } else {
              handleSelectChange('endMonth', val, v => parseInt(v));
            }
          }}
          className="px-1 py-0.5 border rounded text-xs"
          disabled={item.hidden}
        >
          <option value="">Indefinite</option>
          {monthLabels.map((label, i) => (
            <option key={i} value={i}>{label}</option>
          ))}
        </select>
        {hasEndDate && (
          <>
            <span className="text-gray-500 ml-2">Severance:</span>
            <select
              value={localValues.severanceMonths}
              onChange={(e) => handleSelectChange('severanceMonths', e.target.value, v => parseInt(v))}
              className="px-1 py-0.5 border rounded text-xs"
              disabled={item.hidden}
            >
              {[0, 1, 2, 3, 4, 5, 6, 9, 12].map(m => (
                <option key={m} value={m}>{m} mo</option>
              ))}
            </select>
          </>
        )}
      </div>
      {hasEndDate && (
        <div className="text-xs text-amber-600">
          Ends {monthLabels[item.endMonth]}{item.severanceMonths > 0 ? ` + ${item.severanceMonths} mo severance` : ''}
        </div>
      )}
    </div>
  );
};

const SectionHeader = ({ title, section, icon: Icon, badge, expanded, onToggle, onCollapseAll, onExpandAll }) => (
  <div className={`flex border-b border-gray-200 bg-white px-3 text-sm items-center gap-2 w-full font-semibold text-gray-700 py-2`}>
    <button
      onClick={() => onToggle(section)}
      className="flex items-center gap-2 flex-1 text-left hover:text-gray-900"
    >
      {Icon && <Icon size={15} className="text-gray-400" />}
      {title}
      {badge > 0 && (
        <span className="ml-2 px-1.5 py-0.5 text-xs bg-amber-100 text-amber-700 rounded">
          {badge} hidden
        </span>
      )}
    </button>
    {expanded && (
      <div className="flex items-center gap-1 text-xs font-normal">
        <button
          onClick={onExpandAll}
          className="px-1.5 py-0.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
        >
          Expand All
        </button>
        <span className="text-gray-300">|</span>
        <button
          onClick={onCollapseAll}
          className="px-1.5 py-0.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
        >
          Collapse All
        </button>
      </div>
    )}
    <button onClick={() => onToggle(section)} className="hover:text-gray-900">
      {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
    </button>
  </div>
);

const SidebarBox = ({ title, section, icon, badge, expanded, onToggle, children, dotColor }) => (
  <div className="rounded-lg border border-gray-200 bg-white" style={{ boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }}>
    <button
      onClick={() => onToggle(section)}
      className={`flex ${expanded ? 'border-b border-gray-200' : ''} px-2 py-1.5 text-xs items-center gap-1.5 w-full text-left font-medium text-gray-900 hover:text-gray`}
    >
      {dotColor && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: dotColor }} />}
      {icon && React.createElement(icon, { size: 12, className: 'text-gray-400' })}
      <span className="flex-1">{title}</span>
      {badge > 0 && (
        <span className="px-1 py-0.5 text-xs bg-amber-100 text-amber-700 rounded">
          {badge}
        </span>
      )}
      {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
    </button>
    {expanded && (
      <div className="px-2 py-3">
        {children}
      </div>
    )}
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border rounded shadow-lg text-sm">
        <p className="font-semibold mb-2">{label}</p>
        <p className="text-green-600">Inflows: {formatCurrency(data.totalInflows)}</p>
        <p className="text-red-600">Outflows: {formatCurrency(data.totalOutflows)}</p>
        <p className="text-blue-600 font-semibold">Balance: {formatCurrency(data.cashBalance)}</p>
      </div>
    );
  }
  return null;
};

// URL param helpers
const encodeState = (state) => {
  const params = new URLSearchParams();
  
  // Simple values
  params.set('ic', state.initialCash);
  params.set('mrr', state.startingMRR);
  params.set('nc', state.newCustomersPerMonth);
  params.set('arpu', state.arpu);
  params.set('churn', state.monthlyChurnRate);
  params.set('ar', state.additionalRevenue);
  params.set('arg', state.additionalRevenueGrowth);
  
  // Complex arrays - JSON encode
  params.set('apr', JSON.stringify(state.annualPlanRevenue.map(e => ({ d: e.description, m: e.month, a: e.amount, h: e.hidden ? 1 : 0 }))));
  params.set('ci', JSON.stringify(state.capitalInjections.map(e => ({ d: e.description, m: e.month, a: e.amount, h: e.hidden ? 1 : 0 }))));
  params.set('emp', JSON.stringify(state.employees.map(e => ({
    n: e.name,
    s: e.salary,
    h: e.hidden ? 1 : 0,
    sm: e.startMonth,
    em: e.endMonth,
    sv: e.severanceMonths
  }))));
  params.set('rec', JSON.stringify(state.recurringExpenses.map(e => ({ c: e.category, a: e.amount, h: e.hidden ? 1 : 0 }))));
  params.set('one', JSON.stringify(state.oneTimeExpenses.map(e => ({ d: e.description, m: e.month, a: e.amount, h: e.hidden ? 1 : 0 }))));
  params.set('var', JSON.stringify(state.variableExpenses.map(e => ({ c: e.category, p: e.percentage, h: e.hidden ? 1 : 0 }))));
  params.set('ref', JSON.stringify(state.refunds.map(e => ({ c: e.category, a: e.amount, h: e.hidden ? 1 : 0 }))));
  params.set('odr', JSON.stringify(state.ownersDraw.map(e => ({ c: e.category, a: e.amount, h: e.hidden ? 1 : 0 }))));
  params.set('o4k', JSON.stringify(state.owners401k.map(e => ({ c: e.category, m: e.month, a: e.amount, h: e.hidden ? 1 : 0 }))));
  params.set('etx', JSON.stringify(state.estimatedTaxes.map(e => ({ d: e.description, m: e.month, a: e.amount, h: e.hidden ? 1 : 0 }))));

  return params.toString();
};

const decodeState = (search, defaultState) => {
  if (!search) return null;
  
  try {
    const params = new URLSearchParams(search);
    
    // Check if we have any of our params
    if (!params.has('mrr') && !params.has('ic')) return null;
    
    const state = { ...defaultState };
    
    // Simple values
    if (params.has('ic')) state.initialCash = parseFloat(params.get('ic')) || 0;
    if (params.has('mrr')) state.startingMRR = parseFloat(params.get('mrr')) || 0;
    if (params.has('nc')) state.newCustomersPerMonth = parseFloat(params.get('nc')) || 0;
    if (params.has('arpu')) state.arpu = parseFloat(params.get('arpu')) || 0;
    if (params.has('churn')) state.monthlyChurnRate = parseFloat(params.get('churn')) || 0;
    if (params.has('ar')) state.additionalRevenue = parseFloat(params.get('ar')) || 0;
    if (params.has('arg')) state.additionalRevenueGrowth = parseFloat(params.get('arg')) || 0;
    
    // Monthly arrays
    // Complex arrays - annualPlanRevenue and capitalInjections
    if (params.has('apr')) {
      try {
        const apr = JSON.parse(params.get('apr'));
        if (Array.isArray(apr) && apr.length > 0 && typeof apr[0] === 'object') {
          state.annualPlanRevenue = apr.map((e, i) => ({ id: i + 1, description: e.d, month: e.m, amount: e.a, hidden: !!e.h }));
        }
      } catch (e) {
        // Legacy format: "index:value" pairs - convert to new format
        const items = [];
        params.get('apr').split(',').forEach(pair => {
          const [idx, val] = pair.split(':');
          if (parseFloat(val)) {
            items.push({ id: items.length + 1, description: 'Annual Plan Payment', month: parseInt(idx), amount: parseFloat(val), hidden: false });
          }
        });
        if (items.length > 0) state.annualPlanRevenue = items;
      }
    }
    if (params.has('ci')) {
      try {
        const ci = JSON.parse(params.get('ci'));
        if (Array.isArray(ci) && ci.length > 0 && typeof ci[0] === 'object') {
          state.capitalInjections = ci.map((e, i) => ({ id: i + 1, description: e.d, month: e.m, amount: e.a, hidden: !!e.h }));
        }
      } catch (e) {
        // Legacy format: "index:value" pairs - convert to new format
        const items = [];
        params.get('ci').split(',').forEach(pair => {
          const [idx, val] = pair.split(':');
          if (parseFloat(val)) {
            items.push({ id: items.length + 1, description: 'Capital Injection', month: parseInt(idx), amount: parseFloat(val), hidden: false });
          }
        });
        if (items.length > 0) state.capitalInjections = items;
      }
    }

    // Complex arrays
    if (params.has('emp')) {
      const emp = JSON.parse(params.get('emp'));
      state.employees = emp.map((e, i) => ({
        id: i + 1,
        name: e.n,
        salary: e.s,
        hidden: !!e.h,
        startMonth: e.sm ?? 0,
        endMonth: e.em ?? null,
        severanceMonths: e.sv ?? 0
      }));
    }
    if (params.has('rec')) {
      const rec = JSON.parse(params.get('rec'));
      state.recurringExpenses = rec.map((e, i) => ({ id: i + 1, category: e.c, amount: e.a, hidden: !!e.h }));
    }
    if (params.has('one')) {
      const one = JSON.parse(params.get('one'));
      state.oneTimeExpenses = one.map((e, i) => ({ id: i + 1, description: e.d, month: e.m, amount: e.a, hidden: !!e.h }));
    }
    if (params.has('var')) {
      const varExp = JSON.parse(params.get('var'));
      state.variableExpenses = varExp.map((e, i) => ({ id: i + 1, category: e.c, percentage: e.p, hidden: !!e.h }));
    }
    if (params.has('ref')) {
      const ref = JSON.parse(params.get('ref'));
      state.refunds = ref.map((e, i) => ({ id: i + 1, category: e.c, amount: e.a, hidden: !!e.h }));
    }
    if (params.has('odr')) {
      const odr = JSON.parse(params.get('odr'));
      state.ownersDraw = odr.map((e, i) => ({ id: i + 1, category: e.c, amount: e.a, hidden: !!e.h }));
    }
    if (params.has('o4k')) {
      const o4k = JSON.parse(params.get('o4k'));
      state.owners401k = o4k.map((e, i) => ({ id: i + 1, category: e.c, month: e.m ?? 0, amount: e.a, hidden: !!e.h }));
    }
    if (params.has('etx')) {
      const etx = JSON.parse(params.get('etx'));
      state.estimatedTaxes = etx.map((e, i) => ({ id: i + 1, description: e.d, month: e.m, amount: e.a, hidden: !!e.h }));
    }

    return state;
  } catch (e) {
    console.error('Failed to decode URL state:', e);
    return null;
  }
};

export default function CashflowModel() {
  // Date helpers
  const getMonthLabels = () => {
    const labels = [];
    const now = new Date();
    for (let i = 0; i < 24; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      labels.push(d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }));
    }
    return labels;
  };
  const monthLabels = getMonthLabels();

  // Default state factory
  const getDefaultState = () => ({
    initialCash: 150000,
    startingMRR: 63000,
    newCustomersPerMonth: 50,
    arpu: 15,
    monthlyChurnRate: 5,
    additionalRevenue: 0,
    additionalRevenueGrowth: 0,
    annualPlanRevenue: [],
    capitalInjections: [],
    employees: [
      { id: 1, name: 'Employee 1', salary: 8000, hidden: false, startMonth: 0, endMonth: null, severanceMonths: 0 },
      { id: 2, name: 'Employee 2', salary: 7000, hidden: false, startMonth: 0, endMonth: null, severanceMonths: 0 },
    ],
    recurringExpenses: [
      { id: 1, category: 'Software & Tools', amount: 2000, hidden: false },
      { id: 2, category: 'Hosting & Infrastructure', amount: 1500, hidden: false },
      { id: 3, category: 'Marketing', amount: 1000, hidden: false },
    ],
    oneTimeExpenses: [
      { id: 1, description: 'Equipment', month: 3, amount: 5000, hidden: false },
    ],
    variableExpenses: [
      { id: 1, category: 'Stripe Fees', percentage: 2.9, hidden: false },
    ],
    refunds: [
      { id: 1, category: 'Customer Refunds', amount: 500, hidden: false },
    ],
    ownersDraw: [
      { id: 1, category: 'Owner Draw', amount: 0, hidden: false },
    ],
    owners401k: [
      { id: 1, category: '401k Contribution', month: 0, amount: 0, hidden: false },
    ],
    estimatedTaxes: [
      { id: 1, description: 'Q1 Estimated Tax', month: 3, amount: 0, hidden: false },
      { id: 2, description: 'Q2 Estimated Tax', month: 5, amount: 0, hidden: false },
      { id: 3, description: 'Q3 Estimated Tax', month: 8, amount: 0, hidden: false },
      { id: 4, description: 'Q4 Estimated Tax', month: 11, amount: 0, hidden: false },
    ],
  });

  // Initialize state from URL or defaults
  const getInitialState = () => {
    const urlState = decodeState(window.location.search, getDefaultState());
    return urlState || getDefaultState();
  };

  // Main state
  const [state, setState] = useState(getInitialState);
  const isInitialMount = useRef(true);

  // Scenario management
  const [scenarios, setScenarios] = useState([]);
  const [currentScenarioName, setCurrentScenarioName] = useState('');
  const [scenarioModified, setScenarioModified] = useState(false);
  const [newScenarioName, setNewScenarioName] = useState('');
  const [showScenarioModal, setShowScenarioModal] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // Local state for inputs (update on blur to prevent graph jitter)
  const [localInputs, setLocalInputs] = useState({
    startingMRR: state.startingMRR,
    newCustomersPerMonth: state.newCustomersPerMonth,
    arpu: state.arpu,
    monthlyChurnRate: state.monthlyChurnRate,
    initialCash: state.initialCash,
    additionalRevenue: state.additionalRevenue,
    additionalRevenueGrowth: state.additionalRevenueGrowth,
  });

  // Track if we're loading a scenario (to avoid marking as modified)
  const isLoadingScenario = useRef(false);

  // Update URL when state changes and track modifications
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Mark scenario as modified (unless we're loading one)
    if (currentScenarioName && !isLoadingScenario.current) {
      setScenarioModified(true);
    }
    isLoadingScenario.current = false;

    const encoded = encodeState(state);
    const newUrl = `${window.location.pathname}?${encoded}`;
    window.history.replaceState({}, '', newUrl);
  }, [state, currentScenarioName]);

  // Load scenarios from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setScenarios(parsed);
      }
    } catch (e) {
      console.error('Failed to load scenarios:', e);
    }
  }, []);

  // Save scenarios to localStorage
  const saveScenarios = useCallback((newScenarios) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newScenarios));
      setScenarios(newScenarios);
    } catch (e) {
      console.error('Failed to save scenarios:', e);
    }
  }, []);

  // Sync local inputs when state changes externally (e.g., loading scenario)
  useEffect(() => {
    setLocalInputs({
      startingMRR: state.startingMRR,
      newCustomersPerMonth: state.newCustomersPerMonth,
      arpu: state.arpu,
      monthlyChurnRate: state.monthlyChurnRate,
      initialCash: state.initialCash,
      additionalRevenue: state.additionalRevenue,
      additionalRevenueGrowth: state.additionalRevenueGrowth,
    });
  }, [state.startingMRR, state.newCustomersPerMonth, state.arpu, state.monthlyChurnRate, state.initialCash, state.additionalRevenue, state.additionalRevenueGrowth]);

  // UI State
  const [expandedSections, setExpandedSections] = useState({
    inflows: true,
    outflows: true,
    initialCash: false,
    mrr: false,
    additionalRevenue: false,
    payroll: false,
    recurring: false,
    onetime: false,
    variable: false,
    refunds: false,
    ownersDraw: false,
    owners401k: false,
    estimatedTaxes: false,
    capitalInjections: false,
    annualPlanRevenue: false,
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(500);
  const isResizing = useRef(false);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const inflowSections = ['initialCash', 'mrr', 'additionalRevenue', 'capitalInjections', 'annualPlanRevenue'];
  const outflowSections = ['payroll', 'recurring', 'onetime', 'variable', 'refunds', 'ownersDraw', 'owners401k', 'estimatedTaxes'];

  const collapseAllInflows = () => {
    setExpandedSections(prev => {
      const updated = { ...prev };
      inflowSections.forEach(s => updated[s] = false);
      return updated;
    });
  };

  const expandAllInflows = () => {
    setExpandedSections(prev => {
      const updated = { ...prev };
      inflowSections.forEach(s => updated[s] = true);
      return updated;
    });
  };

  const collapseAllOutflows = () => {
    setExpandedSections(prev => {
      const updated = { ...prev };
      outflowSections.forEach(s => updated[s] = false);
      return updated;
    });
  };

  const expandAllOutflows = () => {
    setExpandedSections(prev => {
      const updated = { ...prev };
      outflowSections.forEach(s => updated[s] = true);
      return updated;
    });
  };

  // Sidebar resize handlers
  const startResizing = useCallback((e) => {
    isResizing.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', stopResizing);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isResizing.current) return;
    const newWidth = e.clientX;
    if (newWidth >= 300 && newWidth <= 800) {
      setSidebarWidth(newWidth);
    }
  }, []);

  const stopResizing = useCallback(() => {
    isResizing.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', stopResizing);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, [handleMouseMove]);

  // State updaters
  const updateState = (key, value) => {
    setState(prev => ({ ...prev, [key]: value }));
  };

  const updateArrayItem = (key, id, field, value) => {
    setState(prev => ({
      ...prev,
      [key]: prev[key].map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const addArrayItem = (key, newItem) => {
    setState(prev => ({
      ...prev,
      [key]: [...prev[key], { ...newItem, id: Date.now(), hidden: false }]
    }));
  };

  const removeArrayItem = (key, id) => {
    setState(prev => ({
      ...prev,
      [key]: prev[key].filter(item => item.id !== id)
    }));
  };

  const toggleHidden = (key, id) => {
    setState(prev => ({
      ...prev,
      [key]: prev[key].map(item => item.id === id ? { ...item, hidden: !item.hidden } : item)
    }));
  };

  // Input handlers (update on blur to prevent graph jitter)
  const handleLocalInputChange = (field, value) => {
    setLocalInputs(prev => ({ ...prev, [field]: value }));
  };

  const handleLocalInputBlur = (field) => {
    updateState(field, parseFloat(localInputs[field]) || 0);
  };

  // Copy link handler
  const copyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  };

  // Scenario handlers
  const saveCurrentScenario = () => {
    if (!newScenarioName.trim()) return;
    
    const scenario = {
      name: newScenarioName.trim(),
      savedAt: new Date().toISOString(),
      data: { ...state }
    };
    
    const existingIndex = scenarios.findIndex(s => s.name === scenario.name);
    let newScenarios;
    
    if (existingIndex >= 0) {
      newScenarios = [...scenarios];
      newScenarios[existingIndex] = scenario;
    } else {
      newScenarios = [...scenarios, scenario];
    }
    
    saveScenarios(newScenarios);
    setCurrentScenarioName(scenario.name);
    setScenarioModified(false);
    setNewScenarioName('');
    setShowScenarioModal(false);
  };

  const loadScenario = (scenario) => {
    isLoadingScenario.current = true;
    setState(scenario.data);
    setCurrentScenarioName(scenario.name);
    setScenarioModified(false);
  };

  const updateCurrentScenario = () => {
    if (!currentScenarioName) return;
    const scenario = {
      name: currentScenarioName,
      savedAt: new Date().toISOString(),
      data: { ...state }
    };
    const newScenarios = scenarios.map(s =>
      s.name === currentScenarioName ? scenario : s
    );
    saveScenarios(newScenarios);
    setScenarioModified(false);
  };

  const deleteScenario = (name) => {
    const newScenarios = scenarios.filter(s => s.name !== name);
    saveScenarios(newScenarios);
    if (currentScenarioName === name) {
      setCurrentScenarioName('');
      setScenarioModified(false);
    }
  };

  const resetToDefaults = () => {
    setState(getDefaultState());
    setCurrentScenarioName('');
    setScenarioModified(false);
  };

  // Count hidden items
  const hiddenCounts = useMemo(() => ({
    employees: state.employees.filter(e => e.hidden).length,
    recurringExpenses: state.recurringExpenses.filter(e => e.hidden).length,
    oneTimeExpenses: state.oneTimeExpenses.filter(e => e.hidden).length,
    variableExpenses: state.variableExpenses.filter(e => e.hidden).length,
    refunds: state.refunds.filter(e => e.hidden).length,
    ownersDraw: state.ownersDraw.filter(e => e.hidden).length,
    owners401k: state.owners401k.filter(e => e.hidden).length,
    estimatedTaxes: state.estimatedTaxes.filter(e => e.hidden).length,
    annualPlanRevenue: state.annualPlanRevenue.filter(e => e.hidden).length,
    capitalInjections: state.capitalInjections.filter(e => e.hidden).length,
  }), [state.employees, state.recurringExpenses, state.oneTimeExpenses, state.variableExpenses, state.refunds, state.ownersDraw, state.owners401k, state.estimatedTaxes, state.annualPlanRevenue, state.capitalInjections]);

  const totalHidden = Object.values(hiddenCounts).reduce((a, b) => a + b, 0);

  // Unhide all
  const unhideAll = () => {
    setState(prev => ({
      ...prev,
      employees: prev.employees.map(e => ({ ...e, hidden: false })),
      recurringExpenses: prev.recurringExpenses.map(e => ({ ...e, hidden: false })),
      oneTimeExpenses: prev.oneTimeExpenses.map(e => ({ ...e, hidden: false })),
      variableExpenses: prev.variableExpenses.map(e => ({ ...e, hidden: false })),
      refunds: prev.refunds.map(e => ({ ...e, hidden: false })),
      ownersDraw: prev.ownersDraw.map(e => ({ ...e, hidden: false })),
      owners401k: prev.owners401k.map(e => ({ ...e, hidden: false })),
      estimatedTaxes: prev.estimatedTaxes.map(e => ({ ...e, hidden: false })),
      annualPlanRevenue: prev.annualPlanRevenue.map(e => ({ ...e, hidden: false })),
      capitalInjections: prev.capitalInjections.map(e => ({ ...e, hidden: false })),
    }));
  };

  // Calculate all values
  const calculations = useMemo(() => {
    const data = [];
    let runningCash = state.initialCash;
    let currentMRR = state.startingMRR;
    let currentAdditionalRevenue = state.additionalRevenue;

    for (let month = 0; month < 24; month++) {
      // MRR Calculation
      if (month > 0) {
        const churnLoss = currentMRR * (state.monthlyChurnRate / 100);
        const newRevenue = state.newCustomersPerMonth * state.arpu;
        currentMRR = currentMRR - churnLoss + newRevenue;
      }

      // Additional revenue with growth (supports negative growth)
      if (month > 0) {
        currentAdditionalRevenue = currentAdditionalRevenue * (1 + state.additionalRevenueGrowth / 100);
      }

      // Annual plan revenue (additional one-time payments, not included in MRR) - exclude hidden
      const annualPlanRev = state.annualPlanRevenue
        .filter(item => item.month === month && !item.hidden)
        .reduce((sum, item) => sum + item.amount, 0);

      // Capital injections - exclude hidden
      const capitalInj = state.capitalInjections
        .filter(item => item.month === month && !item.hidden)
        .reduce((sum, item) => sum + item.amount, 0);

      // Total Revenue - MRR is separate from annual plan revenue
      const totalRevenue = currentMRR + currentAdditionalRevenue + annualPlanRev + capitalInj;

      // Payroll (all-in = salary * 1.15) - exclude hidden, factor in start/end dates and severance
      const totalPayroll = state.employees
        .filter(emp => !emp.hidden)
        .reduce((sum, emp) => {
          const allInSalary = emp.salary * 1.15;

          // Check if employee has started yet
          if (month < emp.startMonth) {
            return sum;
          }

          // If no end date, employee is active indefinitely
          if (emp.endMonth === null || emp.endMonth === undefined) {
            return sum + allInSalary;
          }

          // Employee is still active (before or at end month)
          if (month <= emp.endMonth) {
            return sum + allInSalary;
          }

          // Check if in severance period (months after endMonth)
          const monthsAfterEnd = month - emp.endMonth;
          if (monthsAfterEnd <= emp.severanceMonths) {
            return sum + allInSalary;
          }

          // Employee has ended and severance is complete
          return sum;
        }, 0);

      // Recurring expenses - exclude hidden
      const totalRecurring = state.recurringExpenses
        .filter(exp => !exp.hidden)
        .reduce((sum, exp) => sum + exp.amount, 0);

      // One-time expenses for this month - exclude hidden
      const totalOneTime = state.oneTimeExpenses
        .filter(exp => exp.month === month && !exp.hidden)
        .reduce((sum, exp) => sum + exp.amount, 0);

      // Variable expenses - exclude hidden
      const revenueForVariable = currentMRR + currentAdditionalRevenue + annualPlanRev;
      const totalVariable = state.variableExpenses
        .filter(exp => !exp.hidden)
        .reduce((sum, exp) => sum + (revenueForVariable * exp.percentage / 100), 0);

      // Refunds - exclude hidden
      const totalRefunds = state.refunds
        .filter(exp => !exp.hidden)
        .reduce((sum, exp) => sum + exp.amount, 0);

      // Estimated taxes (manual payments by month) - exclude hidden
      const totalEstimatedTaxes = state.estimatedTaxes
        .filter(exp => exp.month === month && !exp.hidden)
        .reduce((sum, exp) => sum + exp.amount, 0);

      // Owner's Draw (taken from profits) - exclude hidden
      const totalOwnersDraw = state.ownersDraw
        .filter(exp => !exp.hidden)
        .reduce((sum, exp) => sum + exp.amount, 0);

      // Owner's 401k (taken from profits, specific months only) - exclude hidden
      const totalOwners401k = state.owners401k
        .filter(exp => exp.month === month && !exp.hidden)
        .reduce((sum, exp) => sum + exp.amount, 0);

      // Total outflows
      const totalOutflows = totalPayroll + totalRecurring + totalOneTime + totalVariable + totalRefunds + totalEstimatedTaxes + totalOwnersDraw + totalOwners401k;

      // Net cashflow
      const netCashflow = totalRevenue - totalOutflows;
      runningCash += netCashflow;

      data.push({
        month: monthLabels[month],
        monthIndex: month,
        mrr: Math.round(currentMRR),
        additionalRevenue: Math.round(currentAdditionalRevenue),
        annualPlanRevenue: annualPlanRev,
        capitalInjection: capitalInj,
        totalInflows: Math.round(totalRevenue),
        payroll: Math.round(totalPayroll),
        recurringExpenses: Math.round(totalRecurring),
        oneTimeExpenses: totalOneTime,
        variableExpenses: Math.round(totalVariable),
        refunds: Math.round(totalRefunds),
        estimatedTaxes: Math.round(totalEstimatedTaxes),
        ownersDraw: Math.round(totalOwnersDraw),
        owners401k: Math.round(totalOwners401k),
        totalOutflows: Math.round(totalOutflows),
        netCashflow: Math.round(netCashflow),
        cashBalance: Math.round(runningCash),
      });
    }

    return data;
  }, [state, monthLabels]);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Sidebar */}
      <div
        className={`${sidebarOpen ? '' : 'w-0'} flex-shrink-0 bg-white border-r border-gray-200 overflow-hidden shadow-md relative`}
        style={{ width: sidebarOpen ? sidebarWidth : 0, transition: isResizing.current ? 'none' : 'width 0.3s' }}
      >
        <div className="h-full overflow-y-auto bg-gray-50" style={{ width: sidebarWidth }}>
          {/* App Header */}
          <div className="px-3 py-2 bg-white border-b border-gray-200 flex items-center gap-1">
            <img src="/airstrip-favicon.png" alt="Airstrip" className="w-4 h-4" />
            <h1 className="text-lg font-bold text-gray-800">Airstrip</h1>
          </div>

          {/* Action Buttons */}
          <div className="p-3 border-b border-gray-200 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              {totalHidden > 0 && (
                <button
                  onClick={unhideAll}
                  className="flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs hover:bg-amber-200"
                >
                  <Eye size={12} />
                  Show All ({totalHidden})
                </button>
              )}

              <button
                onClick={copyLink}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                  linkCopied
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title="Copy shareable link"
              >
                {linkCopied ? <Check size={12} /> : <Link size={12} />}
                {linkCopied ? 'Copied!' : 'Share'}
              </button>

              {currentScenarioName && scenarioModified && (
                <button
                  onClick={updateCurrentScenario}
                  className="flex items-center gap-1 px-2 py-1 bg-amber-500 text-white rounded text-xs hover:bg-amber-600"
                >
                  <Save size={12} />
                  Update
                </button>
              )}

              <button
                onClick={() => setShowScenarioModal(true)}
                className="flex items-center gap-1 px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
              >
                <Save size={12} />
                Save As New
              </button>

              {scenarios.length > 0 && (
                <div className="relative group">
                  <button className="flex items-center gap-1 px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300">
                    <FolderOpen size={12} />
                    Load ({scenarios.length})
                  </button>
                  <div className="absolute left-0 mt-1 w-56 bg-white border rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    {scenarios.map(scenario => (
                      <div key={scenario.name} className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 border-b last:border-0">
                        <button
                          onClick={() => loadScenario(scenario)}
                          className="flex-1 text-left text-xs"
                        >
                          <div className="font-medium">{scenario.name}</div>
                          <div className="text-xs text-gray-400">
                            {new Date(scenario.savedAt).toLocaleDateString()}
                          </div>
                        </button>
                        <button
                          onClick={() => deleteScenario(scenario.name)}
                          className="text-red-400 hover:text-red-600 p-1"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={resetToDefaults}
                className="px-2 py-1 text-gray-500 text-xs hover:text-gray-700"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Inflows Panel */}
          <div>
            <SectionHeader title="Inflows" section="inflows" icon={TrendingUp} expanded={expandedSections.inflows} onToggle={toggleSection} onCollapseAll={collapseAllInflows} onExpandAll={expandAllInflows} />
            {expandedSections.inflows && (
              <div className="space-y-2 p-2.5 bg-gray-50 border-b border-gray-200">
                {/* Initial Cash */}
                <SidebarBox
                  title="Initial Cash in Bank"
                  section="initialCash"
                  expanded={expandedSections.initialCash}
                  onToggle={toggleSection}
                  dotColor="#22c55e"
                >
                  <InputField
                    label="Amount"
                    value={localInputs.initialCash}
                    onChange={(v) => handleLocalInputChange('initialCash', v)}
                    onBlur={() => handleLocalInputBlur('initialCash')}
                    prefix="$"
                  />
                </SidebarBox>

                {/* MRR Settings */}
                <SidebarBox
                  title="MRR Extrapolation"
                  section="mrr"
                  expanded={expandedSections.mrr}
                  onToggle={toggleSection}
                  dotColor="#6b7280"
                >
                  <div className="grid grid-cols-2 gap-2">
                    <InputField
                      label="Starting MRR"
                      value={localInputs.startingMRR}
                      onChange={(v) => handleLocalInputChange('startingMRR', v)}
                      onBlur={() => handleLocalInputBlur('startingMRR')}
                      prefix="$"
                    />
                    <InputField
                      label="ARPU"
                      value={localInputs.arpu}
                      onChange={(v) => handleLocalInputChange('arpu', v)}
                      onBlur={() => handleLocalInputBlur('arpu')}
                      prefix="$"
                    />
                    <InputField
                      label="New Customers/mo"
                      value={localInputs.newCustomersPerMonth}
                      onChange={(v) => handleLocalInputChange('newCustomersPerMonth', v)}
                      onBlur={() => handleLocalInputBlur('newCustomersPerMonth')}
                    />
                    <InputField
                      label="Monthly Churn"
                      value={localInputs.monthlyChurnRate}
                      onChange={(v) => handleLocalInputChange('monthlyChurnRate', v)}
                      onBlur={() => handleLocalInputBlur('monthlyChurnRate')}
                      suffix="%"
                    />
                  </div>
                  <div className="mt-2 pt-2 border-t border-gray-200 flex items-center justify-between text-xs">
                    <span className="text-gray-500 flex items-center gap-1">
                      Terminal MRR
                      <span className="relative group">
                        <Info size={12} className="text-gray-400 cursor-help" />
                        <span className="absolute left-full top-1/2 -translate-y-1/2 ml-1 px-2 py-1.5 bg-gray-800 text-white text-xs rounded w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity z-10">
                          The maximum MRR you'll reach when new customers equal churned customers each month.
                        </span>
                      </span>
                    </span>
                    <span className="font-medium text-gray-700">
                      {state.monthlyChurnRate > 0
                        ? formatCurrency((state.newCustomersPerMonth / (state.monthlyChurnRate / 100)) * state.arpu)
                        : '∞'}
                    </span>
                  </div>
                </SidebarBox>

                {/* Additional Revenue */}
                <SidebarBox
                  title="Additional Revenue"
                  section="additionalRevenue"
                  expanded={expandedSections.additionalRevenue}
                  onToggle={toggleSection}
                  dotColor="#8b5cf6"
                >
                  <div className="grid grid-cols-2 gap-2">
                    <InputField
                      label="Amount"
                      value={localInputs.additionalRevenue}
                      onChange={(v) => handleLocalInputChange('additionalRevenue', v)}
                      onBlur={() => handleLocalInputBlur('additionalRevenue')}
                      prefix="$"
                    />
                    <InputField
                      label="Growth"
                      value={localInputs.additionalRevenueGrowth}
                      onChange={(v) => handleLocalInputChange('additionalRevenueGrowth', v)}
                      onBlur={() => handleLocalInputBlur('additionalRevenueGrowth')}
                      suffix="%"
                    />
                  </div>
                </SidebarBox>

                {/* Capital Injections */}
                <SidebarBox
                  title="Capital Injections"
                  section="capitalInjections"
                  badge={hiddenCounts.capitalInjections}
                  expanded={expandedSections.capitalInjections}
                  onToggle={toggleSection}
                  dotColor="#3b82f6"
                >
                  <div className="space-y-1">
                    {state.capitalInjections.map(item => (
                      <ExpenseRow
                        key={item.id}
                        item={item}
                        onUpdate={(field, value) => updateArrayItem('capitalInjections', item.id, field, value)}
                        onToggleHidden={() => toggleHidden('capitalInjections', item.id)}
                        onRemove={() => removeArrayItem('capitalInjections', item.id)}
                        fields={[
                          { key: 'description', type: 'text', className: 'flex-1' },
                          {
                            key: 'month',
                            type: 'select',
                            options: monthLabels.map((label, i) => ({ value: i, label })),
                            parse: v => parseInt(v)
                          },
                          { key: 'amount', type: 'number', prefix: '$', className: 'w-20', parse: v => parseFloat(v) || 0 },
                        ]}
                      />
                    ))}
                    <button
                      onClick={() => addArrayItem('capitalInjections', { description: 'Capital Injection', month: 0, amount: 0 })}
                      className="flex items-center gap-1 text-blue-500 hover:text-blue-700 text-xs"
                    >
                      <Plus size={12} /> Add Injection
                    </button>
                  </div>
                </SidebarBox>

                {/* Annual Plan Revenue */}
                <SidebarBox
                  title="Annual Plan Revenue"
                  section="annualPlanRevenue"
                  badge={hiddenCounts.annualPlanRevenue}
                  expanded={expandedSections.annualPlanRevenue}
                  onToggle={toggleSection}
                  dotColor="#a855f7"
                >
                  <div className="space-y-1">
                    {state.annualPlanRevenue.map(item => (
                      <ExpenseRow
                        key={item.id}
                        item={item}
                        onUpdate={(field, value) => updateArrayItem('annualPlanRevenue', item.id, field, value)}
                        onToggleHidden={() => toggleHidden('annualPlanRevenue', item.id)}
                        onRemove={() => removeArrayItem('annualPlanRevenue', item.id)}
                        fields={[
                          { key: 'description', type: 'text', className: 'flex-1' },
                          {
                            key: 'month',
                            type: 'select',
                            options: monthLabels.map((label, i) => ({ value: i, label })),
                            parse: v => parseInt(v)
                          },
                          { key: 'amount', type: 'number', prefix: '$', className: 'w-20', parse: v => parseFloat(v) || 0 },
                        ]}
                      />
                    ))}
                    <button
                      onClick={() => addArrayItem('annualPlanRevenue', { description: 'Annual Plan Payment', month: 0, amount: 0 })}
                      className="flex items-center gap-1 text-blue-500 hover:text-blue-700 text-xs"
                    >
                      <Plus size={12} /> Add Payment
                    </button>
                  </div>
                </SidebarBox>
              </div>
            )}
          </div>

          {/* Outflows Panel */}
          <div>
            <SectionHeader title="Outflows" section="outflows" icon={CreditCard} expanded={expandedSections.outflows} onToggle={toggleSection} onCollapseAll={collapseAllOutflows} onExpandAll={expandAllOutflows} />
            {expandedSections.outflows && (
              <div className="space-y-2 p-3 bg-gray-50">
                {/* Payroll */}
                <SidebarBox
                  title="Payroll"
                  section="payroll"
                  badge={hiddenCounts.employees}
                  expanded={expandedSections.payroll}
                  onToggle={toggleSection}
                  dotColor="#ef4444"
                >
                  <div className="space-y-2">
                    {state.employees.map(emp => (
                      <EmployeeRow
                        key={emp.id}
                        item={emp}
                        onUpdate={(field, value) => updateArrayItem('employees', emp.id, field, value)}
                        onToggleHidden={() => toggleHidden('employees', emp.id)}
                        onRemove={() => removeArrayItem('employees', emp.id)}
                        monthLabels={monthLabels}
                      />
                    ))}
                    <button
                      onClick={() => addArrayItem('employees', { name: 'New Employee', salary: 5000, startMonth: 0, endMonth: null, severanceMonths: 0 })}
                      className="flex items-center gap-1 text-blue-500 hover:text-blue-700 text-xs"
                    >
                      <Plus size={12} /> Add Employee
                    </button>
                  </div>
                </SidebarBox>

                {/* Recurring Expenses */}
                <SidebarBox
                  title="Recurring Expenses"
                  section="recurring"
                  badge={hiddenCounts.recurringExpenses}
                  expanded={expandedSections.recurring}
                  onToggle={toggleSection}
                  dotColor="#f97316"
                >
                  <div className="space-y-1">
                    {state.recurringExpenses.map(exp => (
                      <ExpenseRow
                        key={exp.id}
                        item={exp}
                        onUpdate={(field, value) => updateArrayItem('recurringExpenses', exp.id, field, value)}
                        onToggleHidden={() => toggleHidden('recurringExpenses', exp.id)}
                        onRemove={() => removeArrayItem('recurringExpenses', exp.id)}
                        fields={[
                          { key: 'category', type: 'text', className: 'flex-1' },
                          { key: 'amount', type: 'number', prefix: '$', className: 'w-20', parse: v => parseFloat(v) || 0 },
                        ]}
                      />
                    ))}
                    <button
                      onClick={() => addArrayItem('recurringExpenses', { category: 'New Expense', amount: 0 })}
                      className="flex items-center gap-1 text-blue-500 hover:text-blue-700 text-xs"
                    >
                      <Plus size={12} /> Add Recurring
                    </button>
                  </div>
                </SidebarBox>

                {/* One-Time Expenses */}
                <SidebarBox
                  title="One-Time Expenses"
                  section="onetime"
                  badge={hiddenCounts.oneTimeExpenses}
                  expanded={expandedSections.onetime}
                  onToggle={toggleSection}
                  dotColor="#f59e0b"
                >
                  <div className="space-y-1">
                    {state.oneTimeExpenses.map(exp => (
                      <ExpenseRow
                        key={exp.id}
                        item={exp}
                        onUpdate={(field, value) => updateArrayItem('oneTimeExpenses', exp.id, field, value)}
                        onToggleHidden={() => toggleHidden('oneTimeExpenses', exp.id)}
                        onRemove={() => removeArrayItem('oneTimeExpenses', exp.id)}
                        fields={[
                          { key: 'description', type: 'text', className: 'flex-1' },
                          {
                            key: 'month',
                            type: 'select',
                            options: monthLabels.map((label, i) => ({ value: i, label })),
                            parse: v => parseInt(v)
                          },
                          { key: 'amount', type: 'number', prefix: '$', className: 'w-20', parse: v => parseFloat(v) || 0 },
                        ]}
                      />
                    ))}
                    <button
                      onClick={() => addArrayItem('oneTimeExpenses', { description: 'New Expense', month: 0, amount: 0 })}
                      className="flex items-center gap-1 text-blue-500 hover:text-blue-700 text-xs"
                    >
                      <Plus size={12} /> Add One-Time
                    </button>
                  </div>
                </SidebarBox>

                {/* Variable Expenses */}
                <SidebarBox
                  title="Variable Expenses (% of MRR)"
                  section="variable"
                  badge={hiddenCounts.variableExpenses}
                  expanded={expandedSections.variable}
                  onToggle={toggleSection}
                  dotColor="#ec4899"
                >
                  <div className="space-y-1">
                    {state.variableExpenses.map(exp => (
                      <ExpenseRow
                        key={exp.id}
                        item={exp}
                        onUpdate={(field, value) => updateArrayItem('variableExpenses', exp.id, field, value)}
                        onToggleHidden={() => toggleHidden('variableExpenses', exp.id)}
                        onRemove={() => removeArrayItem('variableExpenses', exp.id)}
                        fields={[
                          { key: 'category', type: 'text', className: 'flex-1' },
                          { key: 'percentage', type: 'number', suffix: '%', className: 'w-[4.75rem]', parse: v => parseFloat(v) || 0 },
                        ]}
                      />
                    ))}
                    <button
                      onClick={() => addArrayItem('variableExpenses', { category: 'New Variable', percentage: 0 })}
                      className="flex items-center gap-1 text-blue-500 hover:text-blue-700 text-xs"
                    >
                      <Plus size={12} /> Add Variable
                    </button>
                  </div>
                </SidebarBox>

                {/* Refunds */}
                <SidebarBox
                  title="Refunds (monthly)"
                  section="refunds"
                  badge={hiddenCounts.refunds}
                  expanded={expandedSections.refunds}
                  onToggle={toggleSection}
                  dotColor="#f43f5e"
                >
                  <div className="space-y-1">
                    {state.refunds.map(exp => (
                      <ExpenseRow
                        key={exp.id}
                        item={exp}
                        onUpdate={(field, value) => updateArrayItem('refunds', exp.id, field, value)}
                        onToggleHidden={() => toggleHidden('refunds', exp.id)}
                        onRemove={() => removeArrayItem('refunds', exp.id)}
                        fields={[
                          { key: 'category', type: 'text', className: 'flex-1' },
                          { key: 'amount', type: 'number', prefix: '$', className: 'w-20', parse: v => parseFloat(v) || 0 },
                        ]}
                      />
                    ))}
                    <button
                      onClick={() => addArrayItem('refunds', { category: 'New Refund', amount: 0 })}
                      className="flex items-center gap-1 text-blue-500 hover:text-blue-700 text-xs"
                    >
                      <Plus size={12} /> Add Refund
                    </button>
                  </div>
                </SidebarBox>

                {/* Owner's Draw */}
                <SidebarBox
                  title="Owner's Draw (by month)"
                  section="ownersDraw"
                  badge={hiddenCounts.ownersDraw}
                  expanded={expandedSections.ownersDraw}
                  onToggle={toggleSection}
                  dotColor="#6366f1"
                >
                  <div className="space-y-1">
                    {state.ownersDraw.map(exp => (
                      <ExpenseRow
                        key={exp.id}
                        item={exp}
                        onUpdate={(field, value) => updateArrayItem('ownersDraw', exp.id, field, value)}
                        onToggleHidden={() => toggleHidden('ownersDraw', exp.id)}
                        onRemove={() => removeArrayItem('ownersDraw', exp.id)}
                        fields={[
                          { key: 'category', type: 'text', className: 'flex-1' },
                          {
                            key: 'month',
                            type: 'select',
                            options: monthLabels.map((label, i) => ({ value: i, label })),
                            parse: v => parseInt(v)
                          },
                          { key: 'amount', type: 'number', prefix: '$', className: 'w-20', parse: v => parseFloat(v) || 0 },
                        ]}
                      />
                    ))}
                    <button
                      onClick={() => addArrayItem('ownersDraw', { category: 'New Draw', month: 0, amount: 0 })}
                      className="flex items-center gap-1 text-blue-500 hover:text-blue-700 text-xs"
                    >
                      <Plus size={12} /> Add Draw
                    </button>
                  </div>
                </SidebarBox>

                {/* 401k Contributions */}
                <SidebarBox
                  title="401k Contributions (by month)"
                  section="owners401k"
                  badge={hiddenCounts.owners401k}
                  expanded={expandedSections.owners401k}
                  onToggle={toggleSection}
                  dotColor="#14b8a6"
                >
                  <div className="space-y-2">
                    {state.owners401k.map(exp => (
                      <ExpenseRow
                        key={exp.id}
                        item={exp}
                        onUpdate={(field, value) => updateArrayItem('owners401k', exp.id, field, value)}
                        onToggleHidden={() => toggleHidden('owners401k', exp.id)}
                        onRemove={() => removeArrayItem('owners401k', exp.id)}
                        fields={[
                          { key: 'category', type: 'text', className: 'flex-1' },
                          {
                            key: 'month',
                            type: 'select',
                            options: monthLabels.map((label, i) => ({ value: i, label })),
                            parse: v => parseInt(v)
                          },
                          { key: 'amount', type: 'number', prefix: '$', className: 'w-20', parse: v => parseFloat(v) || 0 },
                        ]}
                      />
                    ))}
                    <button
                      onClick={() => addArrayItem('owners401k', { category: 'New 401k Contribution', month: 0, amount: 0 })}
                      className="flex items-center gap-1 text-blue-500 hover:text-blue-700 text-xs"
                    >
                      <Plus size={12} /> Add 401k
                    </button>
                  </div>
                </SidebarBox>

                {/* Estimated Taxes */}
                <SidebarBox
                  title="Estimated Tax Payments"
                  section="estimatedTaxes"
                  badge={hiddenCounts.estimatedTaxes}
                  expanded={expandedSections.estimatedTaxes}
                  onToggle={toggleSection}
                  dotColor="#eab308"
                >
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500 mb-1">Based on prior year profits</p>
                    {state.estimatedTaxes.map(exp => (
                      <ExpenseRow
                        key={exp.id}
                        item={exp}
                        onUpdate={(field, value) => updateArrayItem('estimatedTaxes', exp.id, field, value)}
                        onToggleHidden={() => toggleHidden('estimatedTaxes', exp.id)}
                        onRemove={() => removeArrayItem('estimatedTaxes', exp.id)}
                        fields={[
                          { key: 'description', type: 'text', className: 'flex-1' },
                          {
                            key: 'month',
                            type: 'select',
                            options: monthLabels.map((label, i) => ({ value: i, label })),
                            parse: v => parseInt(v)
                          },
                          { key: 'amount', type: 'number', prefix: '$', className: 'w-20', parse: v => parseFloat(v) || 0 },
                        ]}
                      />
                    ))}
                    <button
                      onClick={() => addArrayItem('estimatedTaxes', { description: 'Tax Payment', month: 0, amount: 0 })}
                      className="flex items-center gap-1 text-blue-500 hover:text-blue-700 text-xs"
                    >
                      <Plus size={12} /> Add Tax Payment
                    </button>
                  </div>
                </SidebarBox>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar Resize Handle */}
      {sidebarOpen && (
        <div
          onMouseDown={startResizing}
          className="absolute top-0 bottom-0 w-1 cursor-col-resize bg-transparent hover:bg-blue-400 transition-colors z-20"
          style={{ left: sidebarWidth - 2 }}
        />
      )}

      {/* Sidebar Toggle Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="absolute top-1/2 -translate-y-1/2 z-10 bg-white border border-gray-200 rounded-r-lg p-1.5 shadow-sm hover:bg-gray-50 transition-all duration-300"
        style={{ left: sidebarOpen ? sidebarWidth : 0 }}
      >
        {sidebarOpen ? <PanelLeftClose size={18} className="text-gray-600" /> : <PanelLeftOpen size={18} className="text-gray-600" />}
      </button>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-auto">
        {/* Header Bar */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0">
          <div className="flex items-center text-sm">
            <span className="text-gray-600">Dashboard</span>
            {currentScenarioName && (
              <>
                <ChevronRight size={14} className="mx-1 text-gray-400" />
                <span className="text-gray-800 font-medium">{currentScenarioName}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex-1 p-4 overflow-auto">
          <div className="max-w-full mx-auto">
            {/* Save Scenario Modal */}
        {showScenarioModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Save Scenario</h3>
                <button onClick={() => setShowScenarioModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>
              <input
                type="text"
                value={newScenarioName}
                onChange={(e) => setNewScenarioName(e.target.value)}
                placeholder="Scenario name..."
                className="w-full px-3 py-2 border rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && saveCurrentScenario()}
              />
              {scenarios.some(s => s.name === newScenarioName.trim()) && (
                <p className="text-amber-600 text-sm mb-4">This will overwrite the existing scenario.</p>
              )}
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowScenarioModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={saveCurrentScenario}
                  disabled={!newScenarioName.trim()}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="text-sm text-gray-500">Starting Cash</div>
            <div className="text-xl font-bold text-gray-800">{formatCurrency(state.initialCash)}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="text-sm text-gray-500">Month 12 Balance</div>
            <div className={`text-xl font-bold ${calculations[11]?.cashBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(calculations[11]?.cashBalance || 0)}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="text-sm text-gray-500">Month 24 Balance</div>
            <div className={`text-xl font-bold ${calculations[23]?.cashBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(calculations[23]?.cashBalance || 0)}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="text-sm text-gray-500">Monthly Burn Rate</div>
            <div className="text-xl font-bold text-gray-800">
              {formatCurrency(calculations[0]?.totalOutflows - calculations[0]?.totalInflows)}
            </div>
          </div>
        </div>

        {/* Chart Section */}
        <div className="bg-white rounded-lg shadow-sm mb-4 border border-gray-200">
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-700">Cash Balance Forecast</h2>
            <div className="flex gap-3 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>Positive</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span>Negative</span>
              </div>
            </div>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={calculations} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                <XAxis dataKey="month" tick={{ fontSize: 10 }} interval={1} angle={-45} textAnchor="end" height={60} />
                <YAxis tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11 }} domain={[-50000, 'dataMax']} allowDataOverflow={true} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="3 3" />
                <Bar
                  dataKey="cashBalance"
                  radius={[4, 4, 0, 0]}
                >
                  {calculations.map((entry, index) => (
                    <Cell key={index} fill={entry.cashBalance >= 0 ? '#22c55e' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
          <div className="px-3 py-2.5 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-700">Monthly Breakdown</h2>
          </div>
          <div className="p-4 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-1 sticky left-0 bg-white font-medium text-gray-600 min-w-[140px]">Category</th>
                {calculations.map((d, i) => (
                  <th key={i} className="text-right py-2 px-1 font-medium text-gray-600 min-w-[70px]">{d.month}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Inflows Section */}
              <tr className="bg-green-50">
                <td className="py-2 px-1 font-semibold text-green-700 sticky left-0 bg-green-50">INFLOWS</td>
                {calculations.map((_, i) => <td key={i}></td>)}
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="py-1 px-1 pl-4 sticky left-0 bg-white">MRR</td>
                {calculations.map((d, i) => (
                  <td key={i} className="text-right py-1 px-1 text-green-600">{formatCurrency(d.mrr)}</td>
                ))}
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="py-1 px-1 pl-4 sticky left-0 bg-white">Additional Revenue</td>
                {calculations.map((d, i) => (
                  <td key={i} className="text-right py-1 px-1 text-green-600">{formatCurrency(d.additionalRevenue)}</td>
                ))}
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="py-1 px-1 pl-4 sticky left-0 bg-white">Annual Plan Revenue</td>
                {calculations.map((d, i) => (
                  <td key={i} className="text-right py-1 px-1 text-green-600">{d.annualPlanRevenue ? formatCurrency(d.annualPlanRevenue) : '-'}</td>
                ))}
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="py-1 px-1 pl-4 sticky left-0 bg-white">Capital Injection</td>
                {calculations.map((d, i) => (
                  <td key={i} className="text-right py-1 px-1 text-green-600">{d.capitalInjection ? formatCurrency(d.capitalInjection) : '-'}</td>
                ))}
              </tr>
              <tr className="bg-green-100 font-semibold">
                <td className="py-1 px-1 sticky left-0 bg-green-100">Total Inflows</td>
                {calculations.map((d, i) => (
                  <td key={i} className="text-right py-1 px-1 text-green-700">{formatCurrency(d.totalInflows)}</td>
                ))}
              </tr>

              {/* Outflows Section */}
              <tr className="bg-red-50">
                <td className="py-2 px-1 font-semibold text-red-700 sticky left-0 bg-red-50">OUTFLOWS</td>
                {calculations.map((_, i) => <td key={i}></td>)}
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="py-1 px-1 pl-4 sticky left-0 bg-white">Payroll (All-In)</td>
                {calculations.map((d, i) => (
                  <td key={i} className="text-right py-1 px-1 text-red-600">{formatCurrency(d.payroll)}</td>
                ))}
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="py-1 px-1 pl-4 sticky left-0 bg-white">Recurring Expenses</td>
                {calculations.map((d, i) => (
                  <td key={i} className="text-right py-1 px-1 text-red-600">{formatCurrency(d.recurringExpenses)}</td>
                ))}
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="py-1 px-1 pl-4 sticky left-0 bg-white">One-Time Expenses</td>
                {calculations.map((d, i) => (
                  <td key={i} className="text-right py-1 px-1 text-red-600">{d.oneTimeExpenses ? formatCurrency(d.oneTimeExpenses) : '-'}</td>
                ))}
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="py-1 px-1 pl-4 sticky left-0 bg-white">Variable Expenses</td>
                {calculations.map((d, i) => (
                  <td key={i} className="text-right py-1 px-1 text-red-600">{formatCurrency(d.variableExpenses)}</td>
                ))}
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="py-1 px-1 pl-4 sticky left-0 bg-white">Refunds</td>
                {calculations.map((d, i) => (
                  <td key={i} className="text-right py-1 px-1 text-red-600">{formatCurrency(d.refunds)}</td>
                ))}
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="py-1 px-1 pl-4 sticky left-0 bg-white">Estimated Taxes</td>
                {calculations.map((d, i) => (
                  <td key={i} className="text-right py-1 px-1 text-red-600">{d.estimatedTaxes ? formatCurrency(d.estimatedTaxes) : '-'}</td>
                ))}
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="py-1 px-1 pl-4 sticky left-0 bg-white">Owner's Draw</td>
                {calculations.map((d, i) => (
                  <td key={i} className="text-right py-1 px-1 text-red-600">{formatCurrency(d.ownersDraw)}</td>
                ))}
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="py-1 px-1 pl-4 sticky left-0 bg-white">Owner's 401k</td>
                {calculations.map((d, i) => (
                  <td key={i} className="text-right py-1 px-1 text-red-600">{d.owners401k ? formatCurrency(d.owners401k) : '-'}</td>
                ))}
              </tr>
              <tr className="bg-red-100 font-semibold">
                <td className="py-1 px-1 sticky left-0 bg-red-100">Total Outflows</td>
                {calculations.map((d, i) => (
                  <td key={i} className="text-right py-1 px-1 text-red-700">{formatCurrency(d.totalOutflows)}</td>
                ))}
              </tr>

              {/* Summary */}
              <tr className="bg-gray-100">
                <td className="py-2 px-1 font-semibold sticky left-0 bg-gray-100">Net Cashflow</td>
                {calculations.map((d, i) => (
                  <td key={i} className={`text-right py-2 px-1 font-semibold ${d.netCashflow >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {formatCurrency(d.netCashflow)}
                  </td>
                ))}
              </tr>
              <tr className="bg-blue-100">
                <td className="py-2 px-1 font-bold sticky left-0 bg-blue-100">Cash Balance</td>
                {calculations.map((d, i) => (
                  <td key={i} className={`text-right py-2 px-1 font-bold ${d.cashBalance >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                    {formatCurrency(d.cashBalance)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
          </div>
        </div>

          </div>
        </div>
      </div>
    </div>
  );
}
