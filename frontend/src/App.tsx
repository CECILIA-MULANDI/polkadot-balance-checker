import { useState } from "react";
import "./App.css";

interface BalanceData {
  free: number;
  reserved: number;
  frozen: number;
  total: number;
}

export default function App() {
  const [address, setAddress] = useState("");
  const [balance, setBalance] = useState<BalanceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkBalance = async () => {
    if (!address.trim()) {
      setError("Please enter an address");
      return;
    }

    setLoading(true);
    setError(null);
    setBalance(null);

    try {
      const response = await fetch(
        `https://polkadot-balance-checker-3.onrender.com/api/balance/${address}`
      );
      const data = await response.json();

      if (data.success && data.data) {
        setBalance(data.data);
      } else {
        setError(data.error || "Failed to fetch balance");
      }
    } catch (err) {
      setError("Failed to connect to backend. Is the server running?");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      checkBalance();
    }
  };

  const tryExample = () => {
    setAddress("16JGzEsi8gcySKjpmxHVrkLTHdFHodRepEz8n244gNZpr9J");
  };

  return (
    <div className="app-container">
      <div className="card">
        {/* Header */}
        <div className="header">
          <div className="icon-wrapper">
            <svg className="icon" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" opacity="0.3" />
              <circle cx="12" cy="12" r="6" />
              <circle cx="12" cy="12" r="2" fill="white" />
            </svg>
          </div>
          <h1 className="title">Polkadot Balance</h1>
          <p className="subtitle">Check any address using PAPI light client</p>
        </div>

        {/* Input Section */}
        <div className="input-section">
          <div className="input-group">
            <label htmlFor="address" className="label">
              Polkadot Address
            </label>
            <input
              id="address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter Polkadot address..."
              className="input"
              disabled={loading}
            />
            <button onClick={tryExample} className="example-btn">
              Try example address
            </button>
          </div>

          <button
            onClick={checkBalance}
            disabled={loading || !address.trim()}
            className="check-btn"
          >
            {loading ? (
              <span className="loading-content">
                <div className="spinner"></div>
                Checking Balance...
              </span>
            ) : (
              "Check Balance"
            )}
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="status-box loading-box">
            <div className="status-content">
              <div className="spinner-small"></div>
              <div>
                <p className="status-title">Connecting to Polkadot</p>
                <p className="status-text">
                  Starting light client and syncing to latest block...
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="status-box error-box">
            <div className="status-content">
              <span className="error-icon">❌</span>
              <div>
                <p className="status-title">Error</p>
                <p className="status-text">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Success State */}
        {balance && !loading && (
          <div className="balance-section">
            {/* Main Balance */}
            <div className="main-balance">
              <p className="balance-label">Free Balance</p>
              <p className="balance-amount">{balance.free.toFixed(4)}</p>
              <p className="balance-currency">DOT</p>
            </div>

            {/* Additional Info */}
            <div className="balance-grid">
              <div className="balance-item">
                <p className="balance-item-label">Reserved</p>
                <p className="balance-item-value">
                  {balance.reserved.toFixed(4)}
                </p>
              </div>
              <div className="balance-item">
                <p className="balance-item-label">Frozen</p>
                <p className="balance-item-value">
                  {balance.frozen.toFixed(4)}
                </p>
              </div>
            </div>

            {/* Total */}
            <div className="total-balance">
              <p className="total-label">Total Balance</p>
              <p className="total-amount">{balance.total.toFixed(4)} DOT</p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="footer">
          <div className="footer-content">
            <span className="status-indicator"></span>
            <span>Powered by Polkadot API (PAPI)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
