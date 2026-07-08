'use client'

import * as React from 'react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Alert,
  AlertDescription,
  AlertTitle,
  AspectRatio,
  Badge,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  Calendar,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
  Label,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  ModeToggle,
} from '@/components'
import { InfoIcon } from 'lucide-react'

const TestShadcn = () => {
  return (
    <div className="container py-10 space-y-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Shadcn UI Component Test Page</h1>
        <ModeToggle />
      </div>

      <Tabs defaultValue="buttons" className="w-full">
        <TabsList className="grid grid-cols-2">
          <TabsTrigger value="buttons">Buttons & Cards</TabsTrigger>
          <TabsTrigger value="inputs">Inputs & Forms</TabsTrigger>
        </TabsList>

        <TabsContent value="buttons" className="space-y-8">
          <section id="buttons" className="space-y-4">
            <h2 className="text-2xl font-bold">Buttons</h2>
            <div className="flex flex-wrap gap-4">
              <Button variant="default">Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link</Button>
            </div>
          </section>

          <section id="cards" className="space-y-4">
            <h2 className="text-2xl font-bold">Cards</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Card Title</CardTitle>
                  <CardDescription>Card Description</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Card content goes here.</p>
                </CardContent>
                <CardFooter>
                  <Button>Action</Button>
                </CardFooter>
              </Card>

              <div className="space-y-4">
                <Alert>
                  <InfoIcon className="h-4 w-4" />
                  <AlertTitle>Information</AlertTitle>
                  <AlertDescription>
                    This is an informational alert.
                  </AlertDescription>
                </Alert>

                <div className="flex flex-wrap gap-2">
                  <Badge>Default Badge</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge variant="outline">Outline</Badge>
                  <Badge variant="destructive">Destructive</Badge>
                </div>
              </div>
            </div>
          </section>

          <section id="accordion" className="space-y-4">
            <h2 className="text-2xl font-bold">Accordion</h2>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>Is it accessible?</AccordionTrigger>
                <AccordionContent>
                  Yes. It adheres to the WAI-ARIA design pattern.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>Is it styled?</AccordionTrigger>
                <AccordionContent>
                  Yes. It comes with default styles that match your theme.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </section>

          <section id="aspect-ratio" className="space-y-4">
            <h2 className="text-2xl font-bold">Aspect Ratio</h2>
            <div className="max-w-md">
              <AspectRatio ratio={16 / 9} className="bg-muted rounded-md">
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-muted-foreground">
                    16:9 Aspect Ratio
                  </p>
                </div>
              </AspectRatio>
            </div>
          </section>
        </TabsContent>

        <TabsContent value="inputs" className="space-y-8">
          <section id="inputs" className="space-y-4">
            <h2 className="text-2xl font-bold">Form Inputs</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" placeholder="Enter your name" />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox id="terms" />
                  <Label htmlFor="terms">Accept terms and conditions</Label>
                </div>

                <div className="flex flex-col space-y-2">
                  <Label>Choose a date</Label>
                  <Calendar mode="single" className="rounded-md border" />
                </div>
              </div>
            </div>
          </section>

          <section id="dialogs" className="space-y-4">
            <h2 className="text-2xl font-bold">Dialog</h2>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">Open Dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Dialog Title</DialogTitle>
                  <DialogDescription>
                    This is a dialog description.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">Dialog content goes here.</div>
                <DialogFooter>
                  <Button type="submit">Save changes</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </section>

          <section id="dropdowns" className="space-y-4">
            <h2 className="text-2xl font-bold">Dropdown Menu</h2>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">Open Menu</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Billing</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </section>

          <section id="navigation" className="space-y-4">
            <h2 className="text-2xl font-bold">Breadcrumb</h2>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/components">Components</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </section>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default TestShadcn
