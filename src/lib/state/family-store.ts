import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { nanoid } from "nanoid/non-secure";

// Permission types
export type AccessType = "partner" | "co_parent" | "guardian" | "child";

export interface FamilyMember {
  id: string;
  name: string;
  email: string;
  accessType: AccessType;
  status: "pending" | "accepted" | "declined";
  invitedAt: string;
  acceptedAt?: string;
  childIds?: string[]; // For co-parents/guardians, which children they can access
  permissions: MemberPermissions;
}

export interface MemberPermissions {
  // View permissions
  canViewChildren: boolean;
  canViewTasks: boolean;
  canViewRewards: boolean;
  canViewCalendar: boolean;
  canViewProgress: boolean;

  // Edit permissions
  canEditChildren: boolean;
  canEditTasks: boolean;
  canEditRewards: boolean;
  canEditCalendar: boolean;

  // Action permissions
  canApproveRewards: boolean;
  canCompleteTasksFor: boolean;
  canSendNotifications: boolean;
}

export interface Invitation {
  id: string;
  email: string;
  accessType: AccessType;
  code: string;
  expiresAt: string;
  status: "pending" | "accepted" | "expired";
  createdAt: string;
}

// Default permissions based on access type
export const DEFAULT_PERMISSIONS: Record<AccessType, MemberPermissions> = {
  partner: {
    canViewChildren: true,
    canViewTasks: true,
    canViewRewards: true,
    canViewCalendar: true,
    canViewProgress: true,
    canEditChildren: true,
    canEditTasks: true,
    canEditRewards: true,
    canEditCalendar: true,
    canApproveRewards: true,
    canCompleteTasksFor: true,
    canSendNotifications: true,
  },
  co_parent: {
    canViewChildren: true,
    canViewTasks: true,
    canViewRewards: true,
    canViewCalendar: true,
    canViewProgress: true,
    canEditChildren: false,
    canEditTasks: true,
    canEditRewards: false,
    canEditCalendar: true,
    canApproveRewards: true,
    canCompleteTasksFor: true,
    canSendNotifications: true,
  },
  guardian: {
    canViewChildren: true,
    canViewTasks: true,
    canViewRewards: true,
    canViewCalendar: true,
    canViewProgress: false,
    canEditChildren: false,
    canEditTasks: false,
    canEditRewards: false,
    canEditCalendar: false,
    canApproveRewards: true,
    canCompleteTasksFor: true,
    canSendNotifications: false,
  },
  child: {
    canViewChildren: false,
    canViewTasks: true, // Only their own
    canViewRewards: true, // Only their own
    canViewCalendar: true, // Family events
    canViewProgress: false,
    canEditChildren: false,
    canEditTasks: false,
    canEditRewards: false,
    canEditCalendar: false,
    canApproveRewards: false,
    canCompleteTasksFor: false,
    canSendNotifications: false,
  },
};

export const ACCESS_TYPE_INFO: Record<
  AccessType,
  { label: string; description: string; color: string }
> = {
  partner: {
    label: "Partner",
    description: "Full access to everything. Can manage children, tasks, rewards, and settings.",
    color: "#10b981",
  },
  co_parent: {
    label: "Co-parent",
    description: "Can view and manage tasks/calendar for assigned children. Cannot edit child profiles or rewards.",
    color: "#3b82f6",
  },
  guardian: {
    label: "Guardian",
    description: "Limited access. Can approve rewards and complete tasks when caring for children.",
    color: "#f59e0b",
  },
  child: {
    label: "Child",
    description: "Can view their own tasks and rewards. Cannot edit anything.",
    color: "#8b5cf6",
  },
};

interface FamilyState {
  members: FamilyMember[];
  invitations: Invitation[];

  // Actions
  addMember: (member: Omit<FamilyMember, "id" | "invitedAt" | "status">) => FamilyMember;
  updateMember: (id: string, updates: Partial<FamilyMember>) => void;
  removeMember: (id: string) => void;
  updateMemberPermissions: (id: string, permissions: Partial<MemberPermissions>) => void;

  // Invitation actions
  createInvitation: (email: string, accessType: AccessType) => Invitation;
  cancelInvitation: (id: string) => void;
  acceptInvitation: (invitationId: string, memberName: string) => void;

  // Utility
  getMembersByAccessType: (accessType: AccessType) => FamilyMember[];
  getMembersForChild: (childId: string) => FamilyMember[];
  resetStore: () => void;
}

const generateInviteCode = (): string => {
  return nanoid(8).toUpperCase();
};

const initialState = {
  members: [],
  invitations: [],
};

export const useFamilyStore = create<FamilyState>()(
  persist(
    (set, get) => ({
      ...initialState,

      addMember: (memberData) => {
        const newMember: FamilyMember = {
          id: nanoid(),
          ...memberData,
          status: "pending",
          invitedAt: new Date().toISOString(),
        };
        set((state) => ({
          members: [...state.members, newMember],
        }));
        return newMember;
      },

      updateMember: (id, updates) => {
        set((state) => ({
          members: state.members.map((m) =>
            m.id === id ? { ...m, ...updates } : m
          ),
        }));
      },

      removeMember: (id) => {
        set((state) => ({
          members: state.members.filter((m) => m.id !== id),
        }));
      },

      updateMemberPermissions: (id, permissions) => {
        set((state) => ({
          members: state.members.map((m) =>
            m.id === id
              ? { ...m, permissions: { ...m.permissions, ...permissions } }
              : m
          ),
        }));
      },

      createInvitation: (email, accessType) => {
        const invitation: Invitation = {
          id: nanoid(),
          email,
          accessType,
          code: generateInviteCode(),
          status: "pending",
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        };
        set((state) => ({
          invitations: [...state.invitations, invitation],
        }));
        return invitation;
      },

      cancelInvitation: (id) => {
        set((state) => ({
          invitations: state.invitations.filter((i) => i.id !== id),
        }));
      },

      acceptInvitation: (invitationId, memberName) => {
        const invitation = get().invitations.find((i) => i.id === invitationId);
        if (!invitation) return;

        const newMember: FamilyMember = {
          id: nanoid(),
          name: memberName,
          email: invitation.email,
          accessType: invitation.accessType,
          status: "accepted",
          invitedAt: invitation.createdAt,
          acceptedAt: new Date().toISOString(),
          permissions: DEFAULT_PERMISSIONS[invitation.accessType],
        };

        set((state) => ({
          members: [...state.members, newMember],
          invitations: state.invitations.map((i) =>
            i.id === invitationId ? { ...i, status: "accepted" as const } : i
          ),
        }));
      },

      getMembersByAccessType: (accessType) => {
        return get().members.filter((m) => m.accessType === accessType);
      },

      getMembersForChild: (childId) => {
        return get().members.filter(
          (m) =>
            m.accessType === "partner" ||
            (m.childIds && m.childIds.includes(childId))
        );
      },

      resetStore: () => {
        set(initialState);
      },
    }),
    {
      name: "family-store",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
