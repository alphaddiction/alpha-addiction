export default function LegalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen pt-32 pb-20 px-6 max-w-2xl mx-auto">
            <div className="prose prose-invert prose-neutral prose-sm font-light">
                {children}
            </div>
        </div>
    );
}
