import { RotateCcw } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { usePlanState } from '@/lib/plan-state'

export function ResetProgressButton() {
  const { resetProgress, hasLocalProgress } = usePlanState()
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" disabled={!hasLocalProgress}>
          <RotateCcw data-icon="inline-start" />
          清除本机进度
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>清除本机进度？</AlertDialogTitle>
          <AlertDialogDescription>
            会清除这个浏览器里勾选的任务和深挖题，恢复成 Markdown 文档里的状态。文档里已经标成 [x] 的项目不受影响。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={resetProgress}>
            清除
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
