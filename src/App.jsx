import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { Plus, Trash2, ChevronDown, ChevronRight, TrendingUp, Users, CreditCard, Save, FolderOpen, Eye, EyeOff, X, Link, Check, PanelLeftClose, PanelLeftOpen, ChevronUp, Info, Pencil, Settings } from 'lucide-react';

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

const SectionHeader = ({ title, hoverBackgroundColor = 'hover:bg-gray-50', section, icon: Icon, badge, expanded, onToggle, onCollapseAll, onExpandAll }) => (
  <div className={`flex border-b border-gray-200 bg-white ${hoverBackgroundColor} px-3 text-sm items-center gap-2 w-full font-semibold text-gray-700 py-2`}>
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

const CustomTooltip = ({ active, payload, label, selectedMetric, metricConfig }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const metric = metricConfig?.[selectedMetric];
    const value = data[selectedMetric];
    return (
      <div className="bg-white p-3 border rounded shadow-lg text-sm">
        <p className="font-semibold mb-2">{label}</p>
        <p style={{ color: metric?.type === 'outflow' ? '#dc2626' : (metric?.type === 'inflow' ? '#16a34a' : (value >= 0 ? '#16a34a' : '#dc2626')) }} className="font-semibold">
          {metric?.label}: {formatCurrency(value)}
        </p>
        {selectedMetric !== 'cashBalance' && (
          <p className="text-gray-500 text-xs mt-1">Balance: {formatCurrency(data.cashBalance)}</p>
        )}
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

  // Chart settings
  if (state.chartYMin !== null) params.set('cymin', state.chartYMin);
  if (state.chartYMax !== null) params.set('cymax', state.chartYMax);
  if (state.numberOfMonths !== 24) params.set('nm', state.numberOfMonths);
  if (state.forecastStartDate) params.set('fsd', state.forecastStartDate);

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

    // Chart settings
    if (params.has('cymin')) state.chartYMin = parseFloat(params.get('cymin'));
    if (params.has('cymax')) state.chartYMax = parseFloat(params.get('cymax'));
    if (params.has('nm')) state.numberOfMonths = parseInt(params.get('nm'));
    if (params.has('fsd')) state.forecastStartDate = params.get('fsd');

    return state;
  } catch (e) {
    console.error('Failed to decode URL state:', e);
    return null;
  }
};

export default function CashflowModel() {
  // Default state factory
  const getDefaultState = () => ({
    numberOfMonths: 24,
    initialCash: 0,
    startingMRR: 0,
    newCustomersPerMonth: 10,
    arpu: 10,
    monthlyChurnRate: 5,
    additionalRevenue: 0,
    additionalRevenueGrowth: 0,
    annualPlanRevenue: [],
    capitalInjections: [],
    employees: [],
    recurringExpenses: [],
    oneTimeExpenses: [],
    variableExpenses: [
      { id: 1, category: 'Stripe Fees', percentage: 2.9, hidden: false },
    ],
    refunds: [],
    ownersDraw: [],
    owners401k: [],
    estimatedTaxes: [
      { id: 1, description: 'Q1 Estimated Tax', month: 3, amount: 0, hidden: false },
      { id: 2, description: 'Q2 Estimated Tax', month: 5, amount: 0, hidden: false },
      { id: 3, description: 'Q3 Estimated Tax', month: 8, amount: 0, hidden: false },
      { id: 4, description: 'Q4 Estimated Tax', month: 11, amount: 0, hidden: false },
    ],
    // Chart settings
    chartYMin: null,
    chartYMax: null,
    // Model settings
    forecastStartDate: null, // null = current month, or "YYYY-MM" string
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
  const [newScenarioNote, setNewScenarioNote] = useState('');
  const [currentScenarioNote, setCurrentScenarioNote] = useState('');
  const [showScenarioModal, setShowScenarioModal] = useState(false);
  const [showEditScenarioModal, setShowEditScenarioModal] = useState(false);
  const [editScenarioName, setEditScenarioName] = useState('');
  const [editScenarioNote, setEditScenarioNote] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [activeBarIndex, setActiveBarIndex] = useState(null);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(null);
  const [selectedChartMetric, setSelectedChartMetric] = useState('cashBalance');
  const tableContainerRef = useRef(null);

  // Generate month labels based on numberOfMonths and forecastStartDate
  const monthLabels = useMemo(() => {
    const labels = [];
    let startYear, startMonth;
    if (state.forecastStartDate) {
      // Parse "YYYY-MM" format directly to avoid timezone issues
      const [year, month] = state.forecastStartDate.split('-').map(Number);
      startYear = year;
      startMonth = month - 1; // Convert to 0-indexed
    } else {
      const now = new Date();
      startYear = now.getFullYear();
      startMonth = now.getMonth();
    }
    for (let i = 0; i < state.numberOfMonths; i++) {
      const d = new Date(startYear, startMonth + i, 1);
      labels.push(d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }));
    }
    return labels;
  }, [state.numberOfMonths, state.forecastStartDate]);

  // Chart metric configuration
  const chartMetrics = {
    // Inflows (green)
    mrr: { label: 'MRR', color: '#22c55e', hoverColor: '#16a34a', type: 'inflow' },
    additionalRevenue: { label: 'Additional Revenue', color: '#22c55e', hoverColor: '#16a34a', type: 'inflow' },
    annualPlanRevenue: { label: 'Annual Plan Revenue', color: '#22c55e', hoverColor: '#16a34a', type: 'inflow' },
    capitalInjection: { label: 'Capital Injection', color: '#22c55e', hoverColor: '#16a34a', type: 'inflow' },
    totalInflows: { label: 'Total Inflows', color: '#22c55e', hoverColor: '#16a34a', type: 'inflow' },
    // Outflows (red)
    payroll: { label: 'Payroll (All-In)', color: '#ef4444', hoverColor: '#dc2626', type: 'outflow' },
    recurringExpenses: { label: 'Recurring Expenses', color: '#ef4444', hoverColor: '#dc2626', type: 'outflow' },
    oneTimeExpenses: { label: 'One-Time Expenses', color: '#ef4444', hoverColor: '#dc2626', type: 'outflow' },
    variableExpenses: { label: 'Variable Expenses', color: '#ef4444', hoverColor: '#dc2626', type: 'outflow' },
    refunds: { label: 'Refunds', color: '#ef4444', hoverColor: '#dc2626', type: 'outflow' },
    estimatedTaxes: { label: 'Estimated Taxes', color: '#ef4444', hoverColor: '#dc2626', type: 'outflow' },
    ownersDraw: { label: "Owner's Draw", color: '#ef4444', hoverColor: '#dc2626', type: 'outflow' },
    owners401k: { label: "Owner's 401k", color: '#ef4444', hoverColor: '#dc2626', type: 'outflow' },
    totalOutflows: { label: 'Total Outflows', color: '#ef4444', hoverColor: '#dc2626', type: 'outflow' },
    // Summary (dynamic colors)
    netCashflow: { label: 'Net Cashflow', color: '#22c55e', hoverColor: '#16a34a', negColor: '#ef4444', negHoverColor: '#dc2626', type: 'dynamic' },
    cashBalance: { label: 'Cash Balance', color: '#22c55e', hoverColor: '#16a34a', negColor: '#ef4444', negHoverColor: '#dc2626', type: 'dynamic' },
  };

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
    settings: false,
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
    modelSettings: false,
    chartSettings: false,
    monthlyBreakdown: true,
    mrrMetrics: true,
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
      note: newScenarioNote.trim(),
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
    setCurrentScenarioNote(scenario.note);
    setScenarioModified(false);
    setNewScenarioName('');
    setNewScenarioNote('');
    setShowScenarioModal(false);
  };

  const loadScenario = (scenario) => {
    isLoadingScenario.current = true;
    setState(scenario.data);
    setCurrentScenarioName(scenario.name);
    setCurrentScenarioNote(scenario.note || '');
    setScenarioModified(false);
  };

  const updateCurrentScenario = () => {
    if (!currentScenarioName) return;
    const scenario = {
      name: currentScenarioName,
      savedAt: new Date().toISOString(),
      note: currentScenarioNote,
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
      setCurrentScenarioNote('');
      setScenarioModified(false);
    }
  };

  const openEditScenarioModal = () => {
    setEditScenarioName(currentScenarioName);
    setEditScenarioNote(currentScenarioNote);
    setShowEditScenarioModal(true);
  };

  const saveEditedScenario = () => {
    if (!editScenarioName.trim()) return;
    const oldName = currentScenarioName;
    const newName = editScenarioName.trim();
    const newNote = editScenarioNote.trim();

    // Check if renaming to an existing scenario name (that isn't the current one)
    if (newName !== oldName && scenarios.some(s => s.name === newName)) {
      return; // Don't allow overwriting another scenario
    }

    const newScenarios = scenarios.map(s => {
      if (s.name === oldName) {
        return { ...s, name: newName, note: newNote };
      }
      return s;
    });

    saveScenarios(newScenarios);
    setCurrentScenarioName(newName);
    setCurrentScenarioNote(newNote);
    setShowEditScenarioModal(false);
  };

  const resetToDefaults = () => {
    setState(getDefaultState());
    setCurrentScenarioName('');
    setCurrentScenarioNote('');
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
    let currentCustomers = state.arpu > 0 ? Math.round(state.startingMRR / state.arpu) : 0;

    for (let month = 0; month < state.numberOfMonths; month++) {
      // MRR and Customer Calculations
      let newCustomers = 0;
      let churnedCustomers = 0;
      let newRevenue = 0;
      let churnedRevenue = 0;

      if (month > 0) {
        churnedRevenue = currentMRR * (state.monthlyChurnRate / 100);
        newRevenue = state.newCustomersPerMonth * state.arpu;
        currentMRR = currentMRR - churnedRevenue + newRevenue;

        newCustomers = state.newCustomersPerMonth;
        churnedCustomers = Math.round(currentCustomers * (state.monthlyChurnRate / 100));
        currentCustomers = currentCustomers - churnedCustomers + newCustomers;
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
        // MRR Metrics
        newCustomers,
        churnedCustomers,
        totalCustomers: currentCustomers,
        newRevenue: Math.round(newRevenue),
        churnedRevenue: Math.round(churnedRevenue),
      });
    }

    return data;
  }, [state, monthLabels]);

  return (
    <div className="min-h-screen bg-gray-50 flex" onClick={() => setSelectedMonthIndex(null)}>
      {/* Left Sidebar */}
      <div
        className={`${sidebarOpen ? '' : 'w-0'} flex-shrink-0 bg-white border-r border-gray-200 overflow-hidden shadow-md relative`}
        style={{ width: sidebarOpen ? sidebarWidth : 0, transition: isResizing.current ? 'none' : 'width 0.3s' }}
      >
        <div className="h-full overflow-y-auto bg-gray-50" style={{ width: sidebarWidth }}>
          {/* App Header */}
          <div className="px-3 py-2 bg-white border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <img src="/airstrip-favicon.png" alt="Airstrip" className="w-4 h-4" />
              <h1 className="text-lg font-bold text-gray-800">Airstrip</h1>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 rounded hover:bg-gray-100 transition-colors"
            >
              <PanelLeftClose size={18} className="text-gray-600" />
            </button>
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
            <SectionHeader title="Inflows" hoverBackgroundColor="hover:bg-green-50" section="inflows" icon={TrendingUp} expanded={expandedSections.inflows} onToggle={toggleSection} onCollapseAll={collapseAllInflows} onExpandAll={expandAllInflows} />
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
                      label="Monthly ARPU"
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
                      Steady State MRR
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
                  title="Other Recurring Revenue"
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
                      label="Growth (Decrease)"
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
            <SectionHeader title="Outflows" hoverBackgroundColor="hover:bg-red-50" section="outflows" icon={CreditCard} expanded={expandedSections.outflows} onToggle={toggleSection} onCollapseAll={collapseAllOutflows} onExpandAll={expandAllOutflows} />
            {expandedSections.outflows && (
              <div className="space-y-2 p-3 bg-gray-50 border-b border-gray-200">
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
                  title="Recurring Owner's Draw"
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
                          { key: 'amount', type: 'number', prefix: '$', className: 'w-20', parse: v => parseFloat(v) || 0 },
                        ]}
                      />
                    ))}
                    <button
                      onClick={() => addArrayItem('ownersDraw', { category: 'New Draw', amount: 0 })}
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

          {/* Settings Panel */}
          <div>
            <SectionHeader title="Settings" hoverBackgroundColor="hover:bg-gray-100" section="settings" icon={Settings} expanded={expandedSections.settings} onToggle={toggleSection} />
            {expandedSections.settings && (
              <div className="space-y-2 p-3 bg-gray-50">
                {/* Model Settings */}
                <SidebarBox
                  title="Model Settings"
                  section="modelSettings"
                  expanded={expandedSections.modelSettings}
                  onToggle={toggleSection}
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-600 w-20">Start Date</label>
                      <input
                        type="month"
                        value={state.forecastStartDate || new Date().toISOString().slice(0, 7)}
                        onChange={(e) => updateState('forecastStartDate', e.target.value || null)}
                        className="flex-1 px-2 py-1 border rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-600 w-20">Months</label>
                      <input
                        type="number"
                        min="6"
                        max="60"
                        value={state.numberOfMonths}
                        onChange={(e) => updateState('numberOfMonths', parseInt(e.target.value) || 24)}
                        onBlur={(e) => updateState('numberOfMonths', Math.max(6, Math.min(60, parseInt(e.target.value) || 24)))}
                        className="flex-1 px-2 py-1 border rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    {state.forecastStartDate && (
                      <button
                        onClick={() => updateState('forecastStartDate', null)}
                        className="text-xs text-blue-500 hover:text-blue-700"
                      >
                        Reset to Current Month
                      </button>
                    )}
                    <div className="text-xs text-gray-400">Forecast period (6-60 months)</div>
                  </div>
                </SidebarBox>

                {/* Chart Settings */}
                <SidebarBox
                  title="Chart Settings"
                  section="chartSettings"
                  expanded={expandedSections.chartSettings}
                  onToggle={toggleSection}
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-600 w-20">Min Y Value</label>
                      <input
                        type="number"
                        value={state.chartYMin ?? ''}
                        onChange={(e) => updateState('chartYMin', e.target.value === '' ? null : parseFloat(e.target.value))}
                        placeholder="Auto"
                        className="flex-1 px-2 py-1 border rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-600 w-20">Max Y Value</label>
                      <input
                        type="number"
                        value={state.chartYMax ?? ''}
                        onChange={(e) => updateState('chartYMax', e.target.value === '' ? null : parseFloat(e.target.value))}
                        placeholder="Auto"
                        className="flex-1 px-2 py-1 border rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    {(state.chartYMin !== null || state.chartYMax !== null) && (
                      <button
                        onClick={() => { updateState('chartYMin', null); updateState('chartYMax', null); }}
                        className="text-xs text-blue-500 hover:text-blue-700"
                      >
                        Reset to Auto
                      </button>
                    )}
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-auto">
        {/* Header Bar */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0">
          <div className="flex items-center text-sm">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-1 rounded hover:bg-gray-100 transition-colors mr-2"
              >
                <PanelLeftOpen size={18} className="text-gray-600" />
              </button>
            )}
            <span className="text-gray-600">Dashboard</span>
            {currentScenarioName && (
              <>
                <ChevronRight size={14} className="mx-1 text-gray-400" />
                <span className="text-gray-800 font-medium">{currentScenarioName}</span>
                {currentScenarioNote && (
                  <button
                    className="ml-2 px-1 text-gray-400 hover:text-gray-600 rounded relative group"
                    title={currentScenarioNote}
                  >
                    <Info size={14} />
                    <div className="absolute left-0 top-full mt-1 w-64 p-2 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 whitespace-pre-wrap">
                      {currentScenarioNote}
                    </div>
                  </button>
                )}
                <button
                  onClick={openEditScenarioModal}
                  className="ml-1 px-1 text-gray-400 hover:text-gray-600 rounded"
                  title="Edit scenario name and note"
                >
                  <Pencil size={14} />
                </button>
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
                <button onClick={() => { setShowScenarioModal(false); setNewScenarioName(''); setNewScenarioNote(''); }} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>
              <input
                type="text"
                value={newScenarioName}
                onChange={(e) => setNewScenarioName(e.target.value)}
                placeholder="Scenario name..."
                className="w-full px-3 py-2 border rounded mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <textarea
                value={newScenarioNote}
                onChange={(e) => setNewScenarioNote(e.target.value)}
                placeholder="Add a note (optional)..."
                className="w-full px-3 py-2 border rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
              />
              {scenarios.some(s => s.name === newScenarioName.trim()) && (
                <p className="text-amber-600 text-sm mb-4">This will overwrite the existing scenario.</p>
              )}
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => { setShowScenarioModal(false); setNewScenarioName(''); setNewScenarioNote(''); }}
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

        {/* Edit Scenario Modal */}
        {showEditScenarioModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Edit Scenario</h3>
                <button onClick={() => setShowEditScenarioModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={editScenarioName}
                onChange={(e) => setEditScenarioName(e.target.value)}
                placeholder="Scenario name..."
                className="w-full px-3 py-2 border rounded mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              {editScenarioName.trim() !== currentScenarioName && scenarios.some(s => s.name === editScenarioName.trim()) && (
                <p className="text-red-600 text-sm mb-3">A scenario with this name already exists.</p>
              )}
              <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
              <textarea
                value={editScenarioNote}
                onChange={(e) => setEditScenarioNote(e.target.value)}
                placeholder="Add a note (optional)..."
                className="w-full px-3 py-2 border rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowEditScenarioModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEditedScenario}
                  disabled={!editScenarioName.trim() || (editScenarioName.trim() !== currentScenarioName && scenarios.some(s => s.name === editScenarioName.trim()))}
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
            <div className="text-sm text-gray-500">Month {state.numberOfMonths} Balance</div>
            <div className={`text-xl font-bold ${calculations[state.numberOfMonths - 1]?.cashBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(calculations[state.numberOfMonths - 1]?.cashBalance || 0)}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="text-sm text-gray-500">Zero Cash Date</div>
            <div className={`text-xl font-bold ${calculations.findIndex(c => c.cashBalance < 0) >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {(() => {
                const idx = calculations.findIndex(c => c.cashBalance < 0);
                return idx >= 0 ? monthLabels[idx] : 'Runway Clear';
              })()}
            </div>
          </div>
        </div>

        {/* Chart Section */}
        <div className="bg-white rounded-lg shadow-sm mb-4 border border-gray-200">
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                selectedChartMetric === 'totalInflows' ? 'bg-green-700' :
                selectedChartMetric === 'totalOutflows' ? 'bg-red-700' :
                selectedChartMetric === 'netCashflow' ? 'bg-gray-700' :
                selectedChartMetric === 'cashBalance' ? 'bg-blue-700' :
                chartMetrics[selectedChartMetric]?.type === 'inflow' ? 'bg-green-600' :
                chartMetrics[selectedChartMetric]?.type === 'outflow' ? 'bg-red-600' : 'bg-blue-700'
              }`}></div>
              <h2 className="text-sm font-semibold text-gray-700">{chartMetrics[selectedChartMetric]?.label || 'Cash Balance'} Forecast</h2>
              {selectedChartMetric !== 'cashBalance' && (
                <button
                  onClick={() => setSelectedChartMetric('cashBalance')}
                  className="text-xs text-blue-500 hover:text-blue-700"
                >
                  Reset
                </button>
              )}
            </div>
            <div className="flex gap-3 text-xs">
              {chartMetrics[selectedChartMetric]?.type === 'dynamic' ? (
                <>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <span>Positive</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-red-500 rounded"></div>
                    <span>Negative</span>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: chartMetrics[selectedChartMetric]?.color }}></div>
                  <span>{chartMetrics[selectedChartMetric]?.type === 'inflow' ? 'Inflow' : 'Outflow'}</span>
                </div>
              )}
            </div>
          </div>
          <div className="p-4" onClick={(e) => e.stopPropagation()}>
            {(() => {
              // Calculate effective Y-axis domain - only apply limits if data exceeds them
              const metricValues = calculations.map(d => d[selectedChartMetric]);
              const dataMin = Math.min(...metricValues);
              const dataMax = Math.max(...metricValues);
              const effectiveYMin = (state.chartYMin !== null && dataMin < state.chartYMin) ? state.chartYMin : 'auto';
              const effectiveYMax = (state.chartYMax !== null && dataMax > state.chartYMax) ? state.chartYMax : 'auto';

              return (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                  data={calculations}
                  margin={{ top: 10, right: 10, left: -10, bottom: -10 }}
                  onMouseMove={(state) => state.activeTooltipIndex !== undefined && setActiveBarIndex(state.activeTooltipIndex)}
                  onMouseLeave={() => setActiveBarIndex(null)}
                  onClick={(state) => {
                    if (state && state.activeTooltipIndex !== undefined) {
                      const clickedIndex = state.activeTooltipIndex;
                      setSelectedMonthIndex(prev => prev === clickedIndex ? null : clickedIndex);
                      // Scroll to the column in the table
                      if (tableContainerRef.current) {
                        const categoryColWidth = 140;
                        const cellWidth = 70;
                        const scrollPosition = categoryColWidth + (clickedIndex * cellWidth) - (tableContainerRef.current.clientWidth / 2) + (cellWidth / 2);
                        tableContainerRef.current.scrollTo({ left: Math.max(0, scrollPosition), behavior: 'smooth' });
                      }
                    }
                  }}
                >
                <XAxis dataKey="month" tick={{ fontSize: 10 }} interval={0} angle={-45} textAnchor="end" height={60} />
                <YAxis tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11 }} domain={[effectiveYMin, effectiveYMax]} allowDataOverflow={true} />
                <Tooltip content={<CustomTooltip selectedMetric={selectedChartMetric} metricConfig={chartMetrics} />} cursor={{ fill: '#F3F4F6', fillOpacity: 1 }} />
                <ReferenceLine y={0} stroke="#9CA3AF" />
                <Bar
                  dataKey={selectedChartMetric}
                  radius={[4, 4, 0, 0]}
                >
                  {calculations.map((entry, index) => {
                    const isHovered = index === activeBarIndex;
                    const metric = chartMetrics[selectedChartMetric];
                    const value = entry[selectedChartMetric];
                    let fill;
                    if (metric?.type === 'dynamic') {
                      const isPositive = value >= 0;
                      fill = isPositive
                        ? (isHovered ? metric.hoverColor : metric.color)
                        : (isHovered ? metric.negHoverColor : metric.negColor);
                    } else {
                      fill = isHovered ? metric?.hoverColor : metric?.color;
                    }
                    return <Cell key={index} fill={fill} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
              );
            })()}
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 mb-4">
          <div
            className="px-3 py-2.5 border-b border-gray-200 flex items-center justify-between cursor-pointer hover:bg-gray-50"
            onClick={() => toggleSection('monthlyBreakdown')}
          >
            <h2 className="text-sm font-semibold text-gray-700">Monthly Breakdown</h2>
            {expandedSections.monthlyBreakdown ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
          </div>
          {expandedSections.monthlyBreakdown && (
          <div ref={tableContainerRef} className="overflow-x-auto" onClick={(e) => e.stopPropagation()}>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 pl-3 pr-2 sticky left-0 z-10 relative bg-white after:content-[''] after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-gray-200 font-medium text-gray-600 min-w-[180px]">Category</th>
                {calculations.map((d, i) => (
                  <th key={i} className={`text-center py-2 px-1 font-medium min-w-[70px] ${i === selectedMonthIndex ? 'bg-gray-700 text-white' : 'text-gray-600'}`}>{d.month}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Inflows Section */}
              <tr className="bg-green-50">
                <td className="py-2 pl-3 pr-2 font-semibold text-green-700 sticky left-0 z-10 relative bg-green-50 after:content-[''] after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-gray-200">INFLOWS</td>
                {calculations.map((_, i) => <td key={i} className={i === selectedMonthIndex ? 'bg-green-600' : ''}></td>)}
              </tr>
              <tr onClick={() => setSelectedChartMetric('mrr')} className={`group ${selectedChartMetric === 'mrr' ? 'bg-green-600' : 'hover:bg-green-50'}`}>
                <td className={`py-1 pl-6 pr-2 sticky left-0 z-10 relative after:content-[''] after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-gray-200 cursor-pointer ${selectedChartMetric === 'mrr' ? 'bg-green-600 text-white' : 'bg-white group-hover:bg-green-50 hover:text-blue-600'}`}>MRR</td>
                {calculations.map((d, i) => (
                  <td key={i} className={`text-center py-1 px-1 cursor-default ${selectedChartMetric === 'mrr' ? (i === selectedMonthIndex ? 'bg-green-700 text-white' : 'bg-green-600 text-white') : (i === selectedMonthIndex ? 'bg-green-600 text-white' : 'text-green-600')}`}>{formatCurrency(d.mrr)}</td>
                ))}
              </tr>
              <tr onClick={() => setSelectedChartMetric('additionalRevenue')} className={`group ${selectedChartMetric === 'additionalRevenue' ? 'bg-green-600' : 'hover:bg-green-50'}`}>
                <td className={`py-1 pl-6 pr-2 sticky left-0 z-10 relative after:content-[''] after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-gray-200 cursor-pointer ${selectedChartMetric === 'additionalRevenue' ? 'bg-green-600 text-white' : 'bg-white group-hover:bg-green-50 hover:text-blue-600'}`}>Additional Revenue</td>
                {calculations.map((d, i) => (
                  <td key={i} className={`text-center py-1 px-1 cursor-default ${selectedChartMetric === 'additionalRevenue' ? (i === selectedMonthIndex ? 'bg-green-700 text-white' : 'bg-green-600 text-white') : (i === selectedMonthIndex ? 'bg-green-600 text-white' : 'text-green-600')}`}>{formatCurrency(d.additionalRevenue)}</td>
                ))}
              </tr>
              <tr onClick={() => setSelectedChartMetric('annualPlanRevenue')} className={`group ${selectedChartMetric === 'annualPlanRevenue' ? 'bg-green-600' : 'hover:bg-green-50'}`}>
                <td className={`py-1 pl-6 pr-2 sticky left-0 z-10 relative after:content-[''] after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-gray-200 cursor-pointer ${selectedChartMetric === 'annualPlanRevenue' ? 'bg-green-600 text-white' : 'bg-white group-hover:bg-green-50 hover:text-blue-600'}`}>Annual Plan Revenue</td>
                {calculations.map((d, i) => (
                  <td key={i} className={`text-center py-1 px-1 cursor-default ${selectedChartMetric === 'annualPlanRevenue' ? (i === selectedMonthIndex ? 'bg-green-700 text-white' : 'bg-green-600 text-white') : (i === selectedMonthIndex ? 'bg-green-600 text-white' : 'text-green-600')}`}>{d.annualPlanRevenue ? formatCurrency(d.annualPlanRevenue) : '-'}</td>
                ))}
              </tr>
              <tr onClick={() => setSelectedChartMetric('capitalInjection')} className={`group ${selectedChartMetric === 'capitalInjection' ? 'bg-green-600' : 'hover:bg-green-50'}`}>
                <td className={`py-1 pl-6 pr-2 sticky left-0 z-10 relative after:content-[''] after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-gray-200 cursor-pointer ${selectedChartMetric === 'capitalInjection' ? 'bg-green-600 text-white' : 'bg-white group-hover:bg-green-50 hover:text-blue-600'}`}>Capital Injection</td>
                {calculations.map((d, i) => (
                  <td key={i} className={`text-center py-1 px-1 cursor-default ${selectedChartMetric === 'capitalInjection' ? (i === selectedMonthIndex ? 'bg-green-700 text-white' : 'bg-green-600 text-white') : (i === selectedMonthIndex ? 'bg-green-600 text-white' : 'text-green-600')}`}>{d.capitalInjection ? formatCurrency(d.capitalInjection) : '-'}</td>
                ))}
              </tr>
              <tr onClick={() => setSelectedChartMetric('totalInflows')} className={`group font-semibold ${selectedChartMetric === 'totalInflows' ? 'bg-green-700' : 'bg-green-100 hover:bg-green-200'}`}>
                <td className={`py-1 pl-3 pr-2 sticky left-0 z-10 relative after:content-[''] after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-gray-200 cursor-pointer ${selectedChartMetric === 'totalInflows' ? 'bg-green-700 text-white' : 'bg-green-100 group-hover:bg-green-200 hover:text-blue-600'}`}>Total Inflows</td>
                {calculations.map((d, i) => (
                  <td key={i} className={`text-center py-1 px-1 cursor-default ${selectedChartMetric === 'totalInflows' ? (i === selectedMonthIndex ? 'bg-green-800 text-white' : 'bg-green-700 text-white') : (i === selectedMonthIndex ? 'bg-green-700 text-white' : 'text-green-700')}`}>{formatCurrency(d.totalInflows)}</td>
                ))}
              </tr>

              {/* Outflows Section */}
              <tr className="bg-red-50">
                <td className="py-2 pl-3 pr-2 font-semibold text-red-700 sticky left-0 z-10 relative bg-red-50 after:content-[''] after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-gray-200">OUTFLOWS</td>
                {calculations.map((_, i) => <td key={i} className={i === selectedMonthIndex ? 'bg-red-600' : ''}></td>)}
              </tr>
              <tr onClick={() => setSelectedChartMetric('payroll')} className={`group ${selectedChartMetric === 'payroll' ? 'bg-red-600' : 'hover:bg-red-50'}`}>
                <td className={`py-1 pl-6 pr-2 sticky left-0 z-10 relative after:content-[''] after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-gray-200 cursor-pointer ${selectedChartMetric === 'payroll' ? 'bg-red-600 text-white' : 'bg-white group-hover:bg-red-50 hover:text-blue-600'}`}>Payroll (All-In)</td>
                {calculations.map((d, i) => (
                  <td key={i} className={`text-center py-1 px-1 cursor-default ${selectedChartMetric === 'payroll' ? (i === selectedMonthIndex ? 'bg-red-700 text-white' : 'bg-red-600 text-white') : (i === selectedMonthIndex ? 'bg-red-600 text-white' : 'text-red-600')}`}>{formatCurrency(d.payroll)}</td>
                ))}
              </tr>
              <tr onClick={() => setSelectedChartMetric('recurringExpenses')} className={`group ${selectedChartMetric === 'recurringExpenses' ? 'bg-red-600' : 'hover:bg-red-50'}`}>
                <td className={`py-1 pl-6 pr-2 sticky left-0 z-10 relative after:content-[''] after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-gray-200 cursor-pointer ${selectedChartMetric === 'recurringExpenses' ? 'bg-red-600 text-white' : 'bg-white group-hover:bg-red-50 hover:text-blue-600'}`}>Recurring Expenses</td>
                {calculations.map((d, i) => (
                  <td key={i} className={`text-center py-1 px-1 cursor-default ${selectedChartMetric === 'recurringExpenses' ? (i === selectedMonthIndex ? 'bg-red-700 text-white' : 'bg-red-600 text-white') : (i === selectedMonthIndex ? 'bg-red-600 text-white' : 'text-red-600')}`}>{formatCurrency(d.recurringExpenses)}</td>
                ))}
              </tr>
              <tr onClick={() => setSelectedChartMetric('oneTimeExpenses')} className={`group ${selectedChartMetric === 'oneTimeExpenses' ? 'bg-red-600' : 'hover:bg-red-50'}`}>
                <td className={`py-1 pl-6 pr-2 sticky left-0 z-10 relative after:content-[''] after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-gray-200 cursor-pointer ${selectedChartMetric === 'oneTimeExpenses' ? 'bg-red-600 text-white' : 'bg-white group-hover:bg-red-50 hover:text-blue-600'}`}>One-Time Expenses</td>
                {calculations.map((d, i) => (
                  <td key={i} className={`text-center py-1 px-1 cursor-default ${selectedChartMetric === 'oneTimeExpenses' ? (i === selectedMonthIndex ? 'bg-red-700 text-white' : 'bg-red-600 text-white') : (i === selectedMonthIndex ? 'bg-red-600 text-white' : 'text-red-600')}`}>{d.oneTimeExpenses ? formatCurrency(d.oneTimeExpenses) : '-'}</td>
                ))}
              </tr>
              <tr onClick={() => setSelectedChartMetric('variableExpenses')} className={`group ${selectedChartMetric === 'variableExpenses' ? 'bg-red-600' : 'hover:bg-red-50'}`}>
                <td className={`py-1 pl-6 pr-2 sticky left-0 z-10 relative after:content-[''] after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-gray-200 cursor-pointer ${selectedChartMetric === 'variableExpenses' ? 'bg-red-600 text-white' : 'bg-white group-hover:bg-red-50 hover:text-blue-600'}`}>Variable Expenses</td>
                {calculations.map((d, i) => (
                  <td key={i} className={`text-center py-1 px-1 cursor-default ${selectedChartMetric === 'variableExpenses' ? (i === selectedMonthIndex ? 'bg-red-700 text-white' : 'bg-red-600 text-white') : (i === selectedMonthIndex ? 'bg-red-600 text-white' : 'text-red-600')}`}>{formatCurrency(d.variableExpenses)}</td>
                ))}
              </tr>
              <tr onClick={() => setSelectedChartMetric('refunds')} className={`group ${selectedChartMetric === 'refunds' ? 'bg-red-600' : 'hover:bg-red-50'}`}>
                <td className={`py-1 pl-6 pr-2 sticky left-0 z-10 relative after:content-[''] after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-gray-200 cursor-pointer ${selectedChartMetric === 'refunds' ? 'bg-red-600 text-white' : 'bg-white group-hover:bg-red-50 hover:text-blue-600'}`}>Refunds</td>
                {calculations.map((d, i) => (
                  <td key={i} className={`text-center py-1 px-1 cursor-default ${selectedChartMetric === 'refunds' ? (i === selectedMonthIndex ? 'bg-red-700 text-white' : 'bg-red-600 text-white') : (i === selectedMonthIndex ? 'bg-red-600 text-white' : 'text-red-600')}`}>{formatCurrency(d.refunds)}</td>
                ))}
              </tr>
              <tr onClick={() => setSelectedChartMetric('estimatedTaxes')} className={`group ${selectedChartMetric === 'estimatedTaxes' ? 'bg-red-600' : 'hover:bg-red-50'}`}>
                <td className={`py-1 pl-6 pr-2 sticky left-0 z-10 relative after:content-[''] after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-gray-200 cursor-pointer ${selectedChartMetric === 'estimatedTaxes' ? 'bg-red-600 text-white' : 'bg-white group-hover:bg-red-50 hover:text-blue-600'}`}>Estimated Taxes</td>
                {calculations.map((d, i) => (
                  <td key={i} className={`text-center py-1 px-1 cursor-default ${selectedChartMetric === 'estimatedTaxes' ? (i === selectedMonthIndex ? 'bg-red-700 text-white' : 'bg-red-600 text-white') : (i === selectedMonthIndex ? 'bg-red-600 text-white' : 'text-red-600')}`}>{d.estimatedTaxes ? formatCurrency(d.estimatedTaxes) : '-'}</td>
                ))}
              </tr>
              <tr onClick={() => setSelectedChartMetric('ownersDraw')} className={`group ${selectedChartMetric === 'ownersDraw' ? 'bg-red-600' : 'hover:bg-red-50'}`}>
                <td className={`py-1 pl-6 pr-2 sticky left-0 z-10 relative after:content-[''] after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-gray-200 cursor-pointer ${selectedChartMetric === 'ownersDraw' ? 'bg-red-600 text-white' : 'bg-white group-hover:bg-red-50 hover:text-blue-600'}`}>Owner's Draw</td>
                {calculations.map((d, i) => (
                  <td key={i} className={`text-center py-1 px-1 cursor-default ${selectedChartMetric === 'ownersDraw' ? (i === selectedMonthIndex ? 'bg-red-700 text-white' : 'bg-red-600 text-white') : (i === selectedMonthIndex ? 'bg-red-600 text-white' : 'text-red-600')}`}>{formatCurrency(d.ownersDraw)}</td>
                ))}
              </tr>
              <tr onClick={() => setSelectedChartMetric('owners401k')} className={`group ${selectedChartMetric === 'owners401k' ? 'bg-red-600' : 'hover:bg-red-50'}`}>
                <td className={`py-1 pl-6 pr-2 sticky left-0 z-10 relative after:content-[''] after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-gray-200 cursor-pointer ${selectedChartMetric === 'owners401k' ? 'bg-red-600 text-white' : 'bg-white group-hover:bg-red-50 hover:text-blue-600'}`}>Owner's 401k</td>
                {calculations.map((d, i) => (
                  <td key={i} className={`text-center py-1 px-1 cursor-default ${selectedChartMetric === 'owners401k' ? (i === selectedMonthIndex ? 'bg-red-700 text-white' : 'bg-red-600 text-white') : (i === selectedMonthIndex ? 'bg-red-600 text-white' : 'text-red-600')}`}>{d.owners401k ? formatCurrency(d.owners401k) : '-'}</td>
                ))}
              </tr>
              <tr onClick={() => setSelectedChartMetric('totalOutflows')} className={`group font-semibold ${selectedChartMetric === 'totalOutflows' ? 'bg-red-700' : 'bg-red-100 hover:bg-red-200'}`}>
                <td className={`py-1 pl-3 pr-2 sticky left-0 z-10 relative after:content-[''] after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-gray-200 cursor-pointer ${selectedChartMetric === 'totalOutflows' ? 'bg-red-700 text-white' : 'bg-red-100 group-hover:bg-red-200 hover:text-blue-600'}`}>Total Outflows</td>
                {calculations.map((d, i) => (
                  <td key={i} className={`text-center py-1 px-1 cursor-default ${selectedChartMetric === 'totalOutflows' ? (i === selectedMonthIndex ? 'bg-red-800 text-white' : 'bg-red-700 text-white') : (i === selectedMonthIndex ? 'bg-red-700 text-white' : 'text-red-700')}`}>{formatCurrency(d.totalOutflows)}</td>
                ))}
              </tr>

              {/* Summary */}
              <tr onClick={() => setSelectedChartMetric('netCashflow')} className={`group font-semibold ${selectedChartMetric === 'netCashflow' ? 'bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'}`}>
                <td className={`py-2 pl-3 pr-2 sticky left-0 z-10 relative after:content-[''] after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-gray-200 cursor-pointer ${selectedChartMetric === 'netCashflow' ? 'bg-gray-700 text-white' : 'bg-gray-100 group-hover:bg-gray-200 hover:text-blue-600'}`}>Net Cashflow</td>
                {calculations.map((d, i) => (
                  <td key={i} className={`text-center py-2 px-1 font-semibold cursor-default ${selectedChartMetric === 'netCashflow' ? (i === selectedMonthIndex ? 'bg-gray-800 text-white' : 'bg-gray-700 text-white') : (i === selectedMonthIndex ? (d.netCashflow >= 0 ? 'bg-green-700 text-white' : 'bg-red-700 text-white') : (d.netCashflow >= 0 ? 'text-green-700' : 'text-red-700'))}`}>
                    {formatCurrency(d.netCashflow)}
                  </td>
                ))}
              </tr>
              <tr onClick={() => setSelectedChartMetric('cashBalance')} className={`group font-bold ${selectedChartMetric === 'cashBalance' ? 'bg-blue-700' : 'bg-blue-100 hover:bg-blue-200'}`}>
                <td className={`py-2 pl-3 pr-2 sticky left-0 z-10 relative after:content-[''] after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-gray-200 cursor-pointer ${selectedChartMetric === 'cashBalance' ? 'bg-blue-700 text-white' : 'bg-blue-100 group-hover:bg-blue-200 hover:text-blue-600'}`}>Cash Balance</td>
                {calculations.map((d, i) => (
                  <td key={i} className={`text-center py-2 px-1 font-bold cursor-default ${selectedChartMetric === 'cashBalance' ? (i === selectedMonthIndex ? 'bg-blue-800 text-white' : 'bg-blue-700 text-white') : (i === selectedMonthIndex ? (d.cashBalance >= 0 ? 'bg-blue-700 text-white' : 'bg-red-700 text-white') : (d.cashBalance >= 0 ? 'text-blue-700' : 'text-red-700'))}`}>
                    {formatCurrency(d.cashBalance)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
          </div>
          )}
        </div>

        {/* MRR Metrics Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
          <div
            className="px-3 py-2.5 border-b border-gray-200 flex items-center justify-between cursor-pointer hover:bg-gray-50"
            onClick={() => toggleSection('mrrMetrics')}
          >
            <h2 className="text-sm font-semibold text-gray-700">MRR Metrics</h2>
            {expandedSections.mrrMetrics ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
          </div>
          {expandedSections.mrrMetrics && (
          <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 pl-3 pr-2 sticky left-0 z-10 relative bg-white after:content-[''] after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-gray-200 font-medium text-gray-600 min-w-[180px]">Metric</th>
                {calculations.map((d, i) => (
                  <th key={i} className={`text-center py-2 px-1 font-medium min-w-[70px] ${i === selectedMonthIndex ? 'bg-gray-700 text-white' : 'text-gray-600'}`}>{d.month}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Customers Section */}
              <tr className="bg-slate-100">
                <td className="py-2 pl-3 pr-2 font-semibold text-slate-700 sticky left-0 z-10 relative bg-slate-100 after:content-[''] after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-gray-200">CUSTOMERS</td>
                {calculations.map((_, i) => <td key={i} className={i === selectedMonthIndex ? 'bg-slate-600' : ''}></td>)}
              </tr>
              <tr>
                <td className="py-1 pl-6 pr-2 sticky left-0 z-10 relative bg-white after:content-[''] after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-gray-200">New Customers</td>
                {calculations.map((d, i) => (
                  <td key={i} className={`text-center py-1 px-1 cursor-default ${i === selectedMonthIndex ? 'bg-slate-600 text-white' : 'text-green-600'}`}>{d.newCustomers > 0 ? `+${d.newCustomers}` : d.newCustomers}</td>
                ))}
              </tr>
              <tr>
                <td className="py-1 pl-6 pr-2 sticky left-0 z-10 relative bg-white after:content-[''] after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-gray-200">Churned Customers</td>
                {calculations.map((d, i) => (
                  <td key={i} className={`text-center py-1 px-1 cursor-default ${i === selectedMonthIndex ? 'bg-slate-600 text-white' : 'text-red-600'}`}>{d.churnedCustomers > 0 ? `-${d.churnedCustomers}` : d.churnedCustomers}</td>
                ))}
              </tr>
              <tr className="font-semibold bg-slate-200">
                <td className="py-1 pl-3 pr-2 sticky left-0 z-10 relative bg-slate-200 after:content-[''] after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-gray-200">Total Customers</td>
                {calculations.map((d, i) => (
                  <td key={i} className={`text-center py-1 px-1 cursor-default ${i === selectedMonthIndex ? 'bg-slate-700 text-white' : 'text-slate-700'}`}>{d.totalCustomers}</td>
                ))}
              </tr>

              {/* Revenue Section */}
              <tr className="bg-slate-100">
                <td className="py-2 pl-3 pr-2 font-semibold text-slate-700 sticky left-0 z-10 relative bg-slate-100 after:content-[''] after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-gray-200">REVENUE</td>
                {calculations.map((_, i) => <td key={i} className={i === selectedMonthIndex ? 'bg-slate-600' : ''}></td>)}
              </tr>
              <tr>
                <td className="py-1 pl-6 pr-2 sticky left-0 z-10 relative bg-white after:content-[''] after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-gray-200">New Revenue</td>
                {calculations.map((d, i) => (
                  <td key={i} className={`text-center py-1 px-1 cursor-default ${i === selectedMonthIndex ? 'bg-slate-600 text-white' : 'text-green-600'}`}>{d.newRevenue > 0 ? `+${formatCurrency(d.newRevenue)}` : formatCurrency(d.newRevenue)}</td>
                ))}
              </tr>
              <tr>
                <td className="py-1 pl-6 pr-2 sticky left-0 z-10 relative bg-white after:content-[''] after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-gray-200">Churned Revenue</td>
                {calculations.map((d, i) => (
                  <td key={i} className={`text-center py-1 px-1 cursor-default ${i === selectedMonthIndex ? 'bg-slate-600 text-white' : 'text-red-600'}`}>{d.churnedRevenue > 0 ? `-${formatCurrency(d.churnedRevenue)}` : formatCurrency(d.churnedRevenue)}</td>
                ))}
              </tr>
              <tr className="font-semibold bg-slate-200">
                <td className="py-1 pl-3 pr-2 sticky left-0 z-10 relative bg-slate-200 after:content-[''] after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-gray-200">Net New Revenue</td>
                {calculations.map((d, i) => {
                  const netRevenue = d.newRevenue - d.churnedRevenue;
                  return (
                    <td key={i} className={`text-center py-1 px-1 cursor-default ${i === selectedMonthIndex ? 'bg-slate-700 text-white' : (netRevenue >= 0 ? 'text-green-700' : 'text-red-700')}`}>
                      {netRevenue >= 0 ? `+${formatCurrency(netRevenue)}` : formatCurrency(netRevenue)}
                    </td>
                  );
                })}
              </tr>
              <tr className="font-bold bg-slate-300">
                <td className="py-1 pl-3 pr-2 sticky left-0 z-10 relative bg-slate-300 after:content-[''] after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-gray-200">Total MRR</td>
                {calculations.map((d, i) => (
                  <td key={i} className={`text-center py-1 px-1 cursor-default ${i === selectedMonthIndex ? 'bg-slate-800 text-white' : 'text-slate-800'}`}>{formatCurrency(d.mrr)}</td>
                ))}
              </tr>
            </tbody>
          </table>
          </div>
          )}
        </div>

          </div>
        </div>
      </div>
    </div>
  );
}
