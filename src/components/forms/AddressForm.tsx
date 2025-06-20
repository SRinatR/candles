'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useSession } from 'next-auth/react';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const addressSchema = z.object({
  title: z.string().min(1, 'Address title is required'),
  street: z.string().min(1, 'Street is required'),
  house: z.string().min(1, 'House number is required'),
  apartment: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  region: z.string().min(1, 'Region is required'),
  postalCode: z.string().optional(),
  landmark: z.string().optional(),
  comment: z.string().optional(),
  country: z.string().default('UZ'),
  isDefault: z.boolean().default(false)
});

type AddressFormData = z.infer<typeof addressSchema>;

interface AddressFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  dictionary?: any;
  initialData?: {
    id?: string;
    title?: string;
    street?: string;
    house?: string;
    apartment?: string;
    city?: string;
    region?: string;
    postalCode?: string;
    landmark?: string;
    comment?: string;
    country?: string;
    isDefault?: boolean;
  };
}

const uzbekistanRegions = [
  'Toshkent shahri',
  'Toshkent viloyati',
  'Andijon viloyati',
  'Buxoro viloyati',
  'Farg\'ona viloyati',
  'Jizzax viloyati',
  'Xorazm viloyati',
  'Namangan viloyati',
  'Navoiy viloyati',
  'Qashqadaryo viloyati',
  'Qoraqalpog\'iston Respublikasi',
  'Samarqand viloyati',
  'Sirdaryo viloyati',
  'Surxondaryo viloyati'
];

export function AddressForm({ isOpen, onClose, onSuccess, dictionary, initialData }: AddressFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = !!initialData?.id;
  
  const { currentUser: simulatedUser } = useAuth();
  const { data: nextAuthSession } = useSession();
  
  // Helper function to get request headers with authentication
  const getAuthHeaders = () => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    // If using simulated auth and no NextAuth session, add simulated user header
    if (simulatedUser && !nextAuthSession) {
      headers['x-simulated-user'] = JSON.stringify(simulatedUser);
    }
    
    return headers;
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      title: initialData?.title || '',
      street: initialData?.street || '',
      house: initialData?.house || '',
      apartment: initialData?.apartment || '',
      city: initialData?.city || '',
      region: initialData?.region || '',
      postalCode: initialData?.postalCode || '',
      landmark: initialData?.landmark || '',
      comment: initialData?.comment || '',
      country: initialData?.country || 'UZ',
      isDefault: initialData?.isDefault || false
    }
  });

  const watchedRegion = watch('region');
  const watchedIsDefault = watch('isDefault');

  const onSubmit = async (data: AddressFormData) => {
    setIsLoading(true);
    try {
      const url = isEditing 
        ? `/api/user/addresses/${initialData.id}`
        : '/api/user/addresses';
      
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save address');
      }

      toast.success(isEditing ? 'Адрес успешно обновлен' : 'Адрес успешно создан');
      onSuccess();
      onClose();
      reset();
    } catch (error) {
      console.error('Error saving address:', error);
      toast.error(error instanceof Error ? error.message : 'Не удалось сохранить адрес');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Редактировать адрес' : 'Добавить новый адрес'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Название адреса *</Label>
            <Input
              id="title"
              {...register('title')}
              placeholder="например: Дом, Работа, Офис"
            />
            {errors.title && (
              <p className="text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="region">{dictionary?.regionLabel || 'Регион'} *</Label>
              <Select
                value={watchedRegion || ''}
                onValueChange={(value) => setValue('region', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={dictionary?.regionLabel || 'Выберите регион'} />
                </SelectTrigger>
                <SelectContent>
                  {uzbekistanRegions.map((region) => (
                    <SelectItem key={region} value={region}>
                      {region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.region && (
                <p className="text-sm text-red-600">{errors.region.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">Город *</Label>
              <Input
                id="city"
                {...register('city')}
                placeholder="Введите город"
              />
              {errors.city && (
                <p className="text-sm text-red-600">{errors.city.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="street">Улица *</Label>
            <Input
              id="street"
              {...register('street')}
              placeholder="Введите название улицы"
            />
            {errors.street && (
              <p className="text-sm text-red-600">{errors.street.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="house">Дом *</Label>
              <Input
                id="house"
                {...register('house')}
                placeholder="Номер дома"
              />
              {errors.house && (
                <p className="text-sm text-red-600">{errors.house.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="apartment">Квартира</Label>
              <Input
                id="apartment"
                {...register('apartment')}
                placeholder="Номер квартиры"
              />
              {errors.apartment && (
                <p className="text-sm text-red-600">{errors.apartment.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="postalCode">{dictionary?.postalCodeLabel || 'Индекс'}</Label>
            <Input
              id="postalCode"
              {...register('postalCode')}
              placeholder={dictionary?.postalCodeLabel || 'Почтовый индекс'}
            />
            {errors.postalCode && (
              <p className="text-sm text-red-600">{errors.postalCode.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="landmark">Ориентир</Label>
            <Input
              id="landmark"
              {...register('landmark')}
              placeholder="Рядом с магазином, школой и т.д."
            />
            {errors.landmark && (
              <p className="text-sm text-red-600">{errors.landmark.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Комментарий</Label>
            <Input
              id="comment"
              {...register('comment')}
              placeholder="Дополнительная информация"
            />
            {errors.comment && (
              <p className="text-sm text-red-600">{errors.comment.message}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isDefault"
              checked={watchedIsDefault}
              onCheckedChange={(checked) => setValue('isDefault', !!checked)}
            />
            <Label htmlFor="isDefault" className="text-sm font-normal">
              Установить как основной адрес
            </Label>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Отмена
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Обновить адрес' : 'Сохранить адрес'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
