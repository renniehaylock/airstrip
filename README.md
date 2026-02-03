# 24-Month Cashflow Model

An interactive cashflow forecasting tool built with React. Model your SaaS business finances with MRR extrapolation, expense tracking, and scenario management.

![Cashflow Model Screenshot](screenshot.png)

## Features

### Revenue Modeling
- **MRR Extrapolation**: Set starting MRR, ARPU, new customers/month, and churn rate
- **Additional Revenue**: Model extra revenue streams with growth/decline rates
- **Annual Plan Revenue**: One-time annual payments by month
- **Capital Injections**: Track funding rounds or owner contributions

### Expense Tracking
- **Payroll**: Track employees with automatic 1.15x all-in cost calculation
- **Recurring Expenses**: Software, hosting, marketing, etc.
- **One-Time Expenses**: Equipment purchases, etc. by specific month
- **Variable Expenses**: Percentage of revenue (e.g., Stripe fees)
- **Estimated Taxes**: Configurable tax rate on gross profit

### Scenario Management
- **Save/Load Scenarios**: Store different projections locally
- **Hide Expenses**: Toggle expenses for quick "what-if" analysis without deleting
- **URL Sharing**: Share any configuration via URL parameters
- **Reset to Defaults**: Start fresh anytime

### Visualization
- **24-month bar chart**: Cash balance forecast with positive/negative coloring
- **Data table**: Monthly breakdown of all inflows/outflows
- **Quick stats**: Starting cash, Month 12/24 balances, burn rate

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/cashflow-model.git
cd cashflow-model

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to view it in your browser.

### Build for Production

```bash
npm run build
```

The build output will be in the `dist` folder.

## Usage

### MRR Calculation
The MRR compounds monthly using:
```
Next Month MRR = (Current MRR - Churn Loss) + New Customer Revenue
where:
  Churn Loss = Current MRR × (Churn Rate / 100)
  New Customer Revenue = New Customers × ARPU
```

### Sharing Configurations
1. Set up your model with desired values
2. Click "Share" to copy the URL
3. Anyone with the link sees your exact configuration

### Scenario Comparison
1. Set up a baseline scenario and save it
2. Modify values (or hide expenses) for a variant
3. Save as a new scenario
4. Toggle between scenarios to compare

## Tech Stack
- [React](https://reactjs.org/) - UI framework
- [Vite](https://vitejs.dev/) - Build tool
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Recharts](https://recharts.org/) - Charts
- [Lucide React](https://lucide.dev/) - Icons

## License

MIT

## Contributing

Pull requests welcome! For major changes, please open an issue first to discuss what you'd like to change.
