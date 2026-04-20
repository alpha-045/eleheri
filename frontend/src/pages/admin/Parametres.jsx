import { useState } from 'react'
import { Settings, CreditCard, Bell, Shield } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import { useParametres } from '../../features/parametres/useParametres'
import { GeneralSettings } from '../../components/Parametres/GeneralSettings'
import { BillingSettings } from '../../components/Parametres/BillingSettings'
import { NotificationSettings } from '../../components/Parametres/NotificationSettings'
import { SecuritySettings } from '../../components/Parametres/SecuritySettings'
import '../../styles/parametres.css'

export default function Parametres() {
  const { hasAnyPermission } = useAuth()
  const { settings, updateSettings, loading, submitting } = useParametres()
  const [activeTab, setActiveTab] = useState('general')

  if (!hasAnyPermission(['systeme.settings'])) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
        Vous n&apos;avez pas la permission d&apos;accéder aux paramètres.
      </div>
    )
  }

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Chargement des paramètres...</div>
  }

  const tabs = [
    { id: 'general', label: 'Général', icon: Settings },
    { id: 'facturation', label: 'Facturation', icon: CreditCard },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'securite', label: 'Sécurité', icon: Shield },
  ]

  return (
    <section className="content parametres-page">
      <div className="dash-head">
        <div>
          <div className="dash-title">Paramètres du système</div>
          <div className="dash-subtitle">
            <span className="dash-subtitle-dot" />
            Configuration globale de l&apos;application
          </div>
        </div>
      </div>

      <div className="param-layout">
        <aside className="param-sidebar">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                type="button"
                className={`param-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            )
          })}
        </aside>

        <div className="param-content">
          {activeTab === 'general' && (
            <GeneralSettings 
              settings={settings} 
              submitting={submitting} 
              onSave={updateSettings} 
            />
          )}

          {activeTab === 'facturation' && (
            <BillingSettings 
              settings={settings} 
              submitting={submitting} 
              onSave={updateSettings} 
            />
          )}

          {activeTab === 'notifications' && (
            <NotificationSettings 
              settings={settings} 
              submitting={submitting} 
              onSave={updateSettings} 
            />
          )}

          {activeTab === 'securite' && (
            <SecuritySettings 
              settings={settings} 
              submitting={submitting} 
              onSave={updateSettings} 
            />
          )}
        </div>
      </div>
    </section>
  )
}
