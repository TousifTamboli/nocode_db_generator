"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Table2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const tableNameSchema = z.object({
  name: z
    .string()
    .min(1, "Table name is required")
    .max(64, "Table name cannot exceed 64 characters")
    .regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, "Use letters, numbers, and underscores only"),
});

type TableNameFormValues = z.infer<typeof tableNameSchema>;

interface CreateTableDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (name: string) => void;
}

export function CreateTableDialog({ isOpen, onClose, onConfirm }: CreateTableDialogProps) {
  const form = useForm<TableNameFormValues>({
    resolver: zodResolver(tableNameSchema) as never,
    defaultValues: {
      name: "",
    },
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      form.reset({ name: "" });
    }
  }, [isOpen, form]);

  const onSubmit = (values: TableNameFormValues) => {
    onConfirm(values.name);
    form.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px] bg-zinc-900 border-zinc-800 text-white">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
              <Table2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">Create New Table</DialogTitle>
              <DialogDescription className="text-zinc-400 text-sm">
                Enter a name for your table
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-300">Table Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="users"
                      className="bg-zinc-800 border-zinc-700 text-white"
                      autoFocus
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="bg-transparent border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500"
              >
                Create Table
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
