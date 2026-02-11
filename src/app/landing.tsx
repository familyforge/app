// FamilyForge Landing Page — Complete Conversion-Focused Redesign
// Emotionally-driven, high-conversion marketing page (web only)
// Inspired by entrepreneurscircle.org/genieai design patterns

import { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  useWindowDimensions,
  Platform,
  Image,
  Modal,
  TextInput,
  KeyboardAvoidingView,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  Heart,
  Shield,
  Users,
  Clock,
  Gift,
  Calendar,
  BarChart3,
  Bell,
  BookOpen,
  Star,
  Trophy,
  Mail,
  Download,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Play,
  Pause,
  Sparkles,
  Check,
  X,
  Phone,
  ArrowRight,
  Mic,
  Volume2,
  Target,
  Gamepad2,
  Brain,
  Camera,
  Zap,
  Award,
  Eye,
  TrendingUp,
  type LucideIcon,
} from "lucide-react-native";

// ============================================================
// TYPES
// ============================================================

interface FormData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
}

interface ProblemSolution {
  problemIcon: LucideIcon;
  solutionIcon: LucideIcon;
  problemLabel: string;
  problemTitle: string;
  problemDesc: string;
  solutionTitle: string;
  solutionDesc: string;
}

interface DeepDive {
  number: string;
  label: string;
  headline: string;
  headlineAccent: string;
  description: string;
  bulletPoints: string[];
  emotionalCloser: string;
  imagePlaceholder: string;
  imageDescription: string;
  imageSize: { width: number; height: number };
  audioLabel: string;
  audioSource: string;
  comingSoon?: boolean;
  icon: LucideIcon;
  iconColor: string;
}

interface FAQData {
  question: string;
  answer: string;
}

interface TestimonialData {
  quote: string;
  name: string;
  role: string;
}

interface FeatureGridItem {
  icon: LucideIcon;
  title: string;
  problem: string;
  result: string;
  relief: string;
  colors: readonly [string, string];
  comingSoon?: boolean;
}

interface VideoTestimonial {
  name: string;
  role: string;
  thumbnailColor: string;
  thumbnailUrl: string; // Image URL for the thumbnail preview
  videoUrl: string; // Direct video URL (Cloudinary, etc.) or YouTube video ID
  isYouTube?: boolean; // Set to true if videoUrl is a YouTube video ID
}

// ============================================================
// HOOKS
// ============================================================

function useDeviceDetection() {
  const [deviceInfo, setDeviceInfo] = useState({
    isMobile: false,
    isIOS: false,
    isAndroid: false,
  });

  useEffect(() => {
    if (Platform.OS === "web" && typeof navigator !== "undefined") {
      const ua = navigator.userAgent.toLowerCase();
      const isMobile =
        /mobile|android|iphone|ipad|ipod|blackberry|windows phone/i.test(ua);
      const isIOS = /iphone|ipad|ipod/i.test(ua);
      const isAndroid = /android/i.test(ua);
      setDeviceInfo({ isMobile, isIOS, isAndroid });
    }
  }, []);

  return deviceInfo;
}

function useNotificationSound() {
  const playSound = useCallback(() => {
    if (Platform.OS === "web" && typeof Audio !== "undefined") {
      const audioData =
        "data:audio/wav;base64,UklGRqoGAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YYYGAACAgICAgICAgICAgICAgICAgICAgICAgICAjYKMn5R3f114dnlwdHJ5d3p4a19vZGNfY2RhYmloaG1tcHJ2d3t9f4CFiIuPjpGQkZKVlJSZmJmZmJiampeUk5CNjY2IhomGg4B8fnh2c3BtbWtnaGZlYl5gXVldXFtaW1xcXlxfX2FgY2VkZWhnbW5wcnV5fH1/goWGiIyNjoyOkJKQkZKUnJucm5+goqKio6Sjp6ioqKepqKqqrKusra6vrq2urKurrKmqqqmnp6alpqSkpKCfnpycmpuYlZSUk5CPjIyMioiHhoSCgIB+fXt6eXh3dnR1dHR1dXZ3eXp7fH5/gIKDhoeIiYuNjo+RkpOUlZaXl5iZmpqbmpmcm5uin6Gdm5uZlZSSkJCOjIqOjIR9endzcjxvbm1ta2lnZmVkYF9fX15cXFxcXV1dXl1dXV5gYWJiYmJjZGVmZmdpamprbGxub29xcXJzdHV2d3h5ent8fX5/gIGCg4SFhoeIiYqLjI2Oj4+QkZKSkpOUlZWVlpaWl5eXl5eXl5eXlpaVlZSUk5OSkZCPj46NjIuKiYiHhoWEg4KBgH9+fXx7enl4d3Z1dHRzc3JycXFwcXFxcXJyc3N0dXZ3d3h5enp7fH1+fn+AgYKDhIWFhoaHiIiJioqLi4yMjI2Njoy=";
      try {
        const audio = new Audio(audioData);
        audio.volume = 0.3;
        audio.play().catch(() => {});
      } catch (_e) {
        // Ignore audio errors
      }
    }
  }, []);

  return { playSound };
}

// ============================================================
// DATA: PROBLEMS → SOLUTIONS
// ============================================================

const PROBLEMS: ProblemSolution[] = [
  {
    problemIcon: Eye,
    solutionIcon: Users,
    problemLabel: "Problem #1",
    problemTitle: "Your Family Is In The Same Room But A Million Miles Apart",
    problemDesc:
      "The TV is on. Everyone's on their phone. Your children are physically there — but emotionally? They're somewhere else entirely. And deep down, you know this isn't how it's supposed to be.",
    solutionTitle: "Meaningful Connection — On Autopilot",
    solutionDesc:
      "FamilyForge gives your family a reason to put the screens down. Guided activities, shared tasks, and rewards that make togetherness irresistible — not forced.",
  },
  {
    problemIcon: Zap,
    solutionIcon: Gift,
    problemLabel: "Problem #2",
    problemTitle:
      "Your Kids Hate Chores — And You're Exhausted From The Daily Battle",
    problemDesc:
      "Toys everywhere. Dishes untouched. You ask nicely, then firmly, then you're shouting — and nobody moves. It's a daily battle that leaves you drained, guilty, and exhausted.",
    solutionTitle: "Kids Actually WANT To Do Chores — Yes, Really",
    solutionDesc:
      "FamilyForge turns chores into a rewards-driven game. Kids earn points for tasks and trade them for rewards they care about. No more nagging. Just helping.",
  },
  {
    problemIcon: Heart,
    solutionIcon: Shield,
    problemLabel: "Problem #3",
    problemTitle: "Your Children Are Growing Up And The Moments Are Slipping Away",
    problemDesc:
      "They won't be young forever. Every bedtime missed, every rushed morning, every 'not now' — you feel it. The guilt is real. And the years are going faster than you ever imagined.",
    solutionTitle: "Build Unbreakable Bonds Before It's Too Late",
    solutionDesc:
      "FamilyForge helps you capture, create, and protect family moments that matter — so when you look back, you'll know you showed up. Every single day.",
  },
];

// ============================================================
// DATA: DEEP-DIVE SECTIONS
// ============================================================

const DEEP_DIVES: DeepDive[] = [
  {
    number: "#1",
    label: "FAMILY CALENDAR",
    headline: "One Family. One Calendar.",
    headlineAccent: "Everyone In Sync — Always.",
    description:
      "Sports day. Dentist appointment. Grandma's birthday. That school trip form due Friday. When schedules live in different heads, on different phones, and scribbled on different notepads — things get missed. And missed things cause stress, arguments, and guilt. FamilyForge brings your entire family onto one beautiful, shared calendar. Parents AND children see what's coming up. Everyone knows where they need to be and when.",
    bulletPoints: [
      "Shared calendar visible to all family members — parents and kids",
      "Upcoming events, appointments, and deadlines in one view",
      "Colour-coded by family member for instant clarity",
      "Never miss a school event, deadline or appointment again",
    ],
    emotionalCloser:
      "💛 Because a family that's in sync is a family that's at peace — and you deserve that calm.",
    imagePlaceholder: "image-calendar.png",
    imageDescription: "Family calendar showing colour-coded events for each member",
    imageSize: { width: 500, height: 350 },
    audioLabel: "Hear about the family calendar",
    audioSource: "/audio/feature-calendar.mp3",
    icon: Calendar,
    iconColor: "#06b6d4",
  },
  {
    number: "#2",
    label: "SHARED FAMILY ACCESS",
    headline: "Stop Parenting Alone —",
    headlineAccent: "Even If You're Doing It Solo",
    description:
      "Parenting was never meant to be a one-person job. Whether you're co-parenting, single parenting, or just wish your partner could see what needs doing — FamilyForge makes the invisible visible. Invite your co-parent, grandparent, or anyone who helps. Everyone sees the same dashboard. No more 'I didn't know' excuses.",
    bulletPoints: [
      "Invite co-parents or family members with one tap",
      "Both parents see real-time updates and task progress",
      "Share the mental load visibly — not just verbally",
      "No more duplicated effort or missed handoffs",
    ],
    emotionalCloser:
      "💛 Because parenting was never meant to be a solo mission. You deserve a teammate.",
    imagePlaceholder: "image1.png",
    imageDescription: "Two parents looking at the app together",
    imageSize: { width: 500, height: 350 },
    audioLabel: "Hear about shared family access",
    audioSource: "/audio/feature-1.mp3",
    icon: Users,
    iconColor: "#f43f5e",
  },
  {
    number: "#3",
    label: "TASKS & ROUTINES",
    headline: "End The Nagging. End The Arguments.",
    headlineAccent: "End The Exhaustion.",
    description:
      "\"Did you brush your teeth?\" \"Have you done your homework?\" \"How many times do I have to ask?\" — Sound familiar? You're not a broken record. You're a tired parent. FamilyForge takes the reminding off your plate. Assign tasks, set daily routines, and let the app do the chasing — so you don't have to.",
    bulletPoints: [
      "Assign age-appropriate tasks in seconds",
      "Daily routines children can follow themselves",
      "Visual checklists kids actually enjoy ticking off",
      "Real-time completion tracking — you'll know without asking",
    ],
    emotionalCloser:
      "💛 Because your voice was meant for \"I love you\" — not \"have you done it yet?\"",
    imagePlaceholder: "image2.png",
    imageDescription: "Child checking off tasks on their screen",
    imageSize: { width: 500, height: 350 },
    audioLabel: "Hear about tasks & routines",
    audioSource: "/audio/feature-2.mp3",
    icon: Clock,
    iconColor: "#3b82f6",
  },
  {
    number: "#4",
    label: "REWARDS SYSTEM",
    headline: "Watch Your Children's Eyes Light Up",
    headlineAccent: "When Effort Gets Recognised",
    description:
      "Kids don't lack motivation — they lack recognition. When a child sees their hard work rewarded, something magical happens. They WANT to do more. They WANT to help. They WANT to be better. FamilyForge turns daily tasks into opportunities for praise, points, and rewards that make your children feel truly seen.",
    bulletPoints: [
      "Kids earn points for every completed task",
      "Create custom rewards they'll actually love",
      "Builds intrinsic motivation over time",
      "Turns 'I don't want to' into 'can I do more?'",
    ],
    emotionalCloser:
      "💛 Because every child deserves to feel like their effort matters — and every parent deserves to see them smile.",
    imagePlaceholder: "image3.png",
    imageDescription: "Excited child receiving a reward",
    imageSize: { width: 500, height: 350 },
    audioLabel: "Hear about the rewards system",
    audioSource: "/audio/feature-3.mp3",
    icon: Gift,
    iconColor: "#ec4899",
  },
  {
    number: "#5",
    label: "SMART REMINDERS",
    headline: "Your Second Brain —",
    headlineAccent: "So Nothing Slips Through The Cracks",
    description:
      "The average parent carries 32 recurring tasks in their head at any given time. School pick-up. Medicine schedule. Swimming kit. Book fair money. Birthday party RSVP. The mental load is crushing — and invisible. FamilyForge becomes your second brain. Intelligent reminders that notify the right person at the right time.",
    bulletPoints: [
      "Automatic task reminders for kids and parents",
      "Custom timing — daily, weekly, or one-off",
      "Push notifications that actually help (not spam)",
      "Never forget a deadline, appointment, or task again",
    ],
    emotionalCloser:
      "💛 Because your brain deserves a break from carrying everything alone.",
    imagePlaceholder: "image4.png",
    imageDescription: "Parent getting a helpful notification on their phone",
    imageSize: { width: 500, height: 350 },
    audioLabel: "Hear about smart reminders",
    audioSource: "/audio/feature-4.mp3",
    icon: Bell,
    iconColor: "#f59e0b",
  },
  {
    number: "#6",
    label: "PROGRESS TRACKING",
    headline: "See Your Family Getting Stronger —",
    headlineAccent: "Week By Week",
    description:
      "How do you know if things are improving? How do you know if the routines are working? Without visibility, you're guessing. And guessing leads to doubt. FamilyForge gives you beautiful visual dashboards that show exactly how your family is growing. Streaks. Completion rates. Milestones. Real, visible progress that gives you confidence.",
    bulletPoints: [
      "Daily and weekly streak tracking",
      "Visual progress dashboards for each child",
      "Goal setting and milestone celebrations",
      "See improvement you can actually measure",
    ],
    emotionalCloser:
      "💛 Because growth you can see is growth that keeps going — and that's something to be proud of.",
    imagePlaceholder: "image5.png",
    imageDescription: "Family looking at their progress dashboard together",
    imageSize: { width: 500, height: 350 },
    audioLabel: "Hear about progress tracking",
    audioSource: "/audio/feature-5.mp3",
    icon: BarChart3,
    iconColor: "#6366f1",
  },
  {
    number: "#7",
    label: "WEEKLY REPORTS",
    headline: "Finally Know What's Actually",
    headlineAccent: "Happening In Your Family",
    description:
      "You're busy. You can't track everything manually. But you NEED to know — are the kids doing their tasks? Is the routine working? What got missed this week? FamilyForge sends you automatic weekly summaries straight to your inbox. Clear, simple, honest reports that give you the full picture — without you having to chase anyone.",
    bulletPoints: [
      "Automatic email summaries every week",
      "Task completion rates for each child",
      "Highlights, achievements, and areas to improve",
      "Actionable insights for the week ahead",
    ],
    emotionalCloser:
      "💛 Because informed parents are confident parents — and you deserve that peace of mind.",
    imagePlaceholder: "image6.png",
    imageDescription: "Parent reading their weekly report on a laptop",
    imageSize: { width: 500, height: 350 },
    audioLabel: "Hear about weekly reports",
    audioSource: "/audio/feature-6.mp3",
    icon: Trophy,
    iconColor: "#eab308",
  },
  {
    number: "#8",
    label: "FAMILY CHALLENGES",
    headline: "Turn Boring Evenings Into Adventures",
    headlineAccent: "Your Family Will Talk About For Years",
    description:
      "Same routine. Every. Single. Night. TV goes on. Everyone zones out. Another evening where nothing meaningful happened. What if there was a better way? FamilyForge's weekly family challenges are designed to create laughter, connection, and memories that last a lifetime. Fun, age-appropriate, and designed for busy families.",
    bulletPoints: [
      "New bonding challenges every single week",
      "Designed for all ages — toddlers to teens",
      "Indoor and outdoor activities",
      "Create memories your family will treasure forever",
    ],
    emotionalCloser:
      "💛 Because the best family moments don't happen by accident — they happen by design.",
    imagePlaceholder: "image7.png",
    imageDescription: "Family doing a fun challenge together and laughing",
    imageSize: { width: 500, height: 350 },
    audioLabel: "Hear about family challenges",
    audioSource: "/audio/feature-7.mp3",
    comingSoon: true,
    icon: Gamepad2,
    iconColor: "#14b8a6",
  },
  {
    number: "#9",
    label: "LEARNING GAMES",
    headline: "Learning That Feels Like Playing —",
    headlineAccent: "Tied To Their Daily Progress",
    description:
      "Screen time doesn't have to be wasted time. On the children's side of FamilyForge, kids dive into fun, engaging maths and English games that sharpen their skills whilst they play. But here's the magic — learning is tied directly to their daily routines and task progress. Complete chores, unlock learning games. Education woven into everyday life, not separated from it. Progressive difficulty that grows with them. No boring worksheets. No tears.",
    bulletPoints: [
      "Age-appropriate maths and English challenges that build confidence",
      "Learning tied to routines — education meets daily life",
      "Progressive difficulty — grows with your child",
      "Screen time parents can actually feel good about",
    ],
    emotionalCloser:
      "💛 Because education shouldn't feel like punishment — and your children deserve to love learning.",
    imagePlaceholder: "image8.png",
    imageDescription: "Child happily playing an educational game on a tablet",
    imageSize: { width: 500, height: 350 },
    audioLabel: "Hear about learning games",
    audioSource: "/audio/feature-8.mp3",
    icon: Brain,
    iconColor: "#8b5cf6",
  },
  {
    number: "#10",
    label: "MULTI-CHILD SUPPORT",
    headline: "Every Child Is Different —",
    headlineAccent: "FamilyForge Knows That",
    description:
      "Managing one child is hard enough. Managing two, three, or more? It's organised chaos — if you're lucky. Different ages, different abilities, different needs. What works for your 6-year-old won't work for your teenager. FamilyForge gives every child their own personalised dashboard, their own tasks, their own rewards, and their own progress tracking. Because every child deserves to feel individually seen — not lumped in with their siblings.",
    bulletPoints: [
      "Individual dashboards for each child — personalised to their age",
      "Separate task lists, routines, and reward goals",
      "Compare progress without competition — celebrate each child",
      "Works for families with 1 child or 10 — no limits on love",
    ],
    emotionalCloser:
      "💛 Because fair doesn't mean the same — it means giving each child exactly what they need.",
    imagePlaceholder: "image-multichild.png",
    imageDescription: "Multiple child profiles showing individual dashboards",
    imageSize: { width: 500, height: 350 },
    audioLabel: "Hear about multi-child support",
    audioSource: "/audio/feature-multichild.mp3",
    icon: Users,
    iconColor: "#8b5cf6",
  },
];

