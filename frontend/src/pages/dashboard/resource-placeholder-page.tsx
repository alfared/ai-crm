type ResourcePlaceholderPageProps = {
  title: string;
};

export function ResourcePlaceholderPage({
  title,
}: ResourcePlaceholderPageProps) {
  return (
    <section>
      <h1 className="text-3xl font-bold text-slate-900">{title}</h1>

      <p className="mt-2 text-slate-600">
        This module will be implemented soon.
      </p>
    </section>
  );
}
