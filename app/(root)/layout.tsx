import Header from "@/components/Header";
import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";

const DEFAULT_USER: User = {
    id: "guest_analyst",
    name: "Risk Analyst",
    email: "analyst@quant.local",
};

const Layout = async ({ children }: { children : React.ReactNode }) => {
    let user = DEFAULT_USER;

    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (session?.user) {
            user = {
                id: session.user.id,
                name: session.user.name,
                email: session.user.email,
            };
        }
    } catch {
        // Auth bypassed for development / open access
    }

    return (
        <main className="min-h-screen text-gray-400">
            <Header user={user} />

            <div className="container py-10">
                {children}
            </div>
        </main>
    );
};

export default Layout;

