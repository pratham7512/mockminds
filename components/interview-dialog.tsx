import { useState } from 'react'
import Image from 'next/image'
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from 'next/navigation';

export default function InterviewDialog({ item }:{
  item: {
    image: any;
    name: string;
    description: string;
  }
}) {
  const [difficulty, setDifficulty] = useState('medium')
  const [requirements, setRequirements] = useState('')
  const router = useRouter();
  const handleRedirect = () => {
    router.push('/chat');
  };
  return (
    <Dialog>
      <DialogTrigger asChild>
        <li className="w-[200px] h-[300px] relative border border-border flex-shrink-0 bg-black transition-all duration-300 hover:border-muted-foreground overflow-hidden cursor-pointer">
          <div className="h-full flex flex-col">
            <div className="relative h-[200px] w-full">
              <Image
                src={item.image}
                alt={item.name}
                layout="fill"
                objectFit="cover"
              />
            </div>
            <div className="p-4 flex flex-col items-start">
              <span className="text-md text-white mb-2">
                {item.name}
              </span>
              <span className="text-sm text-muted-foreground">
                {item.description}
              </span>
            </div>
          </div>
        </li>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <div className="flex flex-col gap-4">
          <div className="flex gap-4">
            <div className="relative w-[200px] h-[200px] flex-shrink-0">
              <Image
                src={item.image}
                alt={item.name}
                layout="fill"
                objectFit="cover"
                className="rounded-md"
              />
            </div>
            <div className="flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-semibold">{item.name}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
              <div className="grid w-full gap-1.5">
                <Label>Difficulty</Label>
                <RadioGroup defaultValue="medium" onValueChange={setDifficulty} className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="easy" id="easy" />
                    <Label htmlFor="easy">Easy</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="medium" id="medium" />
                    <Label htmlFor="medium">Medium</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="hard" id="hard" />
                    <Label htmlFor="hard">Hard</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </div>
          <div className="grid w-full gap-1.5">
            <Textarea
              id="requirements"
              placeholder="Enter any additional requirements for the interview"
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              className="border border-border"
            />
          </div>
        </div>
        <DialogFooter className="mt-4 font-md">
          <Button onClick={handleRedirect}>
            start interview
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}