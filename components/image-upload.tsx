"use client"

import type React from "react"

import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { ImageIcon } from "lucide-react"

interface ImageUploadProps {
  onImageUpload: (imageUrl: string) => void
}

export function ImageUpload({ onImageUpload }: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        onImageUpload(result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <>
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
      <Button type="button" variant="outline" onClick={handleClick} className="h-[28px] px-3">
        <ImageIcon className="h-4 w-4" />
      </Button>
    </>
  )
}
