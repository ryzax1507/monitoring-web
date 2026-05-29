'use client';

import React, { useState, useActionState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Loader2 } from 'lucide-react';
import { addMonitor } from '@/app/actions';

export default function AddMonitorDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');

  // Use useActionState for form status and action execution
  const [state, formAction, isPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      try {
        await addMonitor(formData);
        setName('');
        setUrl('');
        setOpen(false);
        return { error: null };
      } catch (err: any) {
        return { error: err.message || 'An unexpected error occurred' };
      }
    },
    { error: null }
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={(props) => (
        <Button {...props} className="font-semibold shadow-sm hover:shadow transition-all duration-300">
          <Plus className="mr-1.5 h-4 w-4" /> Tambah Server
        </Button>
      )} />
      <DialogContent className="sm:max-w-[425px]">
        <form action={formAction} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Tambah Server Baru</DialogTitle>
            <DialogDescription>
              Masukkan nama dan URL server untuk memonitor status uptime dan latency.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <label htmlFor="name" className="text-xs font-semibold text-muted-foreground">
                Nama Server
              </label>
              <Input
                id="name"
                name="name"
                placeholder="e.g. My Website API"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isPending}
                required
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="url" className="text-xs font-semibold text-muted-foreground">
                URL Server
              </label>
              <Input
                id="url"
                name="url"
                type="url"
                placeholder="https://example.com/api"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isPending}
                required
              />
            </div>
            {state?.error && (
              <p className="text-xs font-medium text-destructive mt-1 bg-destructive/10 p-2 rounded-md border border-destructive/20">
                {state.error}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isPending} className="min-w-[80px]">
              {isPending ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Menyimpan...
                </>
              ) : (
                'Simpan'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