// ============================================================
// DATA: FEATURES GRID (smaller items not deep-dived)
// ============================================================

const FEATURES_GRID: FeatureGridItem[] = [
  {
    icon: Sparkles,
    title: "Quick Start",
    problem: "New apps feel overwhelming",
    result: "See value in minutes",
    relief: "No learning curve, just clarity",
    colors: ["#10b981", "#059669"] as const,
  },
  {
    icon: Shield,
    title: "Privacy Control",
    problem: "Don't trust apps with family data",
    result: "GDPR-ready, full control",
    relief: "Your family, your data — always",
    colors: ["#64748b", "#475569"] as const,
  },
  {
    icon: Mail,
    title: "Email Preferences",
    problem: "Apps spam you constantly",
    result: "Complete control over notifications",
    relief: "Only what you want, when you want",
    colors: ["#a855f7", "#9333ea"] as const,
  },
];

// ============================================================
// DATA: VIDEO TESTIMONIALS
// ============================================================

const VIDEO_TESTIMONIALS: VideoTestimonial[] = [
  { 
    name: "Rachel H.", 
    role: "Mum of 4, Bristol", 
    thumbnailColor: "#f43f5e", 
    thumbnailUrl: require("../../assets/images/testimonials/rachel-thumbnail.jpeg"),
    videoUrl: require("../../assets/videos/testimonials/rachel-video.mp4")
  },
  { 
    name: "Tom & Sarah W.", 
    role: "Parents of 2, Edinburgh", 
    thumbnailColor: "#3b82f6", 
    thumbnailUrl: require("../../assets/images/testimonials/tom-sarah-thumbnail.jpeg"),
    videoUrl: require("../../assets/videos/testimonials/tom-sarah-video.mp4")
  },
  { 
    name: "Priya K.", 
    role: "Mum of 3, Leicester", 
    thumbnailColor: "#8b5cf6", 
    thumbnailUrl: require("../../assets/images/testimonials/priya-thumbnail.jpeg"),
    videoUrl: require("../../assets/videos/testimonials/priya-video.mp4")
  },
  { 
    name: "Marcus D.", 
    role: "Dad of 2, Cardiff", 
    thumbnailColor: "#14b8a6", 
    thumbnailUrl: require("../../assets/images/testimonials/marcus-thumbnail.jpeg"),
    videoUrl: require("../../assets/videos/testimonials/marcus-video.mp4")
  },
  { 
    name: "Jenny L.", 
    role: "Mum of 3, Glasgow", 
    thumbnailColor: "#f59e0b", 
    thumbnailUrl: require("../../assets/images/testimonials/jenny-thumbnail.jpeg"),
    videoUrl: require("../../assets/videos/testimonials/jenny-video.mp4")
  },
  { 
    name: "Chris & Amina S.", 
    role: "Co-parents, Liverpool", 
    thumbnailColor: "#ec4899", 
    thumbnailUrl: require("../../assets/images/testimonials/chris-amina-thumbnail.jpeg"),
    videoUrl: require("../../assets/videos/testimonials/chris-amina-video.mp4")
  },
  { 
    name: "Emma R.", 
    role: "Mum of 2, Birmingham", 
    thumbnailColor: "#a855f7", 
    thumbnailUrl: require("../../assets/images/testimonials/emma-thumbnail.jpeg"),
    videoUrl: require("../../assets/videos/testimonials/emma-video.mp4")
  },
  { 
    name: "David & Lisa T.", 
    role: "Parents of 2, Leeds", 
    thumbnailColor: "#06b6d4", 
    thumbnailUrl: require("../../assets/images/testimonials/david-lisa-thumbnail.jpeg"),
    videoUrl: require("../../assets/videos/testimonials/david-lisa-video.mp4")
  },
  { 
    name: "Carlos M.", 
    role: "Dad of 1, Manchester", 
    thumbnailColor: "#f97316", 
    thumbnailUrl: require("../../assets/images/testimonials/carlos-thumbnail.jpeg"),
    videoUrl: require("../../assets/videos/testimonials/carlos-video.mp4")
  },
  { 
    name: "James & Claire H.", 
    role: "Parents of 3, London", 
    thumbnailColor: "#84cc16", 
    thumbnailUrl: require("../../assets/images/testimonials/james-claire-thumbnail.jpeg"),
    videoUrl: require("../../assets/videos/testimonials/james-claire-video.mp4")
  },
];

// ============================================================
// DATA: TESTIMONIALS
// ============================================================

const TESTIMONIALS: TestimonialData[] = [
  {
    quote:
      "I used to feel like I was failing every single day. FamilyForge didn't just organise our family — it gave me my confidence back as a mum. My kids actually ASK to do their tasks now. I never thought I'd see the day.",
    name: "Sarah M.",
    role: "Mum of 3, Manchester",
  },
  {
    quote:
      "As a dad who works long hours, I always felt disconnected. Now I can see exactly what's happening at home, assign tasks remotely, and actually feel like part of the team. This app changed everything for us.",
    name: "James T.",
    role: "Dad of 2, London",
  },
  {
    quote:
      "We tried reward charts, chore wheels, family meetings — nothing stuck. FamilyForge is the first thing that actually WORKS. My 8-year-old checks his tasks before I even wake up. Unreal.",
    name: "Emma R.",
    role: "Mum of 2, Birmingham",
  },
  {
    quote:
      "Co-parenting after divorce was a nightmare. Different rules at different houses. FamilyForge means we're finally on the same page — literally. The kids are happier and so are we.",
    name: "David & Lisa K.",
    role: "Co-parents, Leeds",
  },
];

// ============================================================
// DATA: FAQs
// ============================================================

const FAQS: FAQData[] = [
  {
    question: "What exactly is FamilyForge?",
    answer:
      "FamilyForge is a family management and bonding app built for busy parents. It helps you assign tasks, create routines, track progress, reward effort, and bring your whole family together — without adding to your mental load. Think of it as a parenting co-pilot that runs on autopilot.",
  },
  {
    question: "How much time does it take to set up?",
    answer:
      "Minutes. Literally. Our guided onboarding walks you through everything step by step. Most families are fully set up and running within 5 minutes. No technical knowledge needed — if you can use a phone, you can use FamilyForge.",
  },
  {
    question: "Is it suitable for all ages?",
    answer:
      "Yes! FamilyForge works for families with children of all ages — from toddlers to teenagers. Tasks, routines, and rewards automatically adapt to each child's age and ability. You set what's right for each child.",
  },
  {
    question: "What if my partner isn't interested?",
    answer:
      "That's completely fine. FamilyForge works brilliantly for solo parents too. You don't need anyone else to use it. But if your partner sees the kids voluntarily doing their tasks without being asked — trust us, they'll be asking for an invite pretty quickly.",
  },
  {
    question: "Is my family's data safe?",
    answer:
      "Your family's privacy is our absolute #1 priority. All data is encrypted, we're fully GDPR compliant, we never sell your data, and you have complete control to export or delete everything at any time. We're parents too — we'd never compromise on this.",
  },
  {
    question: "Can I try it before I commit?",
    answer:
      "Absolutely. Our Free plan gives you full access to core features with no time limit. No credit card required. No pressure. No guilt. Use it for as long as you like — upgrade when you're ready (and you will be).",
  },
  {
    question: "What devices does FamilyForge work on?",
    answer:
      "FamilyForge works on iPhone, Android, tablets, and web browsers. Your whole family can use it regardless of which devices they have. Download from the App Store or Google Play, or use it right here on the web.",
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "Yes. No contracts, no lock-ins, no cancellation fees. Cancel anytime directly from the app. We believe you'll stay because you love it — not because you're trapped. That said... families who try it tend to never leave. 😊",
  },
];

// ============================================================
// COMPONENT: Mobile Download Prompt
// ============================================================

