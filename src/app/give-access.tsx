/// <reference types="nativewind/types" />

import { useState, useMemo } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Share,
  Text,
  TextInput,
  View,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { Stack, useRouter } from "expo-router";
import {
  ChevronLeft,
  Plus,
  Users,
  X,
  Check,
  Trash2,
  Mail,
  Copy,
  Share2,
  Shield,
  User,
  UserCheck,
  Clock,
  ChevronRight,
  Info,
} from "lucide-react-native";
import * as Clipboard from "expo-clipboard";
import {
  useFamilyStore,
  AccessType,
  ACCESS_TYPE_INFO,
  DEFAULT_PERMISSIONS,
  FamilyMember,
  Invitation,
} from "../lib/state/family-store";
import { useAppStore } from "../lib/state/app-store";

export default function GiveAccessScreen() {
  const router = useRouter();

  const members = useFamilyStore((state) => state.members);
  const invitations = useFamilyStore((state) => state.invitations);
  const addMember = useFamilyStore((state) => state.addMember);
  const removeMember = useFamilyStore((state) => state.removeMember);
  const createInvitation = useFamilyStore((state) => state.createInvitation);
  const cancelInvitation = useFamilyStore((state) => state.cancelInvitation);

  const children = useAppStore((state) => state.children);
  const activeChildren = useMemo(
    () => children.filter((c) => !c.archived),
    [children]
  );

  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [selectedAccessType, setSelectedAccessType] = useState<AccessType>("co_parent");
  const [selectedChildIds, setSelectedChildIds] = useState<string[]>([]);
  const [lastInvitation, setLastInvitation] = useState<Invitation | null>(null);

  const pendingInvitations = useMemo(
    () => invitations.filter((i) => i.status === "pending"),
    [invitations]
  );

  const acceptedMembers = useMemo(
    () => members.filter((m) => m.status === "accepted"),
    [members]
  );

  const openInviteModal = () => {
    setInviteEmail("");
    setSelectedAccessType("co_parent");
    setSelectedChildIds([]);
    setLastInvitation(null);
    setInviteModalOpen(true);
  };

  const openMemberModal = (member: FamilyMember) => {
    setSelectedMember(member);
    setMemberModalOpen(true);
  };

  const handleCreateInvitation = () => {
    if (!inviteEmail.trim()) return;

    const invitation = createInvitation(inviteEmail.trim(), selectedAccessType);
    setLastInvitation(invitation);
  };

  const handleCopyCode = async () => {
    if (lastInvitation) {
      await Clipboard.setStringAsync(lastInvitation.code);
      Alert.alert("Copied!", "Invitation code copied to clipboard");
    }
  };

  const handleShareInvite = async () => {
    if (lastInvitation) {
      try {
        await Share.share({
          message: `You've been invited to join our family on FamilyForge! Use this code to join: ${lastInvitation.code}`,
          title: "Family Invitation",
        });
      } catch (error) {
        console.error("Share error:", error);
      }
    }
  };

  const toggleChildSelection = (childId: string) => {
    setSelectedChildIds((prev) =>
      prev.includes(childId)
        ? prev.filter((id) => id !== childId)
        : [...prev, childId]
    );
  };

  const handleRemoveMember = () => {
    if (selectedMember) {
      removeMember(selectedMember.id);
      setMemberModalOpen(false);
      setSelectedMember(null);
    }
  };

  const getAccessTypeIcon = (type: AccessType) => {
    switch (type) {
      case "partner":
        return UserCheck;
      case "co_parent":
        return Users;
      case "guardian":
        return Shield;
      case "child":
        return User;
      default:
        return User;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-950" edges={["top"]}>
      <Stack.Screen
        options={{
          title: "Give Access",
          headerShown: false,
        }}
      />

      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-4 border-b border-slate-800">
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 rounded-full bg-slate-800 items-center justify-center"
        >
          <ChevronLeft size={24} color="#fff" />
        </Pressable>
        <Text className="text-xl font-bold text-white">Give Access</Text>
        <Pressable
          onPress={openInviteModal}
          className="h-10 w-10 rounded-full bg-purple-500/20 items-center justify-center"
        >
          <Plus size={24} color="#8b5cf6" />
        </Pressable>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Intro Card */}
        <View className="px-5 pt-6">
          <View className="rounded-2xl border border-purple-500/30 bg-purple-500/10 p-4">
            <View className="flex-row items-center gap-3 mb-2">
              <Users size={20} color="#8b5cf6" />
              <Text className="text-lg font-semibold text-white">Family Sharing</Text>
            </View>
            <Text className="text-sm text-slate-300 leading-relaxed">
              Invite family members to help manage your children's tasks, rewards, and schedules. Each person can have different access levels.
            </Text>
          </View>
        </View>

        {/* Pending Invitations */}
        {pendingInvitations.length > 0 && (
          <View className="px-5 mt-6">
            <Text className="text-lg font-semibold text-white mb-3">Pending Invitations</Text>
            <View className="gap-3">
              {pendingInvitations.map((invitation) => {
                const typeInfo = ACCESS_TYPE_INFO[invitation.accessType];
                return (
                  <View
                    key={invitation.id}
                    className="rounded-2xl border border-slate-800 bg-slate-900 p-4"
                  >
                    <View className="flex-row items-center justify-between mb-2">
                      <View className="flex-row items-center gap-2">
                        <Clock size={14} color="#f59e0b" />
                        <Text className="text-sm text-amber-400">Pending</Text>
                      </View>
                      <Pressable
                        onPress={() => cancelInvitation(invitation.id)}
                        className="h-8 w-8 rounded-full bg-red-500/10 items-center justify-center"
                      >
                        <X size={14} color="#ef4444" />
                      </Pressable>
                    </View>
                    <Text className="text-white font-medium">{invitation.email}</Text>
                    <View className="flex-row items-center gap-2 mt-1">
                      <View
                        className="px-2 py-0.5 rounded"
                        style={{ backgroundColor: `${typeInfo.color}20` }}
                      >
                        <Text style={{ color: typeInfo.color }} className="text-xs">
                          {typeInfo.label}
                        </Text>
                      </View>
                      <Text className="text-xs text-slate-400">Code: {invitation.code}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Active Members */}
        <View className="px-5 mt-6">
          <Text className="text-lg font-semibold text-white mb-3">Family Members</Text>
          
          {acceptedMembers.length === 0 ? (
            <View className="rounded-2xl border border-slate-800 border-dashed p-8 items-center">
              <Users size={32} color="#64748b" />
              <Text className="text-slate-400 text-center mt-3">
                No family members yet. Invite someone to share parenting responsibilities!
              </Text>
              <Pressable
                onPress={openInviteModal}
                className="mt-4 px-6 py-3 rounded-full bg-purple-500"
              >
                <Text className="text-white font-medium">Invite Family Member</Text>
              </Pressable>
            </View>
          ) : (
            <View className="gap-3">
              {acceptedMembers.map((member) => {
                const typeInfo = ACCESS_TYPE_INFO[member.accessType];
                const IconComponent = getAccessTypeIcon(member.accessType);

                return (
                  <Pressable
                    key={member.id}
                    onPress={() => openMemberModal(member)}
                    className="rounded-2xl border border-slate-800 bg-slate-900 p-4"
                  >
                    <View className="flex-row items-center">
                      <View
                        className="h-12 w-12 rounded-full items-center justify-center mr-4"
                        style={{ backgroundColor: `${typeInfo.color}20` }}
                      >
                        <IconComponent size={20} color={typeInfo.color} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-base font-medium text-white">
                          {member.name}
                        </Text>
                        <Text className="text-xs text-slate-400">{member.email}</Text>
                        <View
                          className="px-2 py-0.5 rounded self-start mt-1"
                          style={{ backgroundColor: `${typeInfo.color}20` }}
                        >
                          <Text style={{ color: typeInfo.color }} className="text-xs">
                            {typeInfo.label}
                          </Text>
                        </View>
                      </View>
                      <ChevronRight size={20} color="#64748b" />
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        {/* Access Types Explained */}
        <View className="px-5 mt-6">
          <Text className="text-lg font-semibold text-white mb-3">Access Types</Text>
          <View className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
            {(Object.entries(ACCESS_TYPE_INFO) as [AccessType, typeof ACCESS_TYPE_INFO["partner"]][]).map(
              ([type, info], index) => (
                <View
                  key={type}
                  className={`p-4 ${
                    index < Object.entries(ACCESS_TYPE_INFO).length - 1
                      ? "border-b border-slate-800"
                      : ""
                  }`}
                >
                  <View className="flex-row items-center gap-2 mb-1">
                    <View
                      className="h-6 w-6 rounded-full items-center justify-center"
                      style={{ backgroundColor: `${info.color}20` }}
                    >
                      <Shield size={12} color={info.color} />
                    </View>
                    <Text className="text-base font-medium text-white">{info.label}</Text>
                  </View>
                  <Text className="text-xs text-slate-400 ml-8">{info.description}</Text>
                </View>
              )
            )}
          </View>
        </View>
      </ScrollView>

      {/* Invite Modal */}
      <Modal visible={inviteModalOpen} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/60">
          <View className="bg-slate-900 rounded-t-3xl border-t border-slate-800 max-h-[90%]">
            {/* Modal Header */}
            <View className="flex-row items-center justify-between p-5 border-b border-slate-800">
              <Pressable onPress={() => setInviteModalOpen(false)}>
                <X size={24} color="#94a3b8" />
              </Pressable>
              <Text className="text-lg font-semibold text-white">Invite Family Member</Text>
              <View className="w-6" />
            </View>

            <KeyboardAwareScrollView 
              className="px-5 py-6"
              bottomOffset={50}
              keyboardShouldPersistTaps="handled"
            >
              {lastInvitation ? (
                /* Success State */
                <View className="items-center py-6">
                  <View className="h-16 w-16 rounded-full bg-emerald-500/20 items-center justify-center mb-4">
                    <Check size={32} color="#10b981" />
                  </View>
                  <Text className="text-xl font-bold text-white mb-2">Invitation Created!</Text>
                  <Text className="text-slate-400 text-center mb-6">
                    Share this code with {lastInvitation.email}
                  </Text>

                  {/* Code Display */}
                  <View className="w-full rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 mb-4">
                    <Text className="text-3xl font-bold text-emerald-400 text-center tracking-widest">
                      {lastInvitation.code}
                    </Text>
                  </View>

                  {/* Actions */}
                  <View className="flex-row gap-3 w-full mb-4">
                    <Pressable
                      onPress={handleCopyCode}
                      className="flex-1 flex-row items-center justify-center gap-2 py-3 rounded-xl bg-slate-800"
                    >
                      <Copy size={16} color="#94a3b8" />
                      <Text className="text-slate-300 font-medium">Copy Code</Text>
                    </Pressable>
                    <Pressable
                      onPress={handleShareInvite}
                      className="flex-1 flex-row items-center justify-center gap-2 py-3 rounded-xl bg-purple-500"
                    >
                      <Share2 size={16} color="#fff" />
                      <Text className="text-white font-medium">Share</Text>
                    </Pressable>
                  </View>

                  <Pressable
                    onPress={() => {
                      setLastInvitation(null);
                      setInviteEmail("");
                    }}
                    className="mt-4"
                  >
                    <Text className="text-slate-400">Invite another person</Text>
                  </Pressable>
                </View>
              ) : (
                /* Form State */
                <>
                  {/* Email */}
                  <Text className="text-sm font-medium text-slate-400 mb-2">Email Address</Text>
                  <View className="flex-row items-center bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 mb-4">
                    <Mail size={18} color="#64748b" />
                    <TextInput
                      value={inviteEmail}
                      onChangeText={setInviteEmail}
                      placeholder="family@example.com"
                      placeholderTextColor="#64748b"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      className="flex-1 ml-3 text-white"
                    />
                  </View>

                  {/* Access Type */}
                  <Text className="text-sm font-medium text-slate-400 mb-2">Access Type</Text>
                  <View className="gap-2 mb-4">
                    {(Object.entries(ACCESS_TYPE_INFO) as [AccessType, typeof ACCESS_TYPE_INFO["partner"]][]).map(
                      ([type, info]) => {
                        const isSelected = selectedAccessType === type;
                        return (
                          <Pressable
                            key={type}
                            onPress={() => setSelectedAccessType(type)}
                            className={`p-4 rounded-xl border ${
                              isSelected
                                ? "border-purple-500 bg-purple-500/10"
                                : "border-slate-700 bg-slate-800"
                            }`}
                          >
                            <View className="flex-row items-center gap-2 mb-1">
                              <View
                                className={`h-5 w-5 rounded-full border-2 items-center justify-center ${
                                  isSelected
                                    ? "border-purple-500 bg-purple-500"
                                    : "border-slate-600"
                                }`}
                              >
                                {isSelected && <Check size={12} color="#fff" />}
                              </View>
                              <Text
                                className={`font-medium ${
                                  isSelected ? "text-purple-400" : "text-white"
                                }`}
                              >
                                {info.label}
                              </Text>
                            </View>
                            <Text className="text-xs text-slate-400 ml-7">
                              {info.description}
                            </Text>
                          </Pressable>
                        );
                      }
                    )}
                  </View>

                  {/* Child Selection for co_parent and guardian */}
                  {(selectedAccessType === "co_parent" || selectedAccessType === "guardian") &&
                    activeChildren.length > 0 && (
                      <>
                        <Text className="text-sm font-medium text-slate-400 mb-2">
                          Which children can they access?
                        </Text>
                        <View className="gap-2 mb-6">
                          {activeChildren.map((child) => {
                            const isSelected = selectedChildIds.includes(child.id);
                            return (
                              <Pressable
                                key={child.id}
                                onPress={() => toggleChildSelection(child.id)}
                                className={`flex-row items-center p-3 rounded-xl border ${
                                  isSelected
                                    ? "border-emerald-500 bg-emerald-500/10"
                                    : "border-slate-700 bg-slate-800"
                                }`}
                              >
                                <View
                                  className={`h-5 w-5 rounded border-2 items-center justify-center mr-3 ${
                                    isSelected
                                      ? "border-emerald-500 bg-emerald-500"
                                      : "border-slate-600"
                                  }`}
                                >
                                  {isSelected && <Check size={12} color="#fff" />}
                                </View>
                                <Text className="text-white">{child.name}</Text>
                              </Pressable>
                            );
                          })}
                        </View>
                      </>
                    )}

                  {/* Create Button */}
                  <Pressable
                    onPress={handleCreateInvitation}
                    disabled={!inviteEmail.trim()}
                    className={`py-4 rounded-xl items-center ${
                      inviteEmail.trim() ? "bg-purple-500" : "bg-slate-700"
                    }`}
                  >
                    <Text
                      className={`font-semibold ${
                        inviteEmail.trim() ? "text-white" : "text-slate-400"
                      }`}
                    >
                      Create Invitation
                    </Text>
                  </Pressable>
                </>
              )}
            </KeyboardAwareScrollView>
          </View>
        </View>
      </Modal>

      {/* Member Details Modal */}
      <Modal visible={memberModalOpen} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/60">
          <View className="bg-slate-900 rounded-t-3xl border-t border-slate-800">
            {/* Modal Header */}
            <View className="flex-row items-center justify-between p-5 border-b border-slate-800">
              <Pressable onPress={() => setMemberModalOpen(false)}>
                <X size={24} color="#94a3b8" />
              </Pressable>
              <Text className="text-lg font-semibold text-white">Member Details</Text>
              <View className="w-6" />
            </View>

            {selectedMember && (
              <View className="px-5 py-6">
                {/* Member Info */}
                <View className="items-center mb-6">
                  <View
                    className="h-16 w-16 rounded-full items-center justify-center mb-3"
                    style={{
                      backgroundColor: `${ACCESS_TYPE_INFO[selectedMember.accessType].color}20`,
                    }}
                  >
                    <User size={28} color={ACCESS_TYPE_INFO[selectedMember.accessType].color} />
                  </View>
                  <Text className="text-xl font-bold text-white">{selectedMember.name}</Text>
                  <Text className="text-sm text-slate-400">{selectedMember.email}</Text>
                  <View
                    className="px-3 py-1 rounded-full mt-2"
                    style={{
                      backgroundColor: `${ACCESS_TYPE_INFO[selectedMember.accessType].color}20`,
                    }}
                  >
                    <Text
                      style={{ color: ACCESS_TYPE_INFO[selectedMember.accessType].color }}
                      className="text-sm font-medium"
                    >
                      {ACCESS_TYPE_INFO[selectedMember.accessType].label}
                    </Text>
                  </View>
                </View>

                {/* Permissions Summary */}
                <View className="rounded-2xl border border-slate-800 bg-slate-800/50 p-4 mb-6">
                  <Text className="text-sm font-medium text-slate-400 mb-3">Permissions</Text>
                  <View className="gap-2">
                    {selectedMember.permissions.canViewChildren && (
                      <View className="flex-row items-center gap-2">
                        <Check size={14} color="#10b981" />
                        <Text className="text-sm text-slate-300">View children</Text>
                      </View>
                    )}
                    {selectedMember.permissions.canEditTasks && (
                      <View className="flex-row items-center gap-2">
                        <Check size={14} color="#10b981" />
                        <Text className="text-sm text-slate-300">Edit tasks</Text>
                      </View>
                    )}
                    {selectedMember.permissions.canApproveRewards && (
                      <View className="flex-row items-center gap-2">
                        <Check size={14} color="#10b981" />
                        <Text className="text-sm text-slate-300">Approve rewards</Text>
                      </View>
                    )}
                    {selectedMember.permissions.canViewCalendar && (
                      <View className="flex-row items-center gap-2">
                        <Check size={14} color="#10b981" />
                        <Text className="text-sm text-slate-300">View calendar</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Remove Member */}
                <Pressable
                  onPress={handleRemoveMember}
                  className="flex-row items-center justify-center gap-2 py-3 rounded-xl border border-red-500/30 bg-red-500/10"
                >
                  <Trash2 size={16} color="#ef4444" />
                  <Text className="text-red-400 font-medium">Remove Member</Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
