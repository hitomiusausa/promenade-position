import type { ViewRole } from '../types'
import { useI18n } from '../i18n'

const ROLES: ViewRole[] = ['man', 'lady', 'both']

export function RoleToggle({ value, onChange }: { value: ViewRole; onChange: (v: ViewRole) => void }) {
  const { dict } = useI18n()
  return (
    <div className="role-toggle" role="group">
      {ROLES.map((r) => (
        <button key={r} aria-pressed={value === r} className={value === r ? 'active' : ''} onClick={() => onChange(r)}>
          {dict.ui[r]}
        </button>
      ))}
    </div>
  )
}
