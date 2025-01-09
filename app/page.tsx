'use client'

import { useState, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Cloud } from '@/components/Cloud'
import { Pipe } from '@/components/Pipe'
import { Block } from '@/components/Block'
import { cn } from "@/lib/utils"

export default function PngConverter() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [solidityExport, setSolidityExport] = useState(false)
  const [outputHex, setOutputHex] = useState(false)
  const [output, setOutput] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const rgbToHex = (r: number, g: number, b: number) => {
    return [r, g, b].map(x => {
      const hex = x.toString(16)
      return hex.length === 1 ? '0' + hex : hex
    }).join('')
  }

  const processImage = (imageFile: File): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        if (img.width !== 32 || img.height !== 32) {
          reject('Image must be 32x32 pixels')
          return
        }

        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject('Could not get canvas context')
          return
        }
        
        canvas.width = 32
        canvas.height = 32
        ctx.drawImage(img, 0, 0)

        const imageData = ctx.getImageData(0, 0, 32, 32)
        const pixels = imageData.data
        const output: string[] = []

        for (let y = 0; y < 32; y++) {
          for (let x = 0; x < 32; x++) {
            const index = (y * 32 + x) * 4
            const red = pixels[index]
            const green = pixels[index + 1]
            const blue = pixels[index + 2]
            const alpha = pixels[index + 3]
            if (alpha > 0) {
              output.push(`${x},${y},${red},${green},${blue}`)
            }
          }
        }
        resolve(output)
      }

      img.onerror = () => reject('Error loading image')

      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) {
          img.src = e.target.result as string
        }
      }
      reader.readAsDataURL(imageFile)
    })
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setSelectedFiles(files)
    
    try {
      const results: string[] = []
      const hexValues: string[] = []
      const fileNames: string[] = []

      for (const file of files) {
        if (file.type !== 'image/png') {
          throw new Error('Please select PNG files only.')
        }

        const pixelData = await processImage(file)
        let result: string

        const numberArray = pixelData.flatMap(pixel => {
          const [x, y, r, g, b] = pixel.split(',').map(Number)
          return [x, y, r, g, b]
        })

        if (solidityExport || outputHex) {
          result = numberArray.map(num => 
            num.toString(16).padStart(2, '0')
          ).join('')
          
          hexValues.push(result)
          fileNames.push(file.name.replace('.png', ''))
        } else {
          result = numberArray.join(',')
        }

        if (!solidityExport) {
          results.push(`${file.name} = ${result}`)
        }
      }

      if (solidityExport) {
        const hexArray = hexValues.map(hex => `bytes(hex"${hex}")`).join(',\n')
        const namesArray = fileNames.map(name => `"${name}"`).join(',\n')
        setOutput(`// Hex values array:\n[\n${hexArray}\n]\n\n// Names array:\n[\n${namesArray}\n]`)
      } else if (outputHex) {
        setOutput(results.join('\n'))
      } else {
        setOutput(results.join('\n'))
      }
    } catch (error) {
      setOutput(`Error: ${error}`)
      setSelectedFiles([])
    }
  }

  return (
    <div className="min-h-screen bg-sky-300 text-white p-8 relative overflow-hidden">
      <Cloud className="absolute top-10 left-10" />
      <Cloud className="absolute top-20 right-20" />
      <Cloud className="absolute bottom-40 left-1/4" />
      
      <h1 className="text-4xl mb-8 text-center text-yellow-300 drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]">
        PNG to Code Converter
      </h1>

      <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg border-8 border-red-500 relative">
        <Block className="absolute -top-8 -left-8" />
        <Block className="absolute -top-8 -right-8" />
        
        <div className="mb-6">
          <Button 
            onClick={() => fileInputRef.current?.click()} 
            className="w-full bg-red-500 hover:bg-red-600"
          >
            Select PNG Files
          </Button>
          <input
            type="file"
            accept="image/png"
            onChange={handleFileChange}
            className="hidden"
            ref={fileInputRef}
            multiple
          />
        </div>

        <div className="flex justify-between gap-4 mb-6">
          <Button
            onClick={() => {
              setSolidityExport(!solidityExport)
              setOutputHex(false)
              if (selectedFiles.length > 0) {
                handleFileChange({ target: { files: selectedFiles }} as any)
              }
            }}
            className={cn(
              "flex-1 text-sm transition-colors",
              solidityExport 
                ? "bg-green-500 hover:bg-green-600" 
                : "bg-gray-200 hover:bg-gray-300 text-gray-700"
            )}
          >
            Solidity Export
          </Button>

          <Button
            onClick={() => {
              setOutputHex(!outputHex)
              setSolidityExport(false)
              if (selectedFiles.length > 0) {
                handleFileChange({ target: { files: selectedFiles }} as any)
              }
            }}
            className={cn(
              "flex-1 text-sm transition-colors",
              outputHex 
                ? "bg-green-500 hover:bg-green-600" 
                : "bg-gray-200 hover:bg-gray-300 text-gray-700"
            )}
          >
            Output as Hexadecimal
          </Button>
        </div>

        {selectedFiles.length > 0 && (
          <div className="mb-6 flex gap-2 overflow-x-auto">
            {selectedFiles.map((file, index) => (
              <img
                key={index}
                src={URL.createObjectURL(file)}
                alt={`PNG ${index + 1}`}
                className="h-32 w-32 object-contain pixelated border-4 border-yellow-400"
              />
            ))}
          </div>
        )}

        <div className="bg-black p-4 rounded border-4 border-yellow-400 h-64 overflow-auto relative">
          <pre className="text-green-400 whitespace-pre-wrap break-all">{output}</pre>
          <Pipe className="absolute -bottom-8 -right-8 transform -rotate-90" />
        </div>
      </div>
    </div>
  )
}

