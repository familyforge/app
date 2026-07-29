// Which children have been set up on THIS device.
//
// A family may share one device. Once a child has signed in with a one-time
// code they should never have to do it again — and a sibling who has also signed
// in once can be switched to without another code. That means holding one
// refresh token per child locally and swapping the active Supabase session.
//
// Refresh tokens live in AsyncStorage, which is sandboxed to the app. This is
// the same shape any multi-account client uses. Signing a child out removes
// their token from the device.

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LinkedChild {
  childId: string;
  name: string;
  /** Supabase refresh token — exchanged for a session when switching to them. */
  refreshToken: string;
  linkedAt: string;
  lastActiveAt: string;
}

interface ChildDeviceState {
  linkedChildren: LinkedChild[];
  activeChildId: string | null;

  linkChild: (child: Omit<LinkedChild, 'linkedAt' | 'lastActiveAt'>) => void;
  /** Refresh tokens rotate on use; keep the newest or the next switch fails. */
  updateToken: (childId: string, refreshToken: string) => void;
  setActiveChild: (childId: string) => void;
  /**
   * Leave the current session but KEEP the device link.
   *
   * This is what "Sign out" means to a child: hand the device back, or let a
   * sibling on. Their token is retained so they can resume by tapping their own
   * name — no new code from a grown-up. Removing a child from the device
   * entirely is `unlinkChild`, which is deliberately a separate, rarer action.
   */
  signOutActive: () => void;
  unlinkChild: (childId: string) => void;
  unlinkAll: () => void;
}

export const useChildDeviceStore = create<ChildDeviceState>()(
  persist(
    (set, get) => ({
      linkedChildren: [],
      activeChildId: null,

      linkChild: (child) => {
        const now = new Date().toISOString();
        const existing = get().linkedChildren.find((c) => c.childId === child.childId);
        set({
          linkedChildren: existing
            ? get().linkedChildren.map((c) =>
                c.childId === child.childId
                  ? { ...c, ...child, lastActiveAt: now }
                  : c
              )
            : [...get().linkedChildren, { ...child, linkedAt: now, lastActiveAt: now }],
          activeChildId: child.childId,
        });
      },

      updateToken: (childId, refreshToken) =>
        set({
          linkedChildren: get().linkedChildren.map((c) =>
            c.childId === childId ? { ...c, refreshToken } : c
          ),
        }),

      setActiveChild: (childId) =>
        set({
          activeChildId: childId,
          linkedChildren: get().linkedChildren.map((c) =>
            c.childId === childId ? { ...c, lastActiveAt: new Date().toISOString() } : c
          ),
        }),

      signOutActive: () => set({ activeChildId: null }),

      unlinkChild: (childId) => {
        const remaining = get().linkedChildren.filter((c) => c.childId !== childId);
        set({
          linkedChildren: remaining,
          activeChildId:
            get().activeChildId === childId ? remaining[0]?.childId ?? null : get().activeChildId,
        });
      },

      unlinkAll: () => set({ linkedChildren: [], activeChildId: null }),
    }),
    {
      name: 'familyforge-child-device',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
