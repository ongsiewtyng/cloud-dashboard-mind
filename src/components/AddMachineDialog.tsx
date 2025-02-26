
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { Plus } from "lucide-react"

interface AddMachineDialogProps {
  onAdd: (name: string) => void
}

export function AddMachineDialog({ onAdd }: AddMachineDialogProps) {
  const [name, setName] = useState("")
  const [open, setOpen] = useState(false)

  const handleAdd = () => {
    if (name.trim()) {
      onAdd(name)
      setName("")
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Machine
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Machine</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Machine Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter machine name"
            />
          </div>
          <Button onClick={handleAdd} className="w-full">
            Add Machine
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
