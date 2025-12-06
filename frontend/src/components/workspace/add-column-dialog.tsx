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
  FormDescription,
} from "@/components/ui/form";

// MySQL data types grouped by category
const MYSQL_TYPES = [
  // Numeric
  { value: "INT", label: "INT", category: "Numeric" },
  { value: "BIGINT", label: "BIGINT", category: "Numeric" },
  { value: "SMALLINT", label: "SMALLINT", category: "Numeric" },
  { value: "TINYINT", label: "TINYINT", category: "Numeric" },
  { value: "DECIMAL(10,2)", label: "DECIMAL(10,2)", category: "Numeric" },
  { value: "FLOAT", label: "FLOAT", category: "Numeric" },
  { value: "DOUBLE", label: "DOUBLE", category: "Numeric" },
  // String
  { value: "VARCHAR(255)", label: "VARCHAR(255)", category: "String" },
  { value: "VARCHAR(100)", label: "VARCHAR(100)", category: "String" },
  { value: "VARCHAR(50)", label: "VARCHAR(50)", category: "String" },
  { value: "CHAR(36)", label: "CHAR(36) - UUID", category: "String" },
  { value: "TEXT", label: "TEXT", category: "String" },
  { value: "LONGTEXT", label: "LONGTEXT", category: "String" },
  { value: "ENUM", label: "ENUM", category: "String" },
  // Date/Time
  { value: "DATE", label: "DATE", category: "Date/Time" },
  { value: "DATETIME", label: "DATETIME", category: "Date/Time" },
  { value: "TIMESTAMP", label: "TIMESTAMP", category: "Date/Time" },
  { value: "TIME", label: "TIME", category: "Date/Time" },
  { value: "YEAR", label: "YEAR", category: "Date/Time" },
  // Other
  { value: "BOOLEAN", label: "BOOLEAN", category: "Other" },
  { value: "JSON", label: "JSON", category: "Other" },
  { value: "BLOB", label: "BLOB", category: "Other" },
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
  isUnique: z.boolean().default(false),
  isAutoIncrement: z.boolean().default(false),
  defaultValue: z.string().optional(),
  checkConstraint: z.string().optional(),
});

type AddColumnFormValues = z.infer<typeof addColumnSchema>;

interface AddColumnDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (column: {
    name: string;
    type: string;
    isPrimaryKey: boolean;
    isNullable: boolean;
    isUnique: boolean;
    isAutoIncrement: boolean;
    defaultValue?: string;
    checkConstraint?: string;
  }) => void;
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
      isUnique: false,
      isAutoIncrement: false,
      defaultValue: "",
      checkConstraint: "",
    },
  });

  const isPrimaryKey = form.watch("isPrimaryKey");
  const selectedType = form.watch("type");

  // Auto-set autoIncrement when primary key is selected with INT type
  useEffect(() => {
    if (isPrimaryKey && selectedType?.includes("INT")) {
      form.setValue("isAutoIncrement", true);
      form.setValue("isNullable", false);
    }
  }, [isPrimaryKey, selectedType, form]);

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      form.reset({
        name: "",
        type: "",
        isPrimaryKey: false,
        isNullable: true,
        isUnique: false,
        isAutoIncrement: false,
        defaultValue: "",
        checkConstraint: "",
      });
    }
  }, [isOpen, form]);

  const onSubmit = (values: AddColumnFormValues) => {
    onConfirm({
      name: values.name,
      type: values.type,
      isPrimaryKey: values.isPrimaryKey,
      isNullable: values.isNullable,
      isUnique: values.isUnique,
      isAutoIncrement: values.isAutoIncrement,
      defaultValue: values.defaultValue || undefined,
      checkConstraint: values.checkConstraint || undefined,
    });
    form.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-zinc-900 border-zinc-800 text-white max-h-[90vh] overflow-y-auto">
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
            {/* Column Name & Type */}
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
                      <SelectContent className="bg-zinc-800 border-zinc-700 max-h-[200px]">
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

            {/* Default Value */}
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
                      placeholder="NULL, CURRENT_TIMESTAMP, or value"
                      className="bg-zinc-800 border-zinc-700 text-white"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-400 text-xs" />
                </FormItem>
              )}
            />

            {/* Constraints Section */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-zinc-400">Constraints</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="isPrimaryKey"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0 p-3 rounded-lg bg-zinc-800/50 border border-zinc-800">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="border-zinc-600 data-[state=checked]:bg-yellow-500 data-[state=checked]:border-yellow-500"
                        />
                      </FormControl>
                      <div>
                        <FormLabel className="text-zinc-300 text-sm font-normal cursor-pointer">
                          🔑 Primary Key
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isUnique"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0 p-3 rounded-lg bg-zinc-800/50 border border-zinc-800">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="border-zinc-600 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                        />
                      </FormControl>
                      <FormLabel className="text-zinc-300 text-sm font-normal cursor-pointer">
                        Unique
                      </FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isNullable"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0 p-3 rounded-lg bg-zinc-800/50 border border-zinc-800">
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

                <FormField
                  control={form.control}
                  name="isAutoIncrement"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0 p-3 rounded-lg bg-zinc-800/50 border border-zinc-800">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={!selectedType?.includes("INT")}
                          className="border-zinc-600 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500 disabled:opacity-50"
                        />
                      </FormControl>
                      <FormLabel className={`text-sm font-normal cursor-pointer ${!selectedType?.includes("INT") ? "text-zinc-500" : "text-zinc-300"}`}>
                        Auto Increment
                      </FormLabel>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Check Constraint */}
            <FormField
              control={form.control}
              name="checkConstraint"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-300">
                    Check Constraint <span className="text-zinc-500">(optional)</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., age >= 18, status IN ('active', 'inactive')"
                      className="bg-zinc-800 border-zinc-700 text-white"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-zinc-500 text-xs">
                    MySQL 8.0+ constraint expression
                  </FormDescription>
                  <FormMessage className="text-red-400 text-xs" />
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
