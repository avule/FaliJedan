// Template re-mounts on every route change inside the (app) group.
// We use a CSS fade-in animation - no Framer Motion needed.
export default function AppTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="animate-fade-in">{children}</div>;
}
