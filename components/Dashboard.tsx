'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

// Interfaces for our data
interface Role {
    id: string;
    title: string;
    company: string;
    location: string;
    salary: string;
    deadline: string;
    url: string;
    match_score?: number;
    skills: string[];
}

interface UserProfile {
    name: string;
    education: string;
    interests: string[];
    skills: string[];
    location_preference: string;
}

export default function Dashboard() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                // Fetch roles from API
                const rolesResponse = await fetch('/api/roles');
                if (!rolesResponse.ok) {
                    throw new Error('Failed to fetch roles');
                }
                const rolesData = await rolesResponse.json();
                setRoles(rolesData.roles || []);

                // Fetch profile from API (using default user - first available profile)
                const profileResponse = await fetch('/api/vibe-check');
                if (profileResponse.ok) {
                    const profileData = await profileResponse.json();
                    // Use first profile if available
                    if (profileData.profiles && profileData.profiles.length > 0) {
                        const firstProfile = profileData.profiles[0];
                        setProfile({
                            name: firstProfile.first_name,
                            education: firstProfile.predicted_grades || '',
                            interests: Array.isArray(firstProfile.interests) ? firstProfile.interests : [],
                            skills: [],
                            location_preference: ''
                        });
                    } else {
                        // Fallback to default profile
                        setProfile({
                            name: 'Alex Candidate',
                            education: 'A-Levels (Maths, Physics, CS)',
                            interests: ['Software Development', 'Data Analysis', 'FinTech'],
                            skills: ['Python', 'JavaScript', 'SQL', 'Teamwork'],
                            location_preference: 'London'
                        });
                    }
                } else {
                    // Fallback to default profile if not found in database
                    setProfile({
                        name: 'Alex Candidate',
                        education: 'A-Levels (Maths, Physics, CS)',
                        interests: ['Software Development', 'Data Analysis', 'FinTech'],
                        skills: ['Python', 'JavaScript', 'SQL', 'Teamwork'],
                        location_preference: 'London'
                    });
                }
            } catch (err) {
                console.error('Error fetching data:', err);
                setError(err instanceof Error ? err.message : 'Failed to load data');
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                    <p className="mt-4 text-gray-600">Loading apprenticeships...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center max-w-md">
                    <div className="text-6xl mb-4">⚠️</div>
                    <h2 className="text-xl font-bold mb-2">Error Loading Data</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
            {/* Navbar / Header */}
            <header className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center text-sm md:text-base">
                    <div className="font-bold text-lg text-blue-600">Scout</div>
                    <div className="flex items-center gap-3">
                        <div className="hidden sm:block text-right">
                            <p className="font-medium text-gray-900">{profile ? profile.name : 'Guest'}</p>
                            <p className="text-xs text-gray-500">{profile?.education}</p>
                        </div>
                        <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                            {profile ? profile.name.charAt(0) : 'G'}
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 py-6 sm:py-8 space-y-8">

                {/* Welcome Section */}
                <section className="space-y-2">
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">
                        Welcome back, {profile ? profile.name.split(' ')[0] : 'Student'}!
                    </h1>
                    <p className="text-gray-600">
                        We found <span className="font-semibold text-blue-600">{roles.length}</span> apprenticeship opportunities matching your profile.
                    </p>
                </section>

                {/* Filters (Visual Only for now) */}
                <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
                    {["All Roles", "Software", "Finance", "London", "Remote"].map((filter, i) => (
                        <button key={i} className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${i === 0 ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"}`}>
                            {filter}
                        </button>
                    ))}
                </div>

                {/* Roles Grid */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    {roles.map((role, idx) => (
                        <div key={idx} className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden">
                            <div className="p-5 flex flex-col h-full space-y-4">

                                {/* Card Header */}
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                                            {role.title}
                                        </h3>
                                        <p className="text-sm text-gray-500 font-medium">{role.company}</p>
                                    </div>
                                    {role.match_score && (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            {role.match_score}% Match
                                        </span>
                                    )}
                                </div>

                                {/* Details */}
                                <div className="space-y-2 text-sm text-gray-600 flex-grow">
                                    <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                        <span>{role.location}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        <span>{role.salary}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        <span>Deadline: {role.deadline}</span>
                                    </div>
                                </div>

                                {/* Skills Tags */}
                                <div className="flex flex-wrap gap-1.5 pt-2">
                                    {(role.skills || []).slice(0, 3).map((skill, ti) => (
                                        <span key={ti} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                                            {skill}
                                        </span>
                                    ))}
                                    {(role.skills || []).length > 3 && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-50 text-gray-400">
                                            +{(role.skills || []).length - 3}
                                        </span>
                                    )}
                                </div>

                            </div>

                            {/* Action Footer */}
                            <div className="bg-gray-50 px-5 py-3 border-t border-gray-100">
                                <Link
                                    href={role.url}
                                    target="_blank"
                                    className="block w-full text-center bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
                                >
                                    View Application
                                </Link>
                            </div>
                        </div>
                    ))}

                    {roles.length === 0 && (
                        <div className="col-span-full text-center py-12 text-gray-500">
                            No roles found. Please configure your Supabase database and run the migration script.
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}
