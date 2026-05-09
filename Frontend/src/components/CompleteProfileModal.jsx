import React, { useState } from 'react';
import { ShoppingCart, Home, Briefcase, Phone, CheckCircle2 } from 'lucide-react';

const CompleteProfileModal = ({ isOpen, user, onComplete, error }) => {
    const [formData, setFormData] = useState({
        role: user?.role || 'Buyer',
        phone: user?.phone || ''
    });
    const [submitting, setSubmitting] = useState(false);

    if (!isOpen) return null;

    const roles = [
        { id: 'Buyer',  label: 'Buy Property',    desc: 'I want to explore & buy plots',    icon: ShoppingCart },
        { id: 'Seller', label: 'Sell Property',    desc: 'I want to list my land / plots',   icon: Home },
        { id: 'Broker', label: 'Broker / Agent',   desc: 'I manage properties for clients',  icon: Briefcase },
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        await onComplete(formData);
        setSubmitting(false);
    };

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Nunito+Sans:wght@400;500;600;700;800&display=swap');
                .cpm-overlay {
                    position: fixed; inset: 0; z-index: 100;
                    display: flex; align-items: center; justify-content: center;
                    padding: 16px;
                    background: rgba(15, 22, 40, 0.72);
                    backdrop-filter: blur(6px);
                    font-family: 'Nunito Sans', sans-serif;
                }
                .cpm-card {
                    background: #fff;
                    width: 100%; max-width: 460px;
                    border-radius: 20px;
                    overflow: hidden;
                    box-shadow: 0 32px 64px rgba(15,22,40,0.35);
                }
                /* Gold top accent */
                .cpm-top-bar {
                    height: 4px;
                    background: linear-gradient(90deg, #c9a84c, #f0d080, #c9a84c);
                }
                .cpm-body { padding: 28px 28px 24px; }

                /* Header */
                .cpm-header { text-align: center; margin-bottom: 22px; }
                .cpm-icon-wrap {
                    width: 44px; height: 44px; border-radius: 12px;
                    background: #1a2340; display: inline-flex;
                    align-items: center; justify-content: center;
                    margin-bottom: 12px;
                }
                .cpm-title {
                    font-family: 'Playfair Display', serif;
                    font-size: 22px; font-weight: 700; color: #1a2340;
                    margin: 0 0 4px;
                }
                .cpm-sub { font-size: 13px; color: #6b7280; font-weight: 500; margin: 0; }

                /* Error */
                .cpm-error {
                    background: #fff0f0; border: 1px solid #fecaca;
                    color: #dc2626; padding: 10px 14px; border-radius: 8px;
                    font-size: 12px; font-weight: 600; margin-bottom: 16px;
                }

                /* Section label */
                .cpm-label {
                    display: block; font-size: 10px; font-weight: 800;
                    color: #1a2340; text-transform: uppercase; letter-spacing: 1.5px;
                    margin-bottom: 10px;
                }

                /* Role cards */
                .cpm-roles { display: flex; flex-direction: column; gap: 8px; margin-bottom: 18px; }
                .cpm-role-btn {
                    display: flex; align-items: center; gap: 12px;
                    padding: 11px 14px; border-radius: 10px; cursor: pointer;
                    border: 1.5px solid #e2d9c5; background: #fdfaf5;
                    transition: all 0.15s; text-align: left; width: 100%;
                }
                .cpm-role-btn:hover { border-color: #1a2340; background: #f8f5ee; }
                .cpm-role-btn.selected {
                    border-color: #c9a84c; background: #fffbf0;
                    box-shadow: 0 0 0 3px rgba(201,168,76,0.12);
                }
                .cpm-role-icon {
                    width: 36px; height: 36px; border-radius: 9px;
                    background: #1a2340; display: flex; align-items: center; justify-content: center;
                    flex-shrink: 0; transition: background 0.15s;
                }
                .cpm-role-btn.selected .cpm-role-icon { background: #c9a84c; }
                .cpm-role-text { flex: 1; min-width: 0; }
                .cpm-role-name {
                    font-size: 13px; font-weight: 800; color: #1a2340;
                    display: block; margin-bottom: 1px;
                }
                .cpm-role-btn.selected .cpm-role-name { color: #b8933a; }
                .cpm-role-desc { font-size: 11px; color: #9ca3af; font-weight: 500; display: block; }

                /* Phone input */
                .cpm-phone-wrap { margin-bottom: 18px; }
                .cpm-input-row {
                    position: relative; display: flex; align-items: center;
                }
                .cpm-input-icon {
                    position: absolute; left: 12px; color: #9ca3af;
                    display: flex; align-items: center;
                }
                .cpm-input {
                    width: 100%; box-sizing: border-box;
                    padding: 11px 14px 11px 38px;
                    border-radius: 8px; border: 1.5px solid #e2d9c5;
                    background: #fdfaf5; font-family: 'Nunito Sans', sans-serif;
                    font-size: 13px; font-weight: 700; color: #1a2340;
                    outline: none; transition: border-color 0.2s, box-shadow 0.2s;
                }
                .cpm-input::placeholder { color: #b0a898; font-weight: 500; }
                .cpm-input:focus {
                    border-color: #c9a84c;
                    box-shadow: 0 0 0 3px rgba(201,168,76,0.12);
                    background: #fff;
                }

                /* Submit button */
                .cpm-submit {
                    width: 100%; padding: 13px;
                    border-radius: 10px; border: none; cursor: pointer;
                    font-family: 'Nunito Sans', sans-serif;
                    font-size: 13px; font-weight: 800;
                    text-transform: uppercase; letter-spacing: 1px;
                    transition: all 0.2s;
                }
                .cpm-submit:not(:disabled) {
                    background: #1a2340; color: #fff;
                }
                .cpm-submit:not(:disabled):hover { background: #c9a84c; color: #1a1200; }
                .cpm-submit:disabled { background: #e2d9c5; color: #b0a898; cursor: not-allowed; }
            `}</style>

            <div className="cpm-overlay">
                <div className="cpm-card">
                    <div className="cpm-top-bar" />
                    <div className="cpm-body">

                        {/* Header */}
                        <div className="cpm-header">
                            <div className="cpm-icon-wrap">
                                <CheckCircle2 size={22} color="#c9a84c" />
                            </div>
                            <h2 className="cpm-title">Almost There!</h2>
                            <p className="cpm-sub">Just a few details to complete your account</p>
                        </div>

                        {/* Error */}
                        {error && <div className="cpm-error">⚠ {error}</div>}

                        <form onSubmit={handleSubmit}>
                            {/* Role selector */}
                            <span className="cpm-label">I want to...</span>
                            <div className="cpm-roles">
                                {roles.map(role => (
                                    <button
                                        key={role.id}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, role: role.id })}
                                        className={`cpm-role-btn ${formData.role === role.id ? 'selected' : ''}`}
                                    >
                                        <div className="cpm-role-icon">
                                            <role.icon size={17} color={formData.role === role.id ? '#1a1200' : '#c9a84c'} />
                                        </div>
                                        <div className="cpm-role-text">
                                            <span className="cpm-role-name">{role.label}</span>
                                            <span className="cpm-role-desc">{role.desc}</span>
                                        </div>
                                        {/* Selected indicator */}
                                        {formData.role === role.id && (
                                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#c9a84c', flexShrink: 0 }} />
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* Phone number */}
                            {!user?.phone && (
                                <div className="cpm-phone-wrap">
                                    <span className="cpm-label">Phone Number</span>
                                    <div className="cpm-input-row">
                                        <span className="cpm-input-icon"><Phone size={15} /></span>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Enter your mobile number"
                                            className="cpm-input"
                                            value={formData.phone}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Submit */}
                            <button type="submit" className="cpm-submit" disabled={submitting}>
                                {submitting ? 'Setting up...' : 'Complete Setup →'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
};

export default CompleteProfileModal;
