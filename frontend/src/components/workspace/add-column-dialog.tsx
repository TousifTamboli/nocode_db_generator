"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Columns3 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// MySQL data types
const MYSQL_TYPES = [
  // Numeric
  { value: "INT", label: "INT" },
  { value: "BIGINT", label: "BIGINT" },
  { value: "SMALLINT", label: "SMALLINT" },
  { value: "TINYINT", label: "TINYINT" },
  { value: "DECIMAL", label: "DECIMAL" },
  { value: "FLOAT", label: "FLOAT" },
  { value: "DOUBLE", label: "DOUBLE" },
  // String
  { value: "VARCHAR(255)", label: "VARCHAR(255)" },
  { value: "VARCHAR(100)", label: "VARCHAR(100)" },
  { value: "VARCHAR(50)", label: "VARCHAR(50)" },
  { value: "TEXT", label: "TEXT" },
  { value: "LONGTEXT", label: "LONGTEXT" },
  { value: "CHAR(1)", label: "CHAR(1)" },
  // Date/Time
  { value: "DATE", label: "DATE" },
  { value: "DATETIME", label: "DATETIME" },
  { value: "TIMESTAMP", label: "TIMESTAMP" },
  { value: "TIME", label: "TIME" },
  // Other
  { value: "BOOLEAN", label: "BOOLEAN" },
  { value: "JSON", label: "JSON" },
  { value: "BLOB", label: "BLOB" },
];

const addColumnSchema = z.object({
  name: z
    .string()
    .min(1, "Column name is required")
    .max(64, "Column name cannot exceed 64 characters")
    .regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, "Use letters, numbers, and underscores only"),
  type: z.string().min(1, "Data type is required"),
  isPrimaryKey: z.boolean().default(false),
  isNullable: z.boolean().default(true),
  defaultValue: z.string().optional(),
});

type AddColumnFormValues = z.infer<typeof addColumnSchema>;

interface AddColumnDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (column: Omit<AddColumnFormValues, "defaultValue"> & { defaultValue?: string }) => void;
  tableName: string;
}

export function AddColumnDialog({ isOpen, onClose, onConfirm, tableName }: AddColumnDialogProps) {
  const form = useForm<AddColumnFormValues>({
    resolver: zodResolver(addColumnSchema) as never,
    defaultValues: {
      name: "",
      type: "",
      isPrimaryKey: false,
      isNullable: true,
      defaultValue: "",
    },
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      form.reset({
        name: "",
        type: "",
        isPrimaryKey: false,
        isNullable: true,
        defaultValue: "",
      });
    }
  }, [isOpen, form]);

  const onSubmit = (values: AddColumnFormValues) => {
    onConfirm({
      name: values.name,
      type: values.type,
      isPrimaryKey: values.isPrimaryKey,
      isNullable: values.isNullable,
      defaultValue: values.defaultValue || undefined,
    });
    form.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] bg-zinc-900 border-zinc-800 text-white">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
              <Columns3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">Add Column</DialogTitle>
              <DialogDescription className="text-zinc-400 text-sm">
                Add a new column to <span className="text-zinc-300">{tableName}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-300">Column Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="id"
                        className="bg-zinc-800 border-zinc-700 text-white"
                        autoFocus
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-red-400 text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-300">Data Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-zinc-800 border-zinc-700">
                        {MYSQL_TYPES.map((type) => (
                          <SelectItem
                            key={type.value}
                            value={type.value}
                            className="text-white hover:bg-zinc-700 focus:bg-zinc-700"
                          >
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-red-400 text-xs" />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="defaultValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-300">
                    Default Value <span className="text-zinc-500">(optional)</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="NULL"
                      className="bg-zinc-800 border-zinc-700 text-white"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-400 text-xs" />
                </FormItem>
              )}
            />

            <div className="flex gap-6">
              <FormField
                control={form.control}
                name="isPrimaryKey"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="border-zinc-600 data-[state=checked]:bg-yellow-500 data-[state=checked]:border-yellow-500"
                      />
                    </FormControl>
                    <FormLabel className="text-zinc-300 text-sm font-normal cursor-pointer">
                      Primary Key
                    </FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isNullable"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="border-zinc-600 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
                      />
                    </FormControl>
                    <FormLabel className="text-zinc-300 text-sm font-normal cursor-pointer">
                      Nullable
                    </FormLabel>
                  </FormItem>
                )}
              />
            </div>

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
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
              >
                Add Column
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
