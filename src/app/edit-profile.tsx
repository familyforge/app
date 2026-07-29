import { uploadAvatar } from '../lib/api/storage';
/// <reference types="nativewind/types" />

import { useMemo, useState, useCallback } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  FlatList,
  Keyboard,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { ArrowLeft, User, ChevronDown, Check, Search, X, Mail, HelpCircle } from "lucide-react-native";
import {
  useProfileStore,
  ParentingRole,
  AppTone,
  Gender,
  MALE_PARENTAL_GOALS,
  FEMALE_PARENTAL_GOALS,
} from "../lib/state/profile-store";

const ROLE_OPTIONS: { label: string; value: ParentingRole }[] = [
  { label: "Single parent", value: "single_parent" },
  { label: "Co-parent", value: "co_parent" },
  { label: "Guardian", value: "guardian" },
  { label: "Other", value: "other" },
];

const TONE_OPTIONS: { label: string; value: AppTone }[] = [
  { label: "Gentle - Soft encouragement", value: "gentle" },
  { label: "Structured - Clear and organized", value: "structured" },
  { label: "Motivational - Energizing and upbeat", value: "motivational" },
];

const GENDER_OPTIONS: { label: string; value: Gender }[] = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
  { label: "Prefer not to say", value: "other" },
];

const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Argentina", "Armenia", "Australia", "Austria",
  "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan",
  "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Cambodia", "Cameroon",
  "Canada", "Chile", "China", "Colombia", "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic",
  "Denmark", "Ecuador", "Egypt", "El Salvador", "Estonia", "Ethiopia", "Fiji", "Finland", "France",
  "Georgia", "Germany", "Ghana", "Greece", "Guatemala", "Haiti", "Honduras", "Hungary", "Iceland", "India",
  "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan",
  "Kenya", "Kuwait", "Kyrgyzstan", "Latvia", "Lebanon", "Libya", "Lithuania", "Luxembourg",
  "Madagascar", "Malaysia", "Mali", "Malta", "Mexico", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco",
  "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway", "Oman",
  "Pakistan", "Panama", "Paraguay", "Peru", "Philippines", "Poland", "Portugal",
  "Qatar", "Romania", "Russia", "Rwanda", "Saudi Arabia", "Senegal", "Serbia", "Singapore", "Slovakia", "Slovenia",
  "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Sweden", "Switzerland", "Syria", "Taiwan",
  "Tanzania", "Thailand", "Tunisia", "Turkey", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States",
  "Uruguay", "Uzbekistan", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe",
];

const LANGUAGES = [
  "English", "Mandarin Chinese", "Hindi", "Spanish", "French", "Arabic", "Bengali", "Portuguese", "Russian", "Japanese",
  "German", "Korean", "Vietnamese", "Turkish", "Italian", "Thai", "Polish", "Ukrainian", "Dutch", "Romanian",
  "Greek", "Czech", "Hungarian", "Swedish", "Indonesian", "Malay", "Finnish", "Norwegian", "Danish", "Hebrew",
  "Tagalog", "Swahili", "Tamil", "Urdu", "Punjabi", "Persian", "Amharic", "Yoruba", "Igbo", "Zulu", "Hausa", "Somali",
];

function ReadOnlyField({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <View className="gap-2">
      <Text className="text-sm font-medium text-slate-400">{label}</Text>
      <View className="flex-row items-center rounded-2xl border border-slate-700 bg-slate-900/50 px-4 py-4">
        {icon && <View className="mr-3">{icon}</View>}
        <Text className="text-base text-slate-300 flex-1">{value || "Not set"}</Text>
      </View>
    </View>
  );
}