function MobileDownloadPrompt({
  isIOS,
  isAndroid,
  onDismiss,
}: {
  isIOS: boolean;
  isAndroid: boolean;
  onDismiss: () => void;
}) {
  return (
    <View
      style={{
        position: "fixed" as any,
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        backgroundColor: "rgba(15, 10, 31, 0.98)",
        borderBottomWidth: 1,
        borderBottomColor: "rgba(139, 92, 246, 0.3)",
        shadowColor: "#8b5cf6",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          padding: 12,
          paddingTop: 16,
          gap: 12,
        }}
      >
        <Image
          source={require("../../assets/logo.png")}
          style={{ width: 48, height: 48, borderRadius: 12 }}
          resizeMode="cover"
        />
        <View style={{ flex: 1 }}>
          <Text style={{ color: "#ffffff", fontSize: 14, fontWeight: "700" }}>
            FamilyForge
          </Text>
          <Text style={{ color: "#a0a0a0", fontSize: 12 }}>
            Rewards and Growth for Kids
          </Text>
        </View>
        <Pressable
          onPress={() => router.push("/onboarding")}
          style={{
            backgroundColor: isIOS ? "#0066cc" : "#01875f",
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: 8,
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Download size={16} color="#ffffff" />
          <Text style={{ color: "#ffffff", fontWeight: "600", fontSize: 13 }}>
            {isIOS ? "App Store" : "Play Store"}
          </Text>
        </Pressable>
        <Pressable onPress={onDismiss} style={{ padding: 8 }}>
          <X size={20} color="#666666" />
        </Pressable>
      </View>
    </View>
  );
}

// ============================================================
// COMPONENT: Sticky Navigation Bar
// ============================================================

function StickyNav({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <View
      style={{
        position: "fixed" as any,
        top: 0,
        left: 0,
        right: 0,
        zIndex: 900,
        backgroundColor: "rgba(15, 10, 31, 0.92)",
        borderBottomWidth: 1,
        borderBottomColor: "rgba(139, 92, 246, 0.15)",
        backdropFilter: "blur(20px)" as any,
        WebkitBackdropFilter: "blur(20px)" as any,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 24,
          paddingVertical: 14,
          maxWidth: 1200,
          alignSelf: "center",
          width: "100%",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Image
            source={require("../../assets/logo.png")}
            style={{ width: 36, height: 36, borderRadius: 10 }}
            resizeMode="cover"
          />
          <Text style={{ fontSize: 22, fontWeight: "900", color: "#ffffff" }}>
            Family
            <Text style={{ color: "#8b5cf6" }}>Forge</Text>
          </Text>
        </View>
        <Pressable
          onPress={onGetStarted}
          style={({ pressed }) => ({
            transform: [{ scale: pressed ? 0.96 : 1 }],
          })}
        >
          <LinearGradient
            colors={["#8b5cf6", "#6366f1"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              paddingHorizontal: 22,
              paddingVertical: 11,
              borderRadius: 10,
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Text
              style={{ color: "#ffffff", fontWeight: "800", fontSize: 14 }}
            >
              GET STARTED
            </Text>
            <ChevronRight size={16} color="#ffffff" />
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

// ============================================================
// COMPONENT: Sticky Bottom Bar
// ============================================================

function StickyBottomBar({
  onCallMeBack,
  onGetStarted,
}: {
  onCallMeBack: () => void;
  onGetStarted: () => void;
}) {
  return (
    <View
      style={{
        position: "fixed" as any,
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 900,
        backgroundColor: "rgba(15, 10, 31, 0.96)",
        borderTopWidth: 1,
        borderTopColor: "rgba(139, 92, 246, 0.2)",
        paddingHorizontal: 16,
        paddingVertical: 12,
        paddingBottom: 16,
        flexDirection: "row",
        gap: 12,
      }}
    >
      <Pressable
        onPress={onCallMeBack}
        style={({ pressed }) => ({
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: pressed ? "#e2e8f0" : "#ffffff",
          paddingVertical: 14,
          borderRadius: 12,
          gap: 8,
        })}
      >
        <Phone size={18} color="#1e293b" />
        <Text style={{ color: "#1e293b", fontWeight: "800", fontSize: 15 }}>
          Call Me Back
        </Text>
      </Pressable>
      <Pressable
        onPress={onGetStarted}
        style={({ pressed }) => ({
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          borderRadius: 12,
          overflow: "hidden",
          transform: [{ scale: pressed ? 0.97 : 1 }],
        })}
      >
        <LinearGradient
          colors={["#8b5cf6", "#6366f1", "#4f46e5"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: 14,
            gap: 8,
          }}
        >
          <Text style={{ color: "#ffffff", fontWeight: "800", fontSize: 15 }}>
            Get Started
          </Text>
          <ArrowRight size={18} color="#ffffff" />
        </LinearGradient>
      </Pressable>
    </View>
  );
}

// ============================================================
// COMPONENT: Form Modal (Call Me Back + Video Gate)
// ============================================================

function FormModal({
  visible,
  onClose,
  onSubmit,
  title,
  subtitle,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: FormData) => void;
  title: string;
  subtitle: string;
}) {
  const { width } = useWindowDimensions();
  const isMobile = width < 500;
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [closing, setClosing] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      setClosing(false);
    }
  }, [visible]);

  const handleClose = useCallback(() => {
    if (Platform.OS === "web") {
      setClosing(true);
      setTimeout(() => {
        setShouldRender(false);
        setClosing(false);
        setSubmitted(false);
        setFirstName("");
        setLastName("");
        setPhone("");
        setEmail("");
        onClose();
      }, 700);
    } else {
      setSubmitted(false);
      setFirstName("");
      setLastName("");
      setPhone("");
      setEmail("");
      onClose();
    }
  }, [onClose]);

  const handleSubmit = () => {
    if (!firstName || !lastName || !phone || !email) return;
    onSubmit({ firstName, lastName, phone, email });
    setSubmitted(true);
    setTimeout(() => {
      handleClose();
    }, 2200);
  };

  if (!shouldRender && !visible) return null;

  // Web version with flip animation
  if (Platform.OS === "web") {
    return (
      <View
        style={{
          position: "absolute" as any,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
        }}
      >
        {/* Backdrop */}
        <Pressable
          onPress={handleClose}
          style={{ position: "absolute" as any, top: 0, left: 0, right: 0, bottom: 0 }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              background: "rgba(0, 0, 0, 0.75)",
              backdropFilter: "blur(8px)",
              animation: closing
                ? "fadeOutOverlay 0.7s ease forwards"
                : "fadeInOverlay 0.5s ease forwards",
            }}
          />
        </Pressable>

        {/* Form Card */}
        <View
          style={{
            position: "absolute" as any,
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: "flex-start",
            alignItems: "center",
            paddingTop: isMobile ? 40 : 80,
            paddingHorizontal: isMobile ? 16 : 20,
          }}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <div
              style={{
                transformOrigin: "top center",
                animation: closing
                  ? "flipOutToTop 0.7s ease forwards"
                  : "flipInFromTop 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards",
                width: isMobile ? "calc(100vw - 32px)" : 480,
                maxWidth: 480,
              }}
            >
              <div
                style={{
                  background: "linear-gradient(145deg, #1e1744 0%, #151030 50%, #0f0a1f 100%)",
                  borderRadius: 24,
                  border: "1px solid rgba(139, 92, 246, 0.25)",
                  boxShadow:
                    "0 25px 60px rgba(0, 0, 0, 0.5), 0 0 80px rgba(139, 92, 246, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                {/* Top shimmer bar */}
                <div
                  style={{
                    height: 3,
                    background:
                      "linear-gradient(90deg, transparent, #8b5cf6, #a78bfa, #8b5cf6, transparent)",
                    backgroundSize: "200% 100%",
                    animation: "shimmer 2s linear infinite",
                  }}
                />

                <div style={{ padding: isMobile ? "24px 20px 28px" : "32px 36px 36px" }}>
                  {/* Close button */}
                  <Pressable
                    onPress={handleClose}
                    style={{
                      position: "absolute",
                      top: isMobile ? 16 : 20,
                      right: isMobile ? 16 : 20,
                      zIndex: 10,
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: "rgba(255,255,255,0.06)",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <X size={18} color="#94a3b8" />
                  </Pressable>

                  {submitted ? (
                    <View style={{ alignItems: "center", paddingVertical: 48 }}>
                      <View
                        style={{
                          width: 72,
                          height: 72,
                          borderRadius: 36,
                          backgroundColor: "rgba(74, 222, 128, 0.15)",
                          borderWidth: 2,
                          borderColor: "rgba(74, 222, 128, 0.3)",
                          alignItems: "center",
                          justifyContent: "center",
                          marginBottom: 20,
                        }}
                      >
                        <Check size={36} color="#4ade80" />
                      </View>
                      <Text
                        style={{
                          color: "#ffffff",
                          fontSize: 24,
                          fontWeight: "900",
                          textAlign: "center",
                          letterSpacing: -0.5,
                        }}
                      >
                        You're In! ✨
                      </Text>
                      <Text
                        style={{
                          color: "#94a3b8",
                          fontSize: 15,
                          textAlign: "center",
                          marginTop: 10,
                          lineHeight: 22,
                        }}
                      >
                        We'll be in touch shortly.
                      </Text>
                    </View>
                  ) : (
                    <>
                      {/* Logo + Brand */}
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "center",
                          marginBottom: 20,
                          marginTop: 4,
                          gap: 14,
                        }}
                      >
                        <View
                          style={{
                            width: 52,
                            height: 52,
                            borderRadius: 14,
                            overflow: "hidden",
                            borderWidth: 2,
                            borderColor: "rgba(139, 92, 246, 0.4)",
                          }}
                        >
                          <Image
                            source={require("../../assets/logo.png")}
                            style={{ width: 52, height: 52 }}
                            resizeMode="cover"
                          />
                        </View>
                        <Text
                          style={{
                            fontSize: isMobile ? 22 : 26,
                            fontWeight: "900",
                            color: "#ffffff",
                            letterSpacing: -0.5,
                          }}
                        >
                          Family
                          <Text style={{ color: "#8b5cf6" }}>Forge</Text>
                        </Text>
                      </View>

                      {/* Title */}
                      <Text
                        style={{
                          fontSize: isMobile ? 22 : 26,
                          fontWeight: "900",
                          color: "#ffffff",
                          textAlign: "center",
                          marginBottom: 6,
                          letterSpacing: -0.5,
                        }}
                      >
                        {title}
                      </Text>
                      <Text
                        style={{
                          fontSize: isMobile ? 13 : 14,
                          color: "#94a3b8",
                          textAlign: "center",
                          marginBottom: isMobile ? 24 : 28,
                          lineHeight: 20,
                        }}
                      >
                        {subtitle}
                      </Text>

                      {/* Name Row */}
                      <View
                        style={{
                          flexDirection: isMobile ? "column" : "row",
                          gap: 10,
                          marginBottom: 10,
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              color: "#a78bfa",
                              fontSize: 11,
                              fontWeight: "700",
                              letterSpacing: 0.8,
                              marginBottom: 6,
                              textTransform: "uppercase",
                            }}
                          >
                            First Name
                          </Text>
                          <TextInput
                            placeholder="John"
                            value={firstName}
                            onChangeText={setFirstName}
                            style={{
                              borderWidth: 1.5,
                              borderColor: "rgba(139, 92, 246, 0.2)",
                              borderRadius: 14,
                              paddingHorizontal: 16,
                              paddingVertical: isMobile ? 14 : 15,
                              fontSize: 15,
                              color: "#ffffff",
                              backgroundColor: "rgba(15, 10, 31, 0.7)",
                            }}
                            placeholderTextColor="#475569"
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              color: "#a78bfa",
                              fontSize: 11,
                              fontWeight: "700",
                              letterSpacing: 0.8,
                              marginBottom: 6,
                              textTransform: "uppercase",
                            }}
                          >
                            Last Name
                          </Text>
                          <TextInput
                            placeholder="Smith"
                            value={lastName}
                            onChangeText={setLastName}
                            style={{
                              borderWidth: 1.5,
                              borderColor: "rgba(139, 92, 246, 0.2)",
                              borderRadius: 14,
                              paddingHorizontal: 16,
                              paddingVertical: isMobile ? 14 : 15,
                              fontSize: 15,
                              color: "#ffffff",
                              backgroundColor: "rgba(15, 10, 31, 0.7)",
                            }}
                            placeholderTextColor="#475569"
                          />
                        </View>
                      </View>

                      {/* Email */}
                      <View style={{ marginBottom: 10 }}>
                        <Text
                          style={{
                            color: "#a78bfa",
                            fontSize: 11,
                            fontWeight: "700",
                            letterSpacing: 0.8,
                            marginBottom: 6,
                            textTransform: "uppercase",
                          }}
                        >
                          Email Address
                        </Text>
                        <TextInput
                          placeholder="you@example.com"
                          value={email}
                          onChangeText={setEmail}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          style={{
                            borderWidth: 1.5,
                            borderColor: "rgba(139, 92, 246, 0.2)",
                            borderRadius: 14,
                            paddingHorizontal: 16,
                            paddingVertical: isMobile ? 14 : 15,
                            fontSize: 15,
                            color: "#ffffff",
                            backgroundColor: "rgba(15, 10, 31, 0.7)",
                          }}
                          placeholderTextColor="#475569"
                        />
                      </View>

                      {/* Phone */}
                      <View style={{ marginBottom: isMobile ? 24 : 28 }}>
                        <Text
                          style={{
                            color: "#a78bfa",
                            fontSize: 11,
                            fontWeight: "700",
                            letterSpacing: 0.8,
                            marginBottom: 6,
                            textTransform: "uppercase",
                          }}
                        >
                          Phone Number
                        </Text>
                        <TextInput
                          placeholder="+44 7XXX XXXXXX"
                          value={phone}
                          onChangeText={setPhone}
                          keyboardType="phone-pad"
                          style={{
                            borderWidth: 1.5,
                            borderColor: "rgba(139, 92, 246, 0.2)",
                            borderRadius: 14,
                            paddingHorizontal: 16,
                            paddingVertical: isMobile ? 14 : 15,
                            fontSize: 15,
                            color: "#ffffff",
                            backgroundColor: "rgba(15, 10, 31, 0.7)",
                          }}
                          placeholderTextColor="#475569"
                        />
                      </View>

                      {/* Submit Button */}
                      <Pressable
                        onPress={handleSubmit}
                        style={({ pressed }) => ({
                          transform: [{ scale: pressed ? 0.97 : 1 }],
                        })}
                      >
                        <LinearGradient
                          colors={["#8b5cf6", "#7c3aed", "#6d28d9"]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={{
                            paddingVertical: isMobile ? 16 : 18,
                            borderRadius: 14,
                            alignItems: "center",
                          }}
                        >
                          <Text
                            style={{
                              color: "#fff",
                              fontWeight: "900",
                              fontSize: isMobile ? 15 : 17,
                              letterSpacing: 1.5,
                            }}
                          >
                            CONTINUE →
                          </Text>
                        </LinearGradient>
                      </Pressable>

                      {/* Trust line */}
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "center",
                          marginTop: 16,
                          gap: 6,
                        }}
                      >
                        <Shield size={13} color="#4ade80" />
                        <Text
                          style={{
                            color: "#64748b",
                            fontSize: 11,
                            letterSpacing: 0.3,
                          }}
                        >
                          We respect your privacy. No spam, ever.
                        </Text>
                      </View>
                    </>
                  )}
                </div>
              </div>
            </div>
          </Pressable>
        </View>
      </View>
    );
  }

  // Native fallback (iOS / Android)
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <Pressable
        onPress={handleClose}
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.75)",
          justifyContent: "flex-start",
          alignItems: "center",
          paddingTop: 60,
          paddingHorizontal: 16,
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ width: "100%", maxWidth: 440 }}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <LinearGradient
              colors={["#1e1744", "#151030", "#0f0a1f"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={{
                borderRadius: 24,
                padding: 24,
                borderWidth: 1,
                borderColor: "rgba(139, 92, 246, 0.25)",
              }}
            >
              <Pressable
                onPress={handleClose}
                style={{ position: "absolute", top: 16, right: 16, zIndex: 10 }}
              >
                <X size={18} color="#94a3b8" />
              </Pressable>

              {submitted ? (
                <View style={{ alignItems: "center", paddingVertical: 48 }}>
                  <View
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: 36,
                      backgroundColor: "rgba(74, 222, 128, 0.15)",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 20,
                    }}
                  >
                    <Check size={36} color="#4ade80" />
                  </View>
                  <Text style={{ color: "#ffffff", fontSize: 24, fontWeight: "900", textAlign: "center" }}>
                    You're In! ✨
                  </Text>
                  <Text style={{ color: "#94a3b8", fontSize: 15, textAlign: "center", marginTop: 10 }}>
                    We'll be in touch shortly.
                  </Text>
                </View>
              ) : (
                <>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 20, marginTop: 8, gap: 12 }}>
                    <Image
                      source={require("../../assets/logo.png")}
                      style={{ width: 52, height: 52, borderRadius: 14 }}
                      resizeMode="cover"
                    />
                    <Text style={{ fontSize: 22, fontWeight: "900", color: "#ffffff" }}>
                      Family<Text style={{ color: "#8b5cf6" }}>Forge</Text>
                    </Text>
                  </View>
                  <Text style={{ fontSize: 22, fontWeight: "900", color: "#ffffff", textAlign: "center", marginBottom: 6 }}>
                    {title}
                  </Text>
                  <Text style={{ fontSize: 13, color: "#94a3b8", textAlign: "center", marginBottom: 24 }}>
                    {subtitle}
                  </Text>

                  <View style={{ gap: 10, marginBottom: 10 }}>
                    <View style={{ flexDirection: "row", gap: 10 }}>
                      <TextInput
                        placeholder="First Name"
                        value={firstName}
                        onChangeText={setFirstName}
                        style={{ flex: 1, borderWidth: 1.5, borderColor: "rgba(139,92,246,0.2)", borderRadius: 14, padding: 14, fontSize: 15, color: "#fff", backgroundColor: "rgba(15,10,31,0.7)" }}
                        placeholderTextColor="#475569"
                      />
                      <TextInput
                        placeholder="Last Name"
                        value={lastName}
                        onChangeText={setLastName}
                        style={{ flex: 1, borderWidth: 1.5, borderColor: "rgba(139,92,246,0.2)", borderRadius: 14, padding: 14, fontSize: 15, color: "#fff", backgroundColor: "rgba(15,10,31,0.7)" }}
                        placeholderTextColor="#475569"
                      />
                    </View>
                    <TextInput
                      placeholder="Email Address"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      style={{ borderWidth: 1.5, borderColor: "rgba(139,92,246,0.2)", borderRadius: 14, padding: 14, fontSize: 15, color: "#fff", backgroundColor: "rgba(15,10,31,0.7)" }}
                      placeholderTextColor="#475569"
                    />
                    <TextInput
                      placeholder="Phone Number"
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                      style={{ borderWidth: 1.5, borderColor: "rgba(139,92,246,0.2)", borderRadius: 14, padding: 14, fontSize: 15, color: "#fff", backgroundColor: "rgba(15,10,31,0.7)", marginBottom: 14 }}
                      placeholderTextColor="#475569"
                    />
                  </View>

                  <Pressable onPress={handleSubmit} style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.97 : 1 }] })}>
                    <LinearGradient
                      colors={["#8b5cf6", "#7c3aed", "#6d28d9"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{ paddingVertical: 16, borderRadius: 14, alignItems: "center" }}
                    >
                      <Text style={{ color: "#fff", fontWeight: "900", fontSize: 15, letterSpacing: 1.5 }}>
                        CONTINUE →
                      </Text>
                    </LinearGradient>
                  </Pressable>

                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 16, gap: 6 }}>
                    <Shield size={13} color="#4ade80" />
                    <Text style={{ color: "#64748b", fontSize: 11 }}>
                      We respect your privacy. No spam, ever.
                    </Text>
                  </View>
                </>
              )}
            </LinearGradient>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

