/**
 * Default email texts (ToR 4.5). Used until the admin saves a version in Admin → Emails.
 * Armenian and Russian are working drafts — final translations are supplied by the client.
 */
export type EmailKey =
  | "otp"
  | "claim"
  | "transfer_invite"
  | "transfer_sent"
  | "transfer_completed"
  | "transfer_cancelled";

type T = { subject: string; body: string };

export const EMAIL_KEYS: EmailKey[] = [
  "otp",
  "claim",
  "transfer_invite",
  "transfer_sent",
  "transfer_completed",
  "transfer_cancelled",
];

/** Variables available in each template. */
export const EMAIL_VARS: Record<EmailKey, string[]> = {
  otp: ["code"],
  claim: ["serial", "series", "link"],
  transfer_invite: ["serial", "series", "sender", "link"],
  transfer_sent: ["serial", "recipient"],
  transfer_completed: ["serial"],
  transfer_cancelled: ["serial"],
};

export const DEFAULT_EMAILS: Record<EmailKey, Record<"hy" | "en" | "ru", T>> = {
  otp: {
    en: {
      subject: "Your ONCE code: {{code}}",
      body: "Your one-time code is {{code}}.\n\nIt is valid for 10 minutes. If you didn't ask for it, you can ignore this email.\n\nONCE",
    },
    hy: {
      subject: "Ձեր ONCE կոդը՝ {{code}}",
      body: "Ձեր մեկանգամյա կոդն է՝ {{code}}։\n\nԿոդը վավեր է 10 րոպե։ Եթե դուք այն չեք պահանջել, պարզապես անտեսեք այս նամակը։\n\nONCE",
    },
    ru: {
      subject: "Ваш код ONCE: {{code}}",
      body: "Ваш одноразовый код: {{code}}.\n\nКод действует 10 минут. Если вы его не запрашивали, просто проигнорируйте это письмо.\n\nONCE",
    },
  },
  claim: {
    en: {
      subject: "Your bottle {{serial}} is registered",
      body: "Welcome to ONCE.\n\nBottle {{serial}} ({{series}}) is now registered to you. Open its digital passport:\n{{link}}\n\nONCE",
    },
    hy: {
      subject: "{{serial}} շիշը գրանցված է ձեր անունով",
      body: "Բարի գալուստ ONCE։\n\n{{serial}} ({{series}}) շիշն այժմ գրանցված է ձեր անունով։ Բացեք նրա թվային անձնագիրը՝\n{{link}}\n\nONCE",
    },
    ru: {
      subject: "Бутылка {{serial}} зарегистрирована на вас",
      body: "Добро пожаловать в ONCE.\n\nБутылка {{serial}} ({{series}}) теперь зарегистрирована на вас. Откройте её цифровой паспорт:\n{{link}}\n\nONCE",
    },
  },
  transfer_invite: {
    en: {
      subject: "A ONCE bottle has been passed to you",
      body: "{{sender}} has passed ONCE bottle {{serial}} ({{series}}) to you.\n\nAccept it here:\n{{link}}\n\nThis link works once and only with this email address.\n\nONCE",
    },
    hy: {
      subject: "Ձեզ է փոխանցվել ONCE շիշ",
      body: "{{sender}}-ը ձեզ է փոխանցել ONCE {{serial}} ({{series}}) շիշը։\n\nԸնդունեք այն այստեղ՝\n{{link}}\n\nՀղումն աշխատում է մեկ անգամ և միայն այս էլ. հասցեով։\n\nONCE",
    },
    ru: {
      subject: "Вам передана бутылка ONCE",
      body: "{{sender}} передаёт вам бутылку ONCE {{serial}} ({{series}}).\n\nПримите её по ссылке:\n{{link}}\n\nСсылка работает один раз и только с этим адресом почты.\n\nONCE",
    },
  },
  transfer_sent: {
    en: {
      subject: "Transfer of {{serial}} sent",
      body: "You passed bottle {{serial}} to {{recipient}}. The bottle is no longer in your account.\n\nONCE",
    },
    hy: {
      subject: "{{serial}} շշի փոխանցումն ուղարկված է",
      body: "Դուք {{serial}} շիշը փոխանցեցիք {{recipient}}-ին։ Շիշն այլևս ձեր հաշվում չէ։\n\nONCE",
    },
    ru: {
      subject: "Передача {{serial}} отправлена",
      body: "Вы передали бутылку {{serial}} получателю {{recipient}}. Бутылка больше не в вашем аккаунте.\n\nONCE",
    },
  },
  transfer_completed: {
    en: {
      subject: "Transfer of {{serial}} completed",
      body: "The transfer of bottle {{serial}} is complete. The bottle now belongs to its new owner.\n\nONCE",
    },
    hy: {
      subject: "{{serial}} շշի փոխանցումն ավարտված է",
      body: "{{serial}} շշի փոխանցումն ավարտված է։ Շիշն այժմ պատկանում է նոր սեփականատիրոջը։\n\nONCE",
    },
    ru: {
      subject: "Передача {{serial}} завершена",
      body: "Передача бутылки {{serial}} завершена. Бутылка принадлежит новому владельцу.\n\nONCE",
    },
  },
  transfer_cancelled: {
    en: {
      subject: "Transfer of {{serial}} cancelled",
      body: "The transfer of bottle {{serial}} was cancelled by ONCE. If you have questions, please contact us.\n\nONCE",
    },
    hy: {
      subject: "{{serial}} շշի փոխանցումը չեղարկված է",
      body: "{{serial}} շշի փոխանցումը չեղարկվել է ONCE-ի կողմից։ Հարցերի դեպքում կապվեք մեզ հետ։\n\nONCE",
    },
    ru: {
      subject: "Передача {{serial}} отменена",
      body: "Передача бутылки {{serial}} отменена командой ONCE. Если у вас есть вопросы, свяжитесь с нами.\n\nONCE",
    },
  },
};
