import { getRequestConfig } from "next-intl/server"
import { getAdminIntlMessages } from "@/lib/admin-messages"

export default getRequestConfig(async () => {
  const locale = "en"

  return {
    locale,
    messages: getAdminIntlMessages(locale),
  }
})
