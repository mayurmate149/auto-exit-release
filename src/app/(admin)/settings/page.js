"use client";
import React, { useCallback, useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { useModal } from "@/hooks/useModal";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Loader from "@/components/ui/loader/Loader";
import { showToast } from "@/components/common/Toaster";


function calculateAmounts(totalCapital, maxLossPercent, maxProfitPercent) {
    const cap = parseFloat(totalCapital) || 0;
    const lossP = parseFloat(maxLossPercent) || 0;
    const profitP = parseFloat(maxProfitPercent) || 0;
    return {
        maxLossAmount: cap && lossP ? ((cap * lossP) / 100).toFixed(2) : "",
        maxProfitAmount: cap && profitP ? ((cap * profitP) / 100).toFixed(2) : "",
    };
}


export default function Settings() {
    const [settings, setSettings] = useState({
        totalCapital: "",
        maxLossPercent: "",
        maxLossAmount: "",
        maxProfitPercent: "",
        maxProfitAmount: "",
        schedulerFrequency: "",
        stopLossTrailing: false,
        // Trailing SL params
        initialStopLossPct: "1",
        breakEvenTriggerPct: "1",
        profitLockTriggerPct: "2",
        lockedProfitPct: "1",
        trailingStepPct: "1",
        trailingGapPct: "0.5",
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [modalSettings, setModalSettings] = useState({
        totalCapital: "",
        maxLossPercent: "",
        maxLossAmount: "",
        maxProfitPercent: "",
        maxProfitAmount: "",
        schedulerFrequency: "",
        stopLossTrailing: false,
        // Trailing SL params
        initialStopLossPct: "1",
        breakEvenTriggerPct: "1",
        profitLockTriggerPct: "2",
        lockedProfitPct: "1",
        trailingStepPct: "1",
        trailingGapPct: "0.5",
    });
    const { isOpen, openModal: _openModal, closeModal } = useModal();
    // Helper to open modal and copy settings to modalSettings
    const openModal = useCallback(() => {
        setModalSettings({ ...settings });
        _openModal();
    }, [settings, _openModal]);

    const fetchSettings = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/settings");
            const data = await res.json();
            if (res.ok && data.settings) {
                const { _id, ...rest } = data.settings;
                const { maxLossAmount, maxProfitAmount } = calculateAmounts(
                    rest.totalCapital,
                    rest.maxLossPercent,
                    rest.maxProfitPercent
                );
                const nextSettings = {
                    totalCapital: rest.totalCapital || "",
                    maxLossPercent: rest.maxLossPercent || "",
                    maxLossAmount,
                    maxProfitPercent: rest.maxProfitPercent || "",
                    maxProfitAmount,
                    schedulerFrequency: rest.schedulerFrequency || "",
                    stopLossTrailing: typeof rest.stopLossTrailing === "boolean" ? rest.stopLossTrailing : false,
                    initialStopLossPct: rest.initialStopLossPct || "1",
                    breakEvenTriggerPct: rest.breakEvenTriggerPct || "1",
                    profitLockTriggerPct: rest.profitLockTriggerPct || "2",
                    lockedProfitPct: rest.lockedProfitPct || "1",
                    trailingStepPct: rest.trailingStepPct || "1",
                    trailingGapPct: rest.trailingGapPct || "0.5",
                };
                setSettings(nextSettings);
                setModalSettings(nextSettings);
            } else if (!res.ok) {
                showToast(data.error || "Failed to load settings", { type: "error" });
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to load settings";
            showToast(message, { type: "error" });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const handleSave = useCallback(async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch("/api/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(modalSettings),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                showToast("Settings saved successfully.", { type: "success" });
                closeModal();
                await fetchSettings();
            } else {
                const message = data.error || "Failed to save settings";
                showToast(message, { type: "error" });
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to save settings";
            showToast(message, { type: "error" });
        } finally {
            setSaving(false);
        }
    }, [modalSettings, closeModal, fetchSettings]);

    // Handle input changes
    const handleModalChange = useCallback((e) => {
        const { name, value, type, checked } = e.target;
        setModalSettings((prev) => {
            let updated = {
                ...prev,
                [name]: type === "checkbox" ? checked : value,
            };
            if (["totalCapital", "maxLossPercent", "maxProfitPercent"].includes(name)) {
                const { maxLossAmount, maxProfitAmount } = calculateAmounts(
                    name === "totalCapital" ? value : updated.totalCapital,
                    name === "maxLossPercent" ? value : updated.maxLossPercent,
                    name === "maxProfitPercent" ? value : updated.maxProfitPercent
                );
                updated.maxLossAmount = maxLossAmount;
                updated.maxProfitAmount = maxProfitAmount;
            }
            return updated;
        });
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[300px]">
                <Loader />
            </div>
        );
    }
    return (
        <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
                        Settings
                    </h4>

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
                        <div>
                            <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                Total Capital
                                <span title="Total capital allocated for trading. Used as the base for all % calculations.">
                                    <svg width="14" height="14" fill="none" viewBox="0 0 20 20" className="inline-block text-blue-400"><circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" fill="none"/><text x="6" y="15" fontSize="12" fill="currentColor">?</text></svg>
                                </span>
                            </p>
                            <p className="text-sm font-medium text-gray-800 dark:text-white/90">{settings.totalCapital}</p>
                        </div>
                        <div>
                            <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                Max Loss Allowed (%)
                                <span title="Maximum loss allowed as a percentage of capital before auto-exit triggers.">
                                    <svg width="14" height="14" fill="none" viewBox="0 0 20 20" className="inline-block text-blue-400"><circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" fill="none"/><text x="6" y="15" fontSize="12" fill="currentColor">?</text></svg>
                                </span>
                            </p>
                            <p className="text-sm font-medium text-gray-800 dark:text-white/90">{settings.maxLossPercent}</p>
                        </div>
                        <div>
                            <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                Max Loss Amount
                                <span title="Maximum loss allowed in currency, calculated from capital and %.">
                                    <svg width="14" height="14" fill="none" viewBox="0 0 20 20" className="inline-block text-blue-400"><circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" fill="none"/><text x="6" y="15" fontSize="12" fill="currentColor">?</text></svg>
                                </span>
                            </p>
                            <p className="text-sm font-medium text-gray-800 dark:text-white/90">{settings.maxLossAmount}</p>
                        </div>
                        <div>
                            <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                Max Profit Allowed (%)
                                <span title="Maximum profit allowed as a percentage of capital before auto-exit triggers.">
                                    <svg width="14" height="14" fill="none" viewBox="0 0 20 20" className="inline-block text-blue-400"><circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" fill="none"/><text x="6" y="15" fontSize="12" fill="currentColor">?</text></svg>
                                </span>
                            </p>
                            <p className="text-sm font-medium text-gray-800 dark:text-white/90">{settings.maxProfitPercent}</p>
                        </div>
                        <div>
                            <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                Max Profit Amount
                                <span title="Maximum profit allowed in currency, calculated from capital and %.">
                                    <svg width="14" height="14" fill="none" viewBox="0 0 20 20" className="inline-block text-blue-400"><circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" fill="none"/><text x="6" y="15" fontSize="12" fill="currentColor">?</text></svg>
                                </span>
                            </p>
                            <p className="text-sm font-medium text-gray-800 dark:text-white/90">{settings.maxProfitAmount}</p>
                        </div>
                        <div>
                            <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                Scheduler Frequency (ms)
                                <span title="How often (in ms) the system checks positions and updates trailing stop loss.">
                                    <svg width="14" height="14" fill="none" viewBox="0 0 20 20" className="inline-block text-blue-400"><circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" fill="none"/><text x="6" y="15" fontSize="12" fill="currentColor">?</text></svg>
                                </span>
                            </p>
                            <p className="text-sm font-medium text-gray-800 dark:text-white/90">{settings.schedulerFrequency}</p>
                        </div>
                        <div>
                            <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                StopLoss Trailing
                                <span title="Enable or disable the trailing stop loss system.">
                                    <svg width="14" height="14" fill="none" viewBox="0 0 20 20" className="inline-block text-blue-400"><circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" fill="none"/><text x="6" y="15" fontSize="12" fill="currentColor">?</text></svg>
                                </span>
                            </p>
                            <p className="text-sm font-medium text-gray-800 dark:text-white/90">{settings.stopLossTrailing ? 'On' : 'Off'}</p>
                        </div>
                        {/* Trailing SL Settings */}
                        <div>
                            <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                Initial Stop Loss (%)
                                <span title="Initial stop loss as a negative % of capital, set when position opens.">
                                    <svg width="14" height="14" fill="none" viewBox="0 0 20 20" className="inline-block text-blue-400"><circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" fill="none"/><text x="6" y="15" fontSize="12" fill="currentColor">?</text></svg>
                                </span>
                            </p>
                            <p className="text-sm font-medium text-gray-800 dark:text-white/90">{settings.initialStopLossPct}</p>
                        </div>
                        <div>
                            <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                Break-even Trigger (%)
                                <span title="MTM % at which stop loss is moved to break-even (0%).">
                                    <svg width="14" height="14" fill="none" viewBox="0 0 20 20" className="inline-block text-blue-400"><circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" fill="none"/><text x="6" y="15" fontSize="12" fill="currentColor">?</text></svg>
                                </span>
                            </p>
                            <p className="text-sm font-medium text-gray-800 dark:text-white/90">{settings.breakEvenTriggerPct}</p>
                        </div>
                        <div>
                            <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                Profit Lock Trigger (%)
                                <span title="MTM % at which a portion of profit is locked in as stop loss.">
                                    <svg width="14" height="14" fill="none" viewBox="0 0 20 20" className="inline-block text-blue-400"><circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" fill="none"/><text x="6" y="15" fontSize="12" fill="currentColor">?</text></svg>
                                </span>
                            </p>
                            <p className="text-sm font-medium text-gray-800 dark:text-white/90">{settings.profitLockTriggerPct}</p>
                        </div>
                        <div>
                            <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                Locked Profit (%)
                                <span title="The % of capital to lock as stop loss after profit lock trigger.">
                                    <svg width="14" height="14" fill="none" viewBox="0 0 20 20" className="inline-block text-blue-400"><circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" fill="none"/><text x="6" y="15" fontSize="12" fill="currentColor">?</text></svg>
                                </span>
                            </p>
                            <p className="text-sm font-medium text-gray-800 dark:text-white/90">{settings.lockedProfitPct}</p>
                        </div>
                        <div>
                            <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                Trailing Step (%)
                                <span title="The minimum MTM % increase required to move the trailing stop loss up.">
                                    <svg width="14" height="14" fill="none" viewBox="0 0 20 20" className="inline-block text-blue-400"><circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" fill="none"/><text x="6" y="15" fontSize="12" fill="currentColor">?</text></svg>
                                </span>
                            </p>
                            <p className="text-sm font-medium text-gray-800 dark:text-white/90">{settings.trailingStepPct}</p>
                        </div>
                        <div>
                            <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                Trailing Gap (%)
                                <span title="The gap (in %) to keep between current MTM and the new trailing stop loss.">
                                    <svg width="14" height="14" fill="none" viewBox="0 0 20 20" className="inline-block text-blue-400"><circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" fill="none"/><text x="6" y="15" fontSize="12" fill="currentColor">?</text></svg>
                                </span>
                            </p>
                            <p className="text-sm font-medium text-gray-800 dark:text-white/90">{settings.trailingGapPct}</p>
                        </div>
                    </div>
                </div>

                <button
                    onClick={openModal}
                    className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
                >
                    <svg
                        className="fill-current"
                        width="18"
                        height="18"
                        viewBox="0 0 18 18"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z"
                            fill=""
                        />
                    </svg>
                    Edit
                </button>
            </div>

            <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
                <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
                    <div className="px-2 pr-14">
                        <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                            Settings
                        </h4>
                    </div>
                    <form className="flex flex-col">
                        <div className="custom-scrollbar h-[450px] overflow-y-auto px-2 pb-3">
                            <div>

                                <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                                    <div>
                                        <Label>Total Capital</Label>
                                        <Input type="number" name="totalCapital" defaultValue={modalSettings.totalCapital ?? 0} onChange={handleModalChange} />
                                    </div>
                                    <div>
                                        <Label>Max Loss Allowed (%)</Label>
                                        <Input type="number" name="maxLossPercent" defaultValue={modalSettings.maxLossPercent ?? 0} onChange={handleModalChange} />
                                    </div>
                                    <div>
                                        <Label>Max Loss Amount</Label>
                                        <Input type="number" name="maxLossAmount" defaultValue={modalSettings.maxLossAmount ?? 0} readOnly className="bg-gray-100 cursor-not-allowed" />
                                    </div>
                                    <div>
                                        <Label>Max Profit Allowed (%)</Label>
                                        <Input type="number" name="maxProfitPercent" defaultValue={modalSettings.maxProfitPercent ?? 0} onChange={handleModalChange} />
                                    </div>
                                    <div>
                                        <Label>Max Profit Amount</Label>
                                        <Input type="number" name="maxProfitAmount" defaultValue={modalSettings.maxProfitAmount ?? 0} readOnly className="bg-gray-100 cursor-not-allowed" />
                                    </div>
                                    <div>
                                        <Label>Scheduler Frequency (ms)</Label>
                                        <Input type="number" name="schedulerFrequency" defaultValue={modalSettings.schedulerFrequency ?? 0} onChange={handleModalChange} />
                                    </div>
                                    <div className="col-span-2">
                                        <Label>StopLoss Trailing</Label>
                                        <div className="flex items-center gap-8 mt-2">
                                            <label className="flex items-center cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="stopLossTrailing"
                                                    value="true"
                                                    checked={modalSettings.stopLossTrailing === true}
                                                    onChange={() => handleModalChange({ target: { name: "stopLossTrailing", value: true, type: "checkbox", checked: true } })}
                                                    className="accent-blue-600"
                                                />
                                                <span className="ml-2 font-medium text-green-700">On</span>
                                            </label>
                                            <label className="flex items-center cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="stopLossTrailing"
                                                    value="false"
                                                    checked={modalSettings.stopLossTrailing === false}
                                                    onChange={() => handleModalChange({ target: { name: "stopLossTrailing", value: false, type: "checkbox", checked: false } })}
                                                    className="accent-red-600"
                                                />
                                                <span className="ml-2 font-medium text-red-700">Off</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                {/* Trailing Stop Loss Settings */}
                                <div className="col-span-2 mt-6">
                                    <h5 className="font-semibold mb-2 text-md text-gray-700 dark:text-white/80">Trailing Stop Loss Settings</h5>
                                    <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-3">
                                        <div>
                                            <Label>Initial Stop Loss (%)</Label>
                                            <Input type="number" step="0.01" name="initialStopLossPct" defaultValue={modalSettings.initialStopLossPct ?? 1} onChange={handleModalChange} />
                                        </div>
                                        <div>
                                            <Label>Break-even Trigger (%)</Label>
                                            <Input type="number" step="0.01" name="breakEvenTriggerPct" defaultValue={modalSettings.breakEvenTriggerPct ?? 1} onChange={handleModalChange} />
                                        </div>
                                        <div>
                                            <Label>Profit Lock Trigger (%)</Label>
                                            <Input type="number" step="0.01" name="profitLockTriggerPct" defaultValue={modalSettings.profitLockTriggerPct ?? 2} onChange={handleModalChange} />
                                        </div>
                                        <div>
                                            <Label>Locked Profit (%)</Label>
                                            <Input type="number" step="0.01" name="lockedProfitPct" defaultValue={modalSettings.lockedProfitPct ?? 1} onChange={handleModalChange} />
                                        </div>
                                        <div>
                                            <Label>Trailing Step (%)</Label>
                                            <Input type="number" step="0.01" name="trailingStepPct" defaultValue={modalSettings.trailingStepPct ?? 1} onChange={handleModalChange} />
                                        </div>
                                        <div>
                                            <Label>Trailing Gap (%)</Label>
                                            <Input type="number" step="0.01" name="trailingGapPct" defaultValue={modalSettings.trailingGapPct ?? 0.5} onChange={handleModalChange} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
                            <Button size="sm" variant="outline" onClick={closeModal}>
                                Close
                            </Button>
                            <Button size="sm" onClick={handleSave} disabled={saving}>
                                {saving ? "Saving..." : "Save Changes"}
                            </Button>
                        </div>
                    </form>
                </div>
            </Modal>
        </div>
    );
}
