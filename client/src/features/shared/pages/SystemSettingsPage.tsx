import React, { useState, useEffect, useCallback } from 'react';
import {
  Settings,
  CreditCard,
  GraduationCap,
  Bell,
  Palette,
  ShieldCheck,
  Save,
  RefreshCw,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Building2,
  Globe,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { showToast } from '@/lib/toast';
import {
  settingsApi,
  SettingKey,
  DEFAULT_SETTINGS,
  SettingEntry,
} from '@/api/settings';
import { useAuthStore } from '@/store';

type TabCategory = 'Fees & Billing' | 'Admissions & Batches' | 'Notifications' | 'School Branding' | 'Security & Access';

const TABS: Array<{ id: TabCategory; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'Fees & Billing', label: 'Fees & Billing', icon: CreditCard },
  { id: 'Admissions & Batches', label: 'Admissions & Batches', icon: GraduationCap },
  { id: 'Notifications', label: 'Notifications', icon: Bell },
  { id: 'School Branding', label: 'School Branding', icon: Palette },
  { id: 'Security & Access', label: 'Security & Access', icon: ShieldCheck },
];

export default function SystemSettingsPage() {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [activeTab, setActiveTab] = useState<TabCategory>('Fees & Billing');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dbSettings, setDbSettings] = useState<Record<string, SettingEntry>>({});
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [dirtyKeys, setDirtyKeys] = useState<Set<string>>(new Set());

  // Load settings from backend API
  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const items = await settingsApi.list();
      const map: Record<string, SettingEntry> = {};
      const values: Record<string, string> = {};

      // Seed with default values first
      Object.entries(DEFAULT_SETTINGS).forEach(([k, def]) => {
        values[k] = def.defaultValue;
      });

      // Override with DB values
      items.forEach((item) => {
        map[item.key] = item;
        values[item.key] = item.value;
      });

      setDbSettings(map);
      setFormValues(values);
      setDirtyKeys(new Set());
    } catch (err: any) {
      showToast(err?.response?.data?.error || 'Failed to load system settings', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleFieldChange = (key: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
    setDirtyKeys((prev) => {
      const next = new Set(prev);
      const original = dbSettings[key]?.value ?? DEFAULT_SETTINGS[key]?.defaultValue ?? '';
      if (value === original) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleSaveTab = async () => {
    const keysInTab = Object.entries(DEFAULT_SETTINGS)
      .filter(([_, conf]) => conf.category === activeTab)
      .map(([k]) => k);

    const dirtyKeysInTab = keysInTab.filter((k) => dirtyKeys.has(k));

    if (dirtyKeysInTab.length === 0) {
      showToast('No changes to save in this tab', 'info');
      return;
    }

    setSaving(true);
    try {
      const payload = dirtyKeysInTab.map((key) => ({
        key,
        value: formValues[key] ?? '',
        description: DEFAULT_SETTINGS[key]?.description,
      }));

      await settingsApi.bulkSet(payload);
      showToast(`Successfully saved ${payload.length} setting${payload.length > 1 ? 's' : ''}`, 'success');
      await loadSettings();
    } catch (err: any) {
      showToast(err?.response?.data?.error || 'Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleResetSetting = async (key: string) => {
    const hasDbOverride = Boolean(dbSettings[key]);
    if (hasDbOverride) {
      try {
        await settingsApi.delete(key);
        showToast(`Reset '${DEFAULT_SETTINGS[key]?.label || key}' to default`, 'success');
        await loadSettings();
      } catch (err: any) {
        showToast(err?.response?.data?.error || 'Failed to reset setting', 'error');
      }
    } else {
      handleFieldChange(key, DEFAULT_SETTINGS[key]?.defaultValue ?? '');
    }
  };

  const activeFields = Object.entries(DEFAULT_SETTINGS).filter(
    ([_, conf]) => conf.category === activeTab
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Settings className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">System Settings</h1>
              <p className="text-sm text-muted-foreground">
                Configure school-wide policies, calculation thresholds, notifications, and branding.
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadSettings}
            disabled={loading || saving}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={handleSaveTab}
            disabled={loading || saving || dirtyKeys.size === 0}
            className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Changes {dirtyKeys.size > 0 && `(${dirtyKeys.size})`}
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const countDirty = Object.keys(DEFAULT_SETTINGS).filter(
            (k) => DEFAULT_SETTINGS[k].category === tab.id && dirtyKeys.has(k)
          ).length;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
              {countDirty > 0 && (
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                    isActive ? 'bg-primary-foreground text-primary' : 'bg-primary/20 text-primary'
                  }`}
                >
                  {countDirty}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Form Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm">Loading configurations from server...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {activeFields.map(([key, meta]) => {
            const dbEntry = dbSettings[key];
            const currentValue = formValues[key] ?? meta.defaultValue;
            const isDirty = dirtyKeys.has(key);
            const isCustomized = Boolean(dbEntry);

            return (
              <div
                key={key}
                className={`p-5 rounded-xl border transition-all ${
                  isDirty
                    ? 'border-primary/50 bg-primary/[0.02] shadow-sm'
                    : 'border-border/60 bg-card hover:border-border'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  {/* Label & Description */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground text-base">{meta.label}</span>
                      {isCustomized ? (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                          {dbEntry.scope === 'SCHOOL' ? <Building2 className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
                          {dbEntry.scope === 'SCHOOL' ? 'School Scoped' : 'Global Override'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium bg-muted text-muted-foreground">
                          Default
                        </span>
                      )}
                      {isDirty && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                          Unsaved
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{meta.description}</p>
                    <div className="text-[11px] font-mono text-muted-foreground/60 pt-0.5">Key: {key}</div>
                  </div>

                  {/* Input Controls */}
                  <div className="w-full md:w-80 flex items-center gap-2">
                    {meta.type === 'boolean' ? (
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleFieldChange(key, currentValue === 'true' ? 'false' : 'true')}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            currentValue === 'true' ? 'bg-primary' : 'bg-muted'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                              currentValue === 'true' ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                        <span className="text-sm font-medium text-foreground">
                          {currentValue === 'true' ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    ) : meta.type === 'number' ? (
                      <Input
                        type="number"
                        value={currentValue}
                        onChange={(e) => handleFieldChange(key, e.target.value)}
                        className="font-medium bg-background"
                      />
                    ) : (
                      <div className="flex items-center gap-2 w-full">
                        {key === SettingKey.SCHOOL_PRIMARY_COLOR && (
                          <input
                            type="color"
                            value={currentValue || '#2563eb'}
                            onChange={(e) => handleFieldChange(key, e.target.value)}
                            className="h-9 w-9 rounded border border-border cursor-pointer p-0.5 shrink-0"
                          />
                        )}
                        <Input
                          type="text"
                          value={currentValue}
                          placeholder={meta.defaultValue || 'Enter value...'}
                          onChange={(e) => handleFieldChange(key, e.target.value)}
                          className="font-medium bg-background"
                        />
                      </div>
                    )}

                    {/* Reset Button */}
                    {(isCustomized || isDirty) && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleResetSetting(key)}
                        title="Reset to default value"
                        className="h-9 px-2 text-muted-foreground hover:text-foreground shrink-0"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
