// Template se ponovo montira na svaku promjenu rute u (app) grupi.
// Koristimo cistu CSS animaciju, Framer Motion nije potreban.
export default function AppTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="animate-fade-in">{children}</div>;
}
