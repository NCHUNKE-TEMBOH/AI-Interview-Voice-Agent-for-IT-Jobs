"use client"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { supabase } from '@/services/supabaseClient'
import { Building2, User, UserCheck } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'
import { toast } from 'sonner'

function Login() {
    const router = useRouter()
    const [userType, setUserType] = useState("client")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [isSignUp, setIsSignUp] = useState(false)

    /**
     * Used to Sign In with Google
     */
    const signInWithGoogle = async () => {
        // Store the user type in localStorage to retrieve after auth
        localStorage.setItem('userType', userType)

        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
            })

            if (error) {
                console.error('Error:', error.message)
                toast.error('Google login failed: ' + error.message)
            }
        } catch (error) {
            console.error('Exception:', error)
            toast.error('Google login failed. Please try email login instead.')
        }
    }

    /**
     * Continue as guest (for interview practice)
     */
    const continueAsGuest = () => {
        // Set guest mode in localStorage
        localStorage.setItem('userType', 'guest')
        localStorage.setItem('guestMode', 'true')

        // Redirect to guest dashboard
        router.push('/guest')
        toast.success('Welcome! You can now practice interviews as a guest.')
    }

    /**
     * Sign in with email and password
     */
    const signInWithEmail = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            // Store the user type in localStorage
            localStorage.setItem('userType', userType)

            if (isSignUp) {
                // Sign up
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                })

                if (error) {
                    toast.error('Sign up failed: ' + error.message)
                } else {
                    toast.success('Check your email for the confirmation link')
                }
            } else {
                // Sign in
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                })

                if (error) {
                    toast.error('Sign in failed: ' + error.message)
                }
            }
        } catch (error) {
            console.error('Exception:', error)
            toast.error('Authentication failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className='flex flex-col items-center justify-center h-screen relative'>
            {/* Guest Button - Top Right */}
            <div className="absolute top-4 right-4">
                <Button
                    variant="outline"
                    onClick={continueAsGuest}
                    className="flex items-center gap-2"
                >
                    <UserCheck className="h-4 w-4" />
                    Continue as Guest
                </Button>
            </div>

            <div className='flex flex-col items-center border rounded-2xl p-8 w-full max-w-md'>
                <Image src={'/logo2.png'} alt='logo'
                    width={300}
                    height={80}
                    className='w-[180px]'
                />
                <div className='flex items-center flex-col w-full'>
                    <Image src={'/login.png'} alt='login'
                        width={600}
                        height={400}
                        className='w-[400px] h-[250px] rounded-2xl'
                    />
                    <p className='text-gray-500 text-center mb-4 mt-5'>Sign in to continue</p>

                    <div className="w-full mb-4">
                        <p className="text-sm text-gray-500 mb-2 text-center">I am a:</p>
                        <ToggleGroup
                            type="single"
                            defaultValue="client"
                            value={userType}
                            onValueChange={(value) => {
                                if (value) setUserType(value);
                            }}
                            className="w-full justify-center"
                        >
                            <ToggleGroupItem value="client" className="flex-1">
                                <User className="mr-2 h-4 w-4" />
                                Job Seeker
                            </ToggleGroupItem>
                            <ToggleGroupItem value="company" className="flex-1">
                                <Building2 className="mr-2 h-4 w-4" />
                                Company
                            </ToggleGroupItem>
                        </ToggleGroup>
                    </div>

                    <Tabs defaultValue="email" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-4">
                            <TabsTrigger value="email">Email</TabsTrigger>
                            <TabsTrigger value="google">Google</TabsTrigger>
                        </TabsList>

                        <TabsContent value="email" className="space-y-4">
                            <form onSubmit={signInWithEmail} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="your@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>

                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Sign In'}
                                </Button>

                                <div className="text-center text-sm">
                                    <button
                                        type="button"
                                        className="text-primary hover:underline"
                                        onClick={() => setIsSignUp(!isSignUp)}
                                    >
                                        {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
                                    </button>
                                </div>
                            </form>
                        </TabsContent>

                        <TabsContent value="google">
                            <div className="text-center mb-4">
                                <p className="text-sm text-gray-500">
                                    Sign in with your Google account
                                </p>
                            </div>

                            <Button
                                className='w-full'
                                onClick={signInWithGoogle}
                            >
                                Login with Google
                            </Button>

                            <div className="mt-4 text-center text-sm text-gray-500">
                                <p>Note: Make sure Google authentication is enabled in your Supabase project.</p>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    )
}

export default Login