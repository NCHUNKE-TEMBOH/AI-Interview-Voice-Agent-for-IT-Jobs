import {
    BriefcaseBusinessIcon,
    Building2,
    Calendar,
    ClipboardList,
    Code2Icon,
    Component,
    FileText,
    LayoutDashboard,
    List,
    Puzzle,
    Settings,
    User2Icon,
    Users,
    WalletCards
} from "lucide-react";

export const SideBarOptions = [
    {
        name: 'Dashboard',
        icon: LayoutDashboard,
        path: '/dashboard'
    },
    {
        name: 'Find Jobs',
        icon: BriefcaseBusinessIcon,
        path: '/jobs'
    },
    {
        name: 'Scheduled Interview',
        icon: Calendar,
        path: '/scheduled-interview'
    },
    {
        name: 'All Interview',
        icon: List,
        path: '/all-interview'
    },
    {
        name: 'Billing',
        icon: WalletCards,
        path: '/billing'
    },
    {
        name: 'Settings',
        icon: Settings,
        path: '/settings'
    },
]

export const CompanySideBarOptions = [
    {
        name: 'Dashboard',
        icon: LayoutDashboard,
        path: '/company/dashboard'
    },
    {
        name: 'Jobs',
        icon: BriefcaseBusinessIcon,
        path: '/company/jobs'
    },
    {
        name: 'Submissions',
        icon: ClipboardList,
        path: '/company/submissions'
    },
    {
        name: 'Candidates',
        icon: Users,
        path: '/company/candidates'
    },
    {
        name: 'Company Profile',
        icon: Building2,
        path: '/company/profile'
    },
    {
        name: 'Settings',
        icon: Settings,
        path: '/company/settings'
    },
]

export const InterviewType = [
    {
        title: 'Technical',
        icon: Code2Icon
    },
    {
        title: 'Behavioral',
        icon: User2Icon
    },
    {
        title: 'Experience',
        icon: BriefcaseBusinessIcon
    },
    {
        title: 'Problem Solving',
        icon: Puzzle
    },
    {
        title: 'Leadership',
        icon: Component
    }
]

export const EmploymentTypes = [
    "Full-time",
    "Part-time",
    "Contract",
    "Temporary",
    "Internship",
    "Freelance"
]

export const LocationTypes = [
    "Remote",
    "On-site",
    "Hybrid"
]

export const ExperienceLevels = [
    "Entry Level",
    "Junior",
    "Mid-Level",
    "Senior",
    "Lead",
    "Manager",
    "Director",
    "Executive"
]

export const QUESTIONS_PROMPT = `You are an expert technical interviewer.
Based on the following inputs, generate a well-structured list of high-quality interview questions:

Job Title: {{jobTitle}}

Job Description: {{jobDescription}}

Interview Duration: {{duration}}

Interview Type: {{type}}

Experience Level: {{experienceLevel}}

Required Skills: {{requiredSkills}}

Company Criteria: {{companyCriteria}}

Number of Questions: {{questionCount}}

📝 Your task:

Analyze the job description to identify key responsibilities, required skills, and expected experience.

Generate a list of interview questions based on the interview duration and requested number of questions.

Adjust the number and depth of questions to match the interview duration.

Ensure the questions match the tone and structure of a real-life {{type}} interview.

Pay special attention to the company's specific criteria for the ideal candidate.

🧩 Format your response in JSON format with array list of questions.
format: interviewQuestions=[
{
 question:'',
 type:'Technical/Behavioral/Experience/Problem Solving/Leadership'
},{
...
}]

🎯 The goal is to create a structured, relevant, and time-optimized interview plan for a {{jobTitle}} role.`



export const FEEDBACK_PROMPT = `{{conversation}}
Depends on this Interview Conversation between assistant and user,
Give me feedback for user interview.

Job Title: {{jobTitle}}
Job Description: {{jobDescription}}
Required Skills: {{requiredSkills}}
Company Criteria: {{companyCriteria}}

Give me rating out of 10 for technical Skills,
Communication, Problem Solving, Experience. Also give me summary in 3 lines
about the interview and one line to let me know whether the candidate is recommended
for hire or not with a message.

Pay special attention to how well the candidate meets the company's specific criteria.

Give me response in JSON format
{
    feedback:{
        rating:{
            technicalSkills:<>,
            communication:<>,
            problemSolving:<>,
            experience:<>,
            totalRating:<>
        },
        summary:[<3 lines as array>],
        recommendation:true|false, // true means YES and False Means No
        recommendationMsg:<'one Line Msg'>,
        matchScore:<percentage match with company criteria>
    }
}
`



