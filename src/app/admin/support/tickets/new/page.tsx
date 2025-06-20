'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Upload, 
  X, 
  FileText, 
  Image, 
  Video, 
  Music, 
  AlertTriangle,
  ArrowLeft,
  Save
} from 'lucide-react';
import Link from 'next/link';
import { CreateTicketData, TicketType, TicketPriority, ProductArea } from '@/lib/types';
import { useAdminDictionary } from '@/hooks/useAdminDictionary';

interface UploadedFile {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  path: string;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
}

const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith('image/')) return Image;
  if (mimeType.startsWith('video/')) return Video;
  if (mimeType.startsWith('audio/')) return Music;
  return FileText;
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default function CreateTicketPage() {
  const { dictionary: dict } = useAdminDictionary();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState<CreateTicketData>({
    title: '',
    description: '',
    type: 'SUPPORT',
    priority: 'MEDIUM',
    productArea: 'OTHER',
    assignedToId: undefined,
    tags: [],
    estimatedHours: undefined,
    dueDate: undefined
  });

  useEffect(() => {
    fetchAdminUsers();
  }, []);

  const fetchAdminUsers = async () => {
    try {
      const response = await fetch('/api/admin/users?roles=ADMIN,MANAGER');
      if (response.ok) {
        const users = await response.json();
        setAdminUsers(users);
      }
    } catch (error) {
      console.error('Error fetching admin users:', error);
    }
  };

  const handleInputChange = (field: keyof CreateTicketData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTagsChange = (value: string) => {
    const tags = value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    handleInputChange('tags', tags);
  };

  const handleFileUpload = async (files: FileList) => {
    if (files.length === 0) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/support/attachments', {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          const uploadedFile = await response.json();
          setUploadedFiles(prev => [...prev, uploadedFile]);
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Upload failed');
        }
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const removeFile = async (fileId: string) => {
    try {
      const response = await fetch(`/api/support/attachments/${fileId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
      }
    } catch (error) {
      console.error('Error removing file:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim()) {
      setError('Title and description are required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create ticket');
      }

      const ticket = await response.json();
      
      // Link uploaded files to the ticket
      if (uploadedFiles.length > 0) {
        for (const file of uploadedFiles) {
          await fetch(`/api/support/tickets/${ticket.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              attachmentIds: [file.id]
            })
          });
        }
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/admin/support/tickets/${ticket.id}`);
      }, 2000);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {dict.createTicket.ticketCreated}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/support/tickets">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {dict.createTicket.title}
          </h1>
          <p className="text-muted-foreground">
            Create a new support ticket for tracking issues and requests
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Ticket Information</CardTitle>
                <CardDescription>
                  Basic information about the support ticket
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">{dict.createTicket.ticketTitle}</Label>
                  <Input
                    id="title"
                    placeholder={dict.createTicket.titlePlaceholder}
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    required
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">{dict.createTicket.description}</Label>
                  <Textarea
                    id="description"
                    placeholder={dict.createTicket.descriptionPlaceholder}
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={6}
                    required
                  />
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <Label htmlFor="tags">{dict.createTicket.tags}</Label>
                  <Input
                    id="tags"
                    placeholder={dict.createTicket.tagsPlaceholder}
                    value={formData.tags.join(', ')}
                    onChange={(e) => handleTagsChange(e.target.value)}
                  />
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* File Upload */}
            <Card>
              <CardHeader>
                <CardTitle>{dict.createTicket.attachments}</CardTitle>
                <CardDescription>
                  {dict.createTicket.supportedFormats}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Upload Area */}
                  <div 
                    className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors cursor-pointer"
                    onClick={() => document.getElementById('file-upload')?.click()}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleFileUpload(e.dataTransfer.files);
                    }}
                    onDragOver={(e) => e.preventDefault()}
                  >
                    <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {dict.createTicket.dragDropFiles}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {dict.createTicket.maxFileSize}
                    </p>
                    <input
                      id="file-upload"
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                      accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                    />
                  </div>

                  {/* Uploaded Files */}
                  {uploadedFiles.length > 0 && (
                    <div className="space-y-2">
                      <Label>Uploaded Files</Label>
                      <div className="space-y-2">
                        {uploadedFiles.map((file) => {
                          const FileIcon = getFileIcon(file.mimeType);
                          return (
                            <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center space-x-3">
                                <FileIcon className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="text-sm font-medium">{file.originalName}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatFileSize(file.size)}
                                  </p>
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFile(file.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {uploading && (
                    <p className="text-sm text-muted-foreground">Uploading files...</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Ticket Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Type */}
                <div className="space-y-2">
                  <Label>{dict.createTicket.type}</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: TicketType) => handleInputChange('type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={dict.createTicket.selectType} />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(dict.ticketTypes).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Priority */}
                <div className="space-y-2">
                  <Label>{dict.createTicket.priority}</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value: TicketPriority) => handleInputChange('priority', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={dict.createTicket.selectPriority} />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(dict.ticketPriorities).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Product Area */}
                <div className="space-y-2">
                  <Label>{dict.createTicket.productArea}</Label>
                  <Select
                    value={formData.productArea}
                    onValueChange={(value: ProductArea) => handleInputChange('productArea', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={dict.createTicket.selectArea} />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(dict.productAreas).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Assign To */}
                <div className="space-y-2">
                  <Label>{dict.createTicket.assignTo}</Label>
                  <Select
                    value={formData.assignedToId || 'unassigned'}
                    onValueChange={(value) => handleInputChange('assignedToId', value === 'unassigned' ? undefined : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={dict.createTicket.selectAssignee} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">{dict.createTicket.selectAssignee}</SelectItem>
                      {adminUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Estimated Hours */}
                <div className="space-y-2">
                  <Label>{dict.createTicket.estimatedHours}</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.5"
                    value={formData.estimatedHours || ''}
                    onChange={(e) => handleInputChange('estimatedHours', e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                </div>

                {/* Due Date */}
                <div className="space-y-2">
                  <Label>{dict.createTicket.dueDate}</Label>
                  <Input
                    type="datetime-local"
                    value={formData.dueDate || ''}
                    onChange={(e) => handleInputChange('dueDate', e.target.value || undefined)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-4">
          <Link href="/admin/support/tickets">
            <Button type="button" variant="outline">
              {dict.createTicket.cancel}
            </Button>
          </Link>
          <Button type="submit" disabled={loading}>
            <Save className="mr-2 h-4 w-4" />
            {loading ? dict.createTicket.creating : dict.createTicket.createTicket}
          </Button>
        </div>
      </form>
    </div>
  );
}