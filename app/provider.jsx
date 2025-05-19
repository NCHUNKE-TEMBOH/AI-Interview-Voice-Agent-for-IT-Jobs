"use client"
import { UserDetailContext } from '@/context/UserDetailContext';
import { supabase } from '@/services/supabaseClient'
import React, { useContext, useEffect, useState } from 'react'

function Provider({ children }) {
    const [user, setUser] = useState();
    const [userType, setUserType] = useState("client");
    const [company, setCompany] = useState();

    useEffect(() => {
        // This effect should only run once on component mount
        if (typeof window !== 'undefined') {
            // Set up auth state change listener
            const { data: authListener } = supabase.auth.onAuthStateChange(
                async (event, session) => {
                    console.log("Auth state changed:", event);
                    if (event === 'SIGNED_OUT') {
                        setUser(null);
                        setCompany(null);
                        localStorage.removeItem('userType');
                        window.location.href = '/';
                    }
                }
            );

            // Clean up the listener
            return () => {
                if (authListener && authListener.subscription) {
                    authListener.subscription.unsubscribe();
                }
            };
        }
    }, []);

    // Separate effect for checking user type and authentication
    useEffect(() => {
        const checkUserAndType = async () => {
            if (typeof window !== 'undefined') {
                try {
                    // Get stored user type
                    const storedUserType = localStorage.getItem('userType');

                    // Get current auth session
                    const { data: { session } } = await supabase.auth.getSession();

                    if (!session) {
                        // Not authenticated, don't do anything else
                        return;
                    }

                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) return;

                    console.log("User is authenticated:", user.email);
                    console.log("Stored user type:", storedUserType);

                    // Set user type from localStorage if available
                    if (storedUserType) {
                        setUserType(storedUserType);
                    }

                    // Check if user exists in the appropriate table based on userType
                    if (storedUserType === "company") {
                        console.log("Checking for company account with email:", user.email);

                        try {
                            // Check if company exists
                            const { data: companyData, error } = await supabase
                                .from('Companies')
                                .select('*')
                                .eq('email', user.email)
                                .maybeSingle();

                            if (error) {
                                console.error("Error fetching company:", error);
                                // Continue with company creation instead of returning
                                console.log("Will attempt to create company despite fetch error");

                                // Create a new company record if fetch failed
                                const { data: newCompany, error: insertError } = await supabase
                                    .from('Companies')
                                    .insert([
                                        {
                                            email: user.email,
                                            name: user.user_metadata?.name || 'Company Account',
                                            picture: user.user_metadata?.picture || '',
                                            is_onboarded: false,
                                            industry_type: 'Technology',
                                            created_at: new Date().toISOString()
                                        }
                                    ])
                                    .select();

                                if (insertError) {
                                    console.error("Error creating company after fetch error:", insertError);
                                    // Set a minimal company object to prevent null references
                                    setCompany({
                                        id: 'temp-id',
                                        email: user.email,
                                        name: user.user_metadata?.name || 'Company Account',
                                        is_onboarded: false
                                    });
                                    return;
                                }

                                if (newCompany && newCompany.length > 0) {
                                    console.log("New company created after fetch error:", newCompany[0]);
                                    setCompany(newCompany[0]);
                                }
                                return;
                            }

                            if (companyData) {
                                console.log("Found existing company:", companyData);
                                setCompany(companyData);
                            } else {
                                console.log("No company found, creating new company for:", user.email);
                                // Create a new company record if it doesn't exist
                                const { data: newCompany, error: insertError } = await supabase
                                    .from('Companies')
                                    .insert([
                                        {
                                            email: user.email,
                                            name: user.user_metadata?.name || 'Company Account',
                                            picture: user.user_metadata?.picture || '',
                                            is_onboarded: false,
                                            industry_type: 'Technology',
                                            created_at: new Date().toISOString()
                                        }
                                    ])
                                    .select();

                                if (insertError) {
                                    console.error("Error creating company:", insertError);
                                    // Set a minimal company object to prevent null references
                                    setCompany({
                                        id: 'temp-id',
                                        email: user.email,
                                        name: user.user_metadata?.name || 'Company Account',
                                        is_onboarded: false
                                    });
                                    return;
                                }

                                if (newCompany && newCompany.length > 0) {
                                    console.log("New company created:", newCompany[0]);
                                    setCompany(newCompany[0]);
                                } else {
                                    console.error("No company data returned after insert");
                                    // Set a minimal company object to prevent null references
                                    setCompany({
                                        id: 'temp-id',
                                        email: user.email,
                                        name: user.user_metadata?.name || 'Company Account',
                                        is_onboarded: false
                                    });
                                }
                            }
                        } catch (companyError) {
                            console.error("Exception in company handling:", companyError);
                            // Set a minimal company object to prevent null references
                            setCompany({
                                id: 'temp-id',
                                email: user.email,
                                name: user.user_metadata?.name || 'Company Account',
                                is_onboarded: false
                            });
                        }
                    } else {
                        // Default to client user type
                        if (!storedUserType) {
                            localStorage.setItem('userType', 'client');
                            setUserType('client');
                        }

                        // Check if user exists in Users table
                        const { data: userData, error } = await supabase
                            .from('Users')
                            .select('*')
                            .eq('email', user.email)
                            .maybeSingle();

                        if (error) {
                            console.error("Error fetching user:", error);
                            return;
                        }

                        if (userData) {
                            console.log("Found existing user:", userData);
                            setUser(userData);
                        } else {
                            console.log("Creating new user for:", user.email);
                            // Create a new user record if it doesn't exist
                            const { data: newUser, error: insertError } = await supabase
                                .from('Users')
                                .insert([
                                    {
                                        name: user.user_metadata?.name || user.email,
                                        email: user.email,
                                        picture: user.user_metadata?.picture || '',
                                        credits: 10
                                    }
                                ])
                                .select();

                            if (insertError) {
                                console.error("Error creating user:", insertError);
                                return;
                            }

                            if (newUser && newUser.length > 0) {
                                console.log("New user created:", newUser[0]);
                                setUser(newUser[0]);
                            }
                        }
                    }
                } catch (error) {
                    console.error("Error in checkUserAndType:", error);
                }
            }
        };

        checkUserAndType();
    }, [userType]);

    return (
        <UserDetailContext.Provider value={{
            user,
            setUser,
            userType,
            setUserType,
            company,
            setCompany,
            isCompany: userType === "company"
        }}>
            <div>{children}</div>
        </UserDetailContext.Provider>
    )
}

export default Provider

export const useUser = () => {
    const context = useContext(UserDetailContext);
    return context;
}