export default function EditProfileScreen() {
  const router = useRouter();
  const profile = useProfileStore((s) => s.profile);
  const updateProfile = useProfileStore((s) => s.updateProfile);

  const [countryModalOpen, setCountryModalOpen] = useState(false);
  const [languageModalOpen, setLanguageModalOpen] = useState(false);
  const [genderModalOpen, setGenderModalOpen] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [toneModalOpen, setToneModalOpen] = useState(false);
  const [goalModalOpen, setGoalModalOpen] = useState(false);

  const [countrySearch, setCountrySearch] = useState("");
  const [languageSearch, setLanguageSearch] = useState("");

  const parentalGoalOptions = useMemo(() => {
    if (profile.gender === "female") return FEMALE_PARENTAL_GOALS;
    return MALE_PARENTAL_GOALS;
  }, [profile.gender]);

  const filteredCountries = useMemo(() => {
    if (!countrySearch.trim()) return COUNTRIES;
    return COUNTRIES.filter((c) => c.toLowerCase().includes(countrySearch.toLowerCase()));
  }, [countrySearch]);

  const filteredLanguages = useMemo(() => {
    if (!languageSearch.trim()) return LANGUAGES;
    return LANGUAGES.filter((l) => l.toLowerCase().includes(languageSearch.toLowerCase()));
  }, [languageSearch]);

  const handlePickAvatar = async () => {
    Keyboard.dismiss();
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      // Upload immediately so the stored value is a URL, not a sandbox path.
      // Falls back to the local URI only for instant preview if upload fails;
      // cloud-sync will not push a file:// value.
      const uploaded = await uploadAvatar(result.assets[0].uri, 'parents');
      updateProfile({ avatarUrl: uploaded ?? result.assets[0].uri });
    }
  };

  const handleBack = useCallback(() => {
    Keyboard.dismiss();
    router.back();
  }, [router]);

  const openDropdown = useCallback((setter: (v: boolean) => void) => {
    Keyboard.dismiss();
    setter(true);
  }, []);

  const getGenderLabel = () => GENDER_OPTIONS.find((g) => g.value === profile.gender)?.label || "Select gender";
  const getRoleLabel = () => ROLE_OPTIONS.find((r) => r.value === profile.role)?.label || "Select role";
  const getToneLabel = () => TONE_OPTIONS.find((t) => t.value === profile.tone)?.label.split(" - ")[0] || "Select tone";
  const getGoalLabel = () => parentalGoalOptions.find((g) => g.value === profile.parentalGoal)?.label || "Select your goal";

  return (
    <>
      <SafeAreaView className="flex-1 bg-slate-950" edges={["top"]}>
        <View className="flex-row items-center px-5 py-4 border-b border-slate-800">
          <Pressable onPress={handleBack} className="mr-4 p-2 -ml-2">
            <ArrowLeft size={24} color="#94a3b8" />
          </Pressable>
          <Text className="text-xl font-semibold text-white flex-1">My Profile</Text>
          <View className="w-12" />
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
            <View className="items-center py-8">
              <Pressable
                onPress={handlePickAvatar}
                className="h-28 w-28 rounded-full bg-slate-800 items-center justify-center overflow-hidden border-4 border-slate-700"
              >
                {profile.avatarUrl ? (
                  <Image source={{ uri: profile.avatarUrl }} className="h-28 w-28" />
                ) : (
                  <User size={40} color="#94a3b8" />
                )}
              </Pressable>
              <Pressable onPress={handlePickAvatar} className="mt-3 p-2">
                <Text className="text-emerald-400 font-medium">Change photo</Text>
              </Pressable>
            </View>

            <View className="px-5 gap-5">
              <ReadOnlyField
                label="Name"
                value={profile.name}
                icon={<User size={18} color="#64748b" />}
              />

              <View className="gap-2">
                <Text className="text-sm font-medium text-slate-400">Email</Text>
                <View className="flex-row items-center rounded-2xl border border-slate-700 bg-slate-900/50 px-4 py-4">
                  <Mail size={18} color="#64748b" />
                  <Text className="text-base text-slate-300 flex-1 ml-3">{profile.email || "Not set"}</Text>
                </View>
                <Pressable
                  onPress={() => router.push("/support")}
                  className="flex-row items-center gap-2 mt-1"
                >
                  <HelpCircle size={14} color="#6366f1" />
                  <Text className="text-sm text-indigo-400">Need to change your email? Contact support</Text>
                </Pressable>
              </View>

              <Field label="Gender">
                <DropdownButton
                  value={getGenderLabel()}
                  placeholder="Select gender"
                  onPress={() => openDropdown(setGenderModalOpen)}
                />
              </Field>

              <Field label="Country">
                <DropdownButton
                  value={profile.country}
                  placeholder="Select your country"
                  onPress={() => openDropdown(setCountryModalOpen)}
                />
              </Field>

              <Field label="Language">
                <DropdownButton
                  value={profile.language}
                  placeholder="Select your language"
                  onPress={() => openDropdown(setLanguageModalOpen)}
                />
              </Field>

              <Field label="Parenting role">
                <DropdownButton
                  value={getRoleLabel()}
                  placeholder="Select your role"
                  onPress={() => openDropdown(setRoleModalOpen)}
                />
              </Field>

              <Field label="App tone">
                <DropdownButton
                  value={getToneLabel()}
                  placeholder="Select app tone"
                  onPress={() => openDropdown(setToneModalOpen)}
                />
              </Field>

              <Field label="What is your number one parenting goal?">
                <DropdownButton
                  value={getGoalLabel()}
                  placeholder="Select your goal"
                  onPress={() => openDropdown(setGoalModalOpen)}
                />
              </Field>
            </View>
          </ScrollView>
      </SafeAreaView>

      <SelectionModal
        visible={genderModalOpen}
        onClose={() => setGenderModalOpen(false)}
        title="Select Gender"
        options={GENDER_OPTIONS}
        value={profile.gender}
        onSelect={(value) => {
          updateProfile({ gender: value });
          setGenderModalOpen(false);
        }}
      />

      <SelectionModal
        visible={roleModalOpen}
        onClose={() => setRoleModalOpen(false)}
        title="Select Role"
        options={ROLE_OPTIONS}
        value={profile.role}
        onSelect={(value) => {
          updateProfile({ role: value });
          setRoleModalOpen(false);
        }}
      />

      <SelectionModal
        visible={toneModalOpen}
        onClose={() => setToneModalOpen(false)}
        title="Select App Tone"
        options={TONE_OPTIONS}
        value={profile.tone}
        onSelect={(value) => {
          updateProfile({ tone: value });
          setToneModalOpen(false);
        }}
      />

      <SelectionModal
        visible={goalModalOpen}
        onClose={() => setGoalModalOpen(false)}
        title="Select Your Goal"
        options={parentalGoalOptions}
        value={profile.parentalGoal}
        onSelect={(value) => {
          updateProfile({ parentalGoal: value });
          setGoalModalOpen(false);
        }}
      />

      <SearchableModal
        visible={countryModalOpen}
        onClose={() => {
          setCountryModalOpen(false);
          setCountrySearch("");
        }}
        title="Select Country"
        searchValue={countrySearch}
        onSearchChange={setCountrySearch}
        searchPlaceholder="Search countries..."
        options={filteredCountries}
        value={profile.country}
        onSelect={(value) => {
          updateProfile({ country: value });
          setCountryModalOpen(false);
          setCountrySearch("");
        }}
      />

      <SearchableModal
        visible={languageModalOpen}
        onClose={() => {
          setLanguageModalOpen(false);
          setLanguageSearch("");
        }}
        title="Select Language"
        searchValue={languageSearch}
        onSearchChange={setLanguageSearch}
        searchPlaceholder="Search languages..."
        options={filteredLanguages}
        value={profile.language}
        onSelect={(value) => {
          updateProfile({ language: value });
          setLanguageModalOpen(false);
          setLanguageSearch("");
        }}
      />
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="gap-2">
      <Text className="text-sm font-medium text-slate-400">{label}</Text>
      {children}
    </View>
  );
}

