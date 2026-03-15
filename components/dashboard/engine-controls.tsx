'use client'

import { useState } from 'react'
import { apiClient, Command } from '@/lib/api'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PowerOff, Play } from 'lucide-react'

interface EngineControlsProps {
  deviceId: string
  onCommandExecuted?: () => void
}

export function EngineControls({ deviceId, onCommandExecuted }: EngineControlsProps) {
  const [commands, setCommands] = useState<Command[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showStopDialog, setShowStopDialog] = useState(false)
  const [showResumeDialog, setShowResumeDialog] = useState(false)
  const [lastCommand, setLastCommand] = useState<Command | null>(null)
  const [error, setError] = useState('')

  const executeCommand = async (command: 'stop' | 'resume') => {
    try {
      setIsLoading(true)
      setError('')

      const result =
        command === 'stop' ? await apiClient.engineStop(deviceId) : await apiClient.engineResume(deviceId)

      setLastCommand(result)
      setCommands((prev) => [result, ...prev])

      if (showStopDialog) setShowStopDialog(false)
      if (showResumeDialog) setShowResumeDialog(false)

      onCommandExecuted?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${command} engine`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Engine Controls</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3">
          <Button
            variant="destructive"
            size="lg"
            className="flex-1"
            onClick={() => setShowStopDialog(true)}
            disabled={isLoading}
          >
            <PowerOff className="mr-2 h-4 w-4" />
            Stop Engine
          </Button>
          <Button
            variant="default"
            size="lg"
            className="flex-1"
            onClick={() => setShowResumeDialog(true)}
            disabled={isLoading}
          >
            <Play className="mr-2 h-4 w-4" />
            Resume Engine
          </Button>
        </div>

        {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}

        {lastCommand && (
          <div className="bg-secondary p-3 rounded-md space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Last Command</span>
              <Badge
                variant={
                  lastCommand.status === 'acknowledged'
                    ? 'default'
                    : lastCommand.status === 'sent'
                      ? 'secondary'
                      : 'outline'
                }
              >
                {lastCommand.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{lastCommand.command}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(lastCommand.createdAt).toLocaleString()}
            </p>
          </div>
        )}

        {commands.length > 1 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Command History</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {commands.slice(1, 6).map((cmd) => (
                <div key={cmd.id} className="text-xs bg-secondary p-2 rounded-md">
                  <div className="flex items-center justify-between">
                    <span className="font-mono">{cmd.command}</span>
                    <Badge variant="outline" className="text-xs">
                      {cmd.status}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-xs mt-1">
                    {new Date(cmd.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      <AlertDialog open={showStopDialog} onOpenChange={setShowStopDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Stop Engine?</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately stop the engine of this device. Are you sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => executeCommand('stop')}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? 'Stopping...' : 'Stop Engine'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showResumeDialog} onOpenChange={setShowResumeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resume Engine?</AlertDialogTitle>
            <AlertDialogDescription>
              This will restart the engine of this device. Are you sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => executeCommand('resume')} disabled={isLoading}>
              {isLoading ? 'Resuming...' : 'Resume Engine'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
