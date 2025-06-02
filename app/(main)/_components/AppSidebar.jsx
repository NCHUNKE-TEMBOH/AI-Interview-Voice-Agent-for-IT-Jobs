"use client"
import { Button } from "@/components/ui/button"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import { CompanySideBarOptions, SideBarOptions } from "@/services/Constants"
import { BriefcaseBusiness, Plus } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useUser } from "@/app/provider"

export function AppSidebar() {
    const { isCompany } = useUser();
    const path = usePathname();

    // Use the appropriate sidebar options based on user type
    const sidebarOptions = isCompany ? CompanySideBarOptions : SideBarOptions;

    return (
        <Sidebar>
            <SidebarHeader className='flex items-center mt-5'>
                <Image src={'/logo2.png'} alt="logo" width={200}
                    height={100}
                    className="w-[150px]"
                />
                {/* Only show create button for companies */}
                {isCompany && (
                    <Link href="/company/create-job">
                        <Button className='w-full mt-5'>
                            <BriefcaseBusiness size={16} /> Create New Job
                        </Button>
                    </Link>
                )}
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarContent>
                        <SidebarMenu>
                            {sidebarOptions.map((option, index) => (
                                <SidebarMenuItem key={index} className='p-1'>
                                    <SidebarMenuButton asChild className={`p-5 ${path == option.path && 'bg-blue-50'}`}>
                                        <Link href={option.path}>
                                            <option.icon className={` ${path == option.path && 'text-primary'}`} />
                                            <span className={`text-[16px] font-medium ${path == option.path && 'text-primary'}`}>{option.name}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter />
        </Sidebar>
    )
}
