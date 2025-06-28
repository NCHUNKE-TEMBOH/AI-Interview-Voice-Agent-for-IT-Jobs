"use client"
import { Button } from "@/components/ui/button";
import { supabase } from "@/services/supabaseClient";
import { ArrowRight, BarChart3, Clock, Mic, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { useUser } from "./provider";
import HeroVideoDialog from "@/components/magicui/hero-video-dialog";

export default function Home() {
  const { user } = useUser();


  return (
    <div>
      <header className="border-b w-full">
        <div className=" px-10 flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src={'/logo2.png'} alt="logo" width={140} height={200} />
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-sm font-medium hover:underline">
              Features
            </Link>
            <Link href="#how-it-works" className="text-sm font-medium hover:underline">
              How It Works
            </Link>
            <Link href="#pricing" className="text-sm font-medium hover:underline">
              Pricing
            </Link>
            <Link href="/jobs" className="text-sm font-medium hover:underline">
              Find Jobs
            </Link>
          </nav>
          <div className="flex gap-2">
            <Link href={'/jobs'}>
              <Button variant="outline">Find Jobs</Button>
            </Link>
            <Link href={'/dashboard'}>
              <Button>Dashboard</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 items-center justify-center">
        {/* Hero Section */}
        <section className="py-20 flex items-center justify-center w-full md:py-28 bg-gradient-to-b from-blue-50 to-white">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                    AI-Powered <span className="text-primary"> Interview Assistant </span> for Modern Recruiters
                  </h1>
                  <p className="text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                    Let our AI voice agent conduct candidate interviews while you focus on finding the perfect match.
                    Save time, reduce bias, and improve your hiring process.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button size="lg" className="bg-primary hover:bg-blue-700">
                    Create Interview <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button size="lg" variant="outline">
                    Join Us
                  </Button>
                </div>
              </div>
              <div className="mx-auto lg:mx-0 relative">
                <div className="relative h-[350px] w-full overflow-hidden rounded-xl bg-gray-100 shadow-lg">
                  <div className="relative">
                    <HeroVideoDialog
                      className="block dark:hidden"
                      thumbnailSrc="/image.png"
                      thumbnailAlt="Hero Video"
                    />
                    <HeroVideoDialog
                      className="hidden dark:block"
                      thumbnailSrc="/image.png"
                      thumbnailAlt="Hero Video"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-16 md:py-24 flex items-center justify-center">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">Streamline Your Hiring Process</h2>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl/relaxed">
                  Our platform helps you save time and find better candidates with advanced AI interview technology.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3 md:gap-8 mt-12">
              <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
                <Clock className="h-12 w-12 text-primary" />
                <h3 className="text-xl font-bold">Save Time</h3>
                <p className="text-center text-gray-500">
                  Automate initial screening interviews and focus on final candidates.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
                <BarChart3 className="h-12 w-12 text-primary" />
                <h3 className="text-xl font-bold">Data-Driven Insights</h3>
                <p className="text-center text-gray-500">
                  Get detailed analytics and candidate comparisons based on interview responses.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
                <Users className="h-12 w-12 text-primary" />
                <h3 className="text-xl font-bold">Reduce Bias</h3>
                <p className="text-center text-gray-500">
                  Standardized interviews help eliminate unconscious bias in the hiring process.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="flex items-center justify-center py-16 md:py-24 bg-gray-50">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">How It Works</h2>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl/relaxed">
                  Three simple steps to transform your recruitment process
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-3 mt-12">
              <div className="flex flex-col items-center space-y-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-900">
                  <span className="text-xl font-bold">1</span>
                </div>
                <h3 className="text-xl font-bold">Create Interview</h3>
                <p className="text-center text-gray-500">
                  Set up your job requirements and customize interview questions.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-900">
                  <span className="text-xl font-bold">2</span>
                </div>
                <h3 className="text-xl font-bold">Share with Candidates</h3>
                <p className="text-center text-gray-500">
                  Send interview links to candidates to complete at their convenience.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-900">
                  <span className="text-xl font-bold">3</span>
                </div>
                <h3 className="text-xl font-bold">Review Results</h3>
                <p className="text-center text-gray-500">
                  Get AI-analyzed results, transcripts, and candidate comparisons.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 flex items-center justify-center md:py-24">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
                  Ready to Transform Your Hiring Process?
                </h2>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl/relaxed">
                  Join hundreds of companies already using our AI platform to find the best talent.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Button size="lg" className="bg-primary hover:bg-blue-700">
                  Get Started for Free
                </Button>
                <Button size="lg" variant="outline">
                  Schedule a Demo
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Image src={'/logo2.png'} alt="logo" width={120} height={40} className="brightness-0 invert" />
              </div>
              <p className="text-gray-400 text-sm">
                AI-powered interview platform helping companies find the best talent through intelligent voice interviews.
              </p>
              <div className="flex space-x-4">
                <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                  </svg>
                </Link>
                <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </Link>
                <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.746-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24c6.624 0 11.99-5.367 11.99-11.987C24.007 5.367 18.641.001 12.017.001z" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Product */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Product</h3>
              <ul className="space-y-2">
                <li><Link href="#features" className="text-gray-400 hover:text-white transition-colors text-sm">Features</Link></li>
                <li><Link href="#how-it-works" className="text-gray-400 hover:text-white transition-colors text-sm">How It Works</Link></li>
                <li><Link href="/guest" className="text-gray-400 hover:text-white transition-colors text-sm">Try Demo</Link></li>
                <li><Link href="/jobs" className="text-gray-400 hover:text-white transition-colors text-sm">Find Jobs</Link></li>
                <li><Link href="#pricing" className="text-gray-400 hover:text-white transition-colors text-sm">Pricing</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Company</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="text-gray-400 hover:text-white transition-colors text-sm">About Us</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Careers</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Blog</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Press</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Partners</Link></li>
              </ul>
            </div>

            {/* Support */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Support</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Help Center</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Contact Us</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-white transition-colors text-sm">API Documentation</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Status</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Security</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-gray-800 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <div className="text-sm text-gray-400">
                © 2025 AI Interview Assistant. All rights reserved.
              </div>
              <div className="flex space-x-6">
                <Link href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Privacy Policy</Link>
                <Link href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Terms of Service</Link>
                <Link href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Cookie Policy</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