// ============================================================
// COMPONENT: Listen To Audio Bar
// ============================================================

function ListenToAudio({
  label,
  audioSource,
}: {
  label: string;
  audioSource: string;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = () => {
    if (Platform.OS === "web" && typeof Audio !== "undefined") {
      if (!audioRef.current) {
        audioRef.current = new Audio(audioSource);
        audioRef.current.onended = () => setIsPlaying(false);
        audioRef.current.onerror = () => setIsPlaying(false);
      }
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().catch(() => setIsPlaying(false));
        setIsPlaying(true);
      }
    }
  };

  return (
    <Pressable
      onPress={togglePlay}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: pressed
          ? "rgba(139, 92, 246, 0.2)"
          : "rgba(139, 92, 246, 0.1)",
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 14,
        gap: 12,
        alignSelf: "center",
        maxWidth: 500,
        width: "100%",
        borderWidth: 1,
        borderColor: "rgba(139, 92, 246, 0.2)",
      })}
    >
      <LinearGradient
        colors={["#8b5cf6", "#6366f1"]}
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Mic size={20} color="#fff" />
      </LinearGradient>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: "800", color: "#ffffff" }}>
          🎧 {isPlaying ? "PLAYING..." : "LISTEN"}
        </Text>
        <Text style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
          {label}
        </Text>
      </View>
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: isPlaying
            ? "rgba(239, 68, 68, 0.2)"
            : "rgba(139, 92, 246, 0.2)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {isPlaying ? (
          <Pause size={16} color="#ef4444" />
        ) : (
          <Play size={16} color="#8b5cf6" />
        )}
      </View>
    </Pressable>
  );
}

// ============================================================
// COMPONENT: Glow Text
// ============================================================

