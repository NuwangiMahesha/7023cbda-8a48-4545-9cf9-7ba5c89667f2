import React, { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { useApp } from '../../contexts/AppContext';

export function AdminSettings() {
  const { settings, updateSettings } = useApp();
  const [address, setAddress] = useState(settings.usdtAddress);
  const [minStake, setMinStake] = useState(String(settings.minStake));
  const [minRecharge, setMinRecharge] = useState(String(settings.minRechargeUsdt));
  const [rate, setRate] = useState(String(settings.pointsPerUsdt));
  const [maintenance, setMaintenance] = useState(settings.maintenance);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    const stake = Number(minStake);
    const recharge = Number(minRecharge);
    const conversion = Number(rate);
    if (
      [stake, recharge, conversion].some((value) => !Number.isFinite(value) || value <= 0)
    ) {
      toast.error('Stake, minimum recharge and conversion rate must be positive numbers.');
      return;
    }
    await updateSettings({
      usdtAddress: address.trim(),
      minStake: stake,
      minRechargeUsdt: recharge,
      pointsPerUsdt: conversion,
      maintenance,
    });
    toast.success('Platform settings saved.');
  }

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink-900">
          System settings
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          These values drive the player app — deposits, minimum thresholds and availability.
        </p>
      </header>

      <form onSubmit={save} className="grid gap-4 rounded-2xl bg-white p-5 shadow-card">
        <TextField
          label="USDT (TRC20) deposit address"
          value={address}
          onChange={(event) => setAddress(event.target.value)} />
        
        <div className="grid gap-4 sm:grid-cols-3">
          <TextField
            label="Coins per 1 USDT"
            type="number"
            min={1}
            value={rate}
            onChange={(event) => setRate(event.target.value)}
            hint="1 USDT = 100 coins by default." />
          
          <TextField
            label="Minimum recharge (USDT)"
            type="number"
            min={1}
            value={minRecharge}
            onChange={(event) => setMinRecharge(event.target.value)} />
          
          <TextField
            label="Minimum stake (coins)"
            type="number"
            min={1}
            value={minStake}
            onChange={(event) => setMinStake(event.target.value)} />
          
        </div>

        <label className="flex items-center gap-3 rounded-xl bg-surface-sunken px-4 py-3">
          <input
            type="checkbox"
            checked={maintenance}
            onChange={(event) => setMaintenance(event.target.checked)}
            className="h-4 w-4 accent-brand-500" />
          
          <span className="text-sm font-semibold text-ink-900">
            Maintenance mode
            <span className="block text-xs font-normal text-ink-500">
              Pauses new bets and shows players a maintenance notice.
            </span>
          </span>
        </label>

        <Button type="submit" size="lg" className="justify-self-start px-8">
          Save settings
        </Button>
      </form>
    </div>);

}