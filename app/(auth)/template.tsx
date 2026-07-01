// Template za auth rute daje animaciju pri prelazu izmedju login i register.

export default function AuthTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="animate-scale-in">{children}</div>;
}
