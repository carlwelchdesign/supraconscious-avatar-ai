import { getRequestConfig } from "next-intl/server"
import { getAdminIntlMessages } from "@/lib/admin-messages"
import { readAdminLanguage } from "@/lib/language"

export default getRequestConfig(async () => {
  const locale = await readAdminLanguage()

  return {
    locale,
    messages: getAdminIntlMessages(locale),
  }
})
