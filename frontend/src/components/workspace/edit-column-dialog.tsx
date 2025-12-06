"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Pencil } from "lucide-react";

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
import { Column } from "@/stores/workspace-store";

// MySQL data types
const MYSQL_TYPES = [
  { value: "INT", label: "INT" },
  { value: "BIGINT", label: "BIGINT" },
  { value: "SMALLINT", label: "SMALLINT" },
  { value: "TINYINT", label: "TINYINT" },
  { value: "DECIMAL(10,2)", label: "DECIMAL(10,2)" },
  { value: "FLOAT", label: "FLOAT" },
  { value: "DOUBLE", label: "DOUBLE" },
  { value: "VARCHAR(255)", label: "VARCHAR(255)" },
  { value: "VARCHAR(100)", label: "VARCHAR(100)" },
  { value: "VARCHAR(50)", label: "VARCHAR(50)" },
  { value: "CHAR(36)", label: "CHAR(36) - UUID" },
  { value: "TEXT", label: "TEXT" },
  { value: "LONGTEXT", label: "LONGTEXT" },
  { value: "DATE", label: "DATE" },
  { value: "DATETIME", label: "DATETIME" },
  { value: "TIMESTAMP", label: "TIMESTAMP" },
  { value: "TIME", label: "TIME" },
  { value: "BOOLEAN", label: "BOOLEAN" },
  { value: "JSON", label: "JSON" },
  { value: "BLOB", label: "BLOB" },
];

const editColumnSchema = z.object({
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

type EditColumnFormValues = z.infer<typeof editColumnSchema>;

interface EditColumnDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (updates: Partial<Column>) => void;
  column: Column | null;
  tableName: string;
}

export function EditColumnDialog({ isOpen, onClose, onConfirm, column, tableName }: EditColumnDialogProps) {
  const form = useForm<EditColumnFormValues>({
    resolver: zodResolver(editColumnSchema) as never,
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

  const selectedType = form.watch("type");

  // Reset form when dialog opens with column data
  useEffect(() => {
    if (isOpen && column) {
      form.reset({
        name: column.name,
        type: column.type,
        isPrimaryKey: column.isPrimaryKey,
        isNullable: column.isNullable,
        isUnique: column.isUnique || false,
        isAutoIncrement: column.isAutoIncrement || false,
        defaultValue: column.defaultValue || "",
        checkConstraint: column.checkConstraint || "",
      });
    }
  }, [isOpen, column, form]);

  const onSubmit = (values: EditColumnFormValues) => {
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
  };

  if (!column) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-zinc-900 border-zinc-800 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Pencil className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">Edit Column</DialogTitle>
              <DialogDescription className="text-zinc-400 text-sm">
                Modify column in <span className="text-zinc-300">{tableName}</span>
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
                    <Select onValueChange={field.onChange} value={field.value}>
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
                      <FormLabel className="text-zinc-300 text-sm font-normal cursor-pointer">
                        🔑 Primary Key
                      </FormLabel>
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
                className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500"
              >
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
