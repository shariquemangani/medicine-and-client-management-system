'use client'

import { useTheme } from '@/components'
import { useState, useEffect } from 'react'

export default function TestTailwind() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Only run after component is mounted to avoid hydration issues
  useEffect(() => {
    setMounted(true)
  }, [])
  
  if (!mounted) {
    return null
  }
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Tailwind Test Page</h1>
          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
          >
            {theme === 'dark' ? 'Light' : 'Dark'} Mode
          </button>
        </div>

        {/* Color Samples */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-blue-500 text-white">Primary</div>
          <div className="p-4 rounded-lg bg-purple-500 text-white">Secondary</div>
          <div className="p-4 rounded-lg bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">Muted</div>
          <div className="p-4 rounded-lg bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200">Accent</div>
          <div className="p-4 rounded-lg bg-red-500 text-white">Destructive</div>
          <div className="p-4 rounded-lg bg-white text-gray-800 dark:bg-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700">Card</div>
        </div>
        
        {/* Primary Color Palette */}
        <div>
          <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">Primary Color Palette</h2>
          <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
            <div className="p-4 rounded bg-primary-50 text-xs text-center text-gray-800">50</div>
            <div className="p-4 rounded bg-primary-100 text-xs text-center text-gray-800">100</div>
            <div className="p-4 rounded bg-primary-200 text-xs text-center text-gray-800">200</div>
            <div className="p-4 rounded bg-primary-300 text-xs text-center text-gray-800">300</div>
            <div className="p-4 rounded bg-primary-400 text-xs text-center text-gray-800">400</div>
            <div className="p-4 rounded bg-primary-500 text-white text-xs text-center">500</div>
            <div className="p-4 rounded bg-primary-600 text-white text-xs text-center">600</div>
            <div className="p-4 rounded bg-primary-700 text-white text-xs text-center">700</div>
            <div className="p-4 rounded bg-primary-800 text-white text-xs text-center">800</div>
            <div className="p-4 rounded bg-primary-900 text-white text-xs text-center">900</div>
          </div>
        </div>
        
        {/* Component Styles */}
        <div>
          <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">Component Styles</h2>
          <div className="flex flex-wrap gap-3">
            <button className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded">Primary Button</button>
            <button className="bg-purple-500 hover:bg-purple-600 text-white font-medium py-2 px-4 rounded">Secondary Button</button>
            <button className="bg-white hover:bg-gray-100 text-gray-800 font-medium py-2 px-4 border border-gray-300 rounded dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-white dark:border-gray-600">Outline Button</button>
            <button className="bg-transparent hover:bg-gray-100 text-gray-800 font-medium py-2 px-4 rounded dark:text-gray-200 dark:hover:bg-gray-800">Ghost Button</button>
          </div>
        </div>
        
        {/* Size Variants */}
        <div>
          <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">Size Variants</h2>
          <div className="flex flex-wrap items-center gap-3">
            <button className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-6 text-lg rounded">Large</button>
            <button className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded">Medium</button>
            <button className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-1 px-3 text-sm rounded">Small</button>
            <button className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-1 px-2 text-xs rounded">XS</button>
          </div>
        </div>
        
        {/* Border Test */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-gray-200 dark:border-gray-700 p-4 rounded-lg text-gray-800 dark:text-gray-200">Border Test</div>
          <div className="border-2 border-blue-500 p-4 rounded-lg text-gray-800 dark:text-gray-200">Primary Border</div>
          <div className="border-2 border-purple-500 p-4 rounded-lg text-gray-800 dark:text-gray-200">Secondary Border</div>
        </div>
      </div>
    </div>
  )
}