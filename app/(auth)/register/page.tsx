import { RegisterForm } from '@/components/auth/register-form'

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-balance">Join GPS Tracking</h1>
          <p className="text-muted-foreground mt-2">Create an account to start tracking</p>
        </div>
        <RegisterForm />
      </div>
    </div>
  )
}
