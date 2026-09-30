/**
 * Scroll to a package section and update the URL hash without reloading the page.
 * Package accordions use `id={tender.label}` on PanelAccordion.
 */
const scrollToPackageSection = (packageLabel) => {
  if (!packageLabel) {
    return;
  }

  window.requestAnimationFrame(() => {
    const target = document.getElementById(packageLabel);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    const { pathname, search } = window.location;
    window.history.replaceState(
      null,
      '',
      `${pathname}${search}#${encodeURIComponent(packageLabel)}`,
    );
  });
};

export default scrollToPackageSection;
