export const NOTICE_TEMPLATES: Record<string, { title: string; content: string; noticePeriodDays: number }> = {
  entry_notice: {
    title: 'Notice of Entry',
    content: `Dear Tenant,

This notice is to inform you that the landlord/agent intends to enter the property for the purpose of [inspection/repairs/maintenance].

Entry will occur on [DATE] between [TIME] and [TIME].

If this time is not suitable, please contact us to arrange an alternative time.

Regards,
Landlord/Agent`,
    noticePeriodDays: 1,
  },
  rent_increase: {
    title: 'Notice of Rent Increase',
    content: `Dear Tenant,

Please be advised that the rent for your property will increase as follows:

Current rent: $[CURRENT]/week
New rent: $[NEW]/week
Effective date: [DATE]

This notice is provided in accordance with the Residential Tenancies Act.

If you have any questions, please contact us.

Regards,
Landlord/Agent`,
    noticePeriodDays: 60,
  },
  termination: {
    title: 'Notice of Termination',
    content: `Dear Tenant,

This notice is to inform you that your tenancy agreement will be terminated.

Termination date: [DATE]
Reason: [REASON]

You are required to vacate the property by the termination date.

If you have any questions, please contact us.

Regards,
Landlord/Agent`,
    noticePeriodDays: 30,
  },
  breach: {
    title: 'Breach Notice',
    content: `Dear Tenant,

This notice is to inform you that you are in breach of your tenancy agreement for the following reason:

[REASON]

You are required to remedy this breach within [DAYS] days. Failure to do so may result in termination of your tenancy.

Regards,
Landlord/Agent`,
    noticePeriodDays: 14,
  },
  general: {
    title: 'General Notice',
    content: `Dear Tenant,

[MESSAGE]

Regards,
Landlord/Agent`,
    noticePeriodDays: 0,
  },
}
