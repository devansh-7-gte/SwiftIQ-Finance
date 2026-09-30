import Link from "next/link";
import Image from "next/image";
import NavItems from "@/components/NavItems";
import UserDropdown from "@/components/UserDropdown";
import {searchStocks} from "@/lib/actions/finnhub.actions";

const Header = async ({ user }: { user: User }) => {
    const initialStocks = await searchStocks();

    return (
        <header className="sticky top-0 header">
            <div className="container header-wrapper">
                <Link href="/" className="flex items-center gap-2">
                    <Image src="/assets/icons/logo.svg" alt="SwiftIq Finance logo" width={32} height={32} className="h-8 w-auto cursor-pointer" />
                    <span className="text-xl font-bold tracking-tight text-white">Swift<span className="text-yellow-500">Iq</span></span>
                </Link>
                <nav className="hidden sm:block">
                    <NavItems initialStocks={initialStocks} />
                </nav>

                <UserDropdown user={user} initialStocks={initialStocks} />
            </div>
        </header>
    )
}
export default Header
