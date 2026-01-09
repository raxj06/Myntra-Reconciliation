import React, { useState, useEffect } from 'react';
import { getAvailablePeriods } from '../services/api';

/**
 * Sidebar component for period/month selection
 */
const Sidebar = ({ selectedPeriod, onPeriodChange, onNewPeriod }) => {
    const [periods, setPeriods] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showNewPeriodInput, setShowNewPeriodInput] = useState(false);
    const [newPeriodValue, setNewPeriodValue] = useState('');

    useEffect(() => {
        fetchPeriods();
    }, []);

    const fetchPeriods = async () => {
        try {
            const result = await getAvailablePeriods();
            setPeriods(result.periods || []);
        } catch (error) {
            console.error('Error fetching periods:', error);
        } finally {
            setLoading(false);
        }
    };

    // Format period (2026-01) to readable format (January 2026)
    const formatPeriod = (period) => {
        if (!period) return 'All Time';
        const [year, month] = period.split('-');
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return `${monthNames[parseInt(month) - 1]} ${year}`;
    };

    const handleAddPeriod = () => {
        if (newPeriodValue) {
            onNewPeriod(newPeriodValue);
            setShowNewPeriodInput(false);
            setNewPeriodValue('');
        }
    };

    // Get current month in YYYY-MM format
    const getCurrentMonth = () => {
        return new Date().toISOString().slice(0, 7);
    };

    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <h3>📅 Periods</h3>
            </div>

            <div className="sidebar-content">
                {/* Current/New Period Button */}
                <button
                    className="btn-new-period"
                    onClick={() => onPeriodChange(getCurrentMonth())}
                >
                    ➕ New Period ({formatPeriod(getCurrentMonth())})
                </button>

                {/* All Time Option */}
                <div
                    className={`period-item ${!selectedPeriod ? 'active' : ''}`}
                    onClick={() => onPeriodChange(null)}
                >
                    <span className="period-icon">📊</span>
                    <span className="period-name">All Periods</span>
                </div>

                <div className="period-divider"></div>

                {/* Historical Periods */}
                {loading ? (
                    <div className="period-loading">Loading...</div>
                ) : periods.length === 0 ? (
                    <div className="period-empty">No historical data yet</div>
                ) : (
                    periods.map(period => (
                        <div
                            key={period}
                            className={`period-item ${selectedPeriod === period ? 'active' : ''}`}
                            onClick={() => onPeriodChange(period)}
                        >
                            <span className="period-icon">📁</span>
                            <span className="period-name">{formatPeriod(period)}</span>
                        </div>
                    ))
                )}
            </div>

            {/* Custom Period Input */}
            {showNewPeriodInput && (
                <div className="new-period-form">
                    <input
                        type="month"
                        value={newPeriodValue}
                        onChange={(e) => setNewPeriodValue(e.target.value)}
                        placeholder="YYYY-MM"
                    />
                    <button onClick={handleAddPeriod}>Add</button>
                    <button onClick={() => setShowNewPeriodInput(false)}>Cancel</button>
                </div>
            )}
        </div>
    );
};

export default Sidebar;
