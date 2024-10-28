import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
      <p className="text-xl mb-8">Oops! The page you&apos;re looking for doesn&apos;t exist.</p>
      <Link href="/" className="text-primary hover:underline">
        Go back to home
      </Link>
    </div>
  )
}