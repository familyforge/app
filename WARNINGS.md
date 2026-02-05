# WARNINGS

## Email System Rule

## Critical Directives from AGENTS.md
- Use npm for the Expo/mobile app; reserve bun exclusively for the admin dashboard workflows.
- Never delete, rename, or refactor `RootLayoutNav` in `src/app/_layout.tsx`.
- Expo Router rules:
  - Every file in `src/app/` is a route; keep tab routes defined only inside `src/app/(tabs)/_layout.tsx`.
  - Avoid tabs for game-like experiences; they should use full-screen stacks.
  - Do not ship a single-tab layout—tabs require at least two entries.
  - Prevent double headers by removing headers in tabs and nesting stacks properly.
- React Query usage:
  - Always use the object API (`useQuery({ ... })`).
  - React Query provider must wrap all other providers; never wrap `RootLayoutNav` directly.
  - Use `useMutation` for async operations instead of manual loading state flags.
  - Reuse shared query keys and avoid creating duplicate providers.
- Zustand usage: always subscribe via selectors that return primitives. Do not select the whole store or invoke store methods inside selectors.
- Safe area handling: import from `react-native-safe-area-context`, never from `react-native`. Only add SafeArea wrappers when headers are hidden/custom; skip them when native Stack/Tab headers are active.
- Styling requirements:
  - Use NativeWind for styling and the `cn()` helper for conditional classes.
  - `CameraView`, `LinearGradient`, and `Animated` do not accept `className`; use `style` props instead.
  - Horizontal `ScrollView`s expand vertically unless `style={{ flexGrow: 0 }}` is set.
- Camera usage: use `CameraView` from `expo-camera` (with `style={{ flex: 1 }}`) and absolute-position overlay UI. Do not use the deprecated `Camera` API.
- React Native constraints:
  - Do not import or rely on Node.js `buffer`.
  - Prefer `Pressable` over `TouchableOpacity`.
  - Use custom modals instead of `Alert.alert()`.
  - Ensure keyboards can always be dismissed (consider `react-native-keyboard-controller`).
- Animations & gestures: documentation for `react-native-reanimated` v3 and `react-native-gesture-handler` evolves quickly—verify current APIs before implementation.

## Critical Warnings from README.md
- Date & time policy: no manual typing of dates or times anywhere in the product—always use native pickers/calendars.
- Child deletion flow requirements:
  - Children must be archived before deletion.
  - Deletion demands full-name + DOB confirmation via pickers.
  - A 24-hour countdown/restore window is mandatory before permanent removal.
- Child account permissions: child users are strictly view-only (calendar, deadlines, family info, points, rewards, assigned tasks, routines, learning assignments, last 180 days of activity). They cannot edit data or view items older than 180 days.
- History visibility limit: never display data older than 180 days for events, deadlines, tasks, or learning activities.
- Media retention: media tied to dated content must be deleted from cloud storage 30 days after the item’s date passes (offline cache may persist locally, but expired media cannot remain in the cloud).
- Log-out availability: every profile type (parent, partner, co-parent, guardian, child) must always have a working log-out action.
- Onboarding update directive: the onboarding flow already exists—per the README, updates must enhance it without breaking existing steps, and it now spans 25 pre-summary screens followed by the emotional summary/purchase flow.
- Cloud plan restrictions: Forge plan is the only tier with cloud sync and partner/guardian access sharing; other plans may only invite/link children.
```