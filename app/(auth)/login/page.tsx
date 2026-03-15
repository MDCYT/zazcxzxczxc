import { LoginForm } from '@/components/auth/login-form'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-balance">GPS Tracking Platform</h1>
          <p className="text-muted-foreground mt-2">Real-time vehicle and device tracking</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
