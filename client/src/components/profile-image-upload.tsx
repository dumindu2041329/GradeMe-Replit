import React, { useState, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Camera, Trash2, Upload } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

interface ProfileImageUploadProps {
  userType: 'admin' | 'student';
  currentImageUrl?: string | null;
  userName?: string;
  onImageUpdate?: (imageUrl: string | null) => void;
  className?: string;
}

export function ProfileImageUpload({ 
  userType, 
  currentImageUrl, 
  userName, 
  onImageUpdate,
  className = ""
}: ProfileImageUploadProps) {
  const { toast } = useToast();
  const { user, setUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(currentImageUrl || null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (JPEG, PNG, WebP, or GIF)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image must be smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload the file
    uploadImage(file);
  };

  const uploadImage = async (file: File) => {
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('profileImage', file);

      const endpoint = userType === 'student' 
        ? '/api/student/profile/upload-image'
        : '/api/profile/upload-image';

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setImagePreview(data.imageUrl);
        
        // Update user context
        if (user && setUser) {
          setUser({ ...user, profileImage: data.imageUrl });
        }
        
        // Call the callback if provided
        onImageUpdate?.(data.imageUrl);

        toast({
          title: "Success",
          description: "Profile image updated successfully",
        });
      } else {
        throw new Error(data.error || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive",
      });
      
      // Reset preview on error
      setImagePreview(currentImageUrl || null);
    } finally {
      setIsUploading(false);
    }
  };

  const deleteImage = async () => {
    setIsUploading(true);

    try {
      const endpoint = userType === 'student' 
        ? '/api/student/profile/delete-image'
        : '/api/profile/delete-image';

      const response = await fetch(endpoint, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setImagePreview(null);
        
        // Update user context
        if (user && setUser) {
          setUser({ ...user, profileImage: null });
        }
        
        // Call the callback if provided
        onImageUpdate?.(null);

        toast({
          title: "Success",
          description: "Profile image deleted successfully",
        });

        // Reload the page after successful deletion
        setTimeout(() => {
          window.location.reload();
        }, 200); // Minimal delay for better performance
      } else {
        throw new Error(data.error || 'Failed to delete image');
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Failed to delete image",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const getInitials = () => {
    if (!userName) return 'U';
    return userName
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className={`border shadow-sm ${className}`}>
      <CardContent className="p-6">
        <div className="flex flex-col items-center gap-4">
          {imagePreview ? (
            // Show image with overlay when image exists
            <div className="relative group">
              <Avatar className="h-24 w-24">
                <AvatarImage src={imagePreview} alt={userName || 'Profile'} />
              </Avatar>
              
              {/* Overlay on hover */}
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                   onClick={triggerFileSelect}>
                <Camera className="h-6 w-6 text-white" />
              </div>
            </div>
          ) : userType === 'admin' ? (
            // Show initials for admin when no image exists (like "JD")
            <div className="relative group">
              <Avatar className="h-24 w-24">
                <AvatarFallback className="text-xl bg-slate-700 text-white">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              
              {/* Overlay on hover */}
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                   onClick={triggerFileSelect}>
                <Camera className="h-6 w-6 text-white" />
              </div>
            </div>
          ) : (
            // Show upload area for students when no image exists
            <div 
              className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-full flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors bg-white"
              onClick={triggerFileSelect}
            >
              <Upload className="h-5 w-5 text-gray-400 mb-1" />
              <span className="text-xs text-gray-500 font-medium">Upload</span>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={triggerFileSelect}
              disabled={isUploading}
              size="sm"
              variant="outline"
            >
              <Upload className="h-4 w-4 mr-2" />
              {isUploading ? 'Uploading...' : imagePreview ? 'Change Photo' : 'Upload Photo'}
            </Button>
            
            {imagePreview && (
              <Button
                onClick={deleteImage}
                disabled={isUploading}
                size="sm"
                variant="outline"
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          <p className="text-sm text-muted-foreground text-center">
            Upload a profile picture (JPEG, PNG, WebP, or GIF)<br />
            Maximum file size: 5MB
          </p>
        </div>
      </CardContent>
    </Card>
  );
}