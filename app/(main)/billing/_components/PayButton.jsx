import React from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useUser } from '@/app/provider'
import { supabase } from '@/services/supabaseClient'

function PayButton({ amount, credits }) {

    const { user } = useUser();

    const onPaymentSuccess = async () => {
        const { data, error } = await supabase
            .from('Users')
            .update({ credits: Number(user?.credits) + credits })
            .eq('email', user?.email)
            .select()

        toast('Credit Updated');
        window.location.reload();
    }

    return (
        <div>
            <Dialog>
                <DialogTrigger asChild>
                    <Button className="w-full">Purchase Credits</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Checkout</DialogTitle>
                        <DialogDescription>
                            You are about to purchase {credits} credits for ${amount}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-center text-lg font-medium">
                            Payment options are currently unavailable.
                        </p>
                        <p className="text-center text-sm text-gray-500 mt-2">
                            For demonstration purposes only.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button onClick={onPaymentSuccess} className="w-full">
                            Simulate Payment
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default PayButton