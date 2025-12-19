import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="flex justify-center text-5xl font-bold mb-2">
            <Image
              src="/fense-logo.png"
              alt="Fense Logo"
              width={150}
              height={150}
            />
          </CardTitle>
          {/* <CardDescription className="text-lg">Multiplayer Trivia Game</CardDescription> */}
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <Link href="/online" className="block">
              <Card className="h-full hover:border-primary transition-colors cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-2xl">Online Mode</CardTitle>
                  <CardDescription>
                    Play with friends remotely. Wordle-style guessing with real-time scoring.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" size="lg">
                    Play Online
                  </Button>
                </CardContent>
              </Card>
            </Link>

            <Link href="/in-person" className="block">
              <Card className="h-full hover:border-primary transition-colors cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-2xl">In-Person Mode</CardTitle>
                  <CardDescription>Perfect for game nights. One leader manages questions and scoring.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" size="lg" variant="secondary">
                    Play In-Person
                  </Button>
                </CardContent>
              </Card>
            </Link>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>Create a room or join with a code to get started</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