function DropdownButton({
  value,
  placeholder,
  onPress,
}: {
  value: string | null | undefined;
  placeholder: string;
  onPress: () => void;
}) {
  const hasValue = value && value.trim().length > 0 && value !== placeholder;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
      className="flex-row items-center justify-between rounded-2xl border border-slate-700 bg-slate-900 px-4 py-4"
    >
      <Text className={`text-base ${hasValue ? "text-white" : "text-slate-500"}`}>
        {hasValue ? value : placeholder}
      </Text>
      <ChevronDown size={20} color="#94a3b8" />
    </Pressable>
  );
}

function SelectionModal<T extends string>({
  visible,
  onClose,
  title,
  options,
  value,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  options: { label: string; value: T }[];
  value: T | null;
  onSelect: (value: T) => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1 }} pointerEvents="box-none">
        <Pressable
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.6)",
          }}
          onPress={onClose}
        />
        <View style={{ flex: 1, justifyContent: "flex-end" }} pointerEvents="box-none">
          <View className="bg-slate-900 rounded-t-3xl max-h-[70%]">
            <View className="flex-row items-center justify-between px-5 py-4 border-b border-slate-800">
              <Text className="text-lg font-semibold text-white">{title}</Text>
              <Pressable onPress={onClose} className="p-2 -mr-2">
                <X size={24} color="#94a3b8" />
              </Pressable>
            </View>

            <ScrollView className="max-h-96" keyboardShouldPersistTaps="handled">
              {options.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => onSelect(option.value)}
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.7 : 1,
                    backgroundColor: pressed ? "rgba(30, 41, 59, 1)" : "transparent",
                  })}
                  className="flex-row items-center justify-between px-5 py-4 border-b border-slate-800/50"
                >
                  <Text className={`text-base ${value === option.value ? "text-emerald-400" : "text-white"}`}>
                    {option.label}
                  </Text>
                  {value === option.value && <Check size={20} color="#34d399" />}
                </Pressable>
              ))}
            </ScrollView>

            <View className="h-8" />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function SearchableModal({
  visible,
  onClose,
  title,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  options,
  value,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  options: string[];
  value: string | null | undefined;
  onSelect: (value: string) => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1 }} pointerEvents="box-none">
        <Pressable
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.6)",
          }}
          onPress={onClose}
        />
        <View style={{ flex: 1, justifyContent: "flex-end" }} pointerEvents="box-none">
          <View className="bg-slate-900 rounded-t-3xl h-[80%]">
            <View className="flex-row items-center justify-between px-5 py-4 border-b border-slate-800">
              <Text className="text-lg font-semibold text-white">{title}</Text>
              <Pressable onPress={onClose} className="p-2 -mr-2">
                <X size={24} color="#94a3b8" />
              </Pressable>
            </View>

            <View className="px-5 py-3">
              <View className="flex-row items-center bg-slate-800 rounded-xl px-4 py-3">
                <Search size={18} color="#64748b" />
                <TextInput
                  className="flex-1 ml-3 text-base text-white"
                  placeholder={searchPlaceholder}
                  placeholderTextColor="#64748b"
                  value={searchValue}
                  onChangeText={onSearchChange}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {searchValue.length > 0 && (
                  <Pressable onPress={() => onSearchChange("")} className="p-1">
                    <X size={18} color="#64748b" />
                  </Pressable>
                )}
              </View>
            </View>

            <FlatList
              data={options}
              keyExtractor={(item) => item}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => onSelect(item)}
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.7 : 1,
                    backgroundColor: pressed ? "rgba(30, 41, 59, 1)" : "transparent",
                  })}
                  className="flex-row items-center justify-between px-5 py-4 border-b border-slate-800/50"
                >
                  <Text className={`text-base ${value === item ? "text-emerald-400" : "text-white"}`}>
                    {item}
                  </Text>
                  {value === item && <Check size={20} color="#34d399" />}
                </Pressable>
              )}
              ListEmptyComponent={
                <View className="py-8 items-center">
                  <Text className="text-slate-400">No results found</Text>
                </View>
              }
            />

            <View className="h-8" />
          </View>
        </View>
      </View>
    </Modal>
  );
}
