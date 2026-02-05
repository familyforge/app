// Testimonials Store - Manages testimonials for paywall screen
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Testimonial {
  id: string;
  name: string;
  imageUrl: string;
  text: string;
  isActive: boolean;
  createdAt: string;
}

interface TestimonialsStore {
  testimonials: Testimonial[];
  setTestimonials: (testimonials: Testimonial[]) => void;
  addTestimonial: (testimonial: Omit<Testimonial, "id" | "createdAt">) => void;
  updateTestimonial: (id: string, updates: Partial<Testimonial>) => void;
  deleteTestimonial: (id: string) => void;
  toggleActive: (id: string) => void;
}

// Default testimonials
const defaultTestimonials: Testimonial[] = [
  {
    id: "1",
    name: "Sarah M.",
    imageUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
    text: "My daughter actually asks to do her chores now. I never thought I'd see the day. This app gave us our evenings back.",
    isActive: true,
    createdAt: "2026-01-15",
  },
  {
    id: "2",
    name: "Michael T.",
    imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    text: "As a single dad of 3, I was drowning. FamilyForge helped me create structure without the constant nagging. My kids feel proud of themselves.",
    isActive: true,
    createdAt: "2026-01-18",
  },
  {
    id: "3",
    name: "Jennifer & David K.",
    imageUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
    text: "We finally feel like a team. The calendar keeps us all on the same page, and watching our kids earn their rewards is pure joy.",
    isActive: true,
    createdAt: "2026-01-22",
  },
  {
    id: "4",
    name: "Amanda R.",
    imageUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    text: "I cried when my son completed his first week streak. He's never stuck with anything before. This app understands kids.",
    isActive: true,
    createdAt: "2026-01-25",
  },
  {
    id: "5",
    name: "Chris & Elena P.",
    imageUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    text: "The learning assignments changed everything for our struggling reader. Progress we couldn't achieve in months happened in weeks.",
    isActive: true,
    createdAt: "2026-01-28",
  },
];

export const useTestimonialsStore = create<TestimonialsStore>()(
  persist(
    (set) => ({
      testimonials: defaultTestimonials,
      
      setTestimonials: (testimonials) => set({ testimonials }),
      
      addTestimonial: (testimonial) =>
        set((state) => ({
          testimonials: [
            ...state.testimonials,
            {
              ...testimonial,
              id: Date.now().toString(),
              createdAt: new Date().toISOString().split("T")[0],
            },
          ],
        })),
      
      updateTestimonial: (id, updates) =>
        set((state) => ({
          testimonials: state.testimonials.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        })),
      
      deleteTestimonial: (id) =>
        set((state) => ({
          testimonials: state.testimonials.filter((t) => t.id !== id),
        })),
      
      toggleActive: (id) =>
        set((state) => ({
          testimonials: state.testimonials.map((t) =>
            t.id === id ? { ...t, isActive: !t.isActive } : t
          ),
        })),
    }),
    {
      name: "testimonials-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
