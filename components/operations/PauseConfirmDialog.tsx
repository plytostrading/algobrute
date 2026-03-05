'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface PauseConfirmDialogProps {
  botId: string;
  open: boolean;
  onConfirm: () => void;
  onClose: () => void;
  isPending: boolean;
  error?: string | null;
}

export default function PauseConfirmDialog({
  botId,
  open,
  onConfirm,
  onClose,
  isPending,
  error,
}: PauseConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Pause {botId.slice(0, 8)}&hellip;?</AlertDialogTitle>
          <AlertDialogDescription>
            The bot will stop placing new orders. Open positions remain intact. You can resume at
            any time.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && <p className="text-xs text-destructive px-1 -mt-2">{error}</p>}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending} onClick={onClose}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            onClick={onConfirm}
            className="bg-amber-500 text-white hover:bg-amber-500/90"
          >
            {isPending ? 'Pausing…' : 'Pause Bot'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