function GlowText({
  children,
  style,
  glow = true,
}: {
  children: React.ReactNode;
  style?: any;
  glow?: boolean;
}) {
  return (
    <Text
      style={[
        {
          textShadowColor: glow ? "rgba(139, 92, 246, 0.5)" : "transparent",
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: glow ? 20 : 0,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

// ============================================================
// COMPONENT: Gradient Button
// ============================================================

function GradientButton({
  onPress,
  children,
  size = "large",
}: {
  onPress: () => void;
  children: React.ReactNode;
  size?: "small" | "large";
}) {
  const isLarge = size === "large";
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        transform: [{ scale: pressed ? 0.97 : 1 }],
        shadowColor: "#8b5cf6",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 24,
        elevation: 12,
      })}
    >
      <LinearGradient
        colors={["#8b5cf6", "#6366f1", "#4f46e5"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingVertical: isLarge ? 18 : 14,
          paddingHorizontal: isLarge ? 48 : 32,
          borderRadius: isLarge ? 16 : 12,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
        }}
      >
        <Text
          style={{
            color: "#ffffff",
            fontSize: isLarge ? 18 : 15,
            fontWeight: "800",
            letterSpacing: 0.5,
          }}
        >
          {children}
        </Text>
        <ChevronRight size={isLarge ? 22 : 18} color="#ffffff" />
      </LinearGradient>
    </Pressable>
  );
}

// ============================================================
// COMPONENT: Stats Bar
// ============================================================

function StatsBar({ isWide }: { isWide: boolean }) {
  const stats = [
    { value: "10,000+", label: "Families" },
    { value: "37 mins", label: "Extra quality time / day" },
    { value: "500K+", label: "Tasks completed" },
    { value: "98%", label: "Parents recommend us" },
  ];

  return (
    <View
      style={{
        backgroundColor: "rgba(139, 92, 246, 0.08)",
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: "rgba(139, 92, 246, 0.15)",
        paddingVertical: 32,
        paddingHorizontal: 20,
      }}
    >
      <View
        style={{
          flexDirection: isWide ? "row" : "row",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: isWide ? 60 : 20,
          maxWidth: 1000,
          alignSelf: "center",
        }}
      >
        {stats.map((stat, i) => (
          <View
            key={i}
            style={{
              alignItems: "center",
              minWidth: isWide ? undefined : "40%",
              paddingVertical: isWide ? 0 : 8,
            }}
          >
            <Text
              style={{
                color: "#8b5cf6",
                fontSize: isWide ? 36 : 28,
                fontWeight: "900",
              }}
            >
              {stat.value}
            </Text>
            <Text
              style={{
                color: "#94a3b8",
                fontSize: 13,
                fontWeight: "600",
                marginTop: 4,
              }}
            >
              {stat.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ============================================================
// COMPONENT: Feature Grid Card
// ============================================================

function FeatureGridCard({
  feature,
  index,
}: {
  feature: FeatureGridItem;
  index: number;
}) {
  const Icon = feature.icon;
  const accentColors = [
    { bg: "#10b981", text: "#10b981" },
    { bg: "#8b5cf6", text: "#8b5cf6" },
    { bg: "#eab308", text: "#eab308" },
  ];
  const accent = accentColors[index % 3];

  return (
    <View
      style={{
        backgroundColor: "rgba(30, 25, 50, 0.6)",
        borderRadius: 20,
        padding: 24,
        borderWidth: 1,
        borderColor: feature.comingSoon
          ? "rgba(245, 158, 11, 0.3)"
          : "rgba(139, 92, 246, 0.2)",
        minWidth: 280,
        maxWidth: 340,
        flex: 1,
      }}
    >
      {/* Number Badge */}
      <View
        style={{
          position: "absolute",
          top: -12,
          left: 20,
          backgroundColor: feature.comingSoon ? "#f59e0b" : accent.bg,
          paddingHorizontal: feature.comingSoon ? 12 : 0,
          height: 28,
          minWidth: 28,
          borderRadius: 14,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text
          style={{
            color: "#ffffff",
            fontSize: feature.comingSoon ? 10 : 13,
            fontWeight: "800",
            letterSpacing: feature.comingSoon ? 1 : 0,
          }}
        >
          {feature.comingSoon ? "COMING SOON" : `${index + 1}`}
        </Text>
      </View>

      {/* Icon and Title */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          marginTop: 8,
        }}
      >
        <LinearGradient
          colors={feature.colors}
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={22} color="#ffffff" />
        </LinearGradient>
        <Text style={{ color: "#ffffff", fontSize: 17, fontWeight: "700", flex: 1 }}>
          {feature.title}
        </Text>
      </View>

      {/* Problem → Result → Relief */}
      <View style={{ marginTop: 16, gap: 10 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            gap: 10,
          }}
        >
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: "#f87171",
              marginTop: 6,
            }}
          />
          <Text style={{ color: "#94a3b8", fontSize: 14, flex: 1 }}>
            {feature.problem}
          </Text>
        </View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            gap: 10,
          }}
        >
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: "#4ade80",
              marginTop: 6,
            }}
          />
          <Text style={{ color: "#e2e8f0", fontSize: 14, flex: 1 }}>
            {feature.result}
          </Text>
        </View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            gap: 10,
          }}
        >
          <Check
            size={16}
            color={feature.comingSoon ? "#f59e0b" : accent.text}
            style={{ marginTop: 2 }}
          />
          <Text
            style={{
              color: feature.comingSoon ? "#f59e0b" : accent.text,
              fontSize: 14,
              fontWeight: "600",
              flex: 1,
            }}
          >
            {feature.relief}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ============================================================
// COMPONENT: Deep-Dive Section Item
// ============================================================

function DeepDiveItem({
  item,
  index,
  isWide,
  onGetStarted,
}: {
  item: DeepDive;
  index: number;
  isWide: boolean;
  onGetStarted: () => void;
}) {
  const isReversed = index % 2 === 1;
  const Icon = item.icon;

  return (
    <View
      style={{
        paddingHorizontal: isWide ? 60 : 24,
        paddingVertical: 50,
        backgroundColor:
          index % 2 === 0 ? "rgba(30, 25, 50, 0.2)" : "transparent",
      }}
    >
      <View
        style={{
          flexDirection: isWide
            ? isReversed
              ? "row-reverse"
              : "row"
            : "column",
          gap: isWide ? 60 : 32,
          maxWidth: 1100,
          alignSelf: "center",
          width: "100%",
          alignItems: "center",
        }}
      >
        {/* Image Placeholder */}
        <View
          style={{
            flex: isWide ? 1 : undefined,
            width: isWide ? undefined : "100%",
            maxWidth: item.imageSize.width,
            aspectRatio: item.imageSize.width / item.imageSize.height,
            backgroundColor: "rgba(30, 25, 50, 0.5)",
            borderRadius: 20,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 2,
            borderColor: "rgba(139, 92, 246, 0.2)",
            borderStyle: "dashed",
          }}
        >
          <Camera size={36} color="#64748b" />
          <Text
            style={{
              color: "#8b5cf6",
              fontSize: 14,
              fontWeight: "700",
              marginTop: 8,
            }}
          >
            {item.imagePlaceholder}
          </Text>
          <Text style={{ color: "#64748b", fontSize: 11, marginTop: 4 }}>
            {item.imageSize.width} × {item.imageSize.height}
          </Text>
          <Text
            style={{
              color: "#475569",
              fontSize: 10,
              marginTop: 4,
              fontStyle: "italic",
              textAlign: "center",
              paddingHorizontal: 20,
            }}
          >
            {item.imageDescription}
          </Text>
        </View>

        {/* Content */}
        <View
          style={{ flex: isWide ? 1 : undefined, width: isWide ? undefined : "100%" }}
        >
          {/* Label */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              marginBottom: 12,
            }}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: `${item.iconColor}22`,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon size={20} color={item.iconColor} />
            </View>
            <Text
              style={{
                color: item.iconColor,
                fontWeight: "900",
                fontSize: 13,
                letterSpacing: 1.5,
              }}
            >
              {item.number}: {item.label}
            </Text>
            {item.comingSoon && (
              <View
                style={{
                  backgroundColor: "#f59e0b",
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 8,
                }}
              >
                <Text
                  style={{
                    color: "#ffffff",
                    fontSize: 10,
                    fontWeight: "900",
                    letterSpacing: 1,
                  }}
                >
                  COMING SOON
                </Text>
              </View>
            )}
          </View>

          {/* Headline */}
          <GlowText
            style={{
              fontSize: isWide ? 30 : 24,
              fontWeight: "900",
              color: "#ffffff",
              lineHeight: isWide ? 38 : 32,
              marginBottom: 16,
            }}
          >
            {item.headline}{" "}
            <Text style={{ color: "#8b5cf6" }}>{item.headlineAccent}</Text>
          </GlowText>

          {/* Description */}
          <Text
            style={{
              fontSize: 16,
              color: "#cbd5e1",
              lineHeight: 26,
              marginBottom: 20,
            }}
          >
            {item.description}
          </Text>

          {/* Bullet Points */}
          {item.bulletPoints.map((point, i) => (
            <View
              key={i}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                marginBottom: 10,
              }}
            >
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  backgroundColor: "rgba(74, 222, 128, 0.15)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Check size={13} color="#4ade80" strokeWidth={3} />
              </View>
              <Text
                style={{ fontSize: 15, color: "#e2e8f0", fontWeight: "600" }}
              >
                {point}
              </Text>
            </View>
          ))}

          {/* Emotional Closer */}
          <View
            style={{
              backgroundColor: "rgba(139, 92, 246, 0.08)",
              borderLeftWidth: 3,
              borderLeftColor: "#8b5cf6",
              padding: 16,
              borderRadius: 8,
              marginTop: 16,
            }}
          >
            <Text
              style={{
                color: "#cbd5e1",
                fontSize: 14,
                fontStyle: "italic",
                lineHeight: 22,
              }}
            >
              {item.emotionalCloser}
            </Text>
          </View>

          {/* Audio Bar */}
          <View style={{ marginTop: 20 }}>
            <ListenToAudio
              label={item.audioLabel}
              audioSource={item.audioSource}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

// ============================================================
// COMPONENT: Mid-Page CTA Strip
// ============================================================

function MidPageCTA({
  text,
  onGetStarted,
}: {
  text: string;
  onGetStarted: () => void;
}) {
  return (
    <LinearGradient
      colors={["#8b5cf6", "#6366f1"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={{
        paddingVertical: 40,
        paddingHorizontal: 24,
        alignItems: "center",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          marginBottom: 12,
        }}
      >
        <Star size={20} color="#fbbf24" fill="#fbbf24" />
        <Star size={20} color="#fbbf24" fill="#fbbf24" />
        <Star size={20} color="#fbbf24" fill="#fbbf24" />
      </View>
      <Text
        style={{
          color: "#ffffff",
          fontSize: 22,
          fontWeight: "900",
          textAlign: "center",
          marginBottom: 20,
          maxWidth: 500,
        }}
      >
        {text}
      </Text>
      {/* HIGH CONTRAST white button on purple background */}
      <Pressable
        onPress={onGetStarted}
        style={({ pressed }) => ({
          backgroundColor: pressed ? "#e2e8f0" : "#ffffff",
          paddingVertical: 18,
          paddingHorizontal: 48,
          borderRadius: 16,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          transform: [{ scale: pressed ? 0.97 : 1 }],
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.3,
          shadowRadius: 24,
          elevation: 12,
        })}
      >
        <Text
          style={{
            color: "#4f46e5",
            fontSize: 18,
            fontWeight: "900",
            letterSpacing: 0.5,
          }}
        >
          Get Started
        </Text>
        <ArrowRight size={22} color="#4f46e5" />
      </Pressable>
    </LinearGradient>
  );
}

// ============================================================
// COMPONENT: Video Testimonial Carousel
// ============================================================

function VideoTestimonialCarousel({ isWide }: { isWide: boolean }) {
  const scrollRef = useRef<ScrollView>(null);
  const scrollX = useRef(0);
  const cardWidth = isWide ? 220 : 180;
  const cardGap = 16;
  const totalWidth = VIDEO_TESTIMONIALS.length * (cardWidth + cardGap);
  const [activeVideo, setActiveVideo] = useState<VideoTestimonial | null>(null);
  const [modalClosing, setModalClosing] = useState(false);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    if (activeVideo) return; // pause scrolling while video modal is open
    const interval = setInterval(() => {
      scrollX.current += 1;
      if (scrollX.current >= totalWidth) {
        scrollX.current = 0;
      }
      scrollRef.current?.scrollTo({ x: scrollX.current, animated: false });
    }, 30);
    return () => clearInterval(interval);
  }, [totalWidth, activeVideo]);

  const duplicatedItems = [
    ...VIDEO_TESTIMONIALS,
    ...VIDEO_TESTIMONIALS,
    ...VIDEO_TESTIMONIALS,
  ];

  const openVideo = (item: VideoTestimonial) => {
    setModalClosing(false);
    setActiveVideo(item);
  };

  const closeVideo = () => {
    setModalClosing(true);
    setTimeout(() => {
      setActiveVideo(null);
      setModalClosing(false);
    }, 350);
  };

  return (
    <View
      style={{
        paddingVertical: 60,
        backgroundColor: "rgba(30, 25, 50, 0.3)",
      }}
    >
      <View style={{ alignItems: "center", marginBottom: 40 }}>
        <Text
          style={{
            color: "#fbbf24",
            fontSize: 13,
            fontWeight: "600",
            letterSpacing: 2,
            textTransform: "uppercase",
            marginBottom: 16,
          }}
        >
          Real Families. Real Stories.
        </Text>
        <GlowText
          style={{
            color: "#ffffff",
            fontSize: isWide ? 36 : 28,
            fontWeight: "900",
            textAlign: "center",
          }}
        >
          Watch Parents{" "}
          <Text style={{ color: "#8b5cf6" }}>Share Their Journey</Text>
        </GlowText>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        style={{ flexGrow: 0 }}
        contentContainerStyle={{ paddingHorizontal: 24, gap: cardGap }}
      >
        {duplicatedItems.map((item, index) => (
          <Pressable
            key={index}
            onPress={() => openVideo(item)}
            style={({ pressed }) => ({
              width: cardWidth,
              aspectRatio: 9 / 16,
              borderRadius: 20,
              overflow: "hidden",
              borderWidth: 2,
              borderColor: "rgba(139, 92, 246, 0.3)",
              transform: [{ scale: pressed ? 0.97 : 1 }],
            })}
          >
            {/* Thumbnail Image */}
            <Image
              source={item.thumbnailUrl}
              style={{
                position: "absolute",
                width: "100%",
                height: "100%",
              }}
              resizeMode="cover"
            />
            {/* Dark overlay */}
            <LinearGradient
              colors={[
                "rgba(0, 0, 0, 0.1)",
                "rgba(0, 0, 0, 0.5)",
              ]}
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                padding: 16,
              }}
            >
              {/* Play button */}
              <View
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  backgroundColor: "rgba(255, 255, 255, 0.9)",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                  borderWidth: 2,
                  borderColor: "rgba(255, 255, 255, 1)",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                }}
              >
                <Play size={24} color={item.thumbnailColor} fill={item.thumbnailColor} />
              </View>
              <View
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: 16,
                }}
              >
                <LinearGradient
                  colors={["transparent", "rgba(0,0,0,0.8)"]}
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 80,
                  }}
                />
                <Text style={{ color: "#ffffff", fontSize: 14, fontWeight: "800" }}>
                  {item.name}
                </Text>
                <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, marginTop: 2 }}>
                  {item.role}
                </Text>
              </View>
            </LinearGradient>
          </Pressable>
        ))}
      </ScrollView>

      {/* Full Portrait Video Modal */}
      {activeVideo && Platform.OS === "web" && (
        <View
          style={{
            position: "absolute" as any,
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
          }}
        >
          <Pressable
            onPress={closeVideo}
            style={{ position: "absolute" as any, top: 0, left: 0, right: 0, bottom: 0 }}
          >
            <div
              style={{
                width: "100%",
                height: "100%",
                background: "rgba(0, 0, 0, 0.85)",
                backdropFilter: "blur(12px)",
                animation: modalClosing
                  ? "fadeOutOverlay 0.35s ease forwards"
                  : "fadeInOverlay 0.3s ease forwards",
              }}
            />
          </Pressable>

          <View
            style={{
              position: "absolute" as any,
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Pressable onPress={(e) => e.stopPropagation()}>
              <div
                style={{
                  animation: modalClosing
                    ? "fadeOutOverlay 0.35s ease forwards"
                    : "fadeInOverlay 0.4s ease forwards",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                {/* Close button */}
                <Pressable
                  onPress={closeVideo}
                  style={{
                    position: "absolute",
                    top: -48,
                    right: 0,
                    zIndex: 10,
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: "rgba(255,255,255,0.1)",
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.2)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <X size={20} color="#ffffff" />
                </Pressable>

                {/* Video container - portrait 9:16 (medium size) */}
                <div
                  style={{
                    width: isWide ? 280 : "calc(100vw - 80px)",
                    maxWidth: 300,
                    aspectRatio: "9/16",
                    borderRadius: 24,
                    overflow: "hidden",
                    border: `2px solid ${activeVideo.thumbnailColor}60`,
                    boxShadow: `0 0 60px ${activeVideo.thumbnailColor}30, 0 25px 50px rgba(0,0,0,0.5)`,
                    background: "#000",
                  }}
                >
                  {activeVideo.isYouTube ? (
                    // YouTube iframe
                    <iframe
                      src={`https://www.youtube.com/embed/${activeVideo.videoUrl}?autoplay=1&rel=0&modestbranding=1`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      style={{
                        width: "100%",
                        height: "100%",
                        border: "none",
                      }}
                    />
                  ) : (
                    // Direct video (Cloudinary, etc.)
                    /* @ts-ignore */
                    <video
                      src={activeVideo.videoUrl}
                      poster={activeVideo.thumbnailUrl}
                      autoPlay
                      controls
                      playsInline
                      onEnded={closeVideo}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  )}
                </div>

                {/* Name badge below video */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginTop: 16,
                    gap: 8,
                  }}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: activeVideo.thumbnailColor + "30",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ fontSize: 16 }}>
                      {activeVideo.name.charAt(0)}
                    </Text>
                  </View>
                  <View>
                    <Text
                      style={{
                        color: "#ffffff",
                        fontSize: 15,
                        fontWeight: "800",
                      }}
                    >
                      {activeVideo.name}
                    </Text>
                    <Text
                      style={{
                        color: "rgba(255,255,255,0.6)",
                        fontSize: 12,
                      }}
                    >
                      {activeVideo.role}
                    </Text>
                  </View>
                </View>
              </div>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

// ============================================================
// COMPONENT: Testimonial Card
// ============================================================

function TestimonialCard({ testimonial }: { testimonial: TestimonialData }) {
  return (
    <View
      style={{
        backgroundColor: "rgba(30, 25, 50, 0.5)",
        borderRadius: 20,
        padding: 28,
        borderWidth: 1,
        borderColor: "rgba(139, 92, 246, 0.2)",
        maxWidth: 500,
        flex: 1,
        minWidth: 300,
      }}
    >
      {/* Stars */}
      <View style={{ flexDirection: "row", gap: 4, marginBottom: 16 }}>
        {[1, 2, 3, 4, 5].map((s) => (
          <Star key={s} size={16} color="#fbbf24" fill="#fbbf24" />
        ))}
      </View>
      <Text
        style={{
          color: "#e2e8f0",
          fontSize: 15,
          fontStyle: "italic",
          lineHeight: 24,
          marginBottom: 20,
        }}
      >
        "{testimonial.quote}"
      </Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: "rgba(139, 92, 246, 0.2)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "#8b5cf6", fontWeight: "800", fontSize: 16 }}>
            {testimonial.name.charAt(0)}
          </Text>
        </View>
        <View>
          <Text style={{ color: "#ffffff", fontWeight: "700", fontSize: 14 }}>
            {testimonial.name}
          </Text>
          <Text style={{ color: "#64748b", fontSize: 12 }}>
            {testimonial.role}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ============================================================
// COMPONENT: FAQ Item
// ============================================================

function FAQItemComponent({
  faq,
  isOpen,
  onToggle,
}: {
  faq: FAQData;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable
      onPress={onToggle}
      style={{
        backgroundColor: isOpen
          ? "rgba(139, 92, 246, 0.1)"
          : "rgba(30, 25, 50, 0.4)",
        borderRadius: 14,
        padding: 20,
        marginBottom: 12,
        borderWidth: 1.5,
        borderColor: isOpen
          ? "rgba(139, 92, 246, 0.3)"
          : "rgba(139, 92, 246, 0.1)",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text
          style={{
            fontSize: 16,
            fontWeight: "800",
            color: "#ffffff",
            flex: 1,
            paddingRight: 12,
          }}
        >
          {faq.question}
        </Text>
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: isOpen
              ? "rgba(139, 92, 246, 0.2)"
              : "rgba(139, 92, 246, 0.1)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isOpen ? (
            <ChevronUp size={16} color="#8b5cf6" />
          ) : (
            <ChevronDown size={16} color="#64748b" />
          )}
        </View>
      </View>
      {isOpen && (
        <Text
          style={{
            fontSize: 15,
            color: "#94a3b8",
            marginTop: 14,
            lineHeight: 24,
          }}
        >
          {faq.answer}
        </Text>
      )}
    </Pressable>
  );
}

// ============================================================
// COMPONENT: Pricing Section
// ============================================================

function PricingSection({
  isWide,
  onGetStarted,
}: {
  isWide: boolean;
  onGetStarted: () => void;
}) {
  const [isYearly, setIsYearly] = useState(false);

  const plans = [
    {
      name: "Free",
      monthlyPrice: 0,
      yearlyMonthlyPrice: 0,
      description: "Perfect for trying FamilyForge",
      features: [
        "Up to 2 children",
        "Basic task management",
        "Simple reward system",
        "1 parent account",
        "Basic progress tracking",
        "Community support",
      ],
      highlighted: false,
      ctaText: "Get Started Free",
    },
    {
      name: "Pro",
      monthlyPrice: 6.99,
      yearlyMonthlyPrice: 5.24,
      description: "For families ready to transform",
      features: [
        "Up to 5 children",
        "Advanced task management",
        "Full reward system with custom rewards",
        "2 parent accounts",
        "Detailed progress tracking & analytics",
        "Weekly insights report",
        "Priority email support",
        "Family calendar",
      ],
      highlighted: false,
      badge: undefined as string | undefined,
      ctaText: "Get Started",
    },
    {
      name: "Forge",
      monthlyPrice: 9.99,
      yearlyMonthlyPrice: 7.49,
      description: "The ultimate family toolkit",
      features: [
        "Unlimited children",
        "Everything in Pro",
        "AI-powered suggestions",
        "Custom learning paths",
        "Advanced analytics & reporting",
        "Multiple family groups",
        "Priority support with live chat",
        "Early access to new features",
      ],
      highlighted: true,
      badge: "MOST POPULAR",
      ctaText: "Get Started",
    },
  ];

  return (
    <View
      style={{
        paddingVertical: 60,
        paddingHorizontal: 20,
        backgroundColor: "rgba(30, 25, 50, 0.3)",
      }}
    >
      <Text
        style={{
          fontSize: isWide ? 40 : 30,
          fontWeight: "900",
          color: "#ffffff",
          textAlign: "center",
          marginBottom: 8,
        }}
      >
        Invest In Your Family's{" "}
        <Text style={{ color: "#8b5cf6" }}>Future</Text>
      </Text>
      <Text
        style={{
          fontSize: 16,
          color: "#94a3b8",
          textAlign: "center",
          marginBottom: 8,
          maxWidth: 500,
          alignSelf: "center",
        }}
      >
        Less than the price of a coffee per week. Cancel anytime.
      </Text>
      <Text
        style={{
          fontSize: 14,
          color: "#64748b",
          textAlign: "center",
          marginBottom: 32,
        }}
      >
        No contracts · No hidden fees · Start free today
      </Text>

      {/* Toggle */}
      <View
        style={{
          flexDirection: "row",
          alignSelf: "center",
          backgroundColor: "rgba(30, 25, 50, 0.6)",
          borderRadius: 14,
          padding: 4,
          marginBottom: 40,
          borderWidth: 1,
          borderColor: "rgba(139, 92, 246, 0.2)",
        }}
      >
        <Pressable
          onPress={() => setIsYearly(false)}
          style={{
            paddingVertical: 12,
            paddingHorizontal: 28,
            borderRadius: 10,
            backgroundColor: !isYearly ? "#8b5cf6" : "transparent",
          }}
        >
          <Text
            style={{
              color: !isYearly ? "#ffffff" : "#94a3b8",
              fontWeight: "800",
              fontSize: 14,
            }}
          >
            Monthly
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setIsYearly(true)}
          style={{
            paddingVertical: 12,
            paddingHorizontal: 28,
            borderRadius: 10,
            backgroundColor: isYearly ? "#8b5cf6" : "transparent",
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Text
            style={{
              color: isYearly ? "#ffffff" : "#94a3b8",
              fontWeight: "800",
              fontSize: 14,
            }}
          >
            Yearly
          </Text>
          {!isYearly && (
            <View
              style={{
                backgroundColor: "#4ade80",
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: 6,
              }}
            >
              <Text
                style={{ color: "#ffffff", fontSize: 9, fontWeight: "900" }}
              >
                SAVE 25%
              </Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* Pricing Cards */}
      <View
        style={{
          flexDirection: isWide ? "row" : "column",
          gap: 20,
          maxWidth: 1100,
          alignSelf: "center",
          width: "100%",
          alignItems: isWide ? "stretch" : "center",
        }}
      >
        {plans.map((plan) => {
          const currentPrice = isYearly
            ? plan.yearlyMonthlyPrice
            : plan.monthlyPrice;
          const dailyPrice = currentPrice > 0 ? (currentPrice / 30).toFixed(2) : "0.00";
          const yearlyTotal = (plan.yearlyMonthlyPrice * 12).toFixed(2);
          const savingsPercent =
            plan.monthlyPrice > 0
              ? Math.round(
                  ((plan.monthlyPrice - plan.yearlyMonthlyPrice) /
                    plan.monthlyPrice) *
                    100
                )
              : 0;

          return (
            <View
              key={plan.name}
              style={{
                flex: isWide ? 1 : undefined,
                width: isWide ? undefined : "100%",
                maxWidth: 380,
                backgroundColor: plan.highlighted ? "#1a1f38" : "rgba(30, 25, 50, 0.4)",
                borderRadius: 20,
                padding: 28,
                borderWidth: plan.highlighted ? 2 : 1,
                borderColor: plan.highlighted
                  ? "#8b5cf6"
                  : "rgba(139, 92, 246, 0.15)",
                shadowColor: plan.highlighted ? "#8b5cf6" : "transparent",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: plan.highlighted ? 0.3 : 0,
                shadowRadius: 24,
                elevation: plan.highlighted ? 12 : 0,
                transform: plan.highlighted && isWide ? [{ scale: 1.05 }] : [],
              }}
            >
              {plan.badge && (
                <View
                  style={{
                    position: "absolute",
                    top: -14,
                    alignSelf: "center",
                    left: "50%",
                    marginLeft: -60,
                    width: 120,
                  }}
                >
                  <LinearGradient
                    colors={["#8b5cf6", "#6366f1"]}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 6,
                      borderRadius: 20,
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: "#fff",
                        fontWeight: "900",
                        fontSize: 10,
                        letterSpacing: 1,
                      }}
                    >
                      {plan.badge}
                    </Text>
                  </LinearGradient>
                </View>
              )}

              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "800",
                  color: "#ffffff",
                  textAlign: "center",
                  marginTop: plan.badge ? 8 : 0,
                }}
              >
                {plan.name}
              </Text>

              {/* Daily Price - HERO */}
              <View
                style={{
                  alignItems: "center",
                  marginTop: 16,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-end",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 48,
                      fontWeight: "900",
                      color: plan.highlighted ? "#8b5cf6" : "#ffffff",
                    }}
                  >
                    £{dailyPrice}
                  </Text>
                  <Text
                    style={{
                      fontSize: 16,
                      color: "#64748b",
                      marginBottom: 10,
                      marginLeft: 4,
                    }}
                  >
                    /day
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: 14,
                    color: "#64748b",
                    marginTop: 4,
                  }}
                >
                  {isYearly
                    ? `£${plan.yearlyMonthlyPrice.toFixed(2)}/month (£${yearlyTotal}/year)`
                    : `£${plan.monthlyPrice.toFixed(2)}/month`}
                </Text>
                {isYearly && savingsPercent > 0 && (
                  <View
                    style={{
                      backgroundColor: "rgba(74, 222, 128, 0.15)",
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 8,
                      marginTop: 8,
                    }}
                  >
                    <Text
                      style={{
                        color: "#4ade80",
                        fontSize: 12,
                        fontWeight: "800",
                      }}
                    >
                      SAVE {savingsPercent}%
                    </Text>
                  </View>
                )}
              </View>

              <Text
                style={{
                  fontSize: 13,
                  color: "#94a3b8",
                  textAlign: "center",
                  marginTop: 8,
                  marginBottom: 24,
                }}
              >
                {plan.description}
              </Text>

              {/* Features */}
              {plan.features.map((feature, i) => (
                <View
                  key={i}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 10,
                  }}
                >
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      backgroundColor: plan.highlighted
                        ? "rgba(139, 92, 246, 0.2)"
                        : "rgba(74, 222, 128, 0.15)",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Check
                      size={12}
                      color={plan.highlighted ? "#8b5cf6" : "#4ade80"}
                      strokeWidth={3}
                    />
                  </View>
                  <Text style={{ fontSize: 14, color: "#cbd5e1", flex: 1 }}>
                    {feature}
                  </Text>
                </View>
              ))}

              <Pressable
                onPress={onGetStarted}
                style={({ pressed }) => ({
                  marginTop: 24,
                  transform: [{ scale: pressed ? 0.97 : 1 }],
                })}
              >
                <LinearGradient
                  colors={
                    plan.highlighted
                      ? ["#8b5cf6", "#6366f1"]
                      : ["rgba(139, 92, 246, 0.3)", "rgba(99, 102, 241, 0.3)"]
                  }
                  style={{
                    paddingVertical: 16,
                    borderRadius: 12,
                    alignItems: "center",
                    borderWidth: plan.highlighted ? 0 : 1,
                    borderColor: "rgba(139, 92, 246, 0.3)",
                  }}
                >
                  <Text
                    style={{
                      color: "#fff",
                      fontWeight: "900",
                      fontSize: 15,
                    }}
                  >
                    {plan.ctaText}
                  </Text>
                </LinearGradient>
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ============================================================
// COMPONENT: Quote Block
// ============================================================

function QuoteBlock() {
  return (
    <View
      style={{
        backgroundColor: "rgba(30, 25, 50, 0.4)",
        borderLeftWidth: 4,
        borderLeftColor: "#8b5cf6",
        padding: 24,
        paddingLeft: 28,
        borderRadius: 12,
        marginVertical: 20,
      }}
    >
      <Text
        style={{
          color: "#e2e8f0",
          fontSize: 20,
          fontStyle: "italic",
          lineHeight: 30,
        }}
      >
        "Struggling doesn't mean you're failing. It means you're showing up,
        every single day, for the people who matter most."
      </Text>
      <Text
        style={{
          color: "#8b5cf6",
          fontSize: 14,
          fontWeight: "600",
          marginTop: 16,
        }}
      >
        — To Every Parent Reading This
      </Text>
    </View>
  );
}

// ============================================================
// MAIN LANDING PAGE COMPONENT
// ============================================================

export default function LandingPage() {
  const { width } = useWindowDimensions();
  const isWide = width > 768;
  const isVeryWide = width > 1100;
  const device = useDeviceDetection();
  const { playSound } = useNotificationSound();
  const [showDownloadPrompt, setShowDownloadPrompt] = useState(false);
  const [promptDismissed, setPromptDismissed] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoUnlocked, setVideoUnlocked] = useState(false);
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  // Show download prompt after delay on mobile
  useEffect(() => {
    if (device.isMobile && !promptDismissed) {
      const timer = setTimeout(() => {
        setShowDownloadPrompt(true);
        playSound();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [device.isMobile, promptDismissed]);

  // Inject CSS keyframes for animated arrow
  useEffect(() => {
    if (Platform.OS === "web" && typeof document !== "undefined") {
      const id = "familyforge-arrow-anim";
      if (!document.getElementById(id)) {
        const style = document.createElement("style");
        style.id = id;
        style.textContent = `
          @keyframes bounceArrow {
            0%, 100% { transform: translateY(0); opacity: 0.7; }
            50% { transform: translateY(8px); opacity: 1; }
          }
          @keyframes flipInFromTop {
            0% {
              transform: perspective(800px) rotateX(-90deg) translateY(-60px);
              opacity: 0;
            }
            40% {
              transform: perspective(800px) rotateX(10deg) translateY(0);
              opacity: 1;
            }
            70% {
              transform: perspective(800px) rotateX(-5deg);
            }
            100% {
              transform: perspective(800px) rotateX(0deg);
              opacity: 1;
            }
          }
          @keyframes flipOutToTop {
            0% {
              transform: perspective(800px) rotateX(0deg);
              opacity: 1;
            }
            100% {
              transform: perspective(800px) rotateX(-90deg) translateY(-60px);
              opacity: 0;
            }
          }
          @keyframes fadeInOverlay {
            0% { opacity: 0; }
            100% { opacity: 1; }
          }
          @keyframes fadeOutOverlay {
            0% { opacity: 1; }
            100% { opacity: 0; }
          }
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
          @keyframes inputFocusGlow {
            0%, 100% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0); }
            50% { box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.15); }
          }
        `;
        document.head.appendChild(style);
      }
    }
  }, []);

  const handleGetStarted = useCallback(() => {
    router.push("/onboarding");
  }, []);

  const handleCallMeBack = useCallback((data: FormData) => {
    console.log("Call Me Back submitted:", data);
    // TODO: Send to backend
  }, []);

  const handleVideoGate = useCallback((data: FormData) => {
    console.log("Video gate submitted:", data);
    setVideoUnlocked(true);
    // TODO: Send to backend
  }, []);

  const handleDismissPrompt = useCallback(() => {
    setShowDownloadPrompt(false);
    setPromptDismissed(true);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: "#0f0a1f" }}>
      {/* Mobile Download Prompt */}
      {showDownloadPrompt && (
        <MobileDownloadPrompt
          isIOS={device.isIOS}
          isAndroid={device.isAndroid}
          onDismiss={handleDismissPrompt}
        />
      )}

      {/* Sticky Nav */}
      <StickyNav onGetStarted={handleGetStarted} />

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: 64,
          paddingBottom: 80,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* ========================================== */}
        {/* HERO SECTION */}
        {/* ========================================== */}
        <View
          style={{
            paddingHorizontal: isWide ? 60 : 24,
            paddingTop: isWide ? 80 : 50,
            paddingBottom: 60,
          }}
        >
          <View
            style={{
              flexDirection: isWide ? "row" : "column",
              maxWidth: 1200,
              alignSelf: "center",
              width: "100%",
              gap: isWide ? 60 : 32,
              alignItems: "center",
            }}
          >
            {/* Left Content */}
            <View
              style={{
                flex: isWide ? 1 : undefined,
                width: isWide ? undefined : "100%",
              }}
            >
              {/* Trust Badge */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 24,
                  alignSelf: isWide ? "flex-start" : "center",
                }}
              >
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={14} color="#fbbf24" fill="#fbbf24" />
                ))}
                <Text
                  style={{ color: "#94a3b8", fontSize: 13, marginLeft: 4 }}
                >
                  Loved by 10,000+ families
                </Text>
              </View>

              {/* Headline — Updated */}
              <GlowText
                style={{
                  color: "#ffffff",
                  fontSize: isWide ? 52 : 34,
                  fontWeight: "900",
                  lineHeight: isWide ? 62 : 42,
                  textAlign: isWide ? "left" : "center",
                  marginBottom: 20,
                }}
              >
                Parenting is overwhelming.{"\n"}
                <Text style={{ color: "#8b5cf6" }}>You're not alone.</Text>
              </GlowText>

              {/* Sub-copy — Updated */}
              <Text
                style={{
                  color: "#94a3b8",
                  fontSize: isWide ? 19 : 16,
                  lineHeight: isWide ? 30 : 26,
                  textAlign: isWide ? "left" : "center",
                  marginBottom: 12,
                }}
              >
                Between the endless tasks, the mental load, the guilt, and
                the exhaustion—parenting is harder than anyone admits.
              </Text>
              <Text
                style={{
                  color: "#cbd5e1",
                  fontSize: isWide ? 17 : 15,
                  lineHeight: isWide ? 28 : 24,
                  textAlign: isWide ? "left" : "center",
                  fontWeight: "600",
                  fontStyle: "italic",
                  marginBottom: 32,
                }}
              >
                FamilyForge gives you structure without losing your sanity.
              </Text>

              {/* Dual CTAs */}
              <View
                style={{
                  flexDirection: isWide ? "row" : "column",
                  gap: 14,
                  alignItems: isWide ? "flex-start" : "center",
                }}
              >
                <GradientButton onPress={handleGetStarted}>
                  Get Started
                </GradientButton>
                <Pressable
                  onPress={() => setShowVideoModal(true)}
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    paddingVertical: 18,
                    paddingHorizontal: 32,
                    borderRadius: 16,
                    backgroundColor: pressed
                      ? "rgba(139, 92, 246, 0.15)"
                      : "rgba(139, 92, 246, 0.08)",
                    borderWidth: 1.5,
                    borderColor: "rgba(139, 92, 246, 0.3)",
                  })}
                >
                  <Play size={18} color="#8b5cf6" />
                  <Text
                    style={{
                      color: "#e2e8f0",
                      fontWeight: "800",
                      fontSize: 16,
                    }}
                  >
                    Watch Demo
                  </Text>
                </Pressable>
              </View>

              {/* Micro-trust */}
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 16,
                  marginTop: 24,
                  justifyContent: isWide ? "flex-start" : "center",
                }}
              >
                {[
                  "No credit card required",
                  "Free forever plan",
                  "Set up in 2 minutes",
                ].map((text, i) => (
                  <View
                    key={i}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Check size={14} color="#4ade80" strokeWidth={3} />
                    <Text
                      style={{
                        color: "#94a3b8",
                        fontSize: 13,
                        fontWeight: "600",
                      }}
                    >
                      {text}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Right — Hero Video Player */}
            <View
              style={{
                flex: isWide ? 1 : undefined,
                width: isWide ? undefined : "100%",
                maxWidth: 560,
                aspectRatio: 16 / 9,
                backgroundColor: "rgba(15, 10, 31, 0.8)",
                borderRadius: 24,
                overflow: "hidden",
                borderWidth: 2,
                borderColor: "rgba(139, 92, 246, 0.3)",
                shadowColor: "#8b5cf6",
                shadowOffset: { width: 0, height: 12 },
                shadowOpacity: 0.3,
                shadowRadius: 32,
                elevation: 16,
              }}
            >
              {videoUnlocked ? (
                <View
                  style={{
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#000",
                  }}
                >
                  <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700" }}>
                    🎬 Video Playing...
                  </Text>
                  <Text style={{ color: "#94a3b8", fontSize: 14, marginTop: 8 }}>
                    Replace with actual video player
                  </Text>
                </View>
              ) : (
                <Pressable
                  onPress={() => setShowVideoModal(true)}
                  style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
                >
                  {/* Background gradient */}
                  <LinearGradient
                    colors={[
                      "rgba(139, 92, 246, 0.15)",
                      "rgba(99, 102, 241, 0.08)",
                      "rgba(15, 10, 31, 0.95)",
                    ]}
                    style={{ position: "absolute", width: "100%", height: "100%" }}
                  />
                  {/* Decorative rings */}
                  <View
                    style={{
                      width: 120,
                      height: 120,
                      borderRadius: 60,
                      borderWidth: 2,
                      borderColor: "rgba(139, 92, 246, 0.15)",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <View
                      style={{
                        width: 90,
                        height: 90,
                        borderRadius: 45,
                        borderWidth: 2,
                        borderColor: "rgba(139, 92, 246, 0.25)",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {/* Play Button */}
                      <LinearGradient
                        colors={["#8b5cf6", "#6366f1"]}
                        style={{
                          width: 70,
                          height: 70,
                          borderRadius: 35,
                          alignItems: "center",
                          justifyContent: "center",
                          shadowColor: "#8b5cf6",
                          shadowOffset: { width: 0, height: 0 },
                          shadowOpacity: 0.6,
                          shadowRadius: 20,
                        }}
                      >
                        <Play size={28} color="#fff" fill="#fff" style={{ marginLeft: 3 }} />
                      </LinearGradient>
                    </View>
                  </View>
                  <Text style={{ color: "#ffffff", fontSize: 16, fontWeight: "700", marginTop: 20 }}>
                    Watch How FamilyForge Works
                  </Text>
                  <Text style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>
                    2 min walkthrough · No signup required
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>

        {/* ========================================== */}
        {/* STATS BAR */}
        {/* ========================================== */}
        <StatsBar isWide={isWide} />

        {/* ========================================== */}
        {/* AUDIO BAR #1 */}
        {/* ========================================== */}
        <View style={{ paddingVertical: 24, paddingHorizontal: 24 }}>
          <ListenToAudio
            label="Hear why families choose FamilyForge"
            audioSource="/audio/intro.mp3"
          />
        </View>

        {/* ========================================== */}
        {/* EMPATHY: FOR MOTHERS */}
        {/* ========================================== */}
        <View
          style={{
            paddingHorizontal: isWide ? 80 : 24,
            paddingVertical: 60,
            backgroundColor: "rgba(30, 25, 50, 0.3)",
          }}
        >
          <View
            style={{ maxWidth: 800, alignSelf: "center", width: "100%" }}
          >
            <Text
              style={{
                color: "#f472b6",
                fontSize: 13,
                fontWeight: "600",
                letterSpacing: 2,
                textTransform: "uppercase",
                marginBottom: 16,
              }}
            >
              For Mothers
            </Text>

            <GlowText
              style={{
                color: "#ffffff",
                fontSize: isWide ? 36 : 28,
                fontWeight: "900",
                lineHeight: isWide ? 46 : 38,
                marginBottom: 24,
              }}
            >
              The invisible labor is real.{"\n"}
              The guilt is{" "}
              <Text style={{ color: "#f472b6" }}>crushing.</Text>
            </GlowText>

            <Text
              style={{ color: "#cbd5e1", fontSize: 17, lineHeight: 28 }}
            >
              You remember every appointment, every preference, every
              deadline. You carry the family's schedule in your head while
              everyone else just asks, "What's for dinner?"
              {"\n\n"}
              The exhaustion isn't weakness — it's proof of everything you're
              already doing. FamilyForge doesn't ask you to do more.{" "}
              <Text style={{ color: "#f472b6", fontWeight: "600" }}>
                It helps you share the load.
              </Text>
            </Text>
          </View>
        </View>

        {/* ========================================== */}
        {/* EMPATHY: FOR FATHERS */}
        {/* ========================================== */}
        <View
          style={{
            paddingHorizontal: isWide ? 80 : 24,
            paddingVertical: 60,
          }}
        >
          <View
            style={{ maxWidth: 800, alignSelf: "center", width: "100%" }}
          >
            <Text
              style={{
                color: "#60a5fa",
                fontSize: 13,
                fontWeight: "600",
                letterSpacing: 2,
                textTransform: "uppercase",
                marginBottom: 16,
              }}
            >
              For Fathers
            </Text>

            <GlowText
              style={{
                color: "#ffffff",
                fontSize: isWide ? 36 : 28,
                fontWeight: "900",
                lineHeight: isWide ? 46 : 38,
                marginBottom: 24,
              }}
            >
              The pressure is relentless.{"\n"}
              The fear of failing is{" "}
              <Text style={{ color: "#60a5fa" }}>real.</Text>
            </GlowText>

            <Text
              style={{ color: "#cbd5e1", fontSize: 17, lineHeight: 28 }}
            >
              You want to be present, to connect, to be more than just the
              provider. But between work demands and family needs, you're
              constantly pulled in directions that feel impossible to manage.
              {"\n\n"}
              FamilyForge gives you visibility and structure — so you can{" "}
              <Text style={{ color: "#60a5fa", fontWeight: "600" }}>
                show up intentionally, not just reactively.
              </Text>
            </Text>
          </View>
        </View>

        {/* ========================================== */}
        {/* 3 PROBLEMS → SOLUTIONS */}
        {/* ========================================== */}
        <View
          style={{
            paddingVertical: 60,
            paddingHorizontal: isWide ? 60 : 24,
            backgroundColor: "rgba(30, 25, 50, 0.3)",
          }}
        >
          <View style={{ alignItems: "center", marginBottom: 48 }}>
            <Text
              style={{
                color: "#ef4444",
                fontSize: 13,
                fontWeight: "700",
                letterSpacing: 2,
                textTransform: "uppercase",
                marginBottom: 16,
              }}
            >
              The Wake-Up Call
            </Text>
            <GlowText
              glow={false}
              style={{
                color: "#ffffff",
                fontSize: isWide ? 38 : 28,
                fontWeight: "900",
                textAlign: "center",
                lineHeight: isWide ? 48 : 36,
                maxWidth: 700,
              }}
            >
              The 3 Silent Problems{" "}
              <Text style={{ color: "#ef4444" }}>DESTROYING</Text>
              {"\n"}Family Connection
            </GlowText>
            <Text
              style={{
                color: "#94a3b8",
                fontSize: 16,
                textAlign: "center",
                marginTop: 16,
                maxWidth: 600,
              }}
            >
              These aren't small problems. They're the invisible forces tearing
              families apart — and most parents don't even realise it's
              happening until it's too late.
            </Text>
          </View>

          <View
            style={{
              flexDirection: isWide ? "row" : "column",
              gap: 24,
              maxWidth: 1100,
              alignSelf: "center",
              width: "100%",
            }}
          >
            {PROBLEMS.map((item, index) => {
              const ProblemIcon = item.problemIcon;
              const SolutionIcon = item.solutionIcon;
              return (
                <View
                  key={index}
                  style={{
                    flex: isWide ? 1 : undefined,
                    backgroundColor: "rgba(30, 25, 50, 0.5)",
                    borderRadius: 20,
                    padding: 24,
                    borderWidth: 1,
                    borderColor: "rgba(139, 92, 246, 0.15)",
                  }}
                >
                  {/* Problem */}
                  <View
                    style={{
                      backgroundColor: "rgba(239, 68, 68, 0.08)",
                      borderRadius: 14,
                      padding: 20,
                      marginBottom: 16,
                      borderWidth: 1,
                      borderColor: "rgba(239, 68, 68, 0.15)",
                    }}
                  >
                    <Text
                      style={{
                        color: "#ef4444",
                        fontWeight: "800",
                        fontSize: 11,
                        letterSpacing: 1.5,
                        marginBottom: 10,
                      }}
                    >
                      {item.problemLabel.toUpperCase()}
                    </Text>
                    <ProblemIcon
                      size={28}
                      color="#ef4444"
                      style={{ marginBottom: 10 }}
                    />
                    <Text
                      style={{
                        fontSize: 17,
                        fontWeight: "900",
                        color: "#ffffff",
                        marginBottom: 8,
                      }}
                    >
                      {item.problemTitle}
                    </Text>
                    <Text
                      style={{
                        fontSize: 14,
                        color: "#94a3b8",
                        lineHeight: 22,
                      }}
                    >
                      {item.problemDesc}
                    </Text>
                  </View>

                  {/* Animated Transformation Arrow */}
                  <View
                    style={{
                      alignItems: "center",
                      marginVertical: 8,
                    }}
                  >
                    {Platform.OS === "web" ? (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          animation: "bounceArrow 1.4s ease-in-out infinite",
                        }}
                      >
                        <div
                          style={{
                            width: 4,
                            height: 18,
                            borderRadius: 2,
                            background:
                              "linear-gradient(to bottom, rgba(139,92,246,0.2), #8b5cf6)",
                          }}
                        />
                        <div
                          style={{
                            width: 0,
                            height: 0,
                            borderLeft: "14px solid transparent",
                            borderRight: "14px solid transparent",
                            borderTop: "16px solid #8b5cf6",
                            marginTop: -1,
                          }}
                        />
                      </div>
                    ) : (
                      <Text style={{ fontSize: 28, color: "#8b5cf6", fontWeight: "900" }}>▼</Text>
                    )}
                  </View>

                  {/* Solution */}
                  <View
                    style={{
                      backgroundColor: "rgba(74, 222, 128, 0.06)",
                      borderRadius: 14,
                      padding: 20,
                      borderWidth: 1.5,
                      borderColor: "rgba(74, 222, 128, 0.2)",
                    }}
                  >
                    <Text
                      style={{
                        color: "#4ade80",
                        fontWeight: "800",
                        fontSize: 11,
                        letterSpacing: 1.5,
                        marginBottom: 10,
                      }}
                    >
                      OUR SOLUTION
                    </Text>
                    <SolutionIcon
                      size={28}
                      color="#4ade80"
                      style={{ marginBottom: 10 }}
                    />
                    <Text
                      style={{
                        fontSize: 17,
                        fontWeight: "900",
                        color: "#ffffff",
                        marginBottom: 8,
                      }}
                    >
                      {item.solutionTitle}
                    </Text>
                    <Text
                      style={{
                        fontSize: 14,
                        color: "#cbd5e1",
                        lineHeight: 22,
                      }}
                    >
                      {item.solutionDesc}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* CTA Strip #1 */}
        <MidPageCTA
          text="Still reading? Your family is waiting. Start free today."
          onGetStarted={handleGetStarted}
        />

        {/* Audio Bar #2 */}
        <View style={{ paddingVertical: 24, paddingHorizontal: 24 }}>
          <ListenToAudio
            label="Hear how we solve these 3 problems"
            audioSource="/audio/problems.mp3"
          />
        </View>

        {/* ========================================== */}
        {/* DISCOVER X REASONS HEADER */}
        {/* ========================================== */}
        <View style={{ paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 }}>
          <View
            style={{
              maxWidth: 900,
              alignSelf: "center",
              width: "100%",
              borderRadius: 20,
              overflow: "hidden",
            }}
          >
            <LinearGradient
              colors={["#1a1f38", "#0f0a1f"]}
              style={{
                paddingVertical: 40,
                paddingHorizontal: 24,
                alignItems: "center",
                borderWidth: 1,
                borderColor: "rgba(139, 92, 246, 0.2)",
                borderRadius: 20,
              }}
            >
              <Text
                style={{
                  fontSize: isWide ? 38 : 26,
                  fontWeight: "900",
                  color: "#ffffff",
                  textAlign: "center",
                  lineHeight: isWide ? 48 : 34,
                }}
              >
                Discover 10 Reasons Why{"\n"}Your Family{" "}
                <Text style={{ color: "#8b5cf6", position: "relative" }}>
                  NEEDS
                  {Platform.OS === "web" && (
                    <View
                      style={{
                        position: "absolute",
                        bottom: -4,
                        left: 0,
                        right: 0,
                        height: 8,
                        overflow: "hidden",
                      }}
                    >
                      {/* @ts-ignore */}
                      <svg
                        width="100%"
                        height="8"
                        viewBox="0 0 120 8"
                        preserveAspectRatio="none"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M2 5C20 2 40 7 60 4C80 1 100 6 118 3"
                          stroke="#8b5cf6"
                          strokeWidth="3"
                          strokeLinecap="round"
                        />
                        <path
                          d="M2 6C20 3 40 8 60 5C80 2 100 7 118 4"
                          stroke="#a78bfa"
                          strokeWidth="2"
                          strokeLinecap="round"
                          opacity="0.5"
                        />
                      </svg>
                    </View>
                  )}
                </Text>{" "}
                <Text style={{ color: "#8b5cf6" }}>FamilyForge</Text>
              </Text>
            </LinearGradient>
          </View>
        </View>

        {/* ========================================== */}
        {/* DEEP-DIVE SECTIONS */}
        {/* ========================================== */}
        {DEEP_DIVES.map((item, index) => (
          <View key={index}>
            <DeepDiveItem
              item={item}
              index={index}
              isWide={isWide}
              onGetStarted={handleGetStarted}
            />
            {/* CTA strip after every 3rd deep-dive */}
            {(index + 1) % 3 === 0 && index < DEEP_DIVES.length - 1 && (
              <MidPageCTA
                text={
                  index === 2
                    ? "Ready to breathe easier? Start free today. No pressure, no more guilt — just a little help."
                    : index === 5
                    ? "Want to see more? There's plenty. But first — Get Started."
                    : "Imagine your family a month from now. Ready to begin?"
                }
                onGetStarted={handleGetStarted}
              />
            )}
          </View>
        ))}

        {/* ========================================== */}
        {/* FEATURES OVERVIEW GRID */}
        {/* ========================================== */}
        <View
          style={{
            paddingHorizontal: isWide ? 60 : 24,
            paddingVertical: 60,
            backgroundColor: "rgba(30, 25, 50, 0.3)",
          }}
        >
          <View style={{ alignItems: "center", marginBottom: 48 }}>
            <Text
              style={{
                color: "#8b5cf6",
                fontSize: 13,
                fontWeight: "600",
                letterSpacing: 2,
                textTransform: "uppercase",
                marginBottom: 16,
              }}
            >
              And There's More
            </Text>
            <GlowText
              style={{
                color: "#ffffff",
                fontSize: isWide ? 36 : 26,
                fontWeight: "900",
                textAlign: "center",
              }}
            >
              Problems Solved,{"\n"}Not Features Dumped
            </GlowText>
          </View>

          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 24,
              maxWidth: 1100,
              alignSelf: "center",
            }}
          >
            {FEATURES_GRID.map((feature, index) => (
              <FeatureGridCard key={index} feature={feature} index={index} />
            ))}
          </View>
        </View>

        {/* ========================================== */}
        {/* VALIDATION SECTION */}
        {/* ========================================== */}
        <View
          style={{
            paddingHorizontal: isWide ? 80 : 24,
            paddingVertical: 60,
          }}
        >
          <View
            style={{ maxWidth: 800, alignSelf: "center", width: "100%" }}
          >
            <Text
              style={{
                color: "#4ade80",
                fontSize: 13,
                fontWeight: "600",
                letterSpacing: 2,
                textTransform: "uppercase",
                marginBottom: 16,
                textAlign: "center",
              }}
            >
              You're Doing Better Than You Think
            </Text>

            <GlowText
              style={{
                color: "#ffffff",
                fontSize: isWide ? 36 : 28,
                fontWeight: "900",
                textAlign: "center",
                lineHeight: isWide ? 46 : 38,
                marginBottom: 24,
              }}
            >
              This isn't about perfection.{"\n"}
              It's about <Text style={{ color: "#8b5cf6" }}>support.</Text>
            </GlowText>

            <Text
              style={{
                color: "#cbd5e1",
                fontSize: 17,
                lineHeight: 28,
                textAlign: "center",
              }}
            >
              FamilyForge was built by parents, for parents. We understand
              that some days just surviving is a victory. The app is designed
              to bring calm, not chaos — structure without rigidity, progress
              without pressure.
            </Text>

            <QuoteBlock />
          </View>
        </View>

        {/* ========================================== */}
        {/* VIDEO DEMO SECTION (GATED) */}
        {/* ========================================== */}
        <View
          style={{
            paddingVertical: 60,
            paddingHorizontal: 20,
            backgroundColor: "rgba(30, 25, 50, 0.4)",
          }}
        >
          <View style={{ alignItems: "center", marginBottom: 32 }}>
            <Text
              style={{
                fontSize: isWide ? 38 : 28,
                fontWeight: "900",
                color: "#ffffff",
                textAlign: "center",
              }}
            >
              See How FamilyForge{" "}
              <Text style={{ color: "#8b5cf6" }}>Changes Everything</Text>
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: "#94a3b8",
                textAlign: "center",
                marginTop: 8,
                maxWidth: 500,
              }}
            >
              Watch our quick walkthrough — see exactly what your family gets
            </Text>
          </View>

          <View
            style={{
              maxWidth: 800,
              alignSelf: "center",
              width: "100%",
              borderRadius: 20,
              overflow: "hidden",
              backgroundColor: "rgba(15, 10, 31, 0.8)",
              aspectRatio: 16 / 9,
              borderWidth: 2,
              borderColor: "rgba(139, 92, 246, 0.2)",
            }}
          >
            {videoUnlocked ? (
              <View
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#000",
                }}
              >
                <Text
                  style={{
                    color: "#fff",
                    fontSize: 18,
                    fontWeight: "700",
                  }}
                >
                  🎬 Video Playing...
                </Text>
                <Text
                  style={{
                    color: "#94a3b8",
                    fontSize: 14,
                    marginTop: 8,
                  }}
                >
                  Replace with actual video player
                </Text>
              </View>
            ) : (
              <Pressable
                onPress={() => setShowVideoModal(true)}
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {/* Placeholder background */}
                <View
                  style={{
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                    backgroundColor: "rgba(139, 92, 246, 0.05)",
                  }}
                >
                  <Camera
                    size={60}
                    color="rgba(139, 92, 246, 0.1)"
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      marginLeft: -30,
                      marginTop: -60,
                    }}
                  />
                </View>

                {/* Play Button */}
                <View
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    alignItems: "center",
                    justifyContent: "center",
                    shadowColor: "#8b5cf6",
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.5,
                    shadowRadius: 20,
                  }}
                >
                  <LinearGradient
                    colors={["#8b5cf6", "#6366f1"]}
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 40,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Play size={32} color="#fff" fill="#fff" />
                  </LinearGradient>
                </View>
                <Text
                  style={{
                    color: "#ffffff",
                    fontSize: 16,
                    fontWeight: "700",
                    marginTop: 16,
                  }}
                >
                  Click to Watch Demo
                </Text>
                <Text
                  style={{
                    color: "#64748b",
                    fontSize: 13,
                    marginTop: 4,
                  }}
                >
                  video-thumbnail.png (800 × 450)
                </Text>
              </Pressable>
            )}
          </View>

          {/* Audio below video */}
          <View style={{ paddingTop: 24, paddingHorizontal: 4 }}>
            <ListenToAudio
              label="Hear what makes our platform special"
              audioSource="/audio/demo.mp3"
            />
          </View>
        </View>

        {/* ========================================== */}
        {/* VIDEO TESTIMONIALS CAROUSEL (Before Pricing) */}
        {/* ========================================== */}
        <VideoTestimonialCarousel isWide={isWide} />

        {/* CTA before pricing */}
        <MidPageCTA
          text="Join 10,000+ families who've already started. It's free."
          onGetStarted={handleGetStarted}
        />

        {/* ========================================== */}
        {/* PRICING */}
        {/* ========================================== */}
        <PricingSection isWide={isWide} onGetStarted={handleGetStarted} />

        {/* ========================================== */}
        {/* TEXT TESTIMONIALS (After Pricing) */}
        {/* ========================================== */}
        <View
          style={{
            paddingVertical: 60,
            paddingHorizontal: isWide ? 60 : 24,
          }}
        >
          <View style={{ alignItems: "center", marginBottom: 40 }}>
            <Text
              style={{
                color: "#fbbf24",
                fontSize: 13,
                fontWeight: "600",
                letterSpacing: 2,
                textTransform: "uppercase",
                marginBottom: 16,
              }}
            >
              Real Families. Real Results.
            </Text>
            <GlowText
              style={{
                color: "#ffffff",
                fontSize: isWide ? 36 : 28,
                fontWeight: "900",
                textAlign: "center",
              }}
            >
              Hear From Parents{" "}
              <Text style={{ color: "#8b5cf6" }}>Like You</Text>
            </GlowText>
          </View>

          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 24,
              maxWidth: 1100,
              alignSelf: "center",
            }}
          >
            {TESTIMONIALS.map((t, i) => (
              <TestimonialCard key={i} testimonial={t} />
            ))}
          </View>

          {/* CTA after testimonials */}
          <View style={{ alignItems: "center", marginTop: 40 }}>
            <GradientButton onPress={handleGetStarted}>
              Join 10,000+ Families
            </GradientButton>
          </View>
        </View>

        {/* ========================================== */}
        {/* FAQ */}
        {/* ========================================== */}
        <View
          style={{
            paddingHorizontal: 20,
            paddingVertical: 60,
          }}
        >
          <View
            style={{
              maxWidth: 800,
              alignSelf: "center",
              width: "100%",
            }}
          >
            <Text
              style={{
                fontSize: isWide ? 38 : 28,
                fontWeight: "900",
                color: "#ffffff",
                textAlign: "center",
                marginBottom: 8,
              }}
            >
              Got{" "}
              <Text style={{ color: "#8b5cf6" }}>Questions?</Text>
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: "#94a3b8",
                textAlign: "center",
                marginBottom: 40,
              }}
            >
              We've got answers. And if yours isn't here — just ask.
            </Text>

            {FAQS.map((faq, index) => (
              <FAQItemComponent
                key={index}
                faq={faq}
                isOpen={openFAQ === index}
                onToggle={() =>
                  setOpenFAQ(openFAQ === index ? null : index)
                }
              />
            ))}
          </View>
        </View>

        {/* ========================================== */}
        {/* FINAL EMOTIONAL CTA */}
        {/* ========================================== */}
        <LinearGradient
          colors={["#8b5cf6", "#6366f1", "#4f46e5"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            paddingVertical: 80,
            paddingHorizontal: 24,
            alignItems: "center",
          }}
        >
          <Heart size={40} color="#fff" fill="#fff" />
          <Text
            style={{
              fontSize: isWide ? 38 : 28,
              fontWeight: "900",
              color: "#ffffff",
              textAlign: "center",
              marginTop: 16,
              marginBottom: 12,
              maxWidth: 700,
              lineHeight: isWide ? 48 : 36,
            }}
          >
            Your Family's Best Moments Are Waiting
          </Text>
          <Text
            style={{
              fontSize: 17,
              color: "rgba(255,255,255,0.85)",
              textAlign: "center",
              marginBottom: 32,
              maxWidth: 550,
              lineHeight: 26,
            }}
          >
            Don't let another week go by where your family just "co-exists."
            Start building unbreakable bonds today — automagically ✨
          </Text>

          <View
            style={{
              flexDirection: isWide ? "row" : "column",
              gap: 16,
              alignItems: "center",
            }}
          >
            <Pressable
              onPress={handleGetStarted}
              style={({ pressed }) => ({
                backgroundColor: pressed ? "#e2e8f0" : "#ffffff",
                paddingVertical: 18,
                paddingHorizontal: 40,
                borderRadius: 14,
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                transform: [{ scale: pressed ? 0.97 : 1 }],
              })}
            >
              <Text
                style={{
                  color: "#4f46e5",
                  fontWeight: "900",
                  fontSize: 17,
                }}
              >
                Get Started Now
              </Text>
              <ArrowRight size={20} color="#4f46e5" />
            </Pressable>
            <Pressable
              onPress={() => setShowCallModal(true)}
              style={({ pressed }) => ({
                backgroundColor: pressed
                  ? "rgba(255,255,255,0.25)"
                  : "rgba(255,255,255,0.15)",
                paddingVertical: 18,
                paddingHorizontal: 40,
                borderRadius: 14,
                borderWidth: 2,
                borderColor: "#ffffff",
              })}
            >
              <Text
                style={{
                  color: "#ffffff",
                  fontWeight: "800",
                  fontSize: 16,
                }}
              >
                Book a Demo Call
              </Text>
            </Pressable>
          </View>
        </LinearGradient>

        {/* ========================================== */}
        {/* FOOTER */}
        {/* ========================================== */}
        <View
          style={{
            paddingHorizontal: isWide ? 80 : 24,
            paddingVertical: 40,
            borderTopWidth: 1,
            borderTopColor: "rgba(139, 92, 246, 0.2)",
            backgroundColor: "rgba(15, 10, 31, 0.95)",
            paddingBottom: 100,
          }}
        >
          {/* App Store Buttons */}
          <View
            style={{
              flexDirection: isWide ? "row" : "column",
              justifyContent: "center",
              alignItems: "center",
              gap: 16,
              marginBottom: 32,
            }}
          >
            <Pressable
              onPress={() => router.push("/onboarding")}
              style={{
                backgroundColor: "#000000",
                paddingVertical: 12,
                paddingHorizontal: 24,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#333333",
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
              }}
            >
              <View>
                <Text style={{ color: "#999999", fontSize: 10 }}>
                  Download on the
                </Text>
                <Text
                  style={{
                    color: "#ffffff",
                    fontSize: 18,
                    fontWeight: "600",
                  }}
                >
                  App Store
                </Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => router.push("/onboarding")}
              style={{
                backgroundColor: "#000000",
                paddingVertical: 12,
                paddingHorizontal: 24,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#333333",
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
              }}
            >
              <View>
                <Text style={{ color: "#999999", fontSize: 10 }}>
                  GET IT ON
                </Text>
                <Text
                  style={{
                    color: "#ffffff",
                    fontSize: 18,
                    fontWeight: "600",
                  }}
                >
                  Google Play
                </Text>
              </View>
            </Pressable>
          </View>

          {/* Legal Links */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              gap: 24,
              marginBottom: 24,
            }}
          >
            <Pressable
              onPress={() => router.push("/privacy-policy" as any)}
            >
              <Text
                style={{
                  color: "#64748b",
                  fontSize: 14,
                  backgroundColor: "rgba(100, 116, 139, 0.1)",
                  paddingVertical: 8,
                  paddingHorizontal: 16,
                  borderRadius: 20,
                }}
              >
                Privacy Policy
              </Text>
            </Pressable>
            <Pressable onPress={() => router.push("/terms" as any)}>
              <Text
                style={{
                  color: "#64748b",
                  fontSize: 14,
                  backgroundColor: "rgba(100, 116, 139, 0.1)",
                  paddingVertical: 8,
                  paddingHorizontal: 16,
                  borderRadius: 20,
                }}
              >
                Terms of Service
              </Text>
            </Pressable>
          </View>

          {/* Copyright */}
          <Text
            style={{
              color: "#475569",
              fontSize: 13,
              textAlign: "center",
            }}
          >
            © {new Date().getFullYear()} FamilyForge. Built with love for
            families everywhere.
          </Text>
        </View>
      </ScrollView>

      {/* ========================================== */}
      {/* STICKY BOTTOM BAR */}
      {/* ========================================== */}
      <StickyBottomBar
        onCallMeBack={() => setShowCallModal(true)}
        onGetStarted={handleGetStarted}
      />

      {/* ========================================== */}
      {/* MODALS */}
      {/* ========================================== */}
      <FormModal
        visible={showCallModal}
        onClose={() => setShowCallModal(false)}
        onSubmit={handleCallMeBack}
        title="We'll Call You Back!"
        subtitle="Enter your details below and we'll be in touch shortly."
      />

      <FormModal
        visible={showVideoModal}
        onClose={() => setShowVideoModal(false)}
        onSubmit={handleVideoGate}
        title="Watch the FamilyForge Demo"
        subtitle="Enter your details below to unlock the video walkthrough."
      />
    </View>
  );
}
