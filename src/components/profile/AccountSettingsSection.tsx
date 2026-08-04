import { DeleteAccountButton } from '@/components/profile/DeleteAccountButton'
import { WhatsappConsentToggle } from '@/components/profile/WhatsappConsentToggle'
import { ReminderEmailToggle } from '@/components/profile/ReminderEmailToggle'

export function AccountSettingsSection({
  consentWhatsapp,
  receiveReminderEmails,
  memberSince,
}: {
  consentWhatsapp: boolean
  receiveReminderEmails: boolean
  memberSince: string
}) {
  return (
    <div>
      <WhatsappConsentToggle initialConsent={consentWhatsapp} />
      <ReminderEmailToggle initialConsent={receiveReminderEmails} />
      <p className="font-body font-light text-[10px] text-offwhite/25 tracking-[0.08em] mb-[22px]">Cliente desde {memberSince}.</p>
      <div className="pt-[22px] border-t border-offwhite/[0.08]">
        <DeleteAccountButton />
      </div>
    </div>
  )
}
