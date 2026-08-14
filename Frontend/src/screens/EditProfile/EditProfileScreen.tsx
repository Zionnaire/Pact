import React, { useState } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Screen, TopBar, TextField, Button, Avatar } from '../../components';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/auth.service';
import { ApiRequestError } from '../../types';

const BIO_MAX_LENGTH = 160;

export function EditProfileScreen() {
  const { user, updateProfile, setAvatarUrl } = useAuth();

  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const handleChangePhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photo access needed', 'Allow Pact to access your photo library in system settings to set a profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;

    setIsUploadingPhoto(true);
    setError(null);
    try {
      const updated = await authService.uploadAvatar(result.assets[0].uri);
      setAvatarUrl(updated.avatarUrl ?? '');
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Could not upload photo');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    setError(null);
    setSaved(false);
    setIsSaving(true);
    try {
      await updateProfile({ displayName: displayName.trim(), bio: bio.trim() });
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Could not save your profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return null;

  return (
    <Screen>
      <TopBar title="Edit profile" showBack />

      <View className="items-center py-4">
        <Pressable onPress={handleChangePhoto} disabled={isUploadingPhoto} className="relative">
          <Avatar avatarUrl={user.avatarUrl} avatarInitial={user.avatarInitial} size={88} />
          <View
            className="absolute bottom-0 right-0 h-8 w-8 items-center justify-center rounded-full bg-brand-plum"
            style={{ borderWidth: 2, borderColor: '#F9F7F2' }}
          >
            <Ionicons name={isUploadingPhoto ? 'ellipsis-horizontal' : 'camera'} size={14} color="#F9F7F2" />
          </View>
        </Pressable>
        <Text className="mt-3 text-[12px] text-brand-ink/40">Tap to change photo</Text>
      </View>

      <TextField label="Display name" value={displayName} onChangeText={setDisplayName} maxLength={60} />

      <TextField
        label="Bio"
        value={bio}
        onChangeText={(text) => setBio(text.slice(0, BIO_MAX_LENGTH))}
        placeholder="A line about you (optional)"
        multiline
        numberOfLines={3}
        style={{ minHeight: 72, textAlignVertical: 'top' }}
      />
      <Text className="-mt-2 mb-4 text-right text-[11px] text-brand-ink/30">{bio.length}/{BIO_MAX_LENGTH}</Text>

      {error && <Text className="mb-4 text-[13px] text-type-rant">{error}</Text>}
      {saved && !error && <Text className="mb-4 text-[13px] text-type-note">Saved.</Text>}

      <Button label="Save changes" onPress={handleSave} loading={isSaving} disabled={!displayName.trim()} />
    </Screen>
  );
}
