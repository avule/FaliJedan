export default function AuthTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="animate-scale-in">{children}</div>;
}
