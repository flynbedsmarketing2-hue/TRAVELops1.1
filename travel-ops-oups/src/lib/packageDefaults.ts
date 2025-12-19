export const DEFAULT_RESPONSIBLE_NAME = "Benabderrahmane Amine";

export const todayISO = () => new Date().toISOString().slice(0, 10);

export const generateProductCode = () => {
  const datePart = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const randomPart = Math.random().toString(36).slice(-4).toUpperCase();
  return `PKG-${datePart}-${randomPart}`;
};
