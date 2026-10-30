import { i18n } from "@biugle/biu-i18n";
import { htmlAdapter, type BiuFrameworkAdapter } from "@biugle/biu-runtime";

const localizedHtmlAdapter: BiuFrameworkAdapter = {
  ...htmlAdapter,
  async renderPage(container, page, context) {
    const cleanup = await htmlAdapter.renderPage(container, page, context);
    const translate = () => {
      for (const element of container.querySelectorAll<HTMLElement>("[data-biu-locale]")) {
        const key = element.dataset.biuLocale;
        if (key) element.textContent = i18n.$t(key, undefined, context.locale);
      }
    };
    translate();
    const unsubscribe = i18n.subscribe(translate);
    return () => {
      unsubscribe();
      void cleanup?.();
    };
  },
};

export default localizedHtmlAdapter;
