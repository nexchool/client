import i18next from "i18next";
import { initReactI18next } from "react-i18next";

// i18next.use() registers the react plugin; not the `use` named export.
// eslint-disable-next-line import/no-named-as-default-member
i18next.use(initReactI18next);

export default i18next;
