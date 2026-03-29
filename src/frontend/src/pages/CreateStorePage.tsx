import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ImageIcon, Loader2, Store } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useApp } from "../context/AppContext";
import { useCreateStore } from "../hooks/useQueries";

const CATEGORIES = [
  "Grocery",
  "Snacks",
  "Fruits",
  "Beverages",
  "Bakery",
  "Dairy",
  "Electronics",
  "Other",
];

interface StoreForm {
  name: string;
  image: string;
  category: string;
  description: string;
  deliveryTime: string;
}

interface FormErrors {
  name?: string;
  category?: string;
  deliveryTime?: string;
}

export default function CreateStorePage() {
  const { navigate } = useApp();
  const createStore = useCreateStore();

  const [form, setForm] = useState<StoreForm>({
    name: "",
    image: "",
    category: "",
    description: "",
    deliveryTime: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!form.name.trim()) e.name = "Store name is required";
    if (!form.category) e.category = "Please select a category";
    if (!form.deliveryTime.trim()) e.deliveryTime = "Delivery time is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      await createStore.mutateAsync({
        name: form.name.trim(),
        image: form.image.trim(),
        category: form.category,
        description: form.description.trim(),
        deliveryTime: form.deliveryTime.trim(),
      });
      toast.success("Store created successfully!");
      navigate("vendor-dashboard");
    } catch (e: any) {
      toast.error(e?.message || "Failed to create store.");
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => navigate("vendor-dashboard")}
          className="flex items-center gap-1 text-sm font-semibold text-green-600 hover:text-green-700"
          data-ocid="create-store.back.button"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
            <Store className="w-5 h-5 text-green-500" />
            Create Your Store
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Set up your store to start selling
          </p>
        </div>
      </div>

      <div className="space-y-4" data-ocid="create-store.panel">
        {/* Store Name */}
        <div>
          <Label className="text-xs font-bold text-gray-700">
            Store Name <span className="text-red-500">*</span>
          </Label>
          <Input
            value={form.name}
            onChange={(e) => {
              setForm((f) => ({ ...f, name: e.target.value }));
              setErrors((er) => ({ ...er, name: undefined }));
            }}
            placeholder="e.g. Fresh Farm Grocery"
            className={`mt-1 text-sm ${
              errors.name ? "border-red-400" : "border-gray-300"
            }`}
            data-ocid="create-store.name.input"
          />
          {errors.name && (
            <p
              className="text-xs text-red-500 mt-1"
              data-ocid="create-store.name_error"
            >
              {errors.name}
            </p>
          )}
        </div>

        {/* Category */}
        <div>
          <Label className="text-xs font-bold text-gray-700">
            Category <span className="text-red-500">*</span>
          </Label>
          <Select
            value={form.category}
            onValueChange={(v) => {
              setForm((f) => ({ ...f, category: v }));
              setErrors((er) => ({ ...er, category: undefined }));
            }}
          >
            <SelectTrigger
              className={`mt-1 text-sm ${
                errors.category ? "border-red-400" : "border-gray-300"
              }`}
              data-ocid="create-store.category.select"
            >
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category && (
            <p
              className="text-xs text-red-500 mt-1"
              data-ocid="create-store.category_error"
            >
              {errors.category}
            </p>
          )}
        </div>

        {/* Delivery Time */}
        <div>
          <Label className="text-xs font-bold text-gray-700">
            Delivery Time <span className="text-red-500">*</span>
          </Label>
          <Input
            value={form.deliveryTime}
            onChange={(e) => {
              setForm((f) => ({ ...f, deliveryTime: e.target.value }));
              setErrors((er) => ({ ...er, deliveryTime: undefined }));
            }}
            placeholder="e.g. 15-20 min"
            className={`mt-1 text-sm ${
              errors.deliveryTime ? "border-red-400" : "border-gray-300"
            }`}
            data-ocid="create-store.delivery-time.input"
          />
          {errors.deliveryTime && (
            <p
              className="text-xs text-red-500 mt-1"
              data-ocid="create-store.delivery_time_error"
            >
              {errors.deliveryTime}
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <Label className="text-xs font-bold text-gray-700">Description</Label>
          <Textarea
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
            placeholder="Tell customers about your store..."
            rows={3}
            className="mt-1 text-sm border-gray-300 resize-none"
            data-ocid="create-store.description.textarea"
          />
        </div>

        {/* Image URL */}
        <div>
          <Label className="text-xs font-bold text-gray-700 flex items-center gap-1">
            <ImageIcon className="w-3 h-3" /> Store Image URL
          </Label>
          <Input
            value={form.image}
            onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
            placeholder="https://..."
            className="mt-1 text-sm border-gray-300"
            data-ocid="create-store.image.input"
          />
          <p className="text-[10px] text-gray-400 mt-1">
            Optional — leave blank for a default image
          </p>
        </div>

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={createStore.isPending}
          className="w-full h-12 text-base font-extrabold bg-green-500 hover:bg-green-600 text-white rounded-xl shadow"
          data-ocid="create-store.submit_button"
        >
          {createStore.isPending ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Creating Store...
            </>
          ) : (
            <>
              <Store className="w-5 h-5 mr-2" />
              Create Store
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
