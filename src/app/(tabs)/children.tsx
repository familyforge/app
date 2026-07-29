import { useMemo, useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Modal, Image, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useRouter } from 'expo-router';
import { Plus, Edit3, Archive, User, Trash2, RotateCcw, AlertTriangle, ChevronDown, ChevronRight, Camera, ImagePlus, KeyRound, Eye } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useAppStore } from '../../lib/state/app-store';
import { ChildLoginCodeModal } from '../../components/ChildLoginCodeModal';
import { CaregiverLabelModal } from '../../components/CaregiverLabelModal';
import { ChildVisualNeedsModal } from '../../components/ChildVisualNeedsModal';
import { supabase, isSupabaseConfigured } from '../../lib/api/supabase';
import { uploadAvatar, displayableImage } from '../../lib/api/storage';
import { ACADEMIC_YEARS, AcademicYear } from '../../lib/state/learning-store';

// Type for children pending deletion with countdown
interface PendingDeletion {
  childId: string;
  deletionTime: number; // timestamp when deletion will occur
}

export default function ChildrenScreen() {
  const router = useRouter();
  const children = useAppStore((s) => s.children);
  const addChild = useAppStore((s) => s.addChild);
  const updateChild = useAppStore((s) => s.updateChild);
  const removeChild = useAppStore((s) => s.removeChild);

  const activeChildren = useMemo(() => children.filter((child) => !child.archived), [children]);
  const archivedChildren = useMemo(() => children.filter((child) => child.archived), [children]);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingChildId, setEditingChildId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [age, setAge] = useState('');
  const [birthdayDate, setBirthdayDate] = useState<Date | null>(null);
  const [showBirthdayPicker, setShowBirthdayPicker] = useState(false);
  const [childClass, setChildClass] = useState('');
  const [interests, setInterests] = useState('');
  const [learningStyle, setLearningStyle] = useState('');
  const [specialNeeds, setSpecialNeeds] = useState('');
  const [photo, setPhoto] = useState('');
  const [academicYear, setAcademicYear] = useState<AcademicYear | null>(null);
  const [showAcademicYearPicker, setShowAcademicYearPicker] = useState(false);

  // Delete confirmation modal states
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [childToDelete, setChildToDelete] = useState<string | null>(null);
  // Child whose Kids-app sign-in code is being shown.
  const [codeForChild, setCodeForChild] = useState<{ id: string; name: string } | null>(null);
  // What this parent's children call them — drives all Kids-app copy.
  const [labelOpen, setLabelOpen] = useState(false);
  const [caregiverLabel, setCaregiverLabel] = useState<string | null>(null);
  // Per-child visual accessibility (calm palette / reduced motion).
  const [visualForChild, setVisualForChild] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isSupabaseConfigured()) return;
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user?.id) return;
      const { data } = await supabase
        .from('parents')
        .select('caregiver_label')
        .eq('id', auth.user.id)
        .maybeSingle();
      const label = (data as { caregiver_label?: string | null } | null)?.caregiver_label;
      if (!cancelled && label) setCaregiverLabel(label);
    })();
    return () => { cancelled = true; };
  }, []);
  const [confirmName, setConfirmName] = useState('');
  const [deleteError, setDeleteError] = useState('');

  // Pending deletions with countdown
  const [pendingDeletions, setPendingDeletions] = useState<PendingDeletion[]>([]);
  const [countdownTick, setCountdownTick] = useState(0);

  // Update countdown every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdownTick((t) => t + 1);
      
      // Check for expired countdowns
      const now = Date.now();
      setPendingDeletions((prev) => {
        const expired = prev.filter((p) => now >= p.deletionTime);
        expired.forEach((p) => {
          removeChild(p.childId);
        });
        return prev.filter((p) => now < p.deletionTime);
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [removeChild]);

  const getPendingDeletion = (childId: string) => {
    return pendingDeletions.find((p) => p.childId === childId);
  };

  const getCountdownText = (deletionTime: number) => {
    const remaining = Math.max(0, deletionTime - Date.now());
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const resetForm = () => {
    setEditingChildId(null);
    setName('');
    setNickname('');
    setAge('');
    setBirthdayDate(null);
    setShowBirthdayPicker(false);
    setChildClass('');
    setInterests('');
    setLearningStyle('');
    setSpecialNeeds('');
    setPhoto('');
    setAcademicYear(null);
    setShowAcademicYearPicker(false);
    setModalVisible(false);
  };

  const handleBirthdayChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowBirthdayPicker(false);
    }
    if (event.type === 'set' && selectedDate) {
      setBirthdayDate(selectedDate);
      // Auto-calculate age from birthday
      const today = new Date();
      const birthYear = selectedDate.getFullYear();
      const birthMonth = selectedDate.getMonth();
      const birthDay = selectedDate.getDate();
      let calculatedAge = today.getFullYear() - birthYear;
      if (today.getMonth() < birthMonth || (today.getMonth() === birthMonth && today.getDate() < birthDay)) {
        calculatedAge--;
      }
      if (calculatedAge >= 0) {
        setAge(calculatedAge.toString());
      }
    }
  };

  const formatDateForDisplay = (date: Date | null) => {
    if (!date) return 'Select date of birth';
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatDateForStorage = (date: Date | null) => {
    if (!date) return null;
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const handlePickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      setPhoto(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return;

    // Upload before saving so the stored value is a URL both apps can load, not
    // a file:// path into this handset's sandbox. Returns the input unchanged
    // if it is already remote, so re-saving an unedited profile re-uploads
    // nothing; returns null on failure, which must not block the save.
    const uploadedPicture = photo ? await uploadAvatar(photo, 'children') : null;

    const payload = {
      name: name.trim(),
      nickname: nickname.trim() || undefined,
      age: parseInt(age, 10) || 0,
      birthday: formatDateForStorage(birthdayDate),
      className: childClass.trim(),
      interests: interests
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      learningStyle: learningStyle.trim(),
      specialNeeds: specialNeeds.trim(),
      picture: uploadedPicture ?? (displayableImage(photo) || null),
      academicYear: academicYear || undefined,
    };

    if (editingChildId) {
      updateChild(editingChildId, payload);
    } else {
      addChild(payload);
    }

    resetForm();
  };

  const handleEdit = (childId: string) => {
    const child = children.find((item) => item.id === childId);
    if (!child) return;
    setEditingChildId(child.id);
    setName(child.name);
    setNickname(child.nickname ?? '');
    setAge(child.age.toString());
    // Parse birthday string to Date
    if (child.birthday) {
      const [year, month, day] = child.birthday.split('-').map(Number);
      setBirthdayDate(new Date(year, month - 1, day));
    } else {
      setBirthdayDate(null);
    }
    setChildClass(child.class ?? '');
    setInterests((child.interests ?? []).join(', '));
    setLearningStyle(child.learningStyle ?? '');
    setSpecialNeeds(child.specialNeeds ?? '');
    setPhoto(child.picture ?? '');
    setAcademicYear((child.academicYear as AcademicYear) || null);
    setModalVisible(true);
  };

  const handleArchive = (childId: string) => {
    updateChild(childId, { archived: true });
  };

  const handleRestore = (childId: string) => {
    // Remove from pending deletions if present
    setPendingDeletions((prev) => prev.filter((p) => p.childId !== childId));
    updateChild(childId, { archived: false });
  };

  const openDeleteModal = (childId: string) => {
    setChildToDelete(childId);
    setConfirmName('');
    setDeleteError('');
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = () => {
    if (!childToDelete) return;
    
    const child = children.find((c) => c.id === childToDelete);
    if (!child) return;

    // Get child's first name
    const childFirstName = child.name.split(' ')[0] || child.name;
    
    // Validate first name (case insensitive, trim spaces before/after, but no spaces within)
    const enteredName = confirmName.trim();
    
    // Check if entered name has spaces within it
    if (enteredName.includes(' ')) {
      setDeleteError('Name should not contain spaces between letters.');
      return;
    }
    
    // Compare case-insensitively
    if (enteredName.toLowerCase() !== childFirstName.toLowerCase()) {
      setDeleteError('The name does not match. Please enter the child\'s first name.');
      return;
    }

    // Start 24-hour countdown for deletion
    const deletionTime = Date.now() + (24 * 60 * 60 * 1000); // 24 hours from now
    setPendingDeletions((prev) => [...prev, { childId: childToDelete, deletionTime }]);
    
    setDeleteModalVisible(false);
    setChildToDelete(null);
  };

  const cancelPendingDeletion = (childId: string) => {
    setPendingDeletions((prev) => prev.filter((p) => p.childId !== childId));
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-900" edges={['top']}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-5 pt-4 pb-6 flex-row items-center justify-between">
          <View>
            <Text className="text-3xl font-bold text-white">Children</Text>
            <Text className="text-slate-400 mt-1">{activeChildren.length} active profiles</Text>
          </View>
          <Pressable
            onPress={() => setModalVisible(true)}
            className="bg-emerald-500 w-12 h-12 rounded-full items-center justify-center"
          >
            <Plus size={24} color="white" />
          </Pressable>
        </View>

        {/* Kids-app identity. Sits above the list because it applies to every
            child, and because a blank label makes the Kids app say "your
            grown-up" — which is the thing it is here to prevent. */}
        <Pressable
          onPress={() => setLabelOpen(true)}
          className="mx-5 mb-5 flex-row items-center rounded-2xl border border-purple-500/25 bg-purple-500/10 px-4 py-3"
        >
          <KeyRound size={17} color="#a78bfa" />
          <View className="ml-3 flex-1">
            <Text className="text-xs text-slate-400">In the Kids app your children call you</Text>
            <Text className="text-base font-semibold text-white">
              {caregiverLabel ?? 'Not set yet — tap to choose'}
            </Text>
          </View>
          <ChevronRight size={18} color="#64748b" />
        </Pressable>

        <View className="px-5 pb-8">
          <View className="gap-4">
            {activeChildren.map((child) => {
              const firstName = child.name.split(' ')[0] || child.name;
              return (
              <Pressable 
                key={child.id} 
                className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50 active:opacity-80"
                onPress={() => router.push(`/child-profile?id=${child.id}`)}
              >
                <View className="flex-row items-center">
                  {child.picture ? (
                    <Image source={{ uri: child.picture }} className="w-16 h-16 rounded-full mr-4" />
                  ) : (
                    <View className="w-16 h-16 rounded-full bg-slate-700 items-center justify-center mr-4">
                      <Text className="text-white text-xl font-semibold">
                        {child.name
                          .split(' ')
                          .filter(Boolean)
                          .slice(0, 2)
                          .map((part) => part[0]?.toUpperCase())
                          .join('') || 'CH'}
                      </Text>
                    </View>
                  )}
                  <View className="flex-1">
                    <Text className="text-xl font-semibold text-white">{firstName}</Text>
                    <Text className="text-slate-400">{child.age} years{child.class ? ` • ${child.class}` : ''}</Text>
                    {child.interests?.length ? (
                      <Text className="text-slate-500 text-xs mt-1">Interests: {child.interests.join(', ')}</Text>
                    ) : null}
                  </View>
                  <View className="flex-row gap-2 items-center">
                    {/* Kids-app sign-in code. Sits on the child card because
                        that is where a parent already goes to manage a child. */}
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        setVisualForChild({ id: child.id, name: firstName });
                      }}
                      className="bg-sky-500/20 w-10 h-10 rounded-full items-center justify-center"
                      accessibilityLabel={`Visual settings for ${firstName}`}
                    >
                      <Eye size={18} color="#38bdf8" />
                    </Pressable>
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        setCodeForChild({ id: child.id, name: firstName });
                      }}
                      className="bg-purple-500/20 w-10 h-10 rounded-full items-center justify-center"
                      accessibilityLabel={`Generate Kids app sign-in code for ${firstName}`}
                    >
                      <KeyRound size={18} color="#a78bfa" />
                    </Pressable>
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        handleEdit(child.id);
                      }}
                      className="bg-slate-700 w-10 h-10 rounded-full items-center justify-center"
                    >
                      <Edit3 size={18} color="#94a3b8" />
                    </Pressable>
                    <Pressable 
                      onPress={(e) => {
                        e.stopPropagation();
                        handleArchive(child.id);
                      }} 
                      className="bg-amber-500/20 w-10 h-10 rounded-full items-center justify-center"
                    >
                      <Archive size={18} color="#fbbf24" />
                    </Pressable>
                    <ChevronRight size={20} color="#64748b" />
                  </View>
                </View>
              </Pressable>
            )})}
          </View>

          {archivedChildren.length > 0 ? (
            <View className="mt-8">
              <Text className="text-sm text-slate-400 mb-3">Archived</Text>
              <View className="gap-3">
                {archivedChildren.map((child) => {
                  const pendingDeletion = getPendingDeletion(child.id);
                  const firstName = child.name.split(' ')[0] || child.name;
                  return (
                    <View 
                      key={child.id} 
                      className={`rounded-2xl border bg-slate-900 p-4 ${
                        pendingDeletion ? 'border-red-500/50 opacity-60' : 'border-slate-800'
                      }`}
                    >
                      <View className="flex-row items-center justify-between">
                        <View className="flex-1">
                          <Text className={`text-sm ${pendingDeletion ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                            {firstName}
                          </Text>
                          {pendingDeletion && (
                            <View className="flex-row items-center gap-1 mt-1">
                              <AlertTriangle size={12} color="#ef4444" />
                              <Text className="text-xs text-red-400">
                                Deleting in {getCountdownText(pendingDeletion.deletionTime)}
                              </Text>
                            </View>
                          )}
                        </View>
                        <View className="flex-row gap-2">
                          {pendingDeletion ? (
                            <Pressable 
                              onPress={() => cancelPendingDeletion(child.id)}
                              className="flex-row items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-500/20"
                            >
                              <RotateCcw size={14} color="#10b981" />
                              <Text className="text-xs text-emerald-400">Restore</Text>
                            </Pressable>
                          ) : (
                            <>
                              <Pressable 
                                onPress={() => handleRestore(child.id)}
                                className="px-3 py-1.5 rounded-full bg-emerald-500/20"
                              >
                                <Text className="text-xs text-emerald-400">Restore</Text>
                              </Pressable>
                              <Pressable 
                                onPress={() => openDeleteModal(child.id)}
                                className="flex-row items-center gap-1 px-3 py-1.5 rounded-full bg-red-500/20"
                              >
                                <Trash2 size={14} color="#ef4444" />
                                <Text className="text-xs text-red-400">Delete</Text>
                              </Pressable>
                            </>
                          )}
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={resetForm}>
        <View className="flex-1 bg-black/60 justify-end">
          <Pressable className="flex-1" onPress={resetForm} />
          <View className="rounded-t-3xl border border-slate-800 bg-slate-900 p-5">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold text-white">
                {editingChildId ? 'Edit child' : 'Add child'}
              </Text>
              <Pressable onPress={resetForm}>
                <Text className="text-sm text-slate-400">Close</Text>
              </Pressable>
            </View>
            <KeyboardAwareScrollView 
              showsVerticalScrollIndicator={false} 
              style={{ maxHeight: 520 }}
              bottomOffset={50}
              keyboardShouldPersistTaps="handled"
            >
              <View className="gap-3 pb-6">
                <LabeledInput label="Firstname" value={name} onChange={setName} placeholder="Enter firstname" />
                <LabeledInput label="Nickname" value={nickname} onChange={setNickname} placeholder="Optional" />
                
                {/* Birthday Date Picker */}
                <View className="gap-2">
                  <Text className="text-xs text-slate-400">Date of Birth</Text>
                  <Pressable 
                    onPress={() => setShowBirthdayPicker(true)}
                    className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 flex-row items-center justify-between"
                  >
                    <Text className={`text-base ${birthdayDate ? 'text-white' : 'text-slate-500'}`}>
                      {formatDateForDisplay(birthdayDate)}
                    </Text>
                  </Pressable>
                  {showBirthdayPicker && (
                    <DateTimePicker
                      value={birthdayDate || new Date(2015, 0, 1)}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={handleBirthdayChange}
                      maximumDate={new Date()}
                      minimumDate={new Date(2005, 0, 1)}
                    />
                  )}
                  {Platform.OS === 'ios' && showBirthdayPicker && (
                    <Pressable 
                      onPress={() => setShowBirthdayPicker(false)}
                      className="py-2 rounded-xl bg-blue-500/20"
                    >
                      <Text className="text-center text-blue-400 font-medium">Done</Text>
                    </Pressable>
                  )}
                </View>

                {/* Age - Auto-calculated from Date of Birth (read-only) */}
                {birthdayDate && (
                  <View className="gap-2">
                    <Text className="text-xs text-slate-400">Age (auto-calculated)</Text>
                    <View className="rounded-2xl border border-slate-700 bg-slate-800/50 px-4 py-3">
                      <Text className="text-base text-slate-300">{age} years old</Text>
                    </View>
                  </View>
                )}
                
                {/* Academic Year Picker - Horizontal scrollable chips like onboarding */}
                <View className="gap-2">
                  <Text className="text-xs text-slate-400">Academic Year</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -4 }}>
                    <View className="flex-row gap-2 px-1">
                      {ACADEMIC_YEARS.map((year) => (
                        <Pressable
                          key={year.value}
                          onPress={() => setAcademicYear(year.value)}
                          className={`px-4 py-2.5 rounded-xl ${academicYear === year.value ? 'bg-violet-500' : 'bg-slate-800'}`}
                        >
                          <Text className={`text-sm font-medium ${academicYear === year.value ? 'text-white' : 'text-slate-300'}`}>
                            {year.label}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>
                  {academicYear && (
                    <Text className="text-xs text-slate-500 mt-1">
                      {ACADEMIC_YEARS.find(y => y.value === academicYear)?.ageRange}
                    </Text>
                  )}
                </View>

                <LabeledInput label="Class" value={childClass} onChange={setChildClass} placeholder="Year 3, 5th Grade" />
                <LabeledInput label="Interests" value={interests} onChange={setInterests} placeholder="Art, Reading, Sports" />
                <LabeledInput label="Learning style" value={learningStyle} onChange={setLearningStyle} placeholder="Visual, hands-on" />

                {/* Photo Picker */}
                <View className="gap-2">
                  <Text className="text-xs text-slate-400">Photo</Text>
                  <Pressable 
                    onPress={handlePickPhoto} 
                    className="items-center justify-center rounded-2xl border-2 border-dashed border-slate-700 bg-slate-900/50 py-6"
                  >
                    {photo ? (
                      <View className="items-center">
                        <Image source={{ uri: photo }} className="h-24 w-24 rounded-full mb-3" />
                        <View className="flex-row items-center gap-2">
                          <Camera size={16} color="#10b981" />
                          <Text className="text-sm text-emerald-400 font-medium">Change photo</Text>
                        </View>
                      </View>
                    ) : (
                      <View className="items-center">
                        <View className="w-16 h-16 rounded-full bg-slate-800 items-center justify-center mb-3">
                          <ImagePlus size={28} color="#64748b" />
                        </View>
                        <Text className="text-sm text-slate-400">Tap to add photo</Text>
                        <Text className="text-xs text-slate-500 mt-1">Optional</Text>
                      </View>
                    )}
                  </Pressable>
                </View>

                <Pressable onPress={handleSave} className="mt-2 rounded-2xl bg-emerald-500 py-3">
                  <Text className="text-center text-base font-semibold text-slate-950">Save child</Text>
                </Pressable>
              </View>
            </KeyboardAwareScrollView>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal visible={deleteModalVisible} transparent animationType="fade" onRequestClose={() => setDeleteModalVisible(false)}>
        <View className="flex-1 bg-black/70 justify-center items-center px-5">
          <View className="w-full max-w-sm rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <View className="items-center mb-4">
              <View className="w-16 h-16 rounded-full bg-red-500/20 items-center justify-center mb-3">
                <AlertTriangle size={32} color="#ef4444" />
              </View>
              <Text className="text-xl font-bold text-white text-center">Are you sure?</Text>
              <Text className="text-slate-400 text-center mt-2 text-sm">
                If you delete this account, it cannot be recovered.
              </Text>
            </View>

            {deleteError ? (
              <View className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4">
                <Text className="text-red-400 text-sm text-center">{deleteError}</Text>
              </View>
            ) : null}

            <View className="gap-4">
              <View className="gap-2">
                <Text className="text-xs text-slate-400">Enter child's first name to confirm</Text>
                <TextInput
                  className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-base text-white"
                  value={confirmName}
                  onChangeText={(text) => {
                    setConfirmName(text);
                    setDeleteError('');
                  }}
                  placeholder="Child's first name"
                  placeholderTextColor="#64748b"
                  autoCapitalize="none"
                />
                <Text className="text-xs text-slate-500">Case doesn't matter (daniel = Daniel = DANIEL)</Text>
              </View>
            </View>

            <View className="flex-row gap-3 mt-6">
              <Pressable 
                onPress={() => setDeleteModalVisible(false)}
                className="flex-1 py-3 rounded-xl border border-slate-700 bg-slate-800"
              >
                <Text className="text-center text-white font-medium">Cancel</Text>
              </Pressable>
              <Pressable 
                onPress={handleConfirmDelete}
                className="flex-1 py-3 rounded-xl bg-red-500"
              >
                <Text className="text-center text-white font-semibold">Delete</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <ChildLoginCodeModal
        visible={codeForChild !== null}
        childId={codeForChild?.id ?? null}
        childName={codeForChild?.name ?? ''}
        onClose={() => setCodeForChild(null)}
      />

      <ChildVisualNeedsModal
        visible={visualForChild !== null}
        childId={visualForChild?.id ?? null}
        childName={visualForChild?.name ?? ''}
        onClose={() => setVisualForChild(null)}
      />

      <CaregiverLabelModal
        visible={labelOpen}
        current={caregiverLabel}
        onClose={() => setLabelOpen(false)}
        onSaved={setCaregiverLabel}
      />
    </SafeAreaView>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  placeholder,
  keyboardType,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'number-pad';
}) {
  return (
    <View className="gap-2">
      <Text className="text-xs text-slate-400">{label}</Text>
      <TextInput
        className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-base text-white"
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#64748b"
        keyboardType={keyboardType}
      />
    </View>
  );
}
