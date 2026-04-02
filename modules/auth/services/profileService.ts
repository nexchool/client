import { apiPostForm } from '@/common/services/api';

export async function uploadProfilePicture(file: {
  uri: string;
  name: string;
  mimeType?: string;
}): Promise<{ profile_picture_url: string }> {
  const formData = new FormData();
  const uri =
    file.uri.startsWith('file://') || file.uri.startsWith('content://')
      ? file.uri
      : `file://${file.uri}`;
  formData.append('file', {
    uri,
    name: file.name,
    type: file.mimeType || 'image/jpeg',
  } as unknown as Blob);
  return apiPostForm<{ profile_picture_url: string }>(
    '/api/auth/upload-profile-picture',
    formData,
  );
}